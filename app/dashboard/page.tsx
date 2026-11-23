export const instant = false;
export const metadata = { title: "Randevular" };

import { createServerClient } from "@/lib/supabase/server";
import { getIsletmeId } from "@/lib/supabase/auth";
import { gunEkle, haftaGunu, uzunTarihMetni, yerelAn, yerelSaat, yerelTarih } from "@/lib/utils/zaman";
import Link from "next/link";
import { gecmisleriTamamla } from "@/lib/randevu-durum";
import { redirect } from "next/navigation";
import { kimlikGoster } from "@/lib/whatsapp/kimlik";
import SayfaBasligi from "@/components/SayfaBasligi";
import { ArtiIkon, TakvimIkon } from "@/components/ikonlar";
import AutoRefresh from "./AutoRefresh";
import RandevuEylemleri from "./RandevuEylemleri";
import GelmediButonu from "./GelmediButonu";

const DURUM_ROZET: Record<string, { etiket: string; sinif: string }> = {
  onaylandi: { etiket: "Onaylandı", sinif: "rozet-yesil" },
  beklemede: { etiket: "Beklemede", sinif: "rozet-sari" },
  tamamlandi: { etiket: "Tamamlandı", sinif: "rozet-gri" },
  gelmedi: { etiket: "Gelmedi", sinif: "rozet-turuncu" },
};

const FILTRELER = [
  { key: "bugun", label: "Bugün", baslik: "Bugünkü" },
  { key: "yarin", label: "Yarın", baslik: "Yarınki" },
  { key: "bu-hafta", label: "Bu Hafta", baslik: "Bu haftaki" },
];

/** biter: dahil olmayan üst sınır */
function getAralik(filtre: string): { baslar: Date; biter: Date } {
  const bugun = yerelTarih();

  if (filtre === "yarin") {
    const yarin = gunEkle(bugun, 1);
    return { baslar: yerelAn(yarin), biter: yerelAn(gunEkle(yarin, 1)) };
  }

  if (filtre === "bu-hafta") {
    const gun = haftaGunu(bugun);
    const kalan = gun === 0 ? 0 : 7 - gun;
    return { baslar: yerelAn(bugun), biter: yerelAn(gunEkle(bugun, kalan + 1)) };
  }

  return { baslar: yerelAn(bugun), biter: yerelAn(gunEkle(bugun, 1)) };
}

