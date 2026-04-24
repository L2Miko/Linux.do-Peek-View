(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function collectReadTrackCards(scope, options = {}) {
    const HTMLElementClass = options.HTMLElementClass || globalThis.HTMLElement;
    if (!scope || typeof scope.querySelectorAll !== "function") {
      return [];
    }

    return Array.from(scope.querySelectorAll(".ld-post-card[data-post-number]"))
      .filter((card) => card instanceof HTMLElementClass);
  }

  function syncReadTracking(state, posts, options = {}) {
    const scheduleReadVisibilityCheck = options.scheduleReadVisibilityCheck;
    const collectReadTrackCards = options.collectReadTrackCards;
    const cards = Array.isArray(options.cards) ? options.cards : null;
    const topicId = Number(state?.currentTopic?.id || state?.currentTopicIdHint);
    if (!Number.isFinite(topicId)) {
      return;
    }

    if (state.readTopicId !== topicId) {
      state.readTopicId = topicId;
      state.readSeenPostNumbers.clear();
      state.readPendingPostCards = [];
      state.lastReportedReadPostNumber = 0;
      state.lastReadReportKey = "";
    }

    if (!Array.isArray(posts) || posts.length === 0) {
      return;
    }

    const nextCards = cards || (
      typeof collectReadTrackCards === "function"
        ? collectReadTrackCards(state?.content)
        : []
    );
    if (nextCards.length > 0) {
      const seenCards = new Set(state.readPendingPostCards);
      for (const card of nextCards) {
        if (!seenCards.has(card)) {
          state.readPendingPostCards.push(card);
          seenCards.add(card);
        }
      }
    }

    if (typeof scheduleReadVisibilityCheck === "function") {
      scheduleReadVisibilityCheck();
    }
  }

  function scheduleReadVisibilityCheck(state, options = {}) {
    const requestAnimationFrameFn = options.requestAnimationFrameFn || globalThis.requestAnimationFrame;
    const cancelAnimationFrameFn = options.cancelAnimationFrameFn || globalThis.cancelAnimationFrame;
    const collectVisibleReadPosts = options.collectVisibleReadPosts;
    if (typeof requestAnimationFrameFn !== "function" || typeof cancelAnimationFrameFn !== "function") {
      return;
    }
    if (state.readVisibilityRaf) {
      cancelAnimationFrameFn(state.readVisibilityRaf);
    }
    state.readVisibilityRaf = requestAnimationFrameFn(() => {
      state.readVisibilityRaf = 0;
      if (typeof collectVisibleReadPosts === "function") {
        collectVisibleReadPosts();
      }
    });
  }

  function collectVisibleReadPosts(state, options = {}) {
    const HTMLElementClass = options.HTMLElementClass || globalThis.HTMLElement;
    const getDrawerTopOverlayInset = options.getDrawerTopOverlayInset;
    const scheduleReadProgressReportFromSeen = options.scheduleReadProgressReportFromSeen;
    if (
      !(state?.drawerBody instanceof HTMLElementClass)
      || !(state?.content instanceof HTMLElementClass)
      || typeof getDrawerTopOverlayInset !== "function"
    ) {
      return;
    }

    const containerRect = state.drawerBody.getBoundingClientRect();
    if (containerRect.height <= 0) {
      return;
    }

    let changed = false;
    const topInset = getDrawerTopOverlayInset(containerRect);
    const readLine = containerRect.top + topInset + 24;
    const minVisibleRatio = 0.2;

    const pendingCards = Array.isArray(state.readPendingPostCards) ? state.readPendingPostCards : [];
    if (!pendingCards.length) {
      return;
    }

    const nextPendingCards = [];
    for (const card of pendingCards) {
      if (!(card instanceof HTMLElementClass)) {
        continue;
      }
      if (!card.isConnected) {
        continue;
      }

      const postNumber = Number(card.dataset.postNumber);
      if (!Number.isFinite(postNumber) || postNumber <= 0) {
        continue;
      }

      if (state.readSeenPostNumbers.has(postNumber)) {
        continue;
      }

      const rect = card.getBoundingClientRect();
      const visibleTop = Math.max(rect.top, containerRect.top);
      const visibleBottom = Math.min(rect.bottom, containerRect.bottom);
      const visibleHeight = Math.max(0, visibleBottom - visibleTop);
      const visibleRatio = rect.height > 0 ? (visibleHeight / rect.height) : 0;
      const hasCrossedReadLine = rect.top <= readLine;

      if (visibleRatio >= minVisibleRatio && hasCrossedReadLine) {
        state.readSeenPostNumbers.add(postNumber);
        changed = true;
        continue;
      }

      nextPendingCards.push(card);
    }

    state.readPendingPostCards = nextPendingCards;

    if (changed && typeof scheduleReadProgressReportFromSeen === "function") {
      scheduleReadProgressReportFromSeen();
    }
  }

  function scheduleReadProgressReportFromSeen(state, options = {}) {
    const cancelReadProgressReport = options.cancelReadProgressReport;
    const reportTopicReadProgress = options.reportTopicReadProgress;
    const setTimeoutFn = options.setTimeoutFn || globalThis.setTimeout;
    if (typeof cancelReadProgressReport === "function") {
      cancelReadProgressReport();
    }

    const topicId = Number(state?.currentTopic?.id || state?.currentTopicIdHint);
    if (!Number.isFinite(topicId) || typeof reportTopicReadProgress !== "function" || typeof setTimeoutFn !== "function") {
      return;
    }

    const postNumbers = Array.from(state.readSeenPostNumbers)
      .filter((postNumber) => Number.isFinite(postNumber) && postNumber > 0)
      .sort((a, b) => a - b);
    if (!postNumbers.length) {
      return;
    }

    const maxSeenPostNumber = postNumbers[postNumbers.length - 1];
    if (maxSeenPostNumber <= state.lastReportedReadPostNumber) {
      return;
    }

    const reportKey = `${topicId}:${maxSeenPostNumber}:${postNumbers.length}`;
    state.readReportTimer = setTimeoutFn(() => {
      reportTopicReadProgress(topicId, postNumbers, reportKey)
        .then(() => {
          state.lastReportedReadPostNumber = Math.max(state.lastReportedReadPostNumber, maxSeenPostNumber);
        })
        .catch(() => {});
    }, 1200);
  }

  function cancelReadProgressReport(state, options = {}) {
    const clearTimeoutFn = options.clearTimeoutFn || globalThis.clearTimeout;
    if (state?.readReportTimer) {
      clearTimeoutFn(state.readReportTimer);
      state.readReportTimer = null;
    }
  }

  function resetReadTrackingState(state, options = {}) {
    const cancelReadProgressReport = options.cancelReadProgressReport;
    const cancelAnimationFrameFn = options.cancelAnimationFrameFn || globalThis.cancelAnimationFrame;
    if (typeof cancelReadProgressReport === "function") {
      cancelReadProgressReport();
    }
    if (state?.readVisibilityRaf) {
      cancelAnimationFrameFn(state.readVisibilityRaf);
      state.readVisibilityRaf = 0;
    }
    state.readTopicId = null;
    state.readSeenPostNumbers.clear();
    state.readPendingPostCards = [];
    state.lastReportedReadPostNumber = 0;
    state.lastReadReportKey = "";
  }

  runtime.readTrackingUtils = {
    collectReadTrackCards,
    syncReadTracking,
    scheduleReadVisibilityCheck,
    collectVisibleReadPosts,
    scheduleReadProgressReportFromSeen,
    cancelReadProgressReport,
    resetReadTrackingState
  };
})();
