(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function setReplyPanelOpen(state, isOpen, options = {}) {
    if (!state?.replyPanel || !state?.replyButton) {
      return;
    }
    const setReplyEmojiPanelOpen = options.setReplyEmojiPanelOpen;
    const setReplyTarget = options.setReplyTarget;
    const queueMicrotaskFn = options.queueMicrotaskFn || globalThis.queueMicrotask;
    if (isOpen && !state.currentTopic) {
      return;
    }

    state.replyPanel.hidden = !isOpen;
    state.replyButton.setAttribute("aria-expanded", String(isOpen));

    if (!isOpen) {
      if (typeof setReplyEmojiPanelOpen === "function") {
        setReplyEmojiPanelOpen(false);
      }
      if (typeof setReplyTarget === "function") {
        setReplyTarget(null);
      }
      return;
    }

    if (typeof queueMicrotaskFn === "function") {
      queueMicrotaskFn(() => state.replyTextarea?.focus());
    }
  }

  function toggleReplyPanel(state, options = {}) {
    const setReplyTarget = options.setReplyTarget;
    const setReplyPanelOpen = options.setReplyPanelOpen;
    if (!state?.currentTopic || state?.isReplySubmitting || typeof setReplyPanelOpen !== "function") {
      return;
    }
    if (state.replyPanel?.hidden && typeof setReplyTarget === "function") {
      setReplyTarget(null);
    }
    setReplyPanelOpen(state.replyPanel?.hidden);
  }

  function openReplyPanelForPost(state, post, options = {}) {
    const setReplyTarget = options.setReplyTarget;
    const setReplyPanelOpen = options.setReplyPanelOpen;
    if (!state?.currentTopic || !post || state?.isReplySubmitting || typeof setReplyPanelOpen !== "function" || typeof setReplyTarget !== "function") {
      return;
    }
    setReplyTarget(post);
    setReplyPanelOpen(true);
  }

  function setReplyEmojiPanelOpen(state, isOpen, options = {}) {
    const ensureReplyEmojiItemsLoaded = options.ensureReplyEmojiItemsLoaded;
    const renderReplyEmojiGrid = options.renderReplyEmojiGrid;
    if (!state?.replyEmojiPanel || !state?.replyEmojiToggleButton) {
      return;
    }
    const shouldOpen = Boolean(isOpen);
    state.replyEmojiPanel.hidden = !shouldOpen;
    state.replyEmojiToggleButton.setAttribute("aria-expanded", String(shouldOpen));
    state.replyEmojiToggleButton.classList.toggle("is-active", shouldOpen);
    if (!shouldOpen) {
      return;
    }
    if (typeof ensureReplyEmojiItemsLoaded === "function") {
      ensureReplyEmojiItemsLoaded();
    }
    if (typeof renderReplyEmojiGrid === "function") {
      renderReplyEmojiGrid();
    }
  }

  function handleReplyEmojiToggleClick(state, event, options = {}) {
    const setReplyEmojiPanelOpen = options.setReplyEmojiPanelOpen;
    if (event?.preventDefault) {
      event.preventDefault();
    }
    if (!state?.replyEmojiPanel || !state?.replyEmojiToggleButton || !state?.replyTextarea || typeof setReplyEmojiPanelOpen !== "function") {
      return;
    }
    if (state.replyTextarea.disabled) {
      return;
    }
    setReplyEmojiPanelOpen(state.replyEmojiPanel.hidden);
  }

  function handleReplyEmojiGridClick(state, event, options = {}) {
    const ElementClass = options.ElementClass || globalThis.Element;
    const HTMLButtonElementClass = options.HTMLButtonElementClass || globalThis.HTMLButtonElement;
    const normalizeBiliEmojiShortcode = options.normalizeBiliEmojiShortcode;
    const insertReplyText = options.insertReplyText;
    const setReplyEmojiPanelOpen = options.setReplyEmojiPanelOpen;
    if (
      !event
      || typeof normalizeBiliEmojiShortcode !== "function"
      || typeof insertReplyText !== "function"
      || typeof setReplyEmojiPanelOpen !== "function"
    ) {
      return;
    }
    const target = event.target;
    if (!(target instanceof ElementClass)) {
      return;
    }
    const item = target.closest(".ld-reply-emoji-item");
    if (!(item instanceof HTMLButtonElementClass) || item.disabled || !state?.replyTextarea) {
      return;
    }
    const shortcode = normalizeBiliEmojiShortcode(item.dataset.shortcode);
    if (!shortcode) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    insertReplyText(`:${shortcode}:`);
    setReplyEmojiPanelOpen(false);
    state.replyTextarea.focus();
  }

  runtime.replyPanelUtils = {
    setReplyPanelOpen,
    toggleReplyPanel,
    openReplyPanelForPost,
    setReplyEmojiPanelOpen,
    handleReplyEmojiToggleClick,
    handleReplyEmojiGridClick
  };
})();