interface Hizmet {
  ad: string;
  fiyat: number;
  sure_dakika: number;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ filtre?: string }>;
}) {
  const isletme_id = await getIsletmeId();
  if (!isletme_id) redirect("/admin/login");

  const { filtre: filtreParam = "bugun" } = await searchParams;
  const filtre = FILTRELER.find((f) => f.key === filtreParam) ?? FILTRELER[0];
  await gecmisleriTamamla(isletme_id);
  const supabase = await createServerClient();
  const { baslar, biter } = getAralik(filtre.key);

  const { data } = await supabase
    .from("randevular")
    .select(`
      id, hizmet_id, musteri_ad, musteri_whatsapp, baslangic, bitis, durum,
      hizmetler ( id, ad, fiyat, sure_dakika )
    `)
    .eq("isletme_id", isletme_id)
    .gte("baslangic", baslar.toISOString())
    .lt("baslangic", biter.toISOString())
    .neq("durum", "iptal")
    .order("baslangic", { ascending: true });

  const randevular = (data ?? []).map((r) => ({ ...r, hizmet: r.hizmetler as unknown as Hizmet | null }));

  const simdi = Date.now();
  const ciro = randevular
    .filter((r) => r.durum !== "gelmedi")
    .reduce((t, r) => t + Number(r.hizmet?.fiyat ?? 0), 0);
  const siradaki = randevular.find((r) => new Date(r.baslangic).getTime() > simdi && r.durum !== "gelmedi");

  // Güne göre grupla (çok günlü görünüm için)
  const gunler = new Map<string, typeof randevular>();
  for (const r of randevular) {
    const gun = yerelTarih(new Date(r.baslangic));
    gunler.set(gun, [...(gunler.get(gun) ?? []), r]);
  }
  const cokGunlu = filtre.key === "bu-hafta";

  return (
    <div>
      <AutoRefresh />
      <SayfaBasligi baslik={filtre.baslik} vurgu="randevular" aciklama={uzunTarihMetni()}>
        <Link href="/admin/randevu-ekle" className="btn btn-ana">
          <ArtiIkon className="w-4 h-4" />
          Randevu Ekle
        </Link>
      </SayfaBasligi>

      <div className="flex gap-2 mb-6">
        {FILTRELER.map((f) => (
          <Link
            key={f.key}
            href={`?filtre=${f.key}`}
            className={`btn btn-kucuk ${filtre.key === f.key ? "btn-beyaz" : "btn-cizgili"}`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-8">
        <div className="kart p-5">
          <p className="etiket mb-1">Randevu</p>
          <p className="text-3xl font-bold tabular-nums">{randevular.length}</p>
        </div>
        <div className="kart p-5">
          <p className="etiket mb-1">Beklenen ciro</p>
          <p className="text-3xl font-bold tabular-nums">
            {ciro.toLocaleString("tr-TR")} <span className="text-lg text-soluk">₺</span>
          </p>
        </div>
        <div className="kart p-5 col-span-2 sm:col-span-1 border-turuncu/30 bg-gradient-to-br from-turuncu/12 to-transparent">
          <p className="etiket mb-1 text-turuncu-acik">Sıradaki</p>
          {siradaki ? (
            <p className="text-3xl font-bold tabular-nums">
              {yerelSaat(new Date(siradaki.baslangic))}
              <span className="block text-sm font-medium text-soluk truncate">{siradaki.musteri_ad}</span>
            </p>
          ) : (
            <p className="text-soluk text-sm mt-2">Bu dönemde bekleyen randevu yok</p>
          )}
        </div>
      </div>

      {randevular.length === 0 ? (
        <div className="kart p-12 text-center">
          <TakvimIkon className="w-10 h-10 text-silik mx-auto mb-4" />
          <p className="font-semibold">Bu dönem için randevu yok</p>
          <p className="text-soluk text-sm mt-1">WhatsApp'tan gelen randevular burada otomatik görünür.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {[...gunler.entries()].map(([gun, liste]) => (
            <section key={gun}>
              {cokGunlu && (
                <h2 className="etiket mb-3">{uzunTarihMetni(yerelAn(gun, 12 * 60))}</h2>
              )}
              <ul className="space-y-2.5">
                {liste.map((r) => {
                  const rozet = DURUM_ROZET[r.durum] ?? { etiket: r.durum, sinif: "rozet-gri" };
                  const gecti = r.durum === "tamamlandi" || r.durum === "gelmedi";
                  return (
                    <li
                      key={r.id}
                      className={`kart p-4 sm:p-5 flex flex-wrap sm:flex-nowrap items-center gap-4 sm:gap-6 ${gecti ? "opacity-70" : ""}`}
                    >
                      <div className="w-20 shrink-0">
                        <p className={`text-2xl font-bold tabular-nums ${gecti ? "text-soluk" : "text-turuncu"}`}>
                          {yerelSaat(new Date(r.baslangic))}
                        </p>
                        <p className="text-xs text-silik tabular-nums">{yerelSaat(new Date(r.bitis))}'e kadar</p>
                      </div>

                      <div className="flex-1 min-w-[10rem] sm:border-l sm:border-cizgi sm:pl-6">
                        <p className="font-semibold text-lg leading-tight">{r.musteri_ad}</p>
                        <p className="text-sm text-soluk mt-0.5">
                          {r.hizmet ? `${r.hizmet.ad} · ${r.hizmet.sure_dakika} dk · ${r.hizmet.fiyat} ₺` : "Hizmet silinmiş"}
                        </p>
                        <p className="text-xs text-silik mt-1">{kimlikGoster(r.musteri_whatsapp)}</p>
                      </div>

                      <div className="flex flex-col items-start sm:items-end gap-2.5 w-full sm:w-auto">
                        <span className={`rozet ${rozet.sinif}`}>{rozet.etiket}</span>
                        {gecti ? (
                          <GelmediButonu id={r.id} durum={r.durum} />
                        ) : (
                          <RandevuEylemleri id={r.id} hizmetId={r.hizmet_id ?? null} baslangic={r.baslangic} />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="text-xs text-silik text-center mt-10">Her 60 saniyede bir otomatik güncellenir</p>
    </div>
  );
}
