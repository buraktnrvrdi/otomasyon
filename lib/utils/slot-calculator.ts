import { createServerClient } from "@/lib/supabase/server";

export interface BosSlot {
  baslangic: Date;
  bitis: Date;
  baslangicStr: string;
}

export async function bosSlotlariGetir(
  isletmeId: string,
  tarih: string,
  hizmetSureDakika = 30
): Promise<BosSlot[]> {
  const supabase = await createServerClient();

  const hedefTarih = new Date(tarih + "T00:00:00");
  const gunIndeksi = hedefTarih.getDay();

  const { data: calisma } = await supabase
    .from("calisma_saatleri")
    .select("acilis, kapanis, kapali")
    .eq("isletme_id", isletmeId)
    .eq("gun", gunIndeksi)
    .single();

  if (!calisma || calisma.kapali) return [];

  const gunBaslangic = new Date(tarih + "T00:00:00");
  const gunBitis = new Date(tarih + "T23:59:59");

  const { data: mevcutRandevular } = await supabase
    .from("randevular")
    .select("baslangic, bitis")
    .eq("isletme_id", isletmeId)
    .gte("baslangic", gunBaslangic.toISOString())
    .lte("baslangic", gunBitis.toISOString())
    .in("durum", ["beklemede", "onaylandi"]);

  const [acilisH, acilisM] = calisma.acilis.split(":").map(Number);
  const [kapanisH, kapanisM] = calisma.kapanis.split(":").map(Number);
  const acisToplam = acilisH * 60 + acilisM;
  const kapanisToplam = kapanisH * 60 + kapanisM;

  const mesgulAraliKlar = (mevcutRandevular ?? []).map((r) => {
    const bas = new Date(r.baslangic);
    const bit = new Date(r.bitis);
    return {
      bas: bas.getHours() * 60 + bas.getMinutes(),
      bit: bit.getHours() * 60 + bit.getMinutes(),
    };
  });

  const bosSlotlar: BosSlot[] = [];
  const ADIM = 30;
  const simdi = new Date();
  const bugunMu = hedefTarih.toDateString() === simdi.toDateString();

  for (
    let dakika = acisToplam;
    dakika + hizmetSureDakika <= kapanisToplam;
    dakika += ADIM
  ) {
    const slotBas = dakika;
    const slotBit = dakika + hizmetSureDakika;

    if (bugunMu) {
      const simdikiDakika = simdi.getHours() * 60 + simdi.getMinutes() + 15;
      if (slotBas < simdikiDakika) continue;
    }

    const cakisiyor = mesgulAraliKlar.some(
      (m) => slotBas < m.bit && slotBit > m.bas
    );

    if (!cakisiyor) {
      const slotBasTarih = new Date(tarih + "T00:00:00");
      slotBasTarih.setMinutes(slotBas);
      const slotBitTarih = new Date(slotBasTarih);
      slotBitTarih.setMinutes(slotBitTarih.getMinutes() + hizmetSureDakika);

      const sH = String(Math.floor(slotBas / 60)).padStart(2, "0");
      const sM = String(slotBas % 60).padStart(2, "0");

      bosSlotlar.push({
        baslangic: slotBasTarih,
        bitis: slotBitTarih,
        baslangicStr: `${sH}:${sM}`,
      });
    }
  }

  return bosSlotlar;
}
