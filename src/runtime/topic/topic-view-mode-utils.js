(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function renderTopicError(state, topicUrl, fallbackTitle, error, options = {}) {
    const cancelLoadMoreRequest = options.cancelLoadMoreRequest;
    const cancelReplyRequest = options.cancelReplyRequest;
    const resetReadTrackingState = options.resetReadTrackingState;
    const setDrawerTitle = options.setDrawerTitle;
    const resetReplyComposer = options.resetReplyComposer;
    const clearJumpBackButton = options.clearJumpBackButton;
    const documentRef = options.documentRef || globalThis.document;
    if (
      !state
      || typeof cancelLoadMoreRequest !== "function"
      || typeof cancelReplyRequest !== "function"
      || typeof resetReadTrackingState !== "function"
      || typeof setDrawerTitle !== "function"
      || typeof resetReplyComposer !== "function"
      || typeof clearJumpBackButton !== "function"
      || !documentRef
    ) {
      return;
    }

    cancelLoadMoreRequest();
    cancelReplyRequest();
    resetReadTrackingState();
    state.currentTopic = null;
    state.currentTargetSpec = null;
    state.currentTopicAuthorUsername = "";
    state.currentTopicAuthorUserId = null;
    state.currentResolvedTargetPostNumber = null;
    state.isLoadingMorePosts = false;
    state.isReplySubmitting = false;
    state.loadMoreError = "";
    state.loadMoreStatus = null;
    state.pendingReactionPostIds.clear();
    setDrawerTitle(fallbackTitle || "帖子预览");
    state.meta.textContent = "智能预览暂时不可用。";
    resetReplyComposer();

    const container = documentRef.createElement("div");
    container.className = "ld-topic-error-state";

    const errorNote = documentRef.createElement("div");
    errorNote.className = "ld-topic-note ld-topic-note-error";
    errorNote.textContent = `预览加载失败：${error?.message || "未知错误"}`;

    const hintNote = documentRef.createElement("div");
    hintNote.className = "ld-topic-note";
    hintNote.textContent = `可以点右上角“新标签打开”查看原帖：${topicUrl}`;

    container.append(errorNote, hintNote);
    clearJumpBackButton();
    state.content.replaceChildren(container);
  }

  function setIframeModeEnabled(state, enabled, options = {}) {
    const iframeModeClass = options.iframeModeClass || "ld-iframe-mode";
    const pageIframeOpenClass = options.pageIframeOpenClass || "ld-page-iframe-open";
    const documentRef = options.documentRef || globalThis.document;
    const currentUrl = options.currentUrl;
    if (!state || !documentRef?.body) {
      return;
    }

    state.root?.classList.toggle(iframeModeClass, enabled);
    documentRef.body.classList.toggle(pageIframeOpenClass, Boolean(currentUrl) && enabled);
  }

  function renderIframeFallback(state, topicUrl, fallbackTitle, error, options = {}) {
    const setIframeModeEnabled = options.setIframeModeEnabled;
    const cancelLoadMoreRequest = options.cancelLoadMoreRequest;
    const cancelReplyRequest = options.cancelReplyRequest;
    const resetReadTrackingState = options.resetReadTrackingState;
    const setDrawerTitle = options.setDrawerTitle;
    const resetReplyComposer = options.resetReplyComposer;
    const clearJumpBackButton = options.clearJumpBackButton;
    const forcedIframe = Boolean(options.forcedIframe);
    const documentRef = options.documentRef || globalThis.document;
    if (
      !state
      || typeof setIframeModeEnabled !== "function"
      || typeof cancelLoadMoreRequest !== "function"
      || typeof cancelReplyRequest !== "function"
      || typeof resetReadTrackingState !== "function"
      || typeof setDrawerTitle !== "function"
      || typeof resetReplyComposer !== "function"
      || typeof clearJumpBackButton !== "function"
      || !documentRef
    ) {
      return;
    }

    setIframeModeEnabled(true);
    cancelLoadMoreRequest();
    cancelReplyRequest();
    resetReadTrackingState();

    state.currentTopic = null;
    state.currentTargetSpec = null;
    state.currentTopicAuthorUsername = "";
    state.currentTopicAuthorUserId = null;
    state.currentResolvedTargetPostNumber = null;
    state.isLoadingMorePosts = false;
    state.isReplySubmitting = false;
    state.loadMoreError = "";
    state.loadMoreStatus = null;
    state.pendingReactionPostIds.clear();
    setDrawerTitle(fallbackTitle || "帖子预览");
    state.meta.textContent = forcedIframe ? "当前为整页模式。" : "接口预览失败，已回退为完整页面。";
    resetReplyComposer();

    const container = documentRef.createElement("div");
    container.className = "ld-iframe-fallback";

    if (error) {
      const note = documentRef.createElement("div");
      note.className = "ld-topic-note ld-topic-note-error";
      note.textContent = `预览接口不可用：${error?.message || "未知错误"}`;
      container.append(note);
    }

    const iframe = documentRef.createElement("iframe");
    iframe.className = "ld-topic-iframe";
    iframe.src = topicUrl;
    iframe.loading = "lazy";
    iframe.referrerPolicy = "strict-origin-when-cross-origin";

    container.append(iframe);
    clearJumpBackButton();
    state.content.replaceChildren(container);
  }

  function refreshCurrentView(state, options = {}) {
    const ensureTrackedTopicVisit = options.ensureTrackedTopicVisit;
    const renderIframeFallback = options.renderIframeFallback;
    const getTopicTargetSpec = options.getTopicTargetSpec;
    const shouldFetchTargetedTopic = options.shouldFetchTargetedTopic;
    const topicHasPostNumber = options.topicHasPostNumber;
    const topicHasCompletePostStream = options.topicHasCompletePostStream;
    const renderTopic = options.renderTopic;
    const loadTopic = options.loadTopic;
    if (
      !state
      || typeof ensureTrackedTopicVisit !== "function"
      || typeof renderIframeFallback !== "function"
      || typeof getTopicTargetSpec !== "function"
      || typeof shouldFetchTargetedTopic !== "function"
      || typeof topicHasPostNumber !== "function"
      || typeof topicHasCompletePostStream !== "function"
      || typeof renderTopic !== "function"
      || typeof loadTopic !== "function"
    ) {
      return;
    }

    if (!state.currentUrl) {
      return;
    }

    if (state.currentTopic) {
      const targetSpec = getTopicTargetSpec(state.currentUrl, state.currentTopicIdHint);
      const needsTargetReload = shouldFetchTargetedTopic(
        state.currentTopic,
        targetSpec,
        topicHasPostNumber,
        topicHasCompletePostStream
      )
        && !state.currentResolvedTargetPostNumber;

      if (!needsTargetReload) {
        renderTopic(state.currentTopic, state.currentUrl, state.currentFallbackTitle, state.currentResolvedTargetPostNumber, {
          targetSpec
        });
        return;
      }
    }

    loadTopic(state.currentUrl, state.currentFallbackTitle, state.currentTopicIdHint);
  }

  async function fetchTrackedTopicJson(topicUrl, signal, topicIdHint = null, options = {}) {
    const canonical = options.canonical === true;
    const trackVisit = options.trackVisit !== false;
    const fetchImpl = options.fetchImpl || globalThis.fetch?.bind(globalThis);
    const toTopicJsonUrl = options.toTopicJsonUrl;
    const getTopicIdFromUrl = options.getTopicIdFromUrl;
    const buildTopicRequestHeaders = options.buildTopicRequestHeaders;
    const parseTopicPath = options.parseTopicPath;
    const stripTrailingSlash = options.stripTrailingSlash;
    if (
      typeof fetchImpl !== "function"
      || typeof toTopicJsonUrl !== "function"
      || typeof getTopicIdFromUrl !== "function"
      || typeof buildTopicRequestHeaders !== "function"
      || typeof parseTopicPath !== "function"
      || typeof stripTrailingSlash !== "function"
    ) {
      throw new Error("Unexpected response: 0");
    }

    const topicId = topicIdHint || getTopicIdFromUrl(topicUrl);
    const response = await fetchImpl(toTopicJsonUrl(topicUrl, { canonical, trackVisit, topicIdHint }, {
      parseTopicPath,
      stripTrailingSlash
    }), {
      credentials: "include",
      signal,
      headers: trackVisit ? buildTopicRequestHeaders(topicId) : { Accept: "application/json" }
    });

    const contentType = response.headers.get("content-type") || "";

    if (!response.ok || !contentType.includes("json")) {
      throw new Error(`Unexpected response: ${response.status}`);
    }

    return response.json();
  }

  function ensureTrackedTopicVisit(state, topicUrl, topicIdHint = null, signal, options = {}) {
    const getTopicTrackingKey = options.getTopicTrackingKey;
    const fetchTrackedTopicJson = options.fetchTrackedTopicJson;
    if (!state || typeof getTopicTrackingKey !== "function" || typeof fetchTrackedTopicJson !== "function") {
      return Promise.reject(new Error("topic tracking unavailable"));
    }

    const trackingKey = getTopicTrackingKey(topicUrl, topicIdHint);

    if (state.currentTrackRequest && state.currentTrackRequestKey === trackingKey) {
      return state.currentTrackRequest;
    }

    const request = fetchTrackedTopicJson(topicUrl, signal, topicIdHint, {
      canonical: true,
      trackVisit: true
    }).then((topic) => {
      if (state.currentTopicTrackingKey === trackingKey) {
        state.currentViewTracked = true;
      }
      return topic;
    }).finally(() => {
      if (state.currentTrackRequest === request) {
        state.currentTrackRequest = null;
        state.currentTrackRequestKey = "";
      }
    });

    state.currentTrackRequest = request;
    state.currentTrackRequestKey = trackingKey;
    return request;
  }

  runtime.topicViewModeUtils = {
    renderTopicError,
    setIframeModeEnabled,
    renderIframeFallback,
    refreshCurrentView,
    fetchTrackedTopicJson,
    ensureTrackedTopicVisit
  };
})();
