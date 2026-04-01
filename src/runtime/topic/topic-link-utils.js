(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime?.constants) {
    return;
  }

  const {
    LIST_ROW_SELECTOR,
    PRIMARY_TOPIC_LINK_SELECTOR,
    ENTRY_CONTAINER_SELECTOR
  } = runtime.constants;

  function isPrimaryTopicLink(link) {
    if (!(link instanceof HTMLAnchorElement)) {
      return false;
    }

    if (link.closest(LIST_ROW_SELECTOR)) {
      return link.matches(PRIMARY_TOPIC_LINK_SELECTOR);
    }

    return link.matches(PRIMARY_TOPIC_LINK_SELECTOR);
  }

  function buildEntryKey(url, occurrence) {
    return occurrence > 1 ? `${url}::${occurrence}` : url;
  }

  function getTopicEntryContainer(link) {
    if (!(link instanceof Element)) {
      return null;
    }

    return link.closest(ENTRY_CONTAINER_SELECTOR)
      || link.closest("[data-topic-id]")
      || link;
  }

  function readTopicIdHint(element) {
    if (!(element instanceof Element)) {
      return null;
    }

    const rawTopicId = element.getAttribute("data-topic-id") || element.dataset?.topicId || "";
    return /^\d+$/.test(rawTopicId) ? Number(rawTopicId) : null;
  }

  function getTopicIdHintFromLink(link) {
    if (!(link instanceof Element)) {
      return null;
    }

    const directTopicId = readTopicIdHint(link);
    if (directTopicId) {
      return directTopicId;
    }

    const hintedAncestor = link.closest("[data-topic-id]");
    if (hintedAncestor) {
      return readTopicIdHint(hintedAncestor);
    }

    return readTopicIdHint(getTopicEntryContainer(link));
  }

  function getTopicUrlFromLink(link, options = {}) {
    const {
      rootId = "",
      mainContentSelector = "#main-outlet",
      excludedLinkContextSelector = "",
      isPrimaryTopicLink,
      normalizeTopicUrl,
      locationHref = globalThis.location?.href || "",
      locationOrigin = globalThis.location?.origin || ""
    } = options;

    if (!(link instanceof HTMLAnchorElement)) {
      return null;
    }

    if (link.target && link.target !== "_self") {
      return null;
    }

    if (link.hasAttribute("download")) {
      return null;
    }

    if (!link.closest(mainContentSelector) || (rootId && link.closest(`#${rootId}`))) {
      return null;
    }

    if (excludedLinkContextSelector && link.closest(excludedLinkContextSelector)) {
      return null;
    }

    if (typeof isPrimaryTopicLink === "function" && !isPrimaryTopicLink(link)) {
      return null;
    }

    let url;
    try {
      url = new URL(link.href, locationHref);
    } catch {
      return null;
    }

    if (url.origin !== locationOrigin || !url.pathname.startsWith("/t/")) {
      return null;
    }

    if (typeof normalizeTopicUrl === "function") {
      return normalizeTopicUrl(url);
    }
    return url.toString();
  }

  runtime.topicLink = {
    isPrimaryTopicLink,
    buildEntryKey,
    getTopicEntryContainer,
    getTopicIdHintFromLink,
    getTopicUrlFromLink
  };
})();
