(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function invalidateTopicEntriesCache(state) {
    state.topicEntriesCache = null;
    state.topicEntriesCacheRoot = null;
  }

  function getTopicEntries(state, options = {}) {
    const documentRef = options.documentRef || globalThis.document;
    const mainContentSelector = options.mainContentSelector || "#main-outlet";
    const primaryTopicLinkSelector = options.primaryTopicLinkSelector || "a.title";
    const rootId = options.rootId || "ld-drawer-root";
    const excludedLinkContextSelector = options.excludedLinkContextSelector || "";
    const getTopicUrlFromLink = options.getTopicUrlFromLink;
    const getTopicEntryContainer = options.getTopicEntryContainer;
    const getTopicIdHintFromLink = options.getTopicIdHintFromLink;
    const getTopicIdFromUrl = options.getTopicIdFromUrl;
    const buildEntryKey = options.buildEntryKey;
    const isPrimaryTopicLink = options.isPrimaryTopicLink;
    const normalizeTopicUrl = options.normalizeTopicUrl;
    const locationHref = options.locationHref || globalThis.location?.href || "";
    const locationOrigin = options.locationOrigin || globalThis.location?.origin || "";
    if (
      !state
      || !documentRef
      || typeof getTopicUrlFromLink !== "function"
      || typeof getTopicEntryContainer !== "function"
      || typeof getTopicIdHintFromLink !== "function"
      || typeof getTopicIdFromUrl !== "function"
      || typeof buildEntryKey !== "function"
    ) {
      return [];
    }

    const mainContent = documentRef.querySelector(mainContentSelector);
    if (
      Array.isArray(state.topicEntriesCache)
      && state.topicEntriesCacheRoot === mainContent
    ) {
      return state.topicEntriesCache;
    }

    const entries = [];
    const seen = new WeakSet();
    const duplicateCounts = new Map();

    if (!(mainContent instanceof Element)) {
      state.topicEntriesCache = entries;
      state.topicEntriesCacheRoot = null;
      return entries;
    }

    for (const link of mainContent.querySelectorAll(primaryTopicLinkSelector)) {
      if (!(link instanceof HTMLAnchorElement)) {
        continue;
      }

      const url = getTopicUrlFromLink(link, {
        rootId,
        mainContentSelector,
        excludedLinkContextSelector,
        isPrimaryTopicLink,
        normalizeTopicUrl,
        locationHref,
        locationOrigin
      });
      if (!url) {
        continue;
      }

      const entryElement = getTopicEntryContainer(link);
      if (seen.has(entryElement)) {
        continue;
      }

      seen.add(entryElement);
      const occurrence = (duplicateCounts.get(url) || 0) + 1;
      duplicateCounts.set(url, occurrence);
      entries.push({
        entryElement,
        entryKey: buildEntryKey(url, occurrence),
        topicIdHint: getTopicIdHintFromLink(link) || getTopicIdFromUrl(url),
        url,
        title: link.textContent.trim() || url,
        link
      });
    }

    state.topicEntriesCache = entries;
    state.topicEntriesCacheRoot = mainContent;
    return entries;
  }

  function resolveCurrentEntryIndex(state, entries) {
    if (!Array.isArray(entries) || !entries.length) {
      return -1;
    }

    if (state.currentEntryKey) {
      const indexByKey = entries.findIndex((entry) => entry.entryKey === state.currentEntryKey);
      if (indexByKey !== -1) {
        return indexByKey;
      }
    }

    if (state.currentEntryElement) {
      const indexByElement = entries.findIndex((entry) => entry.entryElement === state.currentEntryElement);
      if (indexByElement !== -1) {
        return indexByElement;
      }
    }

    return entries.findIndex((entry) => entry.url === state.currentUrl);
  }

  function navigateTopic(state, offset, options = {}) {
    const getTopicEntries = options.getTopicEntries;
    const resolveCurrentEntryIndex = options.resolveCurrentEntryIndex;
    const openDrawer = options.openDrawer;
    if (
      !state
      || typeof getTopicEntries !== "function"
      || typeof resolveCurrentEntryIndex !== "function"
      || typeof openDrawer !== "function"
    ) {
      return;
    }

    const entries = getTopicEntries();
    const currentIndex = resolveCurrentEntryIndex(entries);
    const nextEntry = currentIndex === -1 ? null : entries[currentIndex + offset];

    if (!nextEntry) {
      return;
    }

    nextEntry.link.scrollIntoView({ block: "nearest" });
    openDrawer(nextEntry.url, nextEntry.title, nextEntry.link);
  }

  runtime.topicEntryCacheUtils = {
    invalidateTopicEntriesCache,
    getTopicEntries,
    resolveCurrentEntryIndex,
    navigateTopic
  };
})();
