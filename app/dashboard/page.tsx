export const instant = false;

import { createServerClient } from "@/lib/supabase/server";
import { getIsletmeId } from "@/lib/supabase/auth";
import { gunEkle, haftaGunu, uzunTarihMetni, yerelAn, yerelSaat, yerelTarih } from "@/lib/utils/zaman";
import Link from "next/link";
import { redirect } from "next/navigation";
import AutoRefresh from "./AutoRefresh";
import RandevuEylemleri from "./RandevuEylemleri";

/** biter: dahil olmayan üst sınır */
function getAralik(filtre: string): { baslar: Date; biter: Date; label: string } {
  const bugun = yerelTarih();

  if (filtre === "yarin") {
    const yarin = gunEkle(bugun, 1);
    return { baslar: yerelAn(yarin), biter: yerelAn(gunEkle(yarin, 1)), label: "Yarinki Randevular" };
  }

  if (filtre === "bu-hafta") {
    const gun = haftaGunu(bugun);
    const kalan = gun === 0 ? 0 : 7 - gun;
    return {
      baslar: yerelAn(bugun),
      biter: yerelAn(gunEkle(bugun, kalan + 1)),
      label: "Bu Haftaki Randevular",
    };
  }

  return { baslar: yerelAn(bugun), biter: yerelAn(gunEkle(bugun, 1)), label: "Bugunku Randevular" };
}

interface SearchParams {
  filtre?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const isletme_id = await getIsletmeId();
  if (!isletme_id) redirect("/admin/login");

  const { filtre = "bugun" } = await searchParams;
  const supabase = await createServerClient();
  const { baslar, biter, label } = getAralik(filtre);

  const { data: randevular } = await supabase
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

  const filtreler = [
    { key: "bugun", label: "Bugun" },
    { key: "yarin", label: "Yarin" },
    { key: "bu-hafta", label: "Bu Hafta" },
  ];

  return (
    <main className="max-w-3xl mx-auto p-6">
      <AutoRefresh />
      <h1 className="text-2xl font-bold mb-1">{label}</h1>
      <p className="text-gray-500 mb-4">
        {uzunTarihMetni()}
      </p>

      <div className="flex gap-2 mb-6">
        {filtreler.map((f) => (
          <Link
            key={f.key}
            href={`?filtre=${f.key}`}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
              filtre === f.key
                ? "bg-gray-900 text-white border-gray-900"
                : "border-gray-200 text-gray-600 hover:border-gray-400 hover:text-gray-900"
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {!randevular?.length ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-4">—</p>
          <p>Bu donem icin randevu yok.</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {randevular.map((r) => {
            const hizmet = r.hizmetler as unknown as {
              ad: string;
              fiyat: number;
              sure_dakika: number;
            } | null;
            return (
              <li
                key={r.id}
                className="border border-gray-200 rounded-xl p-4 flex justify-between items-start bg-white shadow-sm"
              >
                <div>
                  <p className="font-semibold text-lg text-gray-900">{r.musteri_ad}</p>
                  <p className="text-sm text-gray-400">{r.musteri_whatsapp}</p>
                  {hizmet && (
                    <p className="text-sm mt-1 text-gray-600">
                      {hizmet.ad} · {hizmet.sure_dakika} dk · {hizmet.fiyat} TL
                    </p>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p className="font-mono font-bold text-xl text-gray-900">
                    {yerelSaat(new Date(r.baslangic))}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.durum === "onaylandi"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {r.durum}
                  </span>
                  <RandevuEylemleri
                    id={r.id}
                    hizmetId={r.hizmet_id ?? null}
                    baslangic={r.baslangic}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-xs text-gray-300 text-center mt-8">
        Her 60 saniyede bir otomatik guncellenir
      </p>
    </main>
  );
}
