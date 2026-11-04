let count = 0;
const listeners = new Set<() => void>();
export const hasOpenEditor = () =>
  count > 0 ||
  (typeof document !== "undefined" &&
    document.querySelector("dialog[open]") !== null);
export function holdEditor() {
  count++;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    count--;
    if (count === 0) listeners.forEach((fn) => fn());
  };
}
export function onEditorsClosed(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}
