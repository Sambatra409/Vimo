import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Users, Home as HomeIcon, Receipt, Settings, BadgeCheck, Flag } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user || !user.roles.includes("admin")) redirect("/");

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-10">
      <header className="mb-6">
        <p className="text-[10px] uppercase tracking-widest font-bold text-verified mb-2 flex items-center gap-1.5">
          <span className="size-2 rounded-full bg-verified animate-pulse" />
          Mode administrateur
        </p>
        <h1 className="font-display text-3xl md:text-4xl italic">Console</h1>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6 md:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
            <NavLink href="/dashboard/admin" icon={<LayoutDashboard className="size-4" />} label="Vue d'ensemble" />
            <NavLink href="/dashboard/admin/users" icon={<Users className="size-4" />} label="Utilisateurs" />
            <NavLink href="/dashboard/admin/properties" icon={<HomeIcon className="size-4" />} label="Annonces" />
            <NavLink href="/dashboard/admin/verifications" icon={<BadgeCheck className="size-4" />} label="Vérifications" />
            <NavLink href="/dashboard/admin/reports" icon={<Flag className="size-4" />} label="Signalements" />
            <NavLink href="/dashboard/admin/purchases" icon={<Receipt className="size-4" />} label="Achats jetons" />
            <NavLink href="/dashboard/admin/settings" icon={<Settings className="size-4" />} label="Paramètres" />
          </nav>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

function NavLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted text-foreground whitespace-nowrap">
      <span className="text-primary shrink-0">{icon}</span>
      {label}
    </Link>
  );
}
