let sessionExpiredHandler: (() => void) | null = null;

export function setSessionExpiredHandler(handler: () => void) {
  sessionExpiredHandler = handler;
}

export function sessionExpired() {
  sessionExpiredHandler?.();
}
