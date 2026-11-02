/**
 * Leseeinstellungen pro Kind.
 *
 * Was hilft, ist von Kind zu Kind verschieden (z. B. Silbenfarben: Brügelmann 2025;
 * Abstände und kurze Zeilen: Schneps et al. 2013). Darum hängen die Leseeinstellungen
 * an einem Profil; Oberflächensprache, Buchsprache und Ansicht bleiben gemeinsam.
 */

/** Einstellungen, die zum Profil gehören. */
export const PROFILE_KEYS = ["font", "size", "ls", "lh", "mode", "colors", "bg", "lines", "rate", "turn"] as const;
export type ProfileKey = typeof PROFILE_KEYS[number];

type Values = Record<string, string | number>;
export interface Profile { id: string; name: string; settings: Values }
export interface ProfileStore { active: string; list: Profile[] }

const newId = () => Math.random().toString(36).slice(2, 10);

function pick(S: object): Values {
  const src = S as Values, out: Values = {};
  for (const k of PROFILE_KEYS) if (k in src) out[k] = src[k];
  return out;
}

function valid(x: unknown): x is ProfileStore {
  const st = x as ProfileStore;
  return !!st && typeof st.active === "string" && Array.isArray(st.list) && st.list.length > 0 &&
    st.list.every(p => p && typeof p.id === "string" && typeof p.name === "string" && typeof p.settings === "object") &&
    st.list.some(p => p.id === st.active);
}

/** Gespeicherte Profile laden; ohne (gültige) Daten ein erstes Profil aus den aktuellen Einstellungen. */
export function initProfiles(raw: string | null, S: object, firstName: string): ProfileStore {
  if (raw) {
    try { const st = JSON.parse(raw); if (valid(st)) return st; } catch { /* neu anlegen */ }
  }
  const id = newId();
  return { active: id, list: [{ id, name: firstName, settings: pick(S) }] };
}

/** Aktuelle Leseeinstellungen ins aktive Profil schreiben. */
export function syncActive(st: ProfileStore, S: object): ProfileStore {
  return { ...st, list: st.list.map(p => (p.id === st.active ? { ...p, settings: pick(S) } : p)) };
}

/** Neues Profil (startet mit den aktuellen Einstellungen) anlegen und aktivieren. */
export function addProfile(st: ProfileStore, name: string, S: object): ProfileStore {
  const synced = syncActive(st, S);
  const id = newId();
  return { active: id, list: [...synced.list, { id, name: name.trim() || "?", settings: pick(S) }] };
}

/** Zu einem Profil wechseln; schreibt dessen Werte in `S`. */
export function switchProfile(st: ProfileStore, id: string, S: object): ProfileStore {
  const synced = syncActive(st, S);
  const p = synced.list.find(x => x.id === id);
  if (!p) return synced;
  Object.assign(S, p.settings);
  return { ...synced, active: id };
}

/** Profil löschen (nie das letzte); bei Löschen des aktiven wird das erste übrige aktiv. */
export function removeProfile(st: ProfileStore, id: string, S: object): ProfileStore {
  if (st.list.length <= 1) return st;
  const list = st.list.filter(p => p.id !== id);
  if (st.active !== id) return { ...st, list };
  const next = list[0];
  Object.assign(S, next.settings);
  return { active: next.id, list };
}
