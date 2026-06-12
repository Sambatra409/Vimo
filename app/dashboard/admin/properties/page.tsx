import { Suspense } from "react";
import { listAllPropertiesForAdmin } from "@/lib/actions/admin";
import { PropertiesAdminTable } from "./properties-table";

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export const dynamic = "force-dynamic";

export default async function AdminPropertiesPage({ searchParams }: Props) {
  const { q } = await searchParams;
  const items = await listAllPropertiesForAdmin(q);

  return (
    <>
      <h2 className="font-display text-2xl italic mb-1">Annonces</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Toutes les annonces de la plateforme — actives, pausées ou archivées.
      </p>
      <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
        <PropertiesAdminTable initialItems={items as any} initialSearch={q ?? ""} />
      </Suspense>
    </>
  );
}
