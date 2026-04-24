(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function createApi(state, options = {}) {
    const pageOpenClass = options.pageOpenClass || "ld-drawer-page-open";
    const ensureDrawer = options.ensureDrawer;
    const getTopicEntries = options.getTopicEntries;
    const cacheTitleEmojiMapFromLink = options.cacheTitleEmojiMapFromLink;
    const cacheTagIconMapFromLink = options.cacheTagIconMapFromLink;
    const highlightLink = options.highlightLink;
    const setDrawerTitle = options.setDrawerTitle;
    const resetReadTrackingState = options.resetReadTrackingState;
    const resetReplyComposer = options.resetReplyComposer;
    const clearJumpBackButton = options.clearJumpBackButton;
    const renderLoading = options.renderLoading;
    const setIframeModeEnabled = options.setIframeModeEnabled;
    const updateSettingsPopoverPosition = options.updateSettingsPopoverPosition;
    const syncDrawerHeaderLiquidState = options.syncDrawerHeaderLiquidState;
    const cancelLoadMoreRequest = options.cancelLoadMoreRequest;
    const fetchTrackedTopicJson = options.fetchTrackedTopicJson;
    const ensureTrackedTopicVisit = options.ensureTrackedTopicVisit;
    const renderIframeFallback = options.renderIframeFallback;
    const buildTopicViewModel = options.buildTopicViewModel;
    const updateReactionOptionsFromTopicPayload = options.updateReactionOptionsFromTopicPayload;
    const renderTopicMeta = options.renderTopicMeta;
    const buildTopicView = options.buildTopicView;
    const syncReplyUI = options.syncReplyUI;
    const scrollTopicViewToTargetPost = options.scrollTopicViewToTargetPost;
    const updateLoadMoreStatus = options.updateLoadMoreStatus;
    const syncAutoLoadProgressHint = options.syncAutoLoadProgressHint;
    const queueAutoLoadCheck = options.queueAutoLoadCheck;
    const syncReadTracking = options.syncReadTracking;
    const normalizeUsername = options.normalizeUsername;
    const resolveTopicAuthorUserId = options.resolveTopicAuthorUserId;
    const closeImagePreview = options.closeImagePreview;
    const cancelReplyRequest = options.cancelReplyRequest;
    const cancelReadProgressReport = options.cancelReadProgressReport;
    const clearHighlight = options.clearHighlight;
    const setSettingsPanelOpen = options.setSettingsPanelOpen;
    if (
      !state
      || typeof ensureDrawer !== "function"
      || typeof getTopicEntries !== "function"
      || typeof cacheTitleEmojiMapFromLink !== "function"
      || typeof cacheTagIconMapFromLink !== "function"
      || typeof highlightLink !== "function"
      || typeof setDrawerTitle !== "function"
      || typeof resetReadTrackingState !== "function"
      || typeof resetReplyComposer !== "function"
      || typeof clearJumpBackButton !== "function"
      || typeof renderLoading !== "function"
      || typeof setIframeModeEnabled !== "function"
      || typeof updateSettingsPopoverPosition !== "function"
      || typeof syncDrawerHeaderLiquidState !== "function"
      || typeof cancelLoadMoreRequest !== "function"
      || typeof fetchTrackedTopicJson !== "function"
      || typeof ensureTrackedTopicVisit !== "function"
      || typeof renderIframeFallback !== "function"
      || typeof buildTopicViewModel !== "function"
      || typeof updateReactionOptionsFromTopicPayload !== "function"
      || typeof renderTopicMeta !== "function"
      || typeof buildTopicView !== "function"
      || typeof syncReplyUI !== "function"
      || typeof scrollTopicViewToTargetPost !== "function"
      || typeof updateLoadMoreStatus !== "function"
      || typeof syncAutoLoadProgressHint !== "function"
      || typeof queueAutoLoadCheck !== "function"
      || typeof syncReadTracking !== "function"
      || typeof normalizeUsername !== "function"
      || typeof resolveTopicAuthorUserId !== "function"
      || typeof closeImagePreview !== "function"
      || typeof cancelReplyRequest !== "function"
      || typeof cancelReadProgressReport !== "function"
      || typeof clearHighlight !== "function"
      || typeof setSettingsPanelOpen !== "function"
    ) {
      return null;
    }

    const api = {};

    api.openDrawer = function openDrawer(topicUrl, fallbackTitle, activeLink) {
      ensureDrawer();

      const entryElement = activeLink instanceof Element
        ? runtime.topicLink.getTopicEntryContainer(activeLink)
        : null;
      const topicIdHint = activeLink instanceof Element
        ? (runtime.topicLink.getTopicIdHintFromLink(activeLink) || runtime.topicPath.getTopicIdFromUrl(topicUrl))
        : runtime.topicPath.getTopicIdFromUrl(topicUrl);
      const currentEntry = activeLink instanceof Element
        ? getTopicEntries().find((entry) => entry.link === activeLink || entry.entryElement === entryElement)
        : null;
      const nextTrackingKey = runtime.topicPath.getTopicTrackingKey(topicUrl, topicIdHint);
      const isSameTrackedTopic = Boolean(state.currentTopicTrackingKey) && state.currentTopicTrackingKey === nextTrackingKey;

      state.currentEntryElement = entryElement;
      state.currentEntryKey = currentEntry?.entryKey || runtime.topicLink.buildEntryKey(topicUrl, 1);
      state.currentTopicIdHint = topicIdHint;
      if (!isSameTrackedTopic) {
        state.currentViewTracked = false;
        state.currentTrackRequest = null;
        state.currentTrackRequestKey = "";
      }
      state.currentTopicTrackingKey = nextTrackingKey;
      cacheTitleEmojiMapFromLink(activeLink);
      cacheTagIconMapFromLink(activeLink);

      if (state.currentUrl === topicUrl && document.body.classList.contains(pageOpenClass)) {
        highlightLink(activeLink);

        if (!state.currentViewTracked && !state.currentTrackRequest) {
          api.loadTopic(topicUrl, fallbackTitle, topicIdHint);
        }

        return;
      }

      state.currentUrl = topicUrl;
      state.currentFallbackTitle = fallbackTitle || "";
      state.currentResolvedTargetPostNumber = null;
      state.currentTargetSpec = null;
      state.currentTopicAuthorUsername = "";
      state.currentTopicAuthorUserId = null;
      state.currentTopic = null;
      state.loadMoreError = "";
      state.isLoadingMorePosts = false;
      state.loadMorePlaceholderCount = 0;
      state.loadMorePlaceholderContainer = null;
      resetReadTrackingState();
      state.pendingReactionPostIds.clear();
      state.pendingBookmarkPostIds.clear();
      resetReplyComposer();
      setDrawerTitle(fallbackTitle || "加载中…");
      state.meta.textContent = "正在载入帖子内容…";
      state.openInTab.href = topicUrl;
      clearJumpBackButton();
      state.content.innerHTML = renderLoading();

      highlightLink(activeLink);

      document.body.classList.add(pageOpenClass);
      state.root.setAttribute("aria-hidden", "false");
      setIframeModeEnabled(false);
      updateSettingsPopoverPosition();
      syncDrawerHeaderLiquidState(true);

      api.loadTopic(topicUrl, fallbackTitle, topicIdHint);
    };

    api.closeDrawer = function closeDrawer() {
      if (state.abortController) {
        state.abortController.abort();
        state.abortController = null;
      }

      cancelLoadMoreRequest();
      cancelReplyRequest();
      cancelReadProgressReport();
      resetReadTrackingState();
      clearJumpBackButton();

      document.body.classList.remove(pageOpenClass);
      setIframeModeEnabled(false);
      state.root?.setAttribute("aria-hidden", "true");
      state.currentUrl = "";
      state.currentEntryElement = null;
      state.currentEntryKey = "";
      state.currentTopicIdHint = null;
      state.currentTopicTrackingKey = "";
      state.currentViewTracked = false;
      state.currentTrackRequest = null;
      state.currentTrackRequestKey = "";
      state.currentResolvedTargetPostNumber = null;
      state.currentFallbackTitle = "";
      state.currentTopic = null;
      state.currentTargetSpec = null;
      state.currentTopicAuthorUsername = "";
      state.currentTopicAuthorUserId = null;
      state.currentTitleEmojiMap.clear();
      state.currentTagIconMap.clear();
      state.lastReadReportKey = "";
      state.meta.textContent = "";
      state.loadMoreError = "";
      state.isLoadingMorePosts = false;
      state.loadMorePlaceholderCount = 0;
      state.loadMorePlaceholderContainer = null;
      state.pendingReactionPostIds.clear();
      state.pendingBookmarkPostIds.clear();
      resetReplyComposer();
      closeImagePreview();
      clearHighlight();
      setSettingsPanelOpen(false);
      syncDrawerHeaderLiquidState(true);
    };

    api.loadTopic = async function loadTopic(topicUrl, fallbackTitle, topicIdHint = null, loadOptions = {}) {
      closeImagePreview();
      cancelLoadMoreRequest();
      state.isLoadingMorePosts = false;
      state.loadMoreError = "";

      if (state.abortController) {
        state.abortController.abort();
      }

      if (!state.currentViewTracked) {
        state.currentTrackRequest = null;
        state.currentTrackRequestKey = "";
      }

      const controller = new AbortController();
      state.abortController = controller;

      try {
        const targetSpec = runtime.topicPath.getTopicTargetSpec(topicUrl, topicIdHint);
        let resolvedTargetPostNumber = null;
        let topic;
        let targetedTopic = null;

        if (state.currentViewTracked) {
          topic = await fetchTrackedTopicJson(topicUrl, controller.signal, topicIdHint, {
            canonical: true,
            trackVisit: false
          });
        } else {
          topic = await ensureTrackedTopicVisit(topicUrl, topicIdHint, controller.signal);
        }

        const shouldFetchExplicitTarget = runtime.topicTargetUtils.shouldFetchTargetedTopic(
          topic,
          targetSpec,
          runtime.topicStream.topicHasPostNumber,
          runtime.topicStream.topicHasCompletePostStream
        );
        const lastReadPostNumber = shouldFetchExplicitTarget
          ? null
          : runtime.scrollTargetUtils.resolveTopicLastReadPostNumber(topic);

        if (shouldFetchExplicitTarget) {
          targetedTopic = await fetchTrackedTopicJson(topicUrl, controller.signal, topicIdHint, {
            canonical: false,
            trackVisit: false
          });
          topic = runtime.topicTargetUtils.mergeTopicPreviewData(topic, targetedTopic, runtime.topicStream.getTopicStreamIds, runtime.topicStream.getLoadedTopicPostIds);
          resolvedTargetPostNumber = runtime.topicTargetUtils.resolveTopicTargetPostNumber(targetSpec, topic, targetedTopic, runtime.topicStream.topicHasPostNumber, runtime.topicStream.topicHasCompletePostStream);
        } else if (runtime.topicTargetUtils.shouldFetchLastReadTargetedTopic(
          topic,
          targetSpec,
          lastReadPostNumber,
          runtime.topicStream.topicHasPostNumber
        )) {
          targetedTopic = await fetchTrackedTopicJson(
            runtime.topicUrlUtils.getTopicPostTargetUrl(topicUrl, lastReadPostNumber, topicIdHint, {
              parseTopicPath: runtime.topicPath.parseTopicPath,
              stripTrailingSlash: runtime.topicPath.stripTrailingSlash
            }),
            controller.signal,
            topicIdHint,
            {
              canonical: false,
              trackVisit: false
            }
          );
          topic = runtime.topicTargetUtils.mergeTopicPreviewData(topic, targetedTopic, runtime.topicStream.getTopicStreamIds, runtime.topicStream.getLoadedTopicPostIds);
          resolvedTargetPostNumber = runtime.topicStream.topicHasPostNumber(topic, lastReadPostNumber)
            ? lastReadPostNumber
            : runtime.topicTargetUtils.resolveTopicTargetPostNumber(targetSpec, topic, null, runtime.topicStream.topicHasPostNumber, runtime.topicStream.topicHasCompletePostStream);
        } else {
          resolvedTargetPostNumber = runtime.topicTargetUtils.resolveTopicTargetPostNumber(targetSpec, topic, null, runtime.topicStream.topicHasPostNumber, runtime.topicStream.topicHasCompletePostStream);
        }

        if (controller.signal.aborted || state.currentUrl !== topicUrl) {
          return;
        }

        api.renderTopic(topic, topicUrl, fallbackTitle, resolvedTargetPostNumber, {
          targetSpec,
          preserveScrollTop: loadOptions.preserveScrollTop
        });
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        renderIframeFallback(topicUrl, fallbackTitle, error);
      } finally {
        if (state.abortController === controller) {
          state.abortController = null;
        }
      }
    };

    api.renderTopic = function renderTopic(topic, topicUrl, fallbackTitle, resolvedTargetPostNumber = null, renderOptions = {}) {
      setIframeModeEnabled(false);

      const posts = topic?.post_stream?.posts || [];

      if (!posts.length) {
        renderIframeFallback(topicUrl, fallbackTitle, new Error("No posts available"));
        return;
      }

      const targetSpec = renderOptions.targetSpec || runtime.topicPath.getTopicTargetSpec(topicUrl, state.currentTopicIdHint);
      const viewModel = buildTopicViewModel(topic, targetSpec, resolvedTargetPostNumber);
      const shouldPreserveScroll = Number.isFinite(renderOptions.preserveScrollTop);

      state.currentTopic = topic;
      state.currentTargetSpec = targetSpec;
      state.currentTopicAuthorUsername = normalizeUsername(topic?.created_by?.username);
      state.currentTopicAuthorUserId = resolveTopicAuthorUserId(topic);
      state.currentTopicIdHint = typeof topic?.id === "number" ? topic.id : state.currentTopicIdHint;
      state.currentResolvedTargetPostNumber = resolvedTargetPostNumber;
      updateReactionOptionsFromTopicPayload(topic);
      setDrawerTitle(topic.title || fallbackTitle || "帖子预览");
      renderTopicMeta(topic, viewModel.posts.length);
      clearJumpBackButton();
      state.content.replaceChildren(buildTopicView(topic, viewModel));
      syncReplyUI();
      syncDrawerHeaderLiquidState(true);

      const initialScrollTarget = runtime.scrollTargetUtils.resolveInitialScrollTarget(
        topic,
        viewModel.posts,
        resolvedTargetPostNumber,
        targetSpec
      );

      if (shouldPreserveScroll && state.drawerBody) {
        state.drawerBody.scrollTop = renderOptions.preserveScrollTop;
      } else {
        scrollTopicViewToTargetPost(initialScrollTarget.postNumber, {
          withReadGlow: Number.isFinite(initialScrollTarget.postNumber) && initialScrollTarget.postNumber > 1
        });
      }

      updateLoadMoreStatus();
      syncAutoLoadProgressHint();
      queueAutoLoadCheck();
      syncReadTracking(viewModel.posts);
    };

    return api;
  }

  runtime.drawerTopicFlowUtils = {
    createApi
  };
})();
