(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  async function reportTopicReadProgress(state, topicId, postNumbers, reportKey, options = {}) {
    const locationOrigin = options.locationOrigin || globalThis.location?.origin || "";
    const fetchImpl = options.fetchImpl || globalThis.fetch?.bind(globalThis);
    const documentRef = options.documentRef || globalThis.document;
    const clearCurrentEntryNewTopicBadge = options.clearCurrentEntryNewTopicBadge;
    if (
      !state
      || !Number.isFinite(topicId)
      || !Array.isArray(postNumbers)
      || !postNumbers.length
      || typeof fetchImpl !== "function"
      || typeof clearCurrentEntryNewTopicBadge !== "function"
      || !documentRef
    ) {
      return;
    }

    const csrfToken = runtime.securityUtils.getCsrfToken(documentRef);
    if (!csrfToken) {
      return;
    }

    const timings = {};
    const perPostTimeMs = 650;
    for (const postNumber of postNumbers) {
      timings[String(postNumber)] = perPostTimeMs;
    }

    const payload = {
      topic_id: topicId,
      topic_time: Math.max(1200, Math.min(180000, postNumbers.length * perPostTimeMs)),
      timings
    };

    const endpoints = [
      `${locationOrigin}/topics/timings`,
      `${locationOrigin}/t/${topicId}/timings`
    ];

    for (const endpoint of endpoints) {
      const response = await fetchImpl(endpoint, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-Token": csrfToken
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        state.lastReadReportKey = reportKey;
        clearCurrentEntryNewTopicBadge();
        return;
      }

      if (response.status !== 404) {
        return;
      }
    }
  }

  function clearCurrentEntryNewTopicBadge(state, options = {}) {
    const ElementClass = options.ElementClass || globalThis.Element;
    const HTMLElementClass = options.HTMLElementClass || globalThis.HTMLElement;
    if (!(state?.currentEntryElement instanceof ElementClass)) {
      return;
    }

    for (const badge of state.currentEntryElement.querySelectorAll(".badge.badge-notification.new-topic")) {
      if (badge instanceof HTMLElementClass) {
        badge.dataset.ldHidden = "true";
        badge.style.display = "none";
      }
    }
  }

  runtime.readReportUtils = {
    reportTopicReadProgress,
    clearCurrentEntryNewTopicBadge
  };
})();
