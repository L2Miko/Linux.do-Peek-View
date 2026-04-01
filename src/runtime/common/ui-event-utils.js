(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function init(options = {}) {
    const ensureDrawer = options.ensureDrawer;
    const bindEvents = options.bindEvents;
    const watchLocationChanges = options.watchLocationChanges;
    if (typeof ensureDrawer !== "function" || typeof bindEvents !== "function" || typeof watchLocationChanges !== "function") {
      return;
    }
    ensureDrawer();
    bindEvents();
    watchLocationChanges();
  }

  function bindEvents(options = {}) {
    const documentRef = options.documentRef || globalThis.document;
    const windowRef = options.windowRef || globalThis.window;
    const handleDocumentClick = options.handleDocumentClick;
    const handleKeydown = options.handleKeydown;
    const handleWindowResize = options.handleWindowResize;
    if (
      !documentRef
      || !windowRef
      || typeof handleDocumentClick !== "function"
      || typeof handleKeydown !== "function"
      || typeof handleWindowResize !== "function"
    ) {
      return;
    }
    documentRef.addEventListener("click", handleDocumentClick, true);
    documentRef.addEventListener("keydown", handleKeydown, true);
    windowRef.addEventListener("resize", handleWindowResize, true);
  }

  function handleDocumentClick(state, event, options = {}) {
    const ElementClass = options.ElementClass || globalThis.Element;
    const rootId = options.rootId || "ld-drawer-root";
    const mainContentSelector = options.mainContentSelector || "#main-outlet";
    const excludedLinkContextSelector = options.excludedLinkContextSelector || "";
    const getTopicUrlFromLink = options.getTopicUrlFromLink;
    const isPrimaryTopicLink = options.isPrimaryTopicLink;
    const normalizeTopicUrl = options.normalizeTopicUrl;
    const locationHref = options.locationHref || globalThis.location?.href || "";
    const locationOrigin = options.locationOrigin || globalThis.location?.origin || "";
    const openDrawer = options.openDrawer;
    const setSettingsPanelOpen = options.setSettingsPanelOpen;
    const setReplyPanelOpen = options.setReplyPanelOpen;
    if (
      !state
      || event?.defaultPrevented
      || typeof getTopicUrlFromLink !== "function"
      || typeof openDrawer !== "function"
      || typeof setSettingsPanelOpen !== "function"
      || typeof setReplyPanelOpen !== "function"
    ) {
      return;
    }

    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const target = event.target;
    if (!(target instanceof ElementClass)) {
      return;
    }

    if (state.settingsPanel?.dataset.open === "true" && !target.closest(".ld-drawer-settings-card") && !target.closest(".ld-drawer-settings-toggle")) {
      setSettingsPanelOpen(false);
    }

    if (!state.replyPanel?.hidden && !target.closest(".ld-drawer-reply-panel") && !target.closest(".ld-drawer-reply-fab")) {
      setReplyPanelOpen(false);
    }

    const link = target.closest("a[href]");
    if (!link || link.closest(`#${rootId}`)) {
      return;
    }

    const topicUrl = getTopicUrlFromLink(link, {
      rootId,
      mainContentSelector,
      excludedLinkContextSelector,
      isPrimaryTopicLink,
      normalizeTopicUrl,
      locationHref,
      locationOrigin
    });
    if (!topicUrl) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();

    openDrawer(topicUrl, link.textContent.trim(), link);
  }

  function handleKeydown(state, event, options = {}) {
    const isTypingTarget = options.isTypingTarget;
    const closeImagePreview = options.closeImagePreview;
    const setSettingsPanelOpen = options.setSettingsPanelOpen;
    const setReplyPanelOpen = options.setReplyPanelOpen;
    const closeDrawer = options.closeDrawer;
    const navigateTopic = options.navigateTopic;
    const pageOpenClass = options.pageOpenClass || "ld-drawer-page-open";
    const bodyRef = options.bodyRef || globalThis.document?.body;
    if (
      !state
      || typeof isTypingTarget !== "function"
      || typeof closeImagePreview !== "function"
      || typeof setSettingsPanelOpen !== "function"
      || typeof setReplyPanelOpen !== "function"
      || typeof closeDrawer !== "function"
      || typeof navigateTopic !== "function"
      || !bodyRef
    ) {
      return;
    }

    if (event.key === "Escape" && !state.imagePreview?.hidden) {
      event.preventDefault();
      event.stopPropagation();
      closeImagePreview();
      return;
    }

    if (event.key === "Escape" && state.settingsPanel?.dataset.open === "true") {
      event.preventDefault();
      event.stopPropagation();
      setSettingsPanelOpen(false);
      return;
    }

    if (event.key === "Escape" && !state.replyPanel?.hidden) {
      event.preventDefault();
      event.stopPropagation();
      setReplyPanelOpen(false);
      return;
    }

    if (isTypingTarget(event.target)) {
      return;
    }

    if (event.key === "Escape" && bodyRef.classList.contains(pageOpenClass)) {
      closeDrawer();
      return;
    }

    if (!bodyRef.classList.contains(pageOpenClass)) {
      return;
    }

    if (event.altKey && !event.metaKey && !event.ctrlKey && !event.shiftKey) {
      if (event.key === "ArrowUp") {
        event.preventDefault();
        navigateTopic(-1);
      } else if (event.key === "ArrowDown") {
        event.preventDefault();
        navigateTopic(1);
      }
    }
  }

  function highlightLink(state, link, options = {}) {
    const clearHighlight = options.clearHighlight;
    const activeLinkClass = options.activeLinkClass || "ld-drawer-topic-link-active";
    if (!state || typeof clearHighlight !== "function") {
      return;
    }
    clearHighlight();
    state.activeLink = link;
    state.activeLink?.classList.add(activeLinkClass);
  }

  function clearHighlight(state) {
    if (!state) {
      return;
    }
    state.activeLink?.classList.remove("ld-drawer-topic-link-active");
    state.activeLink = null;
  }

  function handleDrawerBodyScroll(options = {}) {
    const maybeLoadMorePosts = options.maybeLoadMorePosts;
    const scheduleReadVisibilityCheck = options.scheduleReadVisibilityCheck;
    const syncDrawerHeaderLiquidState = options.syncDrawerHeaderLiquidState;
    if (
      typeof maybeLoadMorePosts !== "function"
      || typeof scheduleReadVisibilityCheck !== "function"
      || typeof syncDrawerHeaderLiquidState !== "function"
    ) {
      return;
    }
    maybeLoadMorePosts();
    scheduleReadVisibilityCheck();
    syncDrawerHeaderLiquidState();
  }

  runtime.uiEventUtils = {
    init,
    bindEvents,
    handleDocumentClick,
    handleKeydown,
    highlightLink,
    clearHighlight,
    handleDrawerBodyScroll
  };
})();
