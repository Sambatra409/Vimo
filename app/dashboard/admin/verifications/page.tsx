import { listVerificationRequests } from "@/lib/actions/verification";
import { VerificationsTable } from "./verifications-table";

export default async function AdminVerificationsPage() {
  const requests = await listVerificationRequests();
  const pending = requests.filter((r: any) => r.status === "pending");

  return (
    <>
      <h2 className="font-display text-2xl italic mb-1">Vérifications d'annonces</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {pending.length} demande{pending.length > 1 ? "s" : ""} de vérification en attente.
      </p>
      <VerificationsTable initialRequests={requests as any} />
    </>
  );
}
