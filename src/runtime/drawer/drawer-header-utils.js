(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function syncJumpFirstPostButtonUI(state, options = {}) {
    if (!state?.jumpFirstPostButton) {
      return;
    }
    const iframeModeClass = options.iframeModeClass || "ld-drawer-iframe-mode";
    const isIframeMode = state.root?.classList.contains(iframeModeClass);
    const hasTopic = Boolean(state.currentTopic?.id);
    const shouldShow = Boolean(state.currentUrl) && hasTopic && !isIframeMode && state.isHeaderCompact;
    state.jumpFirstPostButton.hidden = !shouldShow;
  }

  function syncDrawerHeaderLiquidState(state, force = false, options = {}) {
    const HTMLElementClass = options.HTMLElementClass || globalThis.HTMLElement;
    const syncJumpFirstPostButtonUIFn = options.syncJumpFirstPostButtonUI;
    if (
      !(state?.root instanceof HTMLElementClass)
      || !(state?.drawerBody instanceof HTMLElementClass)
      || !(state?.header instanceof HTMLElementClass)
      || typeof syncJumpFirstPostButtonUIFn !== "function"
    ) {
      return;
    }

    const compactEnterThreshold = 56;
    const compactExitThreshold = 22;
    const maxScrollTop = Math.max(0, state.drawerBody.scrollHeight - state.drawerBody.clientHeight);

    if (maxScrollTop <= compactEnterThreshold + 12) {
      if (!force && !state.isHeaderCompact) {
        return;
      }
      state.isHeaderCompact = false;
      state.root.classList.remove("ld-drawer-header-compact");
      syncJumpFirstPostButtonUIFn();
      return;
    }

    const scrollTop = Math.min(state.drawerBody.scrollTop, maxScrollTop);
    const shouldCompact = state.isHeaderCompact
      ? scrollTop > compactExitThreshold
      : scrollTop > compactEnterThreshold;
    if (!force && state.isHeaderCompact === shouldCompact) {
      return;
    }

    state.isHeaderCompact = shouldCompact;
    state.root.classList.toggle("ld-drawer-header-compact", shouldCompact);
    syncJumpFirstPostButtonUIFn();
  }

  function handleJumpToFirstPostClick(state, options = {}) {
    const getFirstTopicPost = options.getFirstTopicPost;
    const scrollToPostNumber = options.scrollToPostNumber;
    if (typeof getFirstTopicPost !== "function" || typeof scrollToPostNumber !== "function") {
      return;
    }
    const firstPost = getFirstTopicPost(state.currentTopic);
    const fallbackPostNumber = Number(state.content?.querySelector(".ld-post-card")?.dataset.postNumber);
    const firstPostNumber = Number.isFinite(Number(firstPost?.post_number))
      ? Number(firstPost.post_number)
      : fallbackPostNumber;
    if (!Number.isFinite(firstPostNumber)) {
      return;
    }
    scrollToPostNumber(firstPostNumber, true);
  }

  function getDrawerTopOverlayInset(state, bodyRect, options = {}) {
    const HTMLElementClass = options.HTMLElementClass || globalThis.HTMLElement;
    const getComputedStyleFn = options.getComputedStyleFn || globalThis.getComputedStyle;
    if (!(state?.root instanceof HTMLElementClass) || !(state?.header instanceof HTMLElementClass)) {
      return 0;
    }
    if (!state.root.classList.contains("ld-drawer-header-compact")) {
      return 0;
    }

    let overlayBottom = bodyRect.top;
    const candidates = [
      state.header.querySelector(".ld-drawer-title-group"),
      state.header.querySelector(".ld-drawer-actions"),
      state.header
    ];

    for (const element of candidates) {
      if (!(element instanceof HTMLElementClass)) {
        continue;
      }

      const style = typeof getComputedStyleFn === "function" ? getComputedStyleFn(element) : null;
      if (style && (style.display === "none" || style.visibility === "hidden")) {
        continue;
      }

      const rect = element.getBoundingClientRect();
      overlayBottom = Math.max(overlayBottom, rect.bottom);
    }

    return Math.max(0, overlayBottom - bodyRect.top) + 6;
  }

  function alignTargetPostBelowHeaderCapsule(state, target, options = {}) {
    const HTMLElementClass = options.HTMLElementClass || globalThis.HTMLElement;
    const getDrawerTopOverlayInsetFn = options.getDrawerTopOverlayInset;
    if (
      !(target instanceof HTMLElementClass)
      || !(state?.drawerBody instanceof HTMLElementClass)
      || typeof getDrawerTopOverlayInsetFn !== "function"
    ) {
      return;
    }

    const targetRect = target.getBoundingClientRect();
    const bodyRect = state.drawerBody.getBoundingClientRect();
    if (bodyRect.height <= 0) {
      return;
    }
    const topInset = getDrawerTopOverlayInsetFn(bodyRect);
    const desiredTop = bodyRect.top + topInset + 4;
    const delta = targetRect.top - desiredTop;
    if (Math.abs(delta) < 1) {
      return;
    }
    state.drawerBody.scrollTop += delta;
  }

  runtime.drawerHeaderUtils = {
    syncJumpFirstPostButtonUI,
    syncDrawerHeaderLiquidState,
    handleJumpToFirstPostClick,
    getDrawerTopOverlayInset,
    alignTargetPostBelowHeaderCapsule
  };
})();
