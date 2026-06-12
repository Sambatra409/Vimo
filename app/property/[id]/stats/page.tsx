import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye, Unlock, Heart, MessageSquare, TrendingUp } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { getPropertyStats } from "@/lib/actions/properties-crud";
import { createAdminClient } from "@/lib/supabase/admin";
import { titleCase } from "@/lib/format";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyStatsPage({ params }: Props) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/login?redirect=/property/${id}/stats`);

  const stats = await getPropertyStats(id);
  if (!stats) notFound();

  // Récupérer le titre de l'annonce
  const admin = createAdminClient();
  const { data: prop } = await admin
    .from("properties")
    .select("title, city")
    .eq("id", id)
    .single();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <Link
        href="/dashboard/owner"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6"
      >
        <ArrowLeft className="size-4" /> Retour au dashboard
      </Link>

      <header className="mb-8 md:mb-10">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
          Statistiques
        </p>
        <h1 className="font-display text-3xl md:text-4xl italic mb-2">
          {prop?.title ? titleCase(prop.title) : "Annonce"}
        </h1>
        <p className="text-muted-foreground text-sm">{prop?.city}</p>
      </header>

      {/* Cards principaux */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard icon={<Eye className="size-4" />} label="Vues totales" value={stats.views_total} sub={`${stats.views_7d} cette semaine`} />
        <StatCard icon={<Unlock className="size-4" />} label="Déblocages contact" value={stats.unlocks_total} sub="Très important" highlight />
        <StatCard icon={<Heart className="size-4" />} label="Favoris" value={stats.favorites_total} sub="Locataires intéressés" />
        <StatCard icon={<MessageSquare className="size-4" />} label="Conversations" value={stats.messages_total} sub="Personnes en contact" />
      </div>

      {/* Indicateur de conversion */}
      <div className="bg-card border border-border rounded-2xl p-5 md:p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1 flex items-center gap-2">
            <TrendingUp className="size-3.5 text-primary" />
            Taux de conversion
          </p>
          <p className="text-3xl md:text-4xl font-mono font-bold text-primary">
            {stats.conversion_rate}%
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            des visiteurs ont débloqué votre contact
          </p>
        </div>
        <p className="text-sm text-foreground/80 max-w-md leading-relaxed">
          {stats.conversion_rate >= 5
            ? "✨ Excellent ! Votre annonce convertit bien. Continuez."
            : stats.conversion_rate >= 1
              ? "Conversion moyenne. Vérifiez vos photos et description."
              : "Faible conversion. Améliorez votre titre, vos photos et le prix."}
        </p>
      </div>

      {/* Liste des déblocages récents */}
      <section className="bg-card border border-border rounded-2xl p-5 md:p-6">
        <h2 className="font-display text-xl italic mb-1">Déblocages récents</h2>
        <p className="text-xs text-muted-foreground mb-5">
          Les 10 dernières personnes qui ont consulté vos coordonnées
        </p>

        {stats.recent_unlocks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Personne n'a encore débloqué votre contact.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {stats.recent_unlocks.map((u, i) => (
              <div key={i} className="flex items-center justify-between py-3 gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {titleCase(u.user_name)}
                  </p>
                  <p className="text-xs text-muted-foreground truncate font-mono">
                    {u.user_email_masked}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground shrink-0">
                  {formatDate(u.unlocked_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  sub,
  highlight = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  sub: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`bg-card border rounded-2xl p-4 md:p-5 ${
        highlight ? "border-primary/30 ring-2 ring-primary/10" : "border-border"
      }`}
    >
      <div className={`${highlight ? "text-primary" : "text-muted-foreground"} mb-2`}>
        {icon}
      </div>
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
        {label}
      </p>
      <p
        className={`text-2xl md:text-3xl font-bold font-mono leading-none ${
          highlight ? "text-primary" : ""
        }`}
      >
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground mt-1.5">{sub}</p>
    </div>
  );
}
