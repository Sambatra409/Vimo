// lib/forbidden-content.ts
// ⚠️ PAS de "use server" ici — c'est un module utilitaire partagé
// utilisable depuis Server Actions ET Client Components

/**
 * Patterns à interdire dans le contenu textuel et résultat OCR.
 */
export const FORBIDDEN_PATTERNS = [
  // Téléphones Madagascar (032, 033, 034, 038 ou +261)
  /(?:\+?261|0)\s*[2-9](?:[\s.-]?\d){8,9}/g,
  // Téléphones internationaux génériques (10+ chiffres)
  /(?:\+?\d{1,3}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/g,
  // Emails
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
];

export function checkForbiddenContent(text: string): {
  ok: boolean;
  found?: string;
} {
  if (!text) return { ok: true };
  for (const pattern of FORBIDDEN_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[0].length > 5) {
      return { ok: false, found: match[0] };
    }
  }
  return { ok: true };
}
