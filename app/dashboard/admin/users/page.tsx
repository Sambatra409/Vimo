import { Suspense } from "react";
import { listAllUsers } from "@/lib/actions/admin";
import { UsersTable } from "./users-table";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const users = await listAllUsers(q);

  return (
    <>
      <h2 className="font-display text-2xl italic mb-1">Utilisateurs</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Recherchez, bannissez, modifiez les rôles et le solde de jetons.
      </p>
      <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
        <UsersTable initialUsers={users} initialSearch={q ?? ""} />
      </Suspense>
    </>
  );
}
