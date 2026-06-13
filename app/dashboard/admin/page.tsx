import { listVerificationRequests } from "@/lib/actions/verification";
import { createAdminClient } from "@/lib/supabase/admin";
import { VerificationsTable } from "./verifications-table";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  // === DEBUG: compter directement dans la DB ===
  const admin = createAdminClient();
  const { count: rawCount, error: rawErr } = await admin
    .from("verification_requests")
    .select("id", { count: "exact", head: true });

  const { data: rawData, error: rawDataErr } = await admin
    .from("verification_requests")
    .select("*")
    .limit(5);

  // Appel de la fonction
  let funcResult: any = null;
  let funcError: any = null;
  try {
    funcResult = await listVerificationRequests();
  } catch (e: any) {
    funcError = e?.message ?? String(e);
  }

  const requests = Array.isArray(funcResult) ? funcResult : [];
  const pending = requests.filter((r: any) => r.status === "pending");

  return (
    <>
      <h2 className="font-display text-2xl italic mb-1">Vérifications d'annonces</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {pending.length} demande{pending.length > 1 ? "s" : ""} de vérification en attente.
      </p>

      {/* ===== PANNEAU DEBUG (temporaire) ===== */}
      <div className="bg-yellow-100 dark:bg-yellow-900/20 border-2 border-yellow-400 rounded-2xl p-4 mb-6 text-xs font-mono">
        <p className="font-bold text-sm mb-2 font-sans">🐛 DEBUG INFO</p>
        <p>
          <strong>Count direct DB :</strong> {rawCount ?? "null"}
          {rawErr && <span className="text-red-600"> | ERR: {rawErr.message}</span>}
        </p>
        <p className="mt-1">
          <strong>Raw data (5 premières lignes) :</strong>{" "}
          {rawData ? rawData.length : "null"} lignes
          {rawDataErr && <span className="text-red-600"> | ERR: {rawDataErr.message}</span>}
        </p>
        <p className="mt-1">
          <strong>listVerificationRequests() retourne :</strong>{" "}
          {Array.isArray(funcResult) ? `${funcResult.length} éléments` : `non-array (${typeof funcResult})`}
          {funcError && <span className="text-red-600"> | ERR: {funcError}</span>}
        </p>
        {rawData && rawData.length > 0 && (
          <details className="mt-3">
            <summary className="cursor-pointer font-sans font-semibold text-sm">
              Voir les données brutes (clique pour ouvrir)
            </summary>
            <pre className="mt-2 p-2 bg-black/5 dark:bg-white/5 rounded overflow-auto text-[10px]">
              {JSON.stringify(rawData, null, 2)}
            </pre>
          </details>
        )}
      </div>
      {/* ===== FIN DEBUG ===== */}

      <VerificationsTable initialRequests={requests as any} />
    </>
  );
}
