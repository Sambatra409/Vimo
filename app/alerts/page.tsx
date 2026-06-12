import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { listAlerts } from "@/lib/actions/alerts";
import { AlertsClient } from "./alerts-client";

export default async function AlertsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?redirect=/alerts");

  const alerts = await listAlerts();

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 py-8 md:py-12">
      <header className="mb-8">
        <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-2">
          Espace locataire
        </p>
        <h1 className="font-display text-3xl md:text-5xl italic">Mes alertes</h1>
        <p className="text-muted-foreground mt-2 text-sm md:text-base">
          Soyez prévenu quand un bien correspondant à vos critères est publié.
        </p>
      </header>

      <AlertsClient initialAlerts={alerts} />
    </div>
  );
}
