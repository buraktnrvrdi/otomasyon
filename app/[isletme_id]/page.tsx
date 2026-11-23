export const instant = false;

import { createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import ChatUI from "./ChatUI";

export default async function IsletmeChatPage({
  params,
}: {
  params: Promise<{ isletme_id: string }>;
}) {
  const { isletme_id } = await params;
  const supabase = await createServerClient();

  const { data: isletme } = await supabase
    .from("isletme")
    .select("*")
    .eq("id", isletme_id)
    .single();

  if (!isletme) return notFound();

  return <ChatUI isletmeId={isletme.id} isletmeAdi={isletme.ad} ikon={isletme.ikon} logoUrl={isletme.logo_url ?? null} />;
}
