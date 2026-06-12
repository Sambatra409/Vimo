"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, Ban, CheckCircle2, Plus, Minus, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  banUserAction,
  unbanUserAction,
  adjustTokensAction,
  toggleUserRoleAction,
} from "@/lib/actions/admin";

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  tokens_balance: number;
  is_banned: boolean;
  is_kyc_verified: boolean;
  roles: string[];
  created_at: string;
}

export function UsersTable({
  initialUsers,
  initialSearch,
}: {
  initialUsers: User[];
  initialSearch: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [search, setSearch] = useState(initialSearch);
  const [openId, setOpenId] = useState<string | null>(null);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    router.push(`${pathname}?q=${encodeURIComponent(search)}`);
  };

  return (
    <>
      {/* Recherche */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom ou email…"
            className="w-full min-h-12 pl-10 pr-4 bg-background border border-border rounded-lg text-sm"
          />
        </div>
        <button
          type="submit"
          className="px-4 min-h-12 bg-primary text-primary-foreground rounded-lg text-sm font-semibold"
        >
          Chercher
        </button>
      </form>

      {/* Liste */}
      {initialUsers.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 border border-dashed border-border rounded-2xl">
          Aucun utilisateur trouvé.
        </p>
      ) : (
        <div className="bg-card border border-border rounded-2xl divide-y divide-border">
          {initialUsers.map((u) => (
            <UserRow
              key={u.id}
              user={u}
              isOpen={openId === u.id}
              onToggle={() => setOpenId(openId === u.id ? null : u.id)}
              onRefresh={() => router.refresh()}
            />
          ))}
        </div>
      )}
    </>
  );
}

function UserRow({
  user,
  isOpen,
  onToggle,
  onRefresh,
}: {
  user: User;
  isOpen: boolean;
  onToggle: () => void;
  onRefresh: () => void;
}) {
  const [pending, startTransition] = useTransition();

  const handleBan = () => {
    const reason = prompt("Motif du bannissement ?");
    if (reason === null) return;
    startTransition(async () => {
      const res = await banUserAction(user.id, reason);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Utilisateur banni");
        onRefresh();
      }
    });
  };

  const handleUnban = () => {
    startTransition(async () => {
      await unbanUserAction(user.id);
      toast.success("Bannissement levé");
      onRefresh();
    });
  };

  const handleAdjust = (delta: number) => {
    const amountStr = prompt(`${delta > 0 ? "Ajouter" : "Retirer"} combien de jetons ?`, "10");
    if (!amountStr) return;
    const amount = Math.abs(Number(amountStr));
    if (!amount || !Number.isInteger(amount)) {
      toast.error("Nombre invalide.");
      return;
    }
    const note = prompt("Motif (optionnel) :") ?? "";

    startTransition(async () => {
      const res = await adjustTokensAction(user.id, delta * amount, note);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success(`${delta > 0 ? "+" : "-"}${amount} jetons appliqués`);
        onRefresh();
      }
    });
  };

  const handleRole = (role: "locataire" | "proprietaire" | "admin", action: "add" | "remove") => {
    const verb = action === "add" ? "donner" : "retirer";
    if (!confirm(`${verb} le rôle "${role}" à ${user.full_name} ?`)) return;
    startTransition(async () => {
      const res = await toggleUserRoleAction(user.id, role, action);
      if (!res.ok) toast.error(res.error);
      else {
        toast.success("Rôle mis à jour");
        onRefresh();
      }
    });
  };

  return (
    <div>
      {/* Ligne principale */}
      <div className="flex items-center gap-3 p-3 md:p-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm truncate">{user.full_name}</p>
            {user.is_banned && (
              <span className="text-[10px] uppercase tracking-widest font-bold bg-destructive/15 text-destructive px-1.5 py-0.5 rounded">
                Banni
              </span>
            )}
            {user.is_kyc_verified && (
              <span className="text-[10px] uppercase tracking-widest font-bold bg-verified/15 text-verified px-1.5 py-0.5 rounded">
                KYC
              </span>
            )}
            {user.roles.map((r) => (
              <span
                key={r}
                className={`text-[10px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded ${
                  r === "admin"
                    ? "bg-primary/15 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {r}
              </span>
            ))}
          </div>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-sm font-semibold text-primary">
            {user.tokens_balance}
          </p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
            jetons
          </p>
        </div>
        <button
          onClick={onToggle}
          disabled={pending}
          aria-label="Actions"
          className="size-9 grid place-items-center rounded-md hover:bg-muted shrink-0"
        >
          <MoreHorizontal className="size-4" />
        </button>
      </div>

      {/* Panneau d'actions */}
      {isOpen && (
        <div className="bg-muted/30 px-3 md:px-4 py-3 border-t border-border space-y-3">
          {/* Jetons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              Jetons :
            </span>
            <button
              onClick={() => handleAdjust(1)}
              disabled={pending}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-verified/10 text-verified hover:bg-verified/20"
            >
              <Plus className="size-3" /> Ajouter
            </button>
            <button
              onClick={() => handleAdjust(-1)}
              disabled={pending}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20"
            >
              <Minus className="size-3" /> Retirer
            </button>
          </div>

          {/* Rôles */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              Rôles :
            </span>
            {(["locataire", "proprietaire", "admin"] as const).map((r) => {
              const has = user.roles.includes(r);
              return (
                <button
                  key={r}
                  onClick={() => handleRole(r, has ? "remove" : "add")}
                  disabled={pending}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md ${
                    has
                      ? "bg-primary/10 text-primary hover:bg-primary/20"
                      : "bg-muted text-muted-foreground hover:bg-card"
                  }`}
                >
                  {has ? "−" : "+"} {r}
                </button>
              );
            })}
          </div>

          {/* Ban */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">
              Modération :
            </span>
            {user.is_banned ? (
              <button
                onClick={handleUnban}
                disabled={pending}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-verified/10 text-verified hover:bg-verified/20"
              >
                <CheckCircle2 className="size-3" /> Lever le bannissement
              </button>
            ) : (
              <button
                onClick={handleBan}
                disabled={pending}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-destructive/10 text-destructive hover:bg-destructive/20"
              >
                <Ban className="size-3" /> Bannir
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
