"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";

const TYPES = [
  { value: "", label: "Tous types" },
  { value: "appartement", label: "Appartement" },
  { value: "maison", label: "Maison" },
  { value: "local_commercial", label: "Local commercial" },
  { value: "terrain", label: "Terrain" },
] as const;

const LISTINGS = [
  { value: "", label: "Louer & vendre" },
  { value: "rent", label: "À louer" },
  { value: "sale", label: "À vendre" },
] as const;

export function SearchFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Lire l'état initial depuis l'URL
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [listing, setListing] = useState(searchParams.get("listing") ?? "");
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [pmin, setPmin] = useState(searchParams.get("pmin") ?? "");
  const [pmax, setPmax] = useState(searchParams.get("pmax") ?? "");
  const [smin, setSmin] = useState(searchParams.get("smin") ?? "");
  const [rooms, setRooms] = useState(searchParams.get("rooms") ?? "");

  const hasAdvanced =
    !!searchParams.get("pmin") ||
    !!searchParams.get("smin") ||
    !!searchParams.get("rooms") ||
    !!searchParams.get("listing");
  const [advancedOpen, setAdvancedOpen] = useState(hasAdvanced);

  // Debounce : à chaque changement local, on attend 350ms puis on push à l'URL
  useEffect(() => {
    const t = setTimeout(() => {
      const params = new URLSearchParams();
      if (city.trim()) params.set("city", city.trim());
      if (type) params.set("type", type);
      if (listing) params.set("listing", listing);
      if (q.trim()) params.set("q", q.trim());
      if (pmin) params.set("pmin", pmin.replace(/\s/g, ""));
      if (pmax) params.set("pmax", pmax.replace(/\s/g, ""));
      if (smin) params.set("smin", smin);
      if (rooms) params.set("rooms", rooms);

      startTransition(() => {
        const qs = params.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
      });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, type, listing, q, pmin, pmax, smin, rooms]);

  const reset = () => {
    setCity("");
    setType("");
    setListing("");
    setQ("");
    setPmin("");
    setPmax("");
    setSmin("");
    setRooms("");
  };

  const hasFilters =
    city || type || listing || q || pmin || pmax || smin || rooms;

  return (
    <>
      {/* Barre principale */}
      <div className="max-w-4xl mx-auto bg-card p-2 rounded-2xl shadow-xl shadow-primary/5 border border-border flex flex-col md:flex-row gap-1 md:gap-2 text-left">
        <label className="flex-1 flex flex-col items-start px-4 py-2 md:border-r border-border min-h-12 justify-center">
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
            Ville
          </span>
          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Antananarivo, Tamatave..."
            className="w-full text-base md:text-sm font-medium focus:outline-none bg-transparent"
          />
        </label>
        <label className="flex-1 flex flex-col items-start px-4 py-2 md:border-r border-border min-h-12 justify-center">
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
            Type de bien
          </span>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="w-full text-base md:text-sm font-medium focus:outline-none bg-transparent text-foreground"
          >
            {TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex-1 flex flex-col items-start px-4 py-2 md:border-r border-border min-h-12 justify-center">
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
            Budget Max (Ar)
          </span>
          <input
            type="text"
            inputMode="numeric"
            value={pmax}
            onChange={(e) => setPmax(e.target.value.replace(/[^\d\s]/g, ""))}
            placeholder="5 000 000"
            className="w-full text-base md:text-sm font-medium focus:outline-none bg-transparent"
          />
        </label>
        <label className="flex-1 flex flex-col items-start px-4 py-2 min-h-12 justify-center">
          <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
            Recherche
          </span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Mot-clé..."
            className="w-full text-base md:text-sm font-medium focus:outline-none bg-transparent"
          />
        </label>
      </div>

      {/* Toggle filtres avancés + reset */}
      <div className="max-w-4xl mx-auto mt-3 flex items-center justify-between text-xs">
        <button
          onClick={() => setAdvancedOpen((v) => !v)}
          aria-expanded={advancedOpen}
          className="flex items-center gap-2 px-4 min-h-10 rounded-full hover:bg-muted text-foreground font-medium"
        >
          <SlidersHorizontal className="size-3.5" />
          Filtres avancés
        </button>
        {hasFilters && (
          <button
            onClick={reset}
            className="flex items-center gap-1 px-4 min-h-10 rounded-full text-muted-foreground hover:text-destructive hover:bg-muted"
          >
            <X className="size-3.5" /> Réinitialiser
          </button>
        )}
      </div>

      {/* Bloc filtres avancés */}
      {advancedOpen && (
        <div className="max-w-4xl mx-auto mt-3 bg-card border border-border rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-left animate-fade-up">
          <div className="flex flex-col">
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
              Transaction
            </label>
            <select
              value={listing}
              onChange={(e) => setListing(e.target.value)}
              className="bg-background text-foreground border border-input rounded-md px-2 py-1.5 text-sm"
            >
              {LISTINGS.map((l) => (
                <option key={l.value} value={l.value}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
              Prix min (Ar)
            </label>
            <input
              type="text"
              value={pmin}
              onChange={(e) => setPmin(e.target.value.replace(/[^\d\s]/g, ""))}
              placeholder="0"
              className="bg-background border border-input rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
              Surface min (m²)
            </label>
            <input
              type="number"
              min="0"
              value={smin}
              onChange={(e) => setSmin(e.target.value)}
              placeholder="0"
              className="bg-background border border-input rounded-md px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">
              Pièces min
            </label>
            <input
              type="number"
              min="0"
              value={rooms}
              onChange={(e) => setRooms(e.target.value)}
              placeholder="0"
              className="bg-background border border-input rounded-md px-2 py-1.5 text-sm"
            />
          </div>
        </div>
      )}
    </>
  );
}
