/** Match a URL hash to a tab's canonical fragment or LANG-006 aliases. */
export function matchTabByHash<T extends { hash: string; hashAliases?: string[] }>(
  tabs: T[],
  hash: string,
): T | undefined {
  return tabs.find((tab) => tab.hash === hash || tab.hashAliases?.includes(hash));
}
