// Shared draft preview for every dashboard material editor.
//
// The editor writes a snapshot of the unsaved material to localStorage and
// opens the preview page in a separate tab. The editor tab never unloads, so
// nothing has to be restored when the preview is closed. Only the preview
// page reads the snapshot.

// Stores the snapshot under `key` and opens `route` in a named tab, so a
// repeated preview reloads the same tab instead of opening a new one.
// Must be called synchronously from a click handler, or the browser blocks
// the new tab as a popup. Returns false if the snapshot could not be stored
// (e.g. localStorage quota exceeded); no tab is opened then.
export const openDashboardPreview = (
  key: string,
  route: string,
  snapshot: unknown,
): boolean => {
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(snapshot));
  } catch (error) {
    console.error(`Failed to store preview snapshot "${key}":`, error);
    return false;
  }
  globalThis.open(route, `maag-${key}`);
  return true;
};

// Returns the stored snapshot, or null if there is none or it is unreadable.
export const readDashboardPreview = <T extends object>(key: string): T | null => {
  try {
    const stored = globalThis.localStorage?.getItem(key);
    const parsed: unknown = stored ? JSON.parse(stored) : null;
    return parsed && typeof parsed === "object" ? (parsed as T) : null;
  } catch (error) {
    console.error(`Failed to read preview snapshot "${key}":`, error);
    return null;
  }
};

export const clearDashboardPreview = (key: string): void => {
  try {
    globalThis.localStorage?.removeItem(key);
  } catch (error) {
    console.warn(`Failed to clear preview snapshot "${key}":`, error);
  }
};
