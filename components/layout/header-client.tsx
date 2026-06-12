"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Menu,
  X,
  Home,
  LogIn,
  UserPlus,
  Heart,
  Bell,
  MessageSquare,
  Coins,
  GitCompare,
  LayoutDashboard,
  Plus,
  Shield,
  LogOut,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { signOutAction } from "@/lib/actions/auth";

type Role = "locataire" | "proprietaire" | "admin";

interface MinimalUser {
  full_name: string;
  tokens_balance: number;
  roles: Role[];
}

interface Props {
  user: MinimalUser | null;
}

export function HeaderClient({ user }: Props) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  const isAdmin = user?.roles.includes("admin") ?? false;
  const isOwner = user?.roles.includes("proprietaire") ?? false;
  const canPost = isOwner || isAdmin;

  const dashboardPath = isAdmin
    ? "/dashboard/admin"
    : isOwner
      ? "/dashboard/owner"
      : "/dashboard/tenant";

  return (
    <nav className="sticky top-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between gap-3">
        {/* Logo + Nav desktop */}
        <div className="flex items-center gap-8 min-w-0">
          <Link
            href="/"
            onClick={close}
            className="font-display text-xl md:text-2xl font-bold tracking-tight text-primary italic truncate"
          >
            Vohitra.
          </Link>
          <div className="hidden md:flex gap-6 text-sm font-medium items-center">
            <Link href="/" className="hover:text-primary transition-colors">
              Annonces
            </Link>
            {user && (
              <>
                <Link
                  href={dashboardPath}
                  className="hover:text-primary transition-colors"
                >
                  Mon espace
                </Link>
                <Link
                  href="/messages"
                  className="hover:text-primary transition-colors"
                >
                  Messages
                </Link>
              </>
            )}
          </div>
        </div>

        {/* Actions desktop */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <>
              {/* Bouton "Mode admin" pour les admins */}
              {isAdmin && (
                <Link
                  href="/dashboard/admin"
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 bg-verified/10 hover:bg-verified/20 rounded-full text-verified transition-colors"
                  title="Console d'administration"
                >
                  <Shield className="size-3.5" /> Admin
                </Link>
              )}
              {/* Bouton "Nouvelle annonce" pour proprios/admins */}
              {canPost && (
                <Link
                  href="/property/new"
                  className="flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 bg-primary/10 hover:bg-primary/20 rounded-full text-primary transition-colors"
                >
                  <Plus className="size-3.5" /> Annonce
                </Link>
              )}
              {/* Compteur de jetons */}
              <Link
                href="/tokens"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/5 hover:bg-primary/10 rounded-full transition-colors"
              >
                <Coins className="size-3.5 text-primary" />
                <span className="text-xs font-mono font-medium">
                  {user.tokens_balance} jetons
                </span>
              </Link>
              {/* Bouton déconnexion */}
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="text-sm font-medium px-4 py-2 hover:bg-muted rounded-lg transition-colors"
                >
                  Déconnexion
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium px-4 py-2 hover:bg-muted rounded-lg transition-colors"
              >
                Connexion
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium bg-foreground text-background px-5 py-2 rounded-lg hover:opacity-90 transition-opacity"
              >
                Inscription
              </Link>
            </>
          )}
        </div>

        {/* Actions mobile */}
        <div className="md:hidden flex items-center gap-2">
          <ThemeToggle />
          {user && (
            <Link
              href="/tokens"
              onClick={close}
              className="flex items-center gap-1 px-2.5 py-1 bg-primary/10 rounded-full"
            >
              <Coins className="size-3 text-primary" />
              <span className="text-xs font-mono font-bold">
                {user.tokens_balance}
              </span>
            </Link>
          )}
          <button
            aria-label="Menu"
            onClick={() => setOpen((v) => !v)}
            className="p-2 -mr-2 rounded-md hover:bg-muted"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      {/* Sheet mobile */}
      {open && (
        <div className="md:hidden border-t border-border bg-background animate-fade-up">
          <div className="px-4 py-4 flex flex-col gap-1 text-sm font-medium">
            {user && canPost && (
              <Link
                href="/property/new"
                onClick={close}
                className="mb-2 py-3 px-4 bg-primary text-primary-foreground rounded-xl flex items-center justify-center gap-2 font-semibold shadow-sm"
              >
                <Plus className="size-4" /> Nouvelle annonce
              </Link>
            )}

            <MobileLink
              href="/"
              onClick={close}
              icon={<Home className="size-4" />}
              label="Annonces"
            />

            {user ? (
              <>
                <MobileLink
                  href={dashboardPath}
                  onClick={close}
                  icon={
                    isAdmin ? (
                      <Shield className="size-4" />
                    ) : (
                      <LayoutDashboard className="size-4" />
                    )
                  }
                  label="Mon espace"
                />
                <MobileLink
                  href="/messages"
                  onClick={close}
                  icon={<MessageSquare className="size-4" />}
                  label="Messages"
                />
                <MobileLink
                  href="/favorites"
                  onClick={close}
                  icon={<Heart className="size-4" />}
                  label="Mes favoris"
                />
                <MobileLink
                  href="/compare"
                  onClick={close}
                  icon={<GitCompare className="size-4" />}
                  label="Comparateur"
                />
                <MobileLink
                  href="/alerts"
                  onClick={close}
                  icon={<Bell className="size-4" />}
                  label="Mes alertes"
                />
                <MobileLink
                  href="/tokens"
                  onClick={close}
                  icon={<Coins className="size-4" />}
                  label="Acheter des jetons"
                />

                <div className="my-2 h-px bg-border" />

                <form action={signOutAction}>
                  <button
                    type="submit"
                    onClick={close}
                    className="w-full text-left py-2.5 px-3 rounded-md hover:bg-muted text-destructive flex items-center gap-3"
                  >
                    <LogOut className="size-4" /> Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <>
                <MobileLink
                  href="/favorites"
                  onClick={close}
                  icon={<Heart className="size-4" />}
                  label="Mes favoris"
                />
                <MobileLink
                  href="/compare"
                  onClick={close}
                  icon={<GitCompare className="size-4" />}
                  label="Comparateur"
                />
                <div className="my-2 h-px bg-border" />
                <MobileLink
                  href="/login"
                  onClick={close}
                  icon={<LogIn className="size-4" />}
                  label="Se connecter"
                />
                <Link
                  href="/signup"
                  onClick={close}
                  className="mt-1 py-3 px-4 bg-foreground text-background rounded-xl flex items-center justify-center gap-2 font-semibold"
                >
                  <UserPlus className="size-4" /> Créer un compte
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

function MobileLink({
  href,
  onClick,
  icon,
  label,
}: {
  href: string;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="py-2.5 px-3 rounded-md hover:bg-muted flex items-center gap-3"
    >
      <span className="text-primary shrink-0">{icon}</span>
      <span className="flex-1">{label}</span>
    </Link>
  );
}
