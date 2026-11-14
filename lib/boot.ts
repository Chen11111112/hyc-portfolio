export const BOOT_READY = "hyc-ready";
/** Fired when the boot screen starts to leave, i.e. the page underneath is now visible. */
export const BOOT_DONE = "hyc-boot-done";

declare global {
  interface Window {
    __hycReady?: boolean;
    __hycBootDone?: boolean;
  }
}

export function markBootReady() {
  window.__hycReady = true;
  window.dispatchEvent(new Event(BOOT_READY));
}

export function isBootReady() {
  return window.__hycReady === true;
}

export function markBootDone() {
  window.__hycBootDone = true;
  window.dispatchEvent(new Event(BOOT_DONE));
}

/** For useSyncExternalStore: whether the boot screen has gone (false on the server). */
export function subscribeBootDone(onChange: () => void) {
  window.addEventListener(BOOT_DONE, onChange);
  return () => window.removeEventListener(BOOT_DONE, onChange);
}

export const isBootDone = () => window.__hycBootDone === true;
export const isBootDoneOnServer = () => false;
