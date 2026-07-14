const STORAGE_KEY = "diabolo-muted";

export function isSoundMuted(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function setSoundMuted(muted: boolean): void {
  localStorage.setItem(STORAGE_KEY, muted ? "1" : "0");
}

export function toggleSoundMuted(): boolean {
  const next = !isSoundMuted();
  setSoundMuted(next);
  return next;
}
