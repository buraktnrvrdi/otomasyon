export const instant = false;
export const metadata = { title: "Müşteriler" };

import { createServerClient } from "@/lib/supabase/server";
import { getIsletmeId } from "@/lib/supabase/auth";
import { tarihSaatMetni } from "@/lib/utils/zaman";
import { redirect } from "next/navigation";
import { kimlikGoster } from "@/lib/whatsapp/kimlik";
import SayfaBasligi from "@/components/SayfaBasligi";
import MusteriSilButonu from "./MusteriSilButonu";
import MusteriNotu from "./MusteriNotu";
import { notlariGetir } from "@/lib/musteri-notlari";
import { SILINMIS_ON_EK } from "@/lib/kvkk";

interface MusteriSatir {
  musteri_ad: string;
  musteri_whatsapp: string;
  toplam: number;
  son_randevu: string;
}

export default async function MusterilerPage() {
  const isletme_id = await getIsletmeId();
  if (!isletme_id) redirect("/admin/login");

  const supabase = await createServerClient();

  const { data: randevular } = await supabase
    .from("randevular")
    .select("musteri_ad, musteri_whatsapp, baslangic")
    .eq("isletme_id", isletme_id)
    .order("baslangic", { ascending: false });

  const map = new Map<string, MusteriSatir>();
  for (const r of randevular ?? []) {
    const key = r.musteri_whatsapp;
    const mevcut = map.get(key);
    if (!mevcut) {
      map.set(key, {
        musteri_ad: r.musteri_ad,
        musteri_whatsapp: r.musteri_whatsapp,
        toplam: 1,
        son_randevu: r.baslangic,
      });
    } else {
      mevcut.toplam += 1;
      if (r.baslangic > mevcut.son_randevu) {
        mevcut.son_randevu = r.baslangic;
      }
    }
  }

  const musteriler: MusteriSatir[] = Array.from(map.values()).sort(
    (a, b) => new Date(b.son_randevu).getTime() - new Date(a.son_randevu).getTime()
  );

  const notlar = await notlariGetir(isletme_id, musteriler.map((m) => m.musteri_whatsapp));

  return (
    <div>
      <SayfaBasligi
        baslik="Müşteriler"
        aciklama={`Toplam ${musteriler.length} müşteri · en son gelen en üstte`}
      />

      <div className="kart overflow-hidden">
        {musteriler.length === 0 ? (
          <p className="text-soluk text-sm p-6">Henüz müşteri yok.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="tablo">
              <thead>
                <tr>
                  <th>Müşteri</th>
                  <th>Numara</th>
                  <th>Randevu</th>
                  <th>Son Randevu</th>
                  <th>Not</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {musteriler.map((m) => (
                  <tr key={m.musteri_whatsapp}>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 shrink-0 rounded-full bg-turuncu/12 text-turuncu-acik font-bold flex items-center justify-center">
                          {m.musteri_ad.trim().charAt(0).toLocaleUpperCase("tr")}
                        </span>
                        <span className="font-semibold">{m.musteri_ad}</span>
                      </div>
                    </td>
                    <td className="text-soluk whitespace-nowrap">{kimlikGoster(m.musteri_whatsapp)}</td>
                    <td>
                      <span className="rozet rozet-gri">{m.toplam}</span>
                    </td>
                    <td className="text-soluk text-xs whitespace-nowrap tabular-nums">
                      {tarihSaatMetni(new Date(m.son_randevu))}
                    </td>
                    <td>
                      {!m.musteri_whatsapp.startsWith(SILINMIS_ON_EK) && !m.musteri_whatsapp.startsWith("web-") ? (
                        <MusteriNotu musteriWhatsapp={m.musteri_whatsapp} notu={notlar[m.musteri_whatsapp] ?? null} />
                      ) : (
                        <span className="text-silik text-sm">-</span>
                      )}
                    </td>
                    <td>
                      {!m.musteri_whatsapp.startsWith(SILINMIS_ON_EK) && !m.musteri_whatsapp.startsWith("web-") && (
                        <MusteriSilButonu musteriWhatsapp={m.musteri_whatsapp} ad={m.musteri_ad} />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
