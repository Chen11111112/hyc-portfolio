export const BOOT_READY = "hyc-ready";

declare global {
  interface Window {
    __hycReady?: boolean;
  }
}

export function markBootReady() {
  window.__hycReady = true;
  window.dispatchEvent(new Event(BOOT_READY));
}

export function isBootReady() {
  return window.__hycReady === true;
}
