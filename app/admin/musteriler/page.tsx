export const instant = false;

import { createServerClient } from "@/lib/supabase/server";
import { getIsletmeId } from "@/lib/supabase/auth";
import { format } from "date-fns";
import { redirect } from "next/navigation";

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

  return (
    <div>
      <h1 className="text-xl font-semibold text-gray-900 mb-1">Musteriler</h1>
      <p className="text-gray-400 text-sm mb-6">
        Toplam {musteriler.length} musteri
      </p>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {musteriler.length === 0 ? (
          <p className="text-gray-400 text-sm p-6">Henuz musteri yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Musteri</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Numara</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Toplam</th>
                <th className="text-left text-xs font-medium text-gray-400 uppercase tracking-wider px-5 py-3">Son Randevu</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {musteriler.map((m) => (
                <tr key={m.musteri_whatsapp} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-900">{m.musteri_ad}</td>
                  <td className="px-5 py-3.5 text-gray-500">{m.musteri_whatsapp}</td>
                  <td className="px-5 py-3.5">
                    <span className="bg-gray-100 text-gray-700 text-xs font-medium px-2.5 py-1 rounded-full">
                      {m.toplam} randevu
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-500 text-xs font-mono">
                    {format(new Date(m.son_randevu), "dd.MM.yyyy HH:mm")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
