export const instant = false;
export const metadata = { title: "Geçmiş" };

import { createServerClient } from "@/lib/supabase/server";
import { getIsletmeId } from "@/lib/supabase/auth";
import { tarihSaatMetni } from "@/lib/utils/zaman";
import { redirect } from "next/navigation";
import { kimlikGoster } from "@/lib/whatsapp/kimlik";
import { gecmisleriTamamla } from "@/lib/randevu-durum";
import GelmediButonu from "@/app/dashboard/GelmediButonu";
import SayfaBasligi from "@/components/SayfaBasligi";

type Randevu = {
  id: string;
  musteri_ad: string;
  musteri_whatsapp: string;
  baslangic: string;
  durum: string;
  hizmetler: { ad: string } | null;
};

function RandevuTablosu({ randevular, isaretlenebilir = false }: { randevular: Randevu[]; isaretlenebilir?: boolean }) {
  return (
    <div className="overflow-x-auto">
      <table className="tablo">
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Müşteri</th>
            <th>Hizmet</th>
            {isaretlenebilir && <th />}
          </tr>
        </thead>
        <tbody>
          {randevular.map((r) => {
            const hizmet = r.hizmetler as unknown as { ad: string } | null;
            return (
              <tr key={r.id}>
                <td className="text-soluk text-xs whitespace-nowrap tabular-nums">{tarihSaatMetni(new Date(r.baslangic))}</td>
                <td>
                  <p className="font-semibold">{r.musteri_ad}</p>
                  <p className="text-xs text-silik">{kimlikGoster(r.musteri_whatsapp)}</p>
                </td>
                <td className="text-soluk">{hizmet?.ad ?? "—"}</td>
                {isaretlenebilir && (
                  <td className="text-right">
                    <GelmediButonu id={r.id} durum={r.durum} />
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function Bolum({ baslik, sayi, bos, children }: { baslik: string; sayi: number; bos: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-base font-bold mb-3">
        {baslik}
        <span className="rozet rozet-gri">{sayi}</span>
      </h2>
      <div className="kart overflow-hidden">
        {sayi === 0 ? <p className="text-soluk text-sm p-6">{bos}</p> : children}
      </div>
    </section>
  );
}

export default async function GecmisPage() {
  const isletme_id = await getIsletmeId();
  if (!isletme_id) redirect("/admin/login");

  await gecmisleriTamamla(isletme_id);
  const supabase = await createServerClient();

  const simdi = new Date();

  const { data: tumRandevular } = await supabase
    .from("randevular")
    .select(`
      id, musteri_ad, musteri_whatsapp, baslangic, durum,
      hizmetler ( ad )
    `)
    .eq("isletme_id", isletme_id)
    .lt("baslangic", simdi.toISOString())
    .in("durum", ["tamamlandi", "gelmedi", "iptal"])
    .order("baslangic", { ascending: false });

  const filtrele = (durum: string) =>
    ((tumRandevular ?? []).filter((r) => r.durum === durum) as unknown) as Randevu[];
  const tamamlananlar = filtrele("tamamlandi");
  const gelmeyenler = filtrele("gelmedi");
  const iptalEdilenler = filtrele("iptal");

  const sonuclanan = tamamlananlar.length + gelmeyenler.length;
  const gelmemeOrani = sonuclanan ? Math.round((gelmeyenler.length / sonuclanan) * 100) : 0;
  const ozet = [
    { etiket: "Tamamlanan", deger: tamamlananlar.length, renk: "text-metin" },
    { etiket: "Gelmeyen", deger: gelmeyenler.length, renk: "text-turuncu" },
    { etiket: "İptal", deger: iptalEdilenler.length, renk: "text-metin" },
    { etiket: "Gelmeme oranı", deger: `%${gelmemeOrani}`, renk: "text-metin" },
  ];

  return (
    <div className="space-y-10">
      <SayfaBasligi baslik="Geçmiş" vurgu="randevular" aciklama="Saati geçen randevular. Gelmeyen müşterileri buradan işaretleyebilirsin." />

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 -mt-4">
        {ozet.map((o) => (
          <div key={o.etiket} className="kart p-5">
            <p className="etiket mb-1">{o.etiket}</p>
            <p className={`text-3xl font-bold tabular-nums ${o.renk}`}>{o.deger}</p>
          </div>
        ))}
      </div>

      <Bolum baslik="Tamamlananlar" sayi={tamamlananlar.length} bos="Tamamlanan randevu yok.">
        <RandevuTablosu randevular={tamamlananlar} isaretlenebilir />
      </Bolum>

      <Bolum baslik="Gelmeyenler" sayi={gelmeyenler.length} bos="Gelmeyen müşteri yok.">
        <RandevuTablosu randevular={gelmeyenler} isaretlenebilir />
      </Bolum>

      <Bolum baslik="İptal edilenler" sayi={iptalEdilenler.length} bos="İptal edilen randevu yok.">
        <RandevuTablosu randevular={iptalEdilenler} />
      </Bolum>
    </div>
  );
}
