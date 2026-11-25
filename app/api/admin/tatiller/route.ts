import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getIsletmeId } from "@/lib/supabase/auth";
import { AKTIF_DURUMLAR } from "@/lib/randevu-durum";
import { gecerliTarihMi, gunEkle, saatiDakikaya, yerelAn, yerelDakika, yerelTarih } from "@/lib/utils/zaman";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAKS_GUN = 366;
const TABLO_YOK = ["PGRST205", "42P01"];

/** Bugünden itibaren geçerli tatil/izin kayıtları. */
export async function GET() {
  const isletme_id = await getIsletmeId();
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const db = await createServerClient();
  const { data, error } = await db
    .from("kapali_gunler")
    .select("id, baslangic_tarih, bitis_tarih, baslangic_saat, bitis_saat, aciklama")
    .eq("isletme_id", isletme_id)
    .gte("bitis_tarih", yerelTarih())
    .order("baslangic_tarih", { ascending: true })
    .limit(200);

  if (error) {
    // Migration 010 çalıştırılmadıysa sayfa bunu açıkça göstersin.
    if (TABLO_YOK.includes(error.code ?? "")) return NextResponse.json({ kayitlar: [], hazir: false });
    return NextResponse.json({ hata: error.message }, { status: 500 });
  }
  return NextResponse.json({
    kayitlar: (data ?? []).map((k) => ({
      ...k,
      baslangic_saat: k.baslangic_saat ? String(k.baslangic_saat).slice(0, 5) : null,
      bitis_saat: k.bitis_saat ? String(k.bitis_saat).slice(0, 5) : null,
    })),
    hazir: true,
  });
}

export async function POST(req: NextRequest) {
  const isletme_id = await getIsletmeId();
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const { baslangic_tarih, bitis_tarih } = b;
  const tumGun = b.tum_gun !== false;

  if (!gecerliTarihMi(baslangic_tarih) || !gecerliTarihMi(bitis_tarih)) {
    return NextResponse.json({ hata: "Geçerli bir başlangıç ve bitiş tarihi seç." }, { status: 400 });
  }
  if (bitis_tarih < baslangic_tarih) {
    return NextResponse.json({ hata: "Bitiş tarihi başlangıçtan önce olamaz." }, { status: 400 });
  }
  if (bitis_tarih < yerelTarih()) {
    return NextResponse.json({ hata: "Geçmiş bir tarih için tatil eklenemez." }, { status: 400 });
  }
  // Çok uzun aralıklar çoğunlukla yazım hatasıdır.
  if (gunEkle(baslangic_tarih, MAKS_GUN) < bitis_tarih) {
    return NextResponse.json({ hata: "Bir kayıt en fazla 1 yıllık bir aralığı kapsayabilir." }, { status: 400 });
  }

  let basSaat: string | null = null;
  let bitSaat: string | null = null;
  if (!tumGun) {
    const bas = saatiDakikaya(String(b.baslangic_saat ?? ""));
    const bit = saatiDakikaya(String(b.bitis_saat ?? ""));
    if (bas === null || bit === null || bit <= bas) {
      return NextResponse.json({ hata: "Geçerli bir saat aralığı gir (bitiş, başlangıçtan sonra olmalı)." }, { status: 400 });
    }
    basSaat = b.baslangic_saat;
    bitSaat = b.bitis_saat;
  }
  const aciklama = typeof b.aciklama === "string" ? b.aciklama.trim().slice(0, 120) || null : null;

  const db = await createServerClient();
  const { error } = await db.from("kapali_gunler").insert({
    isletme_id,
    baslangic_tarih,
    bitis_tarih,
    baslangic_saat: basSaat,
    bitis_saat: bitSaat,
    aciklama,
  });
  if (error) {
    if (TABLO_YOK.includes(error.code ?? "")) {
      return NextResponse.json({ hata: "Tatil tablosu henüz yok. Yöneticiden 010_kapali_gunler.sql dosyasını çalıştırmasını iste." }, { status: 503 });
    }
    return NextResponse.json({ hata: "Kaydedilemedi." }, { status: 500 });
  }

  // Zaten alınmış randevular otomatik iptal edilmez; kaç tane olduğunu söyleyelim.
  const { data: randevular } = await db
    .from("randevular")
    .select("baslangic, bitis")
    .eq("isletme_id", isletme_id)
    .in("durum", [...AKTIF_DURUMLAR])
    .gte("baslangic", yerelAn(baslangic_tarih, 0).toISOString())
    .lt("baslangic", yerelAn(gunEkle(bitis_tarih, 1), 0).toISOString());

  const basD = basSaat ? saatiDakikaya(basSaat)! : 0;
  const bitD = bitSaat ? saatiDakikaya(bitSaat)! : 24 * 60;
  const etkilenen = (randevular ?? []).filter((r) => {
    if (tumGun) return true;
    const rb = yerelDakika(new Date(r.baslangic));
    const re = yerelDakika(new Date(r.bitis));
    return rb < bitD && re > basD;
  }).length;

  return NextResponse.json({ basari: true, etkilenen_randevu: etkilenen });
}

export async function DELETE(req: NextRequest) {
  const isletme_id = await getIsletmeId();
  if (!isletme_id) return NextResponse.json({ hata: "Yetkisiz" }, { status: 401 });

  const { id } = await req.json().catch(() => ({}));
  if (typeof id !== "string" || !UUID.test(id)) {
    return NextResponse.json({ hata: "Geçersiz istek." }, { status: 400 });
  }

  const db = await createServerClient();
  const { error } = await db.from("kapali_gunler").delete().eq("id", id).eq("isletme_id", isletme_id);
  if (error) return NextResponse.json({ hata: "Silinemedi." }, { status: 500 });
  return NextResponse.json({ basari: true });
}
