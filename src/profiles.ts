/**
 * Reading settings for each child.
 *
 * What helps varies between children (e.g. syllable colors: Brügelmann 2025;
 * spacing and short lines: Schneps et al. 2013). Reading settings therefore
 * belong to a profile; interface language, book language, and view remain shared.
 */

/** Settings that belong to a profile. */
export const PROFILE_KEYS = ["font", "size", "ls", "lh", "mode", "sylWords", "colors", "bg", "lines", "rate", "turn"] as const;
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

/** Load saved profiles; if valid data is missing, create the first profile from current settings. */
export function initProfiles(raw: string | null, S: object, firstName: string): ProfileStore {
  if (raw) {
    try { const st = JSON.parse(raw); if (valid(st)) return st; } catch { /* create a new store */ }
  }
  const id = newId();
  return { active: id, list: [{ id, name: firstName, settings: pick(S) }] };
}

/** Write current reading settings to the active profile. */
export function syncActive(st: ProfileStore, S: object): ProfileStore {
  return { ...st, list: st.list.map(p => (p.id === st.active ? { ...p, settings: pick(S) } : p)) };
}

/**
 * Create and activate a new profile, starting with the current settings except `start`, which the
 * new child gets instead (syllable colours start off: each child should only get help that suits them).
 */
export function addProfile(st: ProfileStore, name: string, S: object, start: Values = {}): ProfileStore {
  const synced = syncActive(st, S);
  const id = newId();
  Object.assign(S, start);
  return { active: id, list: [...synced.list, { id, name: name.trim() || "?", settings: pick(S) }] };
}

/** Switch to a profile, writing its values to `S`. */
export function switchProfile(st: ProfileStore, id: string, S: object): ProfileStore {
  const synced = syncActive(st, S);
  const p = synced.list.find(x => x.id === id);
  if (!p) return synced;
  Object.assign(S, p.settings);
  return { ...synced, active: id };
}

/** Delete a profile, except the last one; deleting the active profile activates the first remaining one. */
export function removeProfile(st: ProfileStore, id: string, S: object): ProfileStore {
  if (st.list.length <= 1) return st;
  const list = st.list.filter(p => p.id !== id);
  if (st.active !== id) return { ...st, list };
  const next = list[0];
  Object.assign(S, next.settings);
  return { active: next.id, list };
}
