/**
 * Persistance locale (localStorage) des profils d'écriture.
 * 100% local — aucune donnée ne quitte le navigateur.
 *
 * Stocke plusieurs profils nommés (clé -> WriterProfile) ainsi que
 * l'identifiant du profil actif, pour le restaurer au rechargement.
 */
import type { WriterProfile } from "./writerProfile";

const STORAGE_KEY = "unrobot.profiles.v1";
const ACTIVE_KEY = "unrobot.activeProfileId.v1";

export type StoredProfiles = Record<string, WriterProfile>;

function isStorageAvailable(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Charge tous les profils sauvegardés. Retourne {} si rien n'est stocké ou si le stockage est indisponible. */
export function loadProfiles(): StoredProfiles {
  if (!isStorageAvailable()) return {};
  return safeParse<StoredProfiles>(window.localStorage.getItem(STORAGE_KEY), {});
}

/** Sauvegarde l'ensemble des profils. Échec silencieux si le stockage est plein/indisponible : l'app reste utilisable sans persistance. */
export function saveProfiles(profiles: StoredProfiles): void {
  if (!isStorageAvailable()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profiles));
  } catch {
    // Quota dépassé ou stockage désactivé (navigation privée stricte, etc.) : on ignore.
  }
}

export function loadActiveProfileId(): string | null {
  if (!isStorageAvailable()) return null;
  return window.localStorage.getItem(ACTIVE_KEY);
}

export function saveActiveProfileId(id: string | null): void {
  if (!isStorageAvailable()) return;
  try {
    if (id) window.localStorage.setItem(ACTIVE_KEY, id);
    else window.localStorage.removeItem(ACTIVE_KEY);
  } catch {
    // idem : échec silencieux, non bloquant.
  }
}

export function generateProfileId(): string {
  return `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
