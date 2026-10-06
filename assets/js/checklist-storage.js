// Pure load/save/toggle logic for a persistent checklist (#21). Code names
// are English. No DOM or localStorage access — the storage back-end is passed
// in so the module runs both in the browser and in Node for unit tests.
//
// State is a plain object mapping item keys to booleans. Serialization is
// JSON. The key under which the state is persisted is a caller concern (the
// UI passes `localStorage` and a key name).

/**
 * Load previously persisted state from a storage back-end.
 * Returns a plain object mapping keys to booleans, or an empty object when
 * nothing is stored or the value cannot be parsed.
 * @param {{ getItem(key: string): string | null }} storage
 * @param {string} key
 * @returns {Record<string, boolean>}
 */
export function load(storage, key) {
  try {
    const raw = storage.getItem(key);
    if (raw == null) return {};
    const parsed = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return {};
    /** @type {Record<string, boolean>} */
    const state = {};
    for (const [k, v] of Object.entries(parsed)) {
      if (typeof v === "boolean") state[k] = v;
    }
    return state;
  } catch {
    return {};
  }
}

/**
 * Persist the current state to a storage back-end.
 * @param {{ setItem(key: string, value: string): void }} storage
 * @param {string} key
 * @param {Record<string, boolean>} state
 */
export function save(storage, key, state) {
  storage.setItem(key, JSON.stringify(state));
}

/**
 * Toggle one item and return the updated state (a new object, no mutation).
 * Items not yet in the state default to unchecked, so the first toggle
 * checks them.
 * @param {Record<string, boolean>} state
 * @param {string} itemKey
 * @returns {Record<string, boolean>}
 */
export function toggle(state, itemKey) {
  return { ...state, [itemKey]: !state[itemKey] };
}

/**
 * Count checked items relative to a list of all expected keys.
 * @param {Record<string, boolean>} state
 * @param {string[]} allKeys
 * @returns {{ checked: number, total: number }}
 */
export function progress(state, allKeys) {
  const checked = allKeys.filter((k) => state[k] === true).length;
  return { checked, total: allKeys.length };
}
