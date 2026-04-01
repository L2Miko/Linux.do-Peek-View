(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function hasPreviewableTopicLinks(getTopicEntries) {
    if (typeof getTopicEntries !== "function") {
      return false;
    }
    return getTopicEntries().length > 0;
  }

  function handleLocationChange(state, options = {}) {
    const locationHref = options.locationHref || globalThis.location?.href || "";
    const invalidateTopicEntriesCache = options.invalidateTopicEntriesCache;
    const hasPreviewableTopicLinksFn = options.hasPreviewableTopicLinks;
    const closeDrawer = options.closeDrawer;

    state.lastLocation = locationHref;
    if (typeof invalidateTopicEntriesCache === "function") {
      invalidateTopicEntriesCache();
    }

    if (typeof hasPreviewableTopicLinksFn === "function" && !hasPreviewableTopicLinksFn()) {
      if (typeof closeDrawer === "function") {
        closeDrawer();
      }
    }
  }

  function watchLocationChanges(state, options = {}) {
    const historyRef = options.historyRef || globalThis.history;
    const windowRef = options.windowRef || globalThis.window;
    const documentRef = options.documentRef || globalThis.document;
    const queueMicrotaskFn = options.queueMicrotaskFn || globalThis.queueMicrotask;
    const MutationObserverClass = options.MutationObserverClass || globalThis.MutationObserver;
    const handleLocationChangeFn = options.handleLocationChange;
    const invalidateTopicEntriesCache = options.invalidateTopicEntriesCache;
    const locationRef = options.locationRef || globalThis.location;
    if (
      !historyRef
      || !windowRef
      || !documentRef
      || typeof queueMicrotaskFn !== "function"
      || typeof MutationObserverClass !== "function"
      || typeof handleLocationChangeFn !== "function"
      || typeof invalidateTopicEntriesCache !== "function"
      || !locationRef
    ) {
      return;
    }

    const originalPushState = historyRef.pushState;
    const originalReplaceState = historyRef.replaceState;

    historyRef.pushState = function (...args) {
      const result = originalPushState.apply(this, args);
      queueMicrotaskFn(handleLocationChangeFn);
      return result;
    };

    historyRef.replaceState = function (...args) {
      const result = originalReplaceState.apply(this, args);
      queueMicrotaskFn(handleLocationChangeFn);
      return result;
    };

    windowRef.addEventListener("popstate", handleLocationChangeFn, true);

    let cacheInvalidationQueued = false;
    const queueTopicEntriesCacheInvalidation = () => {
      if (cacheInvalidationQueued) {
        return;
      }
      cacheInvalidationQueued = true;
      queueMicrotaskFn(() => {
        cacheInvalidationQueued = false;
        invalidateTopicEntriesCache();
      });
    };

    const observer = new MutationObserverClass(() => {
      if (locationRef.href !== state.lastLocation) {
        handleLocationChangeFn();
      } else {
        queueTopicEntriesCacheInvalidation();
      }
    });

    observer.observe(documentRef.documentElement, {
      childList: true,
      subtree: true
    });
  }

  runtime.locationWatchUtils = {
    hasPreviewableTopicLinks,
    handleLocationChange,
    watchLocationChanges
  };
})();
