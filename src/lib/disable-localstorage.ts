if (typeof window === "undefined") {
  // Kill Node's broken localStorage shim
  // @ts-ignore
  globalThis.localStorage = undefined;
}