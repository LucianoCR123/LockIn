// Service worker minimo: solo existe para que Chrome/Android considere la
// app "instalable" como PWA. No hace cache offline en esta beta.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", () => self.clients.claim());
self.addEventListener("fetch", () => {});
