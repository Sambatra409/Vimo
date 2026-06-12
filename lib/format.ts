/**
 * Formate un montant en Ariary avec espaces fines.
 * Ex: formatAr(2500000) => "2 500 000 Ar"
 */
export function formatAr(amount: number | string): string {
  const n = typeof amount === "string" ? Number(amount) : amount;
  if (!Number.isFinite(n)) return "—";
  return `${new Intl.NumberFormat("fr-FR").format(Math.round(n))} Ar`;
}

/**
 * Convertit la première lettre de chaque mot en majuscule.
 * Évite que "appartement t3 à tana" devienne moche dans les cartes.
 */
export function titleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(" ")
    .map((w) => (w.length === 0 ? w : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

/**
 * Label lisible pour un type de bien.
 */
export function propertyTypeLabel(type: string): string {
  const map: Record<string, string> = {
    appartement: "Appartement",
    maison: "Maison",
    local_commercial: "Local commercial",
    terrain: "Terrain",
  };
  return map[type] ?? type;
}

/**
 * Type de transaction lisible.
 */
export function listingTypeLabel(type: "rent" | "sale" | null | undefined): string {
  if (type === "sale") return "À vendre";
  if (type === "rent") return "À louer";
  return "";
}
