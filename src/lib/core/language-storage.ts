/**
 * Language persistence — same shape as theme-storage.ts, minus the pre-paint
 * concern. A wrong theme flashes visibly before paint; a wrong language for
 * one extra render does not, so this can go through the normal store
 * lifecycle instead of a bare inline script in index.html.
 */

export const LANGUAGE_KEY = "fanation.language";
export const DEFAULT_LANGUAGE = "en";

export function readStoredLanguage(): string {
  try {
    return localStorage.getItem(LANGUAGE_KEY) || DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export function writeStoredLanguage(code: string): void {
  try {
    localStorage.setItem(LANGUAGE_KEY, code);
  } catch {
    /* Quota, or storage blocked. The choice still applies for this session,
       it just will not survive the reload — nothing the person asked for has
       visibly failed, so this stays silent the same way theme's write does. */
  }
}
