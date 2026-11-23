"use client";

import { usePathname } from "next/navigation";
import PanelKabugu from "@/components/PanelKabugu";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Giriş sayfası panel menüsü olmadan, tam ekran gösterilir.
  if (usePathname().startsWith("/admin/login")) return <>{children}</>;
  return <PanelKabugu>{children}</PanelKabugu>;
}
