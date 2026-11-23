export const instant = false;

import { createServerClient } from "@/lib/supabase/server";
import { getIsletmeId } from "@/lib/supabase/auth";
import { tarihSaatMetni, yerelAn, yerelTarih } from "@/lib/utils/zaman";
import { redirect } from "next/navigation";

type Randevu = {
  id: string;
  musteri_ad: string;
  musteri_whatsapp: string;
  baslangic: string;
  durum: string;
  hizmetler: { ad: string } | null;
};

function RandevuTablosu({ randevular }: { randevular: Randevu[] }) {
  if (!randevular.length) return null;
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-gray-100">
          <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Tarih</th>
          <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Musteri</th>
          <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Hizmet</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {randevular.map((r) => {
          const hizmet = r.hizmetler as unknown as { ad: string } | null;
          return (
            <tr key={r.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-5 py-3.5 text-gray-700 font-mono text-xs whitespace-nowrap">
                {tarihSaatMetni(new Date(r.baslangic))}
              </td>
              <td className="px-5 py-3.5">
                <p className="font-medium text-gray-900">{r.musteri_ad}</p>
                <p className="text-xs text-gray-400">{r.musteri_whatsapp}</p>
              </td>
              <td className="px-5 py-3.5 text-gray-600">
                {hizmet?.ad ?? "—"}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

export default async function GecmisPage() {
  const isletme_id = await getIsletmeId();
  if (!isletme_id) redirect("/admin/login");

  const supabase = await createServerClient();

  const bugunBaslangic = yerelAn(yerelTarih());

  const { data: tumRandevular } = await supabase
    .from("randevular")
    .select(`
      id, musteri_ad, musteri_whatsapp, baslangic, durum,
      hizmetler ( ad )
    `)
    .eq("isletme_id", isletme_id)
    .lt("baslangic", bugunBaslangic.toISOString())
    .in("durum", ["tamamlandi", "iptal"])
    .order("baslangic", { ascending: false });

  const tamamlananlar = ((tumRandevular ?? []).filter((r) => r.durum === "tamamlandi") as unknown) as Randevu[];
  const iptalEdilenler = ((tumRandevular ?? []).filter((r) => r.durum === "iptal") as unknown) as Randevu[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-gray-900 mb-1">Gecmis Randevular</h1>
        <p className="text-gray-400 text-sm">Dun ve oncesine ait randevular</p>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Tamamlananlar
          <span className="ml-2 text-xs font-normal text-gray-400">({tamamlananlar.length})</span>
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {tamamlananlar.length === 0 ? (
            <p className="text-gray-400 text-sm p-6">Tamamlanan randevu yok.</p>
          ) : (
            <RandevuTablosu randevular={tamamlananlar} />
          )}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">
          Iptal Edilenler
          <span className="ml-2 text-xs font-normal text-gray-400">({iptalEdilenler.length})</span>
        </h2>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {iptalEdilenler.length === 0 ? (
            <p className="text-gray-400 text-sm p-6">Iptal edilen randevu yok.</p>
          ) : (
            <RandevuTablosu randevular={iptalEdilenler} />
          )}
        </div>
      </div>
    </div>
  );
}
