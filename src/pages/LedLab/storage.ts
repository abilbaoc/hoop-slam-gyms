/** localStorage wrappers: private mode or blocked storage must never break the page. */
export function loadItem(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function saveItem(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage full or blocked: keep working without persistence */
  }
}

export const DRAWING_KEY = 'hoop-ledlab-drawing';
export const HIGHSCORE_KEY = 'hoop-ledlab-highscore';
