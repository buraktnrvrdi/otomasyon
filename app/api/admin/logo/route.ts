import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getIsletmeId } from "@/lib/supabase/auth";
import { LOGO_BUCKET, LOGO_TURLERI, MAKS_LOGO_BAYT, logoDogrula, logoYoluBul } from "@/lib/logo";

type Db = Awaited<ReturnType<typeof createServerClient>>;

const MIGRATION_MESAJI =
  "Veritabani guncel degil: supabase/migrations/006_salon_logo.sql dosyasini calistirin.";

/** Bucket yoksa (migration çalıştırılmadıysa) oluşturur. */
async function bucketHazirla(db: Db) {
  const { error } = await db.storage.getBucket(LOGO_BUCKET);
  if (!error) return;
  await db.storage.createBucket(LOGO_BUCKET, {
    public: true,
    fileSizeLimit: MAKS_LOGO_BAYT,
    allowedMimeTypes: LOGO_TURLERI,
  });
}

const kolonYok = (error: { code?: string; message?: string } | null) =>
  error?.code === "PGRST204" || error?.code === "42703" || /logo_url/.test(error?.message ?? "");

export async function POST(req: NextRequest) {
  const isletme_id = await getIsletmeId();
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const dosya = form?.get("logo");
  if (!(dosya instanceof File)) {
    return NextResponse.json({ hata: "Logo dosyasi gerekli." }, { status: 400 });
  }
  if (dosya.size > MAKS_LOGO_BAYT) {
    return NextResponse.json({ hata: "Logo en fazla 2 MB olabilir." }, { status: 413 });
  }

  const sonuc = logoDogrula(new Uint8Array(await dosya.arrayBuffer()));
  if (!sonuc.ok) return NextResponse.json({ hata: sonuc.hata }, { status: 400 });

  const db = await createServerClient();

  const { data: mevcut, error: okumaHatasi } = await db
    .from("isletme")
    .select("logo_url")
    .eq("id", isletme_id)
    .maybeSingle();
  if (okumaHatasi) {
    return NextResponse.json(
      { hata: kolonYok(okumaHatasi) ? MIGRATION_MESAJI : "Logo yuklenemedi." },
      { status: 500 }
    );
  }

  await bucketHazirla(db);

  const yol = `${isletme_id}/${Date.now()}.${sonuc.uzanti}`;
  const bayt = new Uint8Array(await dosya.arrayBuffer());
  const { error: yuklemeHatasi } = await db.storage
    .from(LOGO_BUCKET)
    .upload(yol, bayt, { contentType: sonuc.mime, cacheControl: "31536000", upsert: false });
  if (yuklemeHatasi) {
    console.error("[Logo yukle]", yuklemeHatasi.message);
    return NextResponse.json({ hata: "Logo yuklenemedi." }, { status: 500 });
  }

  const logo_url = db.storage.from(LOGO_BUCKET).getPublicUrl(yol).data.publicUrl;
  const { error: kayitHatasi } = await db.from("isletme").update({ logo_url }).eq("id", isletme_id);
  if (kayitHatasi) {
    await db.storage.from(LOGO_BUCKET).remove([yol]);
    return NextResponse.json(
      { hata: kolonYok(kayitHatasi) ? MIGRATION_MESAJI : "Logo kaydedilemedi." },
      { status: 500 }
    );
  }

  const eskiYol = logoYoluBul(mevcut?.logo_url);
  if (eskiYol) await db.storage.from(LOGO_BUCKET).remove([eskiYol]);

  return NextResponse.json({ logo_url });
}

export async function DELETE() {
  const isletme_id = await getIsletmeId();
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const db = await createServerClient();
  const { data: mevcut } = await db.from("isletme").select("logo_url").eq("id", isletme_id).maybeSingle();

  const { error } = await db.from("isletme").update({ logo_url: null }).eq("id", isletme_id);
  if (error) {
    return NextResponse.json(
      { hata: kolonYok(error) ? MIGRATION_MESAJI : "Logo kaldirilamadi." },
      { status: 500 }
    );
  }

  const yol = logoYoluBul(mevcut?.logo_url);
  if (yol) await db.storage.from(LOGO_BUCKET).remove([yol]);

  return NextResponse.json({ basari: true });
}
