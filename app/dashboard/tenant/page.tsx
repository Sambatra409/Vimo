import Link from "next/link";
import { redirect } from "next/navigation";
import { Heart, Unlock, MessageSquare, Coins } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { titleCase } from "@/lib/format";

export default async function TenantDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/dashboard/tenant");

  const admin = createAdminClient();
  const [favRes, unlockRes] = await Promise.all([
    admin
      .from("favorites")
      .select("property_id", { count: "exact" })
      .eq("user_id", user.id),
    admin
      .from("unlock_records")
      .select("property_id", { count: "exact" })
      .eq("user_id", user.id),
  ]);

  const favCount = favRes.count ?? 0;
  const unlockCount = unlockRes.count ?? 0;

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <header className="mb-8 md:mb-10">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
          Espace locataire
        </p>
        <h1 className="font-display text-3xl md:text-5xl italic">
          Bonjour, {titleCase(user.full_name.split(" ")[0])}.
        </h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Suivez votre activité de recherche et vos interactions.
        </p>
      </header>

      {/* Cards d'aperçu */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8 md:mb-10">
        <StatCard
          href="/favorites"
          icon={<Heart className="size-4" />}
          label="Favoris"
          value={favCount}
        />
        <StatCard
          href="#"
          icon={<Unlock className="size-4" />}
          label="Déblocages"
          value={unlockCount}
        />
        <StatCard
          href="/messages"
          icon={<MessageSquare className="size-4" />}
          label="Conversations"
          value={0}
        />
        <StatCard
          href="/tokens"
          icon={<Coins className="size-4" />}
          label="Jetons"
          value={user.tokens_balance}
          mono
        />
      </div>

      {/* Sections rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ActionCard
          href="/"
          title="Continuer la recherche"
          description="Parcourez les nouvelles annonces et utilisez les filtres pour trouver votre futur logement."
          cta="Voir les annonces →"
        />
        <ActionCard
          href="/favorites"
          title="Mes favoris"
          description="Retrouvez les biens que vous avez sauvegardés pour les comparer."
          cta="Voir mes favoris →"
        />
        <ActionCard
          href="/compare"
          title="Comparateur"
          description="Comparez jusqu'à 3 annonces côte à côte sur les critères clés."
          cta="Ouvrir le comparateur →"
        />
        <ActionCard
          href="/tokens"
          title="Acheter des jetons"
          description="Les jetons servent à débloquer les contacts des propriétaires."
          cta="Acheter des jetons →"
        />
      </div>
    </div>
  );
}

function StatCard({
  href,
  icon,
  label,
  value,
  mono = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  value: number;
  mono?: boolean;
}) {
  return (
    <Link
      href={href}
      className="bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors block"
    >
      <div className="text-primary mb-2">{icon}</div>
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
        {label}
      </p>
      <p
        className={`text-xl md:text-2xl font-bold leading-none ${mono ? "font-mono text-primary" : ""}`}
      >
        {value}
      </p>
    </Link>
  );
}

function ActionCard({
  href,
  title,
  description,
  cta,
}: {
  href: string;
  title: string;
  description: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="bg-card border border-border rounded-2xl p-5 md:p-6 hover:border-primary/40 transition-colors block"
    >
      <h3 className="font-display text-xl italic mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
        {description}
      </p>
      <p className="text-sm text-primary font-semibold">{cta}</p>
    </Link>
  );
}
