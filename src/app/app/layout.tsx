import { BottomNav } from "@/components/bottom-nav";
import { ThemeToggle } from "@/components/theme-toggle";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <main className="min-h-screen pb-20">{children}</main>
      <ThemeToggle />
      <BottomNav />
    </>
  );
}
