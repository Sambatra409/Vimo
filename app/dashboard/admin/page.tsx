import Link from "next/link";
import { Users, Building2, Coins, AlertCircle, BadgeCheck } from "lucide-react";
import { getAdminOverview } from "@/lib/actions/admin";

export default async function AdminOverviewPage() {
  const stats = await getAdminOverview();

  return (
    <>
      <h2 className="font-display text-2xl italic mb-1">Vue d'ensemble</h2>
      <p className="text-sm text-muted-foreground mb-6">
        L'état de la plateforme en un coup d'œil.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-8">
        <StatBox icon={<Users />} label="Utilisateurs" value={stats.total_users} />
        <StatBox icon={<Users />} label="Propriétaires" value={stats.total_owners} accent />
        <StatBox icon={<Users />} label="Locataires" value={stats.total_tenants} />
        <StatBox icon={<Building2 />} label="Annonces actives" value={stats.active_properties} />
        <StatBox icon={<Coins />} label="Jetons en circulation" value={stats.tokens_in_circulation} mono />
        <StatBox
          icon={<AlertCircle />}
          label="Achats à valider"
          value={stats.pending_purchases}
          highlight={stats.pending_purchases > 0}
        />
        <StatBox
          icon={<BadgeCheck />}
          label="Vérifications en attente"
          value={stats.pending_verifications}
          highlight={stats.pending_verifications > 0}
        />
      </div>

      {/* Raccourcis */}
      <h3 className="font-display text-xl italic mb-3">Actions rapides</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <ActionLink
          href="/dashboard/admin/verifications"
          title="Valider les vérifications d'annonces"
          subtitle={
            stats.pending_verifications > 0
              ? `${stats.pending_verifications} demande${stats.pending_verifications > 1 ? "s" : ""} en attente`
              : "Aucune demande en attente"
          }
          urgent={stats.pending_verifications > 0}
        />
        <ActionLink
          href="/dashboard/admin/purchases"
          title="Valider les achats de jetons"
          subtitle={
            stats.pending_purchases > 0
              ? `${stats.pending_purchases} demande${stats.pending_purchases > 1 ? "s" : ""} en attente`
              : "Aucune demande en attente"
          }
          urgent={stats.pending_purchases > 0}
        />
        <ActionLink
          href="/dashboard/admin/properties"
          title="Modérer les annonces"
          subtitle="Vérifier, suspendre ou supprimer"
        />
        <ActionLink
          href="/dashboard/admin/users"
          title="Gérer les utilisateurs"
          subtitle="Bannir, ajouter des jetons, modifier les rôles"
        />
        <ActionLink
          href="/dashboard/admin/settings"
          title="Paramètres globaux"
          subtitle="Prix des jetons, mode gratuit, instructions paiement"
        />
      </div>
    </>
  );
}

function StatBox({
  icon,
  label,
  value,
  accent = false,
  highlight = false,
  mono = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  accent?: boolean;
  highlight?: boolean;
  mono?: boolean;
}) {
  return (
    <div
      className={`bg-card rounded-2xl p-4 md:p-5 border ${
        highlight ? "border-primary/50 ring-2 ring-primary/20" : "border-border"
      }`}
    >
      <div className={`${accent || highlight ? "text-primary" : "text-muted-foreground"} mb-2`}>
        {icon}
      </div>
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
        {label}
      </p>
      <p className={`text-2xl md:text-3xl font-bold leading-none ${mono ? "font-mono text-primary" : ""}`}>
        {value}
      </p>
    </div>
  );
}

function ActionLink({
  href,
  title,
  subtitle,
  urgent = false,
}: {
  href: string;
  title: string;
  subtitle: string;
  urgent?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`bg-card rounded-2xl p-4 md:p-5 border block hover:border-primary/40 transition-colors ${
        urgent ? "border-primary/40 bg-primary/5" : "border-border"
      }`}
    >
      <p className="font-semibold text-sm mb-1">{title}</p>
      <p className={`text-xs ${urgent ? "text-primary font-semibold" : "text-muted-foreground"}`}>
        {subtitle}
      </p>
    </Link>
  );
}
