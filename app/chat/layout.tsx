import PanelKabugu from "@/components/PanelKabugu";

export const metadata = { title: "Botu Test Et" };

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return <PanelKabugu>{children}</PanelKabugu>;
}
