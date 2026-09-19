export const SESSION_STORAGE_KEY = "ofogbank_session";
const SESSION_CHANGE_EVENT = "ofogbank-session-change";

export function subscribeToMockSession(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(SESSION_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(SESSION_CHANGE_EVENT, onStoreChange);
  };
}

export function hasMockSession() {
  return sessionStorage.getItem(SESSION_STORAGE_KEY) === "1";
}

export function getServerMockSession() {
  return false;
}

export function setMockSession() {
  sessionStorage.setItem(SESSION_STORAGE_KEY, "1");
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}

export function clearMockSession() {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  window.dispatchEvent(new Event(SESSION_CHANGE_EVENT));
}
