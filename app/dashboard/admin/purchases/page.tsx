import { listAllPurchases } from "@/lib/actions/admin";
import { PurchasesTable } from "./purchases-table";

export default async function AdminPurchasesPage() {
  const purchases = await listAllPurchases();

  const pending = purchases.filter((p: any) => p.status === "pending");

  return (
    <>
      <h2 className="font-display text-2xl italic mb-1">Achats de jetons</h2>
      <p className="text-sm text-muted-foreground mb-6">
        {pending.length} demande{pending.length > 1 ? "s" : ""} en attente de validation.
      </p>
      <PurchasesTable initialPurchases={purchases as any} />
    </>
  );
}
