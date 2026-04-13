(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  const hasBootstrap = Boolean(
    runtime?.constants
    && runtime?.reactionAssets
    && runtime?.reactionUtils
    && runtime?.reactionIconRegistry
    && runtime?.reactionIconResolver
    && runtime?.reactionOptionsUtils
    && runtime?.topicDisplayUtils
    && runtime?.replyEmojiUtils
    && runtime?.replyPanelUtils
    && runtime?.replyUiUtils
    && runtime?.replyComposeUtils
    && runtime?.replyPasteFileUtils
    && runtime?.replyUploadTextUtils
    && runtime?.replyUploadQueueUtils
    && runtime?.replyUploadStateUtils
    && runtime?.replySubmitUtils
    && runtime?.requestControlUtils
    && runtime?.settingsBootstrapUtils
    && runtime?.settingsPanelUtils
    && runtime?.settingsUiUtils
    && runtime?.locationWatchUtils
    && runtime?.drawerStatusUtils
    && runtime?.drawerHeaderUtils
    && runtime?.drawerDomUtils
    && runtime?.readTrackingUtils
    && runtime?.readReportUtils
    && runtime?.uiEventUtils
    && runtime?.topicEntryCacheUtils
    && runtime?.drawerTopicFlowUtils
    && runtime?.topicViewModeUtils
    && runtime?.topicViewBuilderUtils
    && runtime?.topicLoadMoreUtils
    && runtime?.topicMetaUtils
    && runtime?.topicFetchUtils
    && runtime?.postJumpUtils
    && runtime?.postInteractionUtils
    && runtime?.imagePreviewBridgeUtils
    && typeof runtime.createInitialState === "function"
    && typeof runtime.settingsUtils?.loadSettings === "function"
    && typeof runtime.drawerUtils?.clampDrawerWidth === "function"
  );
  if (!hasBootstrap) {
    console.error("runtime bootstrap missing");
    return;
  }
  const fetchImpl = fetch.bind(globalThis);
  const {
    ROOT_ID,
    PAGE_OPEN_CLASS,
    PAGE_IFRAME_OPEN_CLASS,
    ACTIVE_LINK_CLASS,
    IFRAME_MODE_CLASS,
    SETTINGS_KEY,
    LOAD_MORE_TRIGGER_OFFSET,
    IMAGE_PREVIEW_SCALE_MIN,
    IMAGE_PREVIEW_SCALE_MAX,
    IMAGE_PREVIEW_SCALE_STEP,
    IMAGE_PREVIEW_DRAG_THRESHOLD_PX,
    JUMP_BACK_BUTTON_DURATION_MS,
    REPLY_UPLOAD_MARKER,
    REACTION_OPTIONS_CACHE_KEY,
    DEFAULT_SETTINGS,
    DRAWER_WIDTHS,
    PRIMARY_TOPIC_LINK_SELECTOR,
    MAIN_CONTENT_SELECTOR,
    EXCLUDED_LINK_CONTEXT_SELECTOR
  } = runtime.constants;
  const {
    FORCED_REACTION_OPTIONS,
    FORCED_REACTION_ICON_URLS,
    REACTION_PICKER_HIDE_DELAY_MS,
    BILI_EMOJI_SHORTCODE_PREFIX,
    BILI_EMOJI_FALLBACK_COUNT,
    BILI_EMOJI_ICON_URLS,
    DEFAULT_REACTION_OPTIONS
  } = runtime.reactionAssets;
  const {
    normalizeReactionId,
    normalizeIconUrl,
    extractEmojiIdFromText,
    reactionIdToEmoji
  } = runtime.reactionUtils;
  const isKnownOfficialReactionId = (reactionId) => runtime.reactionUtils.isKnownOfficialReactionId(reactionId, DEFAULT_REACTION_OPTIONS);
  const isCustomReactionId = (reactionId) => runtime.reactionUtils.isCustomReactionId(reactionId, DEFAULT_REACTION_OPTIONS);
  const getForcedReactionIconUrl = (reactionId) => runtime.reactionUtils.getForcedReactionIconUrl(reactionId, {
    forcedReactionOptions: FORCED_REACTION_OPTIONS,
    forcedReactionIconUrls: FORCED_REACTION_ICON_URLS,
    locationOrigin: location.origin
  });
  const getReactionIconUrl = (reactionId) => runtime.reactionUtils.getReactionIconUrl(reactionId, {
    reactionIconMap: state.reactionIconMap,
    emojiSet: state.emojiSet,
    locationOrigin: location.origin,
    defaultReactionOptions: DEFAULT_REACTION_OPTIONS
  });
  const finalizeReactionOptions = (primaryOptions) => runtime.reactionOptionsUtils.finalizeReactionOptions(state, primaryOptions, {
    normalizeReactionId,
    isCustomReactionId,
    defaultReactionOptions: DEFAULT_REACTION_OPTIONS
  });
  const maybePersistReactionOptions = (options, source) => runtime.reactionOptionsUtils.maybePersistReactionOptions(state, options, source, {
    normalizeReactionId,
    isCustomReactionId,
    reactionOptionsCacheKey: REACTION_OPTIONS_CACHE_KEY,
    storage: localStorage
  });
  const loadCachedReactionOptions = () => runtime.reactionOptionsUtils.loadCachedReactionOptions({
    normalizeReactionId,
    reactionOptionsCacheKey: REACTION_OPTIONS_CACHE_KEY,
    storage: localStorage
  });
  const registerReactionIconUrl = (reactionId, rawUrl) => runtime.reactionIconRegistry.registerReactionIconUrl(reactionId, rawUrl, {
    normalizeReactionId,
    normalizeIconUrl,
    reactionIconMap: state.reactionIconMap
  });
  const registerReactionIconFromObject = (item) => runtime.reactionIconRegistry.registerReactionIconFromObject(item, {
    normalizeReactionId,
    registerReactionIconUrl
  });
  const registerReactionIconsFromGenericObject = (root) => runtime.reactionIconRegistry.registerReactionIconsFromGenericObject(root, {
    normalizeReactionId,
    registerReactionIconFromObject,
    registerReactionIconUrl
  });
  const registerReactionIconsFromData = (data) => runtime.reactionIconRegistry.registerReactionIconsFromData(data, {
    registerReactionIconFromObject,
    registerReactionIconsFromGenericObject
  });
  const detectEmojiSetFromData = (data) => runtime.reactionIconRegistry.detectEmojiSetFromData(data, normalizeReactionId);
  const fetchReactionOptions = () => runtime.reactionOptionsUtils.fetchReactionOptions(state, {
    locationOrigin: location.origin,
    fetchImpl,
    registerReactionIconsFromData,
    detectEmojiSetFromData,
    normalizeReactionOptions,
    normalizeReactionId
  });
  const fetchReactionOptionsFromCurrentPageHtml = () => runtime.reactionOptionsUtils.fetchReactionOptionsFromCurrentPageHtml({
    fetchImpl,
    locationHref: location.href,
    normalizeReactionOptions,
    normalizeReactionId
  });
  const getReactionOptionsFromPageGlobals = () => runtime.reactionOptionsUtils.getReactionOptionsFromPageGlobals({
    normalizeReactionOptions
  });
  const collectReactionOptionsFromTopics = (...topics) => runtime.reactionOptionsUtils.collectReactionOptionsFromTopics(topics, {
    normalizeReactionId,
    registerReactionIconFromObject,
    inferLikeReactionIdFromUi
  });
  const getReactionOptionsFromExistingUi = () => runtime.reactionOptionsUtils.getReactionOptionsFromExistingUi({
    documentRef: document,
    HTMLElementClass: HTMLElement,
    HTMLImageElementClass: HTMLImageElement,
    normalizeReactionId,
    registerReactionIconUrl,
    inferLikeReactionIdFromUi
  });
  const inferLikeReactionIdFromUi = (options) => runtime.reactionOptionsUtils.inferLikeReactionIdFromUi(options);
  const normalizeReactionOptions = (data) => runtime.reactionOptionsUtils.normalizeReactionOptions(state, data, {
    normalizeReactionId
  });
  const updateReactionOptionsFromTopicPayload = (topic) => runtime.reactionOptionsUtils.updateReactionOptionsFromTopicPayload(
    state,
    topic,
    {
      collectReactionOptionsFromTopics,
      forcedReactionOptions: FORCED_REACTION_OPTIONS,
      getForcedReactionIconUrl,
      ensureReactionIconsLoaded
    }
  );
  const setIframeModeEnabled = (enabled) => runtime.topicViewModeUtils.setIframeModeEnabled(state, enabled, {
    iframeModeClass: IFRAME_MODE_CLASS,
    pageIframeOpenClass: PAGE_IFRAME_OPEN_CLASS,
    documentRef: document,
    currentUrl: state.currentUrl
  });
  const renderTopicError = (topicUrl, fallbackTitle, error) => runtime.topicViewModeUtils.renderTopicError(
    state,
    topicUrl,
    fallbackTitle,
    error,
    {
      cancelLoadMoreRequest,
      cancelReplyRequest,
      resetReadTrackingState,
      setDrawerTitle,
      resetReplyComposer,
      clearJumpBackButton,
      documentRef: document
    }
  );
  const renderIframeFallback = (topicUrl, fallbackTitle, error, forcedIframe = false) => runtime.topicViewModeUtils.renderIframeFallback(
    state,
    topicUrl,
    fallbackTitle,
    error,
    {
      forcedIframe,
      setIframeModeEnabled,
      cancelLoadMoreRequest,
      cancelReplyRequest,
      resetReadTrackingState,
      setDrawerTitle,
      resetReplyComposer,
      clearJumpBackButton,
      documentRef: document
    }
  );
  const refreshCurrentView = () => runtime.topicViewModeUtils.refreshCurrentView(state, {
    ensureTrackedTopicVisit,
    renderIframeFallback,
    getTopicTargetSpec: runtime.topicPath.getTopicTargetSpec,
    shouldFetchTargetedTopic: runtime.topicTargetUtils.shouldFetchTargetedTopic,
    topicHasPostNumber: runtime.topicStream.topicHasPostNumber,
    topicHasCompletePostStream: runtime.topicStream.topicHasCompletePostStream,
    renderTopic,
    loadTopic
  });
  const fetchTrackedTopicJson = (topicUrl, signal, topicIdHint = null, options = {}) => runtime.topicViewModeUtils.fetchTrackedTopicJson(
    topicUrl,
    signal,
    topicIdHint,
    {
      ...options,
      fetchImpl,
      toTopicJsonUrl: runtime.topicUrlUtils.toTopicJsonUrl,
      getTopicIdFromUrl: runtime.topicPath.getTopicIdFromUrl,
      buildTopicRequestHeaders: runtime.topicUrlUtils.buildTopicRequestHeaders,
      parseTopicPath: runtime.topicPath.parseTopicPath,
      stripTrailingSlash: runtime.topicPath.stripTrailingSlash
    }
  );
  const ensureTrackedTopicVisit = (topicUrl, topicIdHint = null, signal) => runtime.topicViewModeUtils.ensureTrackedTopicVisit(
    state,
    topicUrl,
    topicIdHint,
    signal,
    {
      getTopicTrackingKey: runtime.topicPath.getTopicTrackingKey,
      fetchTrackedTopicJson
    }
  );
  const queueAutoLoadCheck = () => runtime.topicLoadMoreUtils.queueAutoLoadCheck({
    requestAnimationFrameFn: requestAnimationFrame,
    maybeLoadMorePosts
  });
  const maybeLoadMorePosts = () => runtime.topicLoadMoreUtils.maybeLoadMorePosts(state, {
    hasMoreTopicPosts: runtime.topicStream.hasMoreTopicPostsBelowLoadedTail,
    updateLoadMoreStatus,
    loadMorePosts,
    loadMoreTriggerOffset: LOAD_MORE_TRIGGER_OFFSET
  });
  const appendPostsToCurrentTopicView = (newPosts, expectedUrl, signal, nextTopic) => runtime.topicLoadMoreUtils.appendPostsToCurrentTopicView(
    state,
    newPosts,
    expectedUrl,
    signal,
    nextTopic,
    {
      HTMLElementClass: HTMLElement,
      buildPostCard,
      updateReactionOptionsFromTopicPayload,
      renderTopicMeta,
      syncReplyUI,
      syncAutoLoadProgressHint,
      syncReadTracking,
      queueAutoLoadCheck,
      requestAnimationFrameFn: requestAnimationFrame
    }
  );
  const loadMorePosts = () => runtime.topicLoadMoreUtils.loadMorePosts(state, {
    getNextTopicPostIdsAfterLoadedTail: runtime.topicStream.getNextTopicPostIdsAfterLoadedTail,
    getNextTopicPostIds: runtime.topicStream.getNextTopicPostIds,
    updateLoadMoreStatus,
    cancelLoadMoreRequest,
    fetchTopicPostsBatch,
    mergeTopicPreviewData: runtime.topicTargetUtils.mergeTopicPreviewData,
    getTopicStreamIds: runtime.topicStream.getTopicStreamIds,
    getLoadedTopicPostIds: runtime.topicStream.getLoadedTopicPostIds,
    appendPostsToCurrentTopicView,
    renderTopic
  });
  const buildTopicView = (topic, viewModel) => runtime.topicViewBuilderUtils.buildTopicView(state, topic, viewModel, {
    documentRef: document,
    buildPostCard,
    buildAutoLoadProgressHintText: runtime.drawerUtils.buildAutoLoadProgressHintText,
    hasHiddenTopicPostsBeforeLoadedHead: runtime.topicStream.hasHiddenTopicPostsBeforeLoadedHead
  });
  const buildTopicViewModel = (topic, targetSpec = null, forcedTargetPostNumber = null) => runtime.topicViewBuilderUtils.buildTopicViewModel(
    topic,
    targetSpec,
    forcedTargetPostNumber,
    {
      hasMoreTopicPosts: runtime.topicStream.hasMoreTopicPosts,
      hasMoreTopicPostsBelowLoadedTail: runtime.topicStream.hasMoreTopicPostsBelowLoadedTail
    }
  );
  const normalizeUsername = runtime.topicDisplayUtils.normalizeUsername;
  const resolveTopicAuthorUserId = (topic) => runtime.topicDisplayUtils.resolveTopicAuthorUserId(topic, runtime.replyViewUtils.getFirstTopicPost);
  const isTopicAuthorPost = (post) => runtime.topicDisplayUtils.isTopicAuthorPost(post, {
    currentTopicAuthorUserId: state.currentTopicAuthorUserId,
    currentTopicAuthorUsername: state.currentTopicAuthorUsername,
    normalizeUsername
  });
  const normalizeTitleEmojiShortcode = runtime.topicDisplayUtils.normalizeTitleEmojiShortcode;
  const cacheTitleEmojiMapFromLink = (link) => {
    state.currentTitleEmojiMap = runtime.topicDisplayUtils.collectTitleEmojiMapFromLink(link, {
      ElementClass: Element,
      ImageClass: HTMLImageElement,
      normalizeTitleEmojiShortcode,
      normalizeIconUrl
    });
  };
  const cacheTagIconMapFromLink = (link) => {
    state.currentTagIconMap = runtime.topicDisplayUtils.collectTagIconMapFromLink(link, {
      ElementClass: Element,
      SVGElementClass: SVGElement,
      ImageClass: HTMLImageElement,
      getTopicEntryContainer: runtime.topicLink.getTopicEntryContainer,
      normalizeIconUrl,
      normalizeTagLabel: runtime.topicDisplayUtils.normalizeTagLabel
    });
  };
  const resolveTitleEmojiIconUrl = (shortcode) => runtime.topicDisplayUtils.resolveTitleEmojiIconUrl(shortcode, {
    normalizeTitleEmojiShortcode,
    currentTitleEmojiMap: state.currentTitleEmojiMap,
    locationOrigin: location.origin
  });
  const setDrawerTitle = (rawTitle) => runtime.topicDisplayUtils.renderDrawerTitle(state.title, rawTitle, {
    HTMLElementClass: HTMLElement,
    resolveTitleEmojiIconUrl,
    escapeHtmlAttribute: runtime.textUtils.escapeHtmlAttribute,
    defaultTitle: "帖子预览"
  });
  const normalizeBiliEmojiShortcode = runtime.replyEmojiUtils.normalizeBiliEmojiShortcode;
  const collectBiliEmojiItemsFromDocument = () => runtime.replyEmojiUtils.collectBiliEmojiItemsFromDocument({
    documentRef: document,
    ImageClass: HTMLImageElement,
    normalizeIconUrl,
    normalizeBiliEmojiShortcode,
    biliEmojiShortcodePrefix: BILI_EMOJI_SHORTCODE_PREFIX,
    biliEmojiIconUrls: BILI_EMOJI_ICON_URLS
  });
  const buildFallbackBiliEmojiItems = () => runtime.replyEmojiUtils.buildFallbackBiliEmojiItems({
    normalizeIconUrl,
    biliEmojiFallbackCount: BILI_EMOJI_FALLBACK_COUNT,
    biliEmojiShortcodePrefix: BILI_EMOJI_SHORTCODE_PREFIX,
    biliEmojiIconUrls: BILI_EMOJI_ICON_URLS
  });
  const ensureReplyEmojiItemsLoaded = () => runtime.replyEmojiUtils.ensureReplyEmojiItemsLoaded(state, {
    collectBiliEmojiItemsFromDocument,
    buildFallbackBiliEmojiItems
  });
  const renderReplyEmojiGrid = () => runtime.replyEmojiUtils.renderReplyEmojiGrid(state, {
    HTMLElementClass: HTMLElement,
    documentRef: document,
    normalizeBiliEmojiShortcode
  });
  const setReplyEmojiPanelOpen = (isOpen) => runtime.replyPanelUtils.setReplyEmojiPanelOpen(state, isOpen, {
    ensureReplyEmojiItemsLoaded,
    renderReplyEmojiGrid
  });
  const setReplyPanelOpen = (isOpen) => runtime.replyPanelUtils.setReplyPanelOpen(state, isOpen, {
    setReplyEmojiPanelOpen,
    setReplyTarget,
    queueMicrotaskFn: queueMicrotask
  });
  const toggleReplyPanel = () => runtime.replyPanelUtils.toggleReplyPanel(state, {
    setReplyTarget,
    setReplyPanelOpen
  });
  const openReplyPanelForPost = (post) => runtime.replyPanelUtils.openReplyPanelForPost(state, post, {
    setReplyTarget,
    setReplyPanelOpen
  });
  const handleReplyEmojiToggleClick = (event) => runtime.replyPanelUtils.handleReplyEmojiToggleClick(state, event, {
    setReplyEmojiPanelOpen
  });
  const handleReplyEmojiGridClick = (event) => runtime.replyPanelUtils.handleReplyEmojiGridClick(state, event, {
    ElementClass: Element,
    HTMLButtonElementClass: HTMLButtonElement,
    normalizeBiliEmojiShortcode,
    insertReplyText,
    setReplyEmojiPanelOpen
  });
  const insertReplyText = (value) => runtime.replyComposeUtils.insertReplyText(state, value, {
    TextAreaClass: HTMLTextAreaElement,
    EventClass: Event
  });
  const buildReplyTargetLabel = runtime.replyComposeUtils.buildReplyTargetLabel;
  const setReplyTarget = (post) => runtime.replyComposeUtils.setReplyTarget(state, post, {
    buildReplyTargetLabel,
    syncReplyUI
  });
  const handleReplyTextareaKeydown = (event) => runtime.replyComposeUtils.handleReplyTextareaKeydown(event, {
    onSubmit: handleReplySubmit
  });
  const mimeTypeToFileExtension = runtime.replyPasteFileUtils.mimeTypeToFileExtension;
  const resolveReplyUploadFileName = (file) => runtime.replyPasteFileUtils.resolveReplyUploadFileName(file, {
    mimeTypeToFileExtension
  });
  const normalizeReplyUploadFile = (file) => runtime.replyPasteFileUtils.normalizeReplyUploadFile(file, {
    BlobClass: Blob,
    FileClass: File,
    now: Date.now,
    resolveReplyUploadFileName
  });
  const getReplyPasteImageFiles = (event) => runtime.replyPasteFileUtils.getReplyPasteImageFiles(event, {
    normalizeReplyUploadFile,
    isImageUploadName: runtime.textUtils.isImageUploadName,
    FileClass: File
  });
  const insertReplyTextareaText = (text) => runtime.replyUploadTextUtils.insertReplyTextareaText(state.replyTextarea, text, {
    EventClass: Event
  });
  const replaceReplyTextareaText = (searchText, replacementText) => runtime.replyUploadTextUtils.replaceReplyTextareaText(
    state.replyTextarea,
    searchText,
    replacementText,
    { EventClass: Event }
  );
  const replaceReplyUploadPlaceholder = (marker, replacement) => runtime.replyUploadTextUtils.replaceReplyUploadPlaceholder(
    state.replyTextarea,
    marker,
    replacement,
    { EventClass: Event }
  );
  const removeReplyUploadPlaceholder = (marker) => runtime.replyUploadTextUtils.removeReplyUploadPlaceholder(
    state.replyTextarea,
    marker,
    { EventClass: Event }
  );
  const buildReplyUploadPlaceholder = (file) => runtime.replyUploadTextUtils.buildReplyUploadPlaceholder(file, {
    makeUploadId: () => `ld-upload-${Date.now()}-${++state.replyUploadSerial}`,
    sanitizeReplyUploadFileName: runtime.textUtils.sanitizeReplyUploadFileName,
    replyUploadMarker: REPLY_UPLOAD_MARKER
  });
  const insertReplyUploadPlaceholders = (files) => runtime.replyUploadTextUtils.insertReplyUploadPlaceholders(
    state.replyTextarea,
    files,
    {
      buildReplyUploadPlaceholder,
      insertReplyTextareaText: (textarea, text) => runtime.replyUploadTextUtils.insertReplyTextareaText(textarea, text, {
        EventClass: Event
      })
    }
  );
  const queueReplyPasteUploads = (files) => runtime.replyUploadQueueUtils.queueReplyPasteUploads(state, files, {
    insertReplyUploadPlaceholders,
    uploadReplyPasteFile,
    syncReplyUI,
    updateReplyUploadStatus
  });
  const handleReplyTextareaPaste = (event) => runtime.replyUploadQueueUtils.handleReplyTextareaPaste(state, event, {
    getReplyPasteImageFiles,
    queueReplyPasteUploads
  });
  const generateIconCandidatesForReaction = (reactionId) => runtime.reactionIconRegistry.generateIconCandidatesForReaction(reactionId, {
    normalizeReactionId,
    normalizeIconUrl,
    reactionIconMap: state.reactionIconMap,
    emojiSet: state.emojiSet,
    locationOrigin: location.origin
  });
  const getReactionIconResolverOptions = () => ({
    normalizeReactionId,
    extractEmojiIdFromText,
    normalizeIconUrl,
    registerReactionIconUrl,
    getForcedReactionIconUrl,
    isKnownOfficialReactionId,
    generateIconCandidatesForReaction,
    reactionIconMap: state.reactionIconMap,
    invalidReactionIconUrls: state.invalidReactionIconUrls,
    currentTopic: state.currentTopic,
    emojiSet: state.emojiSet,
    locationOrigin: location.origin,
    fetchImpl,
    DOMParserClass: DOMParser,
    imageClass: HTMLImageElement,
    documentRef: document,
    getCsrfToken: runtime.securityUtils.getCsrfToken,
    onAfter: () => {
      refreshReactionControls();
    }
  });
  const ensureReactionIconsLoaded = (reactionOptions) => runtime.reactionIconResolver.ensureReactionIconsLoaded(reactionOptions, getReactionIconResolverOptions());
  const collectReactionIconsFromDom = (reactionOptions) => runtime.reactionIconResolver.collectReactionIconsFromDom(reactionOptions, getReactionIconResolverOptions());
  const collectReactionIconsFromLoadedTopicPosts = (reactionOptions) => runtime.reactionIconResolver.collectReactionIconsFromLoadedTopicPosts(reactionOptions, getReactionIconResolverOptions());
  const fetchEmojiCatalogAndRegisterIcons = (reactionOptions) => runtime.reactionIconResolver.fetchEmojiCatalogAndRegisterIcons(reactionOptions, getReactionIconResolverOptions());
  const resolveReactionIconsViaMarkdown = (reactionOptions) => runtime.reactionIconResolver.resolveReactionIconsViaMarkdown(reactionOptions, getReactionIconResolverOptions());
  const hydrateMissingReactionIcons = (reactionOptions) => runtime.reactionIconResolver.hydrateMissingReactionIcons(reactionOptions, getReactionIconResolverOptions());
  let postInteractionApi = null;
  const getPostInteractionApi = () => {
    if (!postInteractionApi) {
      postInteractionApi = runtime.postInteractionUtils.createApi(state, {
        reactionPickerHideDelayMs: REACTION_PICKER_HIDE_DELAY_MS,
        openReplyPanelForPost,
        scrollToPostNumber,
        getForcedReactionIconUrl,
        getReactionIconUrl,
        reactionIdToEmoji,
        ensureReactionIconsLoaded,
        forcedReactionOptions: FORCED_REACTION_OPTIONS,
        isTopicAuthorPost,
        locationOrigin: location.origin
      });
    }
    return postInteractionApi;
  };
  const buildPostCard = (post) => getPostInteractionApi().buildPostCard(post);
  const refreshReactionControls = () => getPostInteractionApi().refreshReactionControls();
  const refreshBookmarkControls = () => getPostInteractionApi().refreshBookmarkControls();
  const ensureReactionOptionsLoaded = () => getPostInteractionApi().ensureReactionOptionsLoaded();
  const addReplyUploadController = (controller) => runtime.replyUploadStateUtils.addReplyUploadController(state, controller);
  const removeReplyUploadController = (controller) => runtime.replyUploadStateUtils.removeReplyUploadController(state, controller);
  const cancelReplyUploads = () => runtime.replyUploadStateUtils.cancelReplyUploads(state);
  const updateReplyUploadStatus = () => runtime.replyUploadStateUtils.updateReplyUploadStatus(state);
  let replySubmitApi = null;
  const getReplySubmitApi = () => {
    if (!replySubmitApi) {
      replySubmitApi = runtime.replySubmitUtils.createApi(state, {
        locationOrigin: location.origin,
        cancelReplyRequest,
        syncReplyUI,
        setReplyPanelOpen,
        appendCreatedReplyToCurrentTopic,
        fetchImpl,
        addReplyUploadController,
        removeReplyUploadController,
        replaceReplyUploadPlaceholder,
        removeReplyUploadPlaceholder,
        insertReplyTextareaText,
        updateReplyUploadStatus
      });
    }
    return replySubmitApi;
  };
  const uploadReplyPasteFile = (entry, sessionId) => getReplySubmitApi().uploadReplyPasteFile(entry, sessionId);
  const handleReplySubmit = () => getReplySubmitApi().handleReplySubmit();
  const cancelLoadMoreRequest = () => runtime.requestControlUtils.cancelLoadMoreRequest(state);
  const cancelReplyRequest = () => runtime.requestControlUtils.cancelReplyRequest(state);
  const syncAutoLoadProgressHint = () => runtime.drawerStatusUtils.syncAutoLoadProgressHint(state, {
    hasMoreTopicPosts: runtime.topicStream.hasMoreTopicPosts,
    HTMLElementClass: HTMLElement,
    hasMoreTopicPostsBelowLoadedTail: runtime.topicStream.hasMoreTopicPostsBelowLoadedTail,
    hasHiddenTopicPostsBeforeLoadedHead: runtime.topicStream.hasHiddenTopicPostsBeforeLoadedHead,
    buildAutoLoadProgressHintText: runtime.drawerUtils.buildAutoLoadProgressHintText
  });
  const updateLoadMoreStatus = () => runtime.drawerStatusUtils.updateLoadMoreStatus(state, {
    hasMoreTopicPosts: runtime.topicStream.hasMoreTopicPosts,
    hasMoreTopicPostsBelowLoadedTail: runtime.topicStream.hasMoreTopicPostsBelowLoadedTail,
    hasHiddenTopicPostsBeforeLoadedHead: runtime.topicStream.hasHiddenTopicPostsBeforeLoadedHead,
    buildAutoLoadProgressHintText: runtime.drawerUtils.buildAutoLoadProgressHintText
  });
  const setSettingsPanelOpen = (isOpen, panelOptions = {}) => runtime.settingsPanelUtils.setSettingsPanelOpen(state, isOpen, {
    updateSettingsPopoverPosition,
    queueMicrotaskFn: queueMicrotask,
    focusOnOpen: panelOptions.focusOnOpen === true
  });
  const toggleSettingsPanel = () => runtime.settingsPanelUtils.toggleSettingsPanel(state, {
    setSettingsPanelOpen: (isOpen) => setSettingsPanelOpen(isOpen, { focusOnOpen: isOpen })
  });
  const handleSettingsPanelClick = (event) => runtime.settingsPanelUtils.handleSettingsPanelClick(state, event, {
    setSettingsPanelOpen
  });
  const syncSettingsUI = () => runtime.settingsUiUtils.syncSettingsUI(state);
  const handleSettingsChange = (event) => runtime.settingsUiUtils.handleSettingsChange(state, event, {
    HTMLInputElementClass: HTMLInputElement,
    HTMLSelectElementClass: HTMLSelectElement,
    saveSettings,
    applyDrawerWidth,
    setSettingsPanelOpen,
    refreshCurrentView
  });
  const resetSettings = () => runtime.settingsUiUtils.resetSettings(state, {
    defaultSettings: DEFAULT_SETTINGS,
    syncSettingsUI,
    saveSettings,
    applyDrawerWidth,
    refreshCurrentView,
    setSettingsPanelOpen
  });
  const applyDrawerWidth = () => runtime.settingsUiUtils.applyDrawerWidth(state, {
    clampDrawerWidth,
    drawerWidths: DRAWER_WIDTHS,
    updateSettingsPopoverPosition,
    documentRef: document
  });
  const updateSettingsPopoverPosition = (options = {}) => runtime.settingsUiUtils.updateSettingsPopoverPosition(state, options);
  const handleWindowResize = () => runtime.settingsUiUtils.handleWindowResize(state, {
    clampDrawerWidth,
    applyDrawerWidth,
    saveSettings,
    updateSettingsPopoverPosition,
    clampImagePreviewOffsets,
    applyImagePreviewScale
  });
  const invalidateTopicEntriesCache = () => runtime.topicEntryCacheUtils.invalidateTopicEntriesCache(state);
  const getTopicEntries = () => runtime.topicEntryCacheUtils.getTopicEntries(state, {
    documentRef: document,
    mainContentSelector: MAIN_CONTENT_SELECTOR,
    primaryTopicLinkSelector: PRIMARY_TOPIC_LINK_SELECTOR,
    rootId: ROOT_ID,
    excludedLinkContextSelector: EXCLUDED_LINK_CONTEXT_SELECTOR,
    getTopicUrlFromLink: runtime.topicLink.getTopicUrlFromLink,
    getTopicEntryContainer: runtime.topicLink.getTopicEntryContainer,
    getTopicIdHintFromLink: runtime.topicLink.getTopicIdHintFromLink,
    getTopicIdFromUrl: runtime.topicPath.getTopicIdFromUrl,
    buildEntryKey: runtime.topicLink.buildEntryKey,
    isPrimaryTopicLink: runtime.topicLink.isPrimaryTopicLink,
    normalizeTopicUrl: runtime.topicPath.normalizeTopicUrl,
    locationHref: location.href,
    locationOrigin: location.origin
  });
  const resolveCurrentEntryIndex = (entries) => runtime.topicEntryCacheUtils.resolveCurrentEntryIndex(state, entries);
  const navigateTopic = (offset) => runtime.topicEntryCacheUtils.navigateTopic(state, offset, {
    getTopicEntries,
    resolveCurrentEntryIndex,
    openDrawer
  });
  const hasPreviewableTopicLinks = () => runtime.locationWatchUtils.hasPreviewableTopicLinks(getTopicEntries);
  const handleLocationChange = () => runtime.locationWatchUtils.handleLocationChange(state, {
    locationHref: location.href,
    invalidateTopicEntriesCache,
    hasPreviewableTopicLinks,
    closeDrawer
  });
  const watchLocationChanges = () => runtime.locationWatchUtils.watchLocationChanges(state, {
    historyRef: history,
    windowRef: window,
    documentRef: document,
    locationRef: location,
    queueMicrotaskFn: queueMicrotask,
    MutationObserverClass: MutationObserver,
    handleLocationChange,
    invalidateTopicEntriesCache
  });
  const ensureDrawer = () => runtime.drawerDomUtils.ensureDrawer(state, {
    documentRef: document,
    rootId: ROOT_ID,
    toggleSettingsPanel,
    toggleReplyPanel,
    handleJumpToFirstPostClick,
    setReplyPanelOpen,
    handleReplySubmit,
    handleReplyTextareaKeydown,
    handleReplyTextareaPaste,
    handleReplyEmojiToggleClick,
    handleReplyEmojiGridClick,
    handleDrawerRootClick,
    handleDrawerRootWheel,
    handleImagePreviewPointerDown,
    handleImagePreviewPointerMove,
    handleImagePreviewPointerEnd,
    handleDrawerBodyScroll,
    handleSettingsChange,
    setSettingsPanelOpen,
    syncSettingsUI,
    applyDrawerWidth,
    syncReplyUI,
    syncDrawerHeaderLiquidState,
    updateSettingsPopoverPosition
  });
  const syncJumpFirstPostButtonUI = () => runtime.drawerHeaderUtils.syncJumpFirstPostButtonUI(state, {
    iframeModeClass: IFRAME_MODE_CLASS
  });
  const syncDrawerHeaderLiquidState = (force = false) => runtime.drawerHeaderUtils.syncDrawerHeaderLiquidState(state, force, {
    HTMLElementClass: HTMLElement,
    syncJumpFirstPostButtonUI
  });
  const handleJumpToFirstPostClick = () => runtime.drawerHeaderUtils.handleJumpToFirstPostClick(state, {
    getFirstTopicPost: runtime.replyViewUtils.getFirstTopicPost,
    scrollToPostNumber
  });
  const getDrawerTopOverlayInset = (bodyRect) => runtime.drawerHeaderUtils.getDrawerTopOverlayInset(state, bodyRect, {
    HTMLElementClass: HTMLElement
  });
  const alignTargetPostBelowHeaderCapsule = (target) => runtime.drawerHeaderUtils.alignTargetPostBelowHeaderCapsule(state, target, {
    HTMLElementClass: HTMLElement,
    getDrawerTopOverlayInset
  });
  let postJumpApi = null;
  const getPostJumpApi = () => {
    if (!postJumpApi) {
      postJumpApi = runtime.postJumpUtils.createApi(state, {
        jumpBackButtonDurationMs: JUMP_BACK_BUTTON_DURATION_MS,
        syncDrawerHeaderLiquidState,
        alignTargetPostBelowHeaderCapsule,
        requestAnimationFrameFn: requestAnimationFrame,
        setTimeoutFn: setTimeout,
        clearTimeoutFn: clearTimeout
      });
    }
    return postJumpApi;
  };
  const clearJumpBackButton = () => getPostJumpApi().clearJumpBackButton();
  const applyReadPositionGlow = (target) => getPostJumpApi().applyReadPositionGlow(target);
  const applyJumpPositionGlow = (target) => getPostJumpApi().applyJumpPositionGlow(target);
  const scrollToPostNumber = (postNumber, withHighlight = false, options = {}) => getPostJumpApi().scrollToPostNumber(postNumber, withHighlight, options);
  const showJumpBackButton = (targetCard, backPostNumber) => getPostJumpApi().showJumpBackButton(targetCard, backPostNumber);
  const scrollTopicViewToTargetPost = (targetPostNumber, options = {}) => getPostJumpApi().scrollTopicViewToTargetPost(targetPostNumber, options);
  let imagePreviewBridgeApi = null;
  const getImagePreviewBridgeApi = () => {
    if (!imagePreviewBridgeApi) {
      imagePreviewBridgeApi = runtime.imagePreviewBridgeUtils.createApi(state, {
        imagePreviewScaleMin: IMAGE_PREVIEW_SCALE_MIN,
        imagePreviewScaleMax: IMAGE_PREVIEW_SCALE_MAX,
        imagePreviewScaleStep: IMAGE_PREVIEW_SCALE_STEP,
        imagePreviewDragThresholdPx: IMAGE_PREVIEW_DRAG_THRESHOLD_PX,
        setReplyEmojiPanelOpen,
        closeDrawer
      });
    }
    return imagePreviewBridgeApi;
  };
  const handleDrawerRootClick = (event) => getImagePreviewBridgeApi().handleDrawerRootClick(event);
  const openImagePreview = (image) => getImagePreviewBridgeApi().openImagePreview(image);
  const closeImagePreview = () => getImagePreviewBridgeApi().closeImagePreview();
  const handlePreviewImageLoad = () => getImagePreviewBridgeApi().handlePreviewImageLoad();
  const triggerBottomEdgeGlow = () => {
    if (!(state.root instanceof HTMLElement)) {
      return;
    }

    const now = Date.now();
    if (state.bottomEdgeGlowLockedUntil > now) {
      return;
    }
    state.bottomEdgeGlowArmed = false;
    state.bottomEdgeGlowLockedUntil = now + 960;

    if (state.bottomEdgeGlowTimer) {
      clearTimeout(state.bottomEdgeGlowTimer);
      state.bottomEdgeGlowTimer = null;
    }

    state.root.classList.remove("ld-drawer-bottom-edge-glow-active");
    void state.root.offsetWidth;
    state.root.classList.add("ld-drawer-bottom-edge-glow-active");
    state.bottomEdgeGlowTimer = setTimeout(() => {
      state.root?.classList.remove("ld-drawer-bottom-edge-glow-active");
      if (state.bottomEdgeGlowTimer) {
        state.bottomEdgeGlowTimer = null;
      }
    }, 5100);
  };
  const maybeTriggerBottomEdgeGlow = (event) => {
    if (
      !(state.drawerBody instanceof HTMLElement)
      || !state.currentTopic
      || state.isLoadingMorePosts
      || Number(event?.deltaY || 0) <= 0
      || !state.root?.contains(event.target)
    ) {
      return;
    }

    if (runtime.topicStream.hasMoreTopicPostsBelowLoadedTail(state.currentTopic)) {
      return;
    }

    const remainingDistance = state.drawerBody.scrollHeight - state.drawerBody.scrollTop - state.drawerBody.clientHeight;
    if (remainingDistance > 1 || state.bottomEdgeGlowArmed !== true) {
      return;
    }

    event.preventDefault();
    triggerBottomEdgeGlow();
  };
  const handleDrawerRootWheel = (event) => {
    if (!state.imagePreview?.hidden) {
      getImagePreviewBridgeApi().handleDrawerRootWheel(event);
      return;
    }

    maybeTriggerBottomEdgeGlow(event);
  };
  const resetImagePreviewScale = () => getImagePreviewBridgeApi().resetImagePreviewScale();
  const applyImagePreviewScale = () => getImagePreviewBridgeApi().applyImagePreviewScale();
  const handleImagePreviewPointerDown = (event) => getImagePreviewBridgeApi().handleImagePreviewPointerDown(event);
  const handleImagePreviewPointerMove = (event) => getImagePreviewBridgeApi().handleImagePreviewPointerMove(event);
  const handleImagePreviewPointerEnd = (event) => getImagePreviewBridgeApi().handleImagePreviewPointerEnd(event);
  const endImagePreviewDrag = () => getImagePreviewBridgeApi().endImagePreviewDrag();
  const clampImagePreviewOffsets = () => getImagePreviewBridgeApi().clampImagePreviewOffsets();
  const syncReadTracking = (posts) => runtime.readTrackingUtils.syncReadTracking(state, posts, {
    scheduleReadVisibilityCheck
  });
  const scheduleReadVisibilityCheck = () => runtime.readTrackingUtils.scheduleReadVisibilityCheck(state, {
    requestAnimationFrameFn: requestAnimationFrame,
    cancelAnimationFrameFn: cancelAnimationFrame,
    collectVisibleReadPosts
  });
  const collectVisibleReadPosts = () => runtime.readTrackingUtils.collectVisibleReadPosts(state, {
    HTMLElementClass: HTMLElement,
    getDrawerTopOverlayInset,
    scheduleReadProgressReportFromSeen
  });
  const scheduleReadProgressReportFromSeen = () => runtime.readTrackingUtils.scheduleReadProgressReportFromSeen(state, {
    cancelReadProgressReport,
    reportTopicReadProgress,
    setTimeoutFn: setTimeout
  });
  const cancelReadProgressReport = () => runtime.readTrackingUtils.cancelReadProgressReport(state, {
    clearTimeoutFn: clearTimeout
  });
  const resetReadTrackingState = () => runtime.readTrackingUtils.resetReadTrackingState(state, {
    cancelReadProgressReport,
    cancelAnimationFrameFn: cancelAnimationFrame
  });
  const clampDrawerWidth = (value) => runtime.settingsBootstrapUtils.clampDrawerWidth(value, {
    defaultDrawerWidthCustom: DEFAULT_SETTINGS.drawerWidthCustom,
    viewportWidth: window.innerWidth
  });
  const loadSettingsSafe = (options) => runtime.settingsBootstrapUtils.loadSettingsSafe(options);
  const state = runtime.createInitialState({
    loadSettings: () => loadSettingsSafe({
      settingsKey: SETTINGS_KEY,
      defaultSettings: DEFAULT_SETTINGS,
      drawerWidths: DRAWER_WIDTHS,
      clampDrawerWidth
    }),
    loadCachedReactionOptions,
    defaultReactionOptions: DEFAULT_REACTION_OPTIONS,
    locationHref: location.href
  });
  let drawerTopicFlowApi = null;
  const getDrawerTopicFlowApi = () => {
    if (!drawerTopicFlowApi) {
      drawerTopicFlowApi = runtime.drawerTopicFlowUtils.createApi(state, {
        pageOpenClass: PAGE_OPEN_CLASS,
        ensureDrawer,
        getTopicEntries,
        cacheTitleEmojiMapFromLink,
        cacheTagIconMapFromLink,
        highlightLink,
        setDrawerTitle,
        resetReadTrackingState,
        resetReplyComposer,
        clearJumpBackButton,
        renderLoading,
        setIframeModeEnabled,
        updateSettingsPopoverPosition,
        syncDrawerHeaderLiquidState,
        cancelLoadMoreRequest,
        fetchTrackedTopicJson,
        ensureTrackedTopicVisit,
        renderIframeFallback,
        buildTopicViewModel,
        updateReactionOptionsFromTopicPayload,
        renderTopicMeta,
        buildTopicView,
        syncReplyUI,
        scrollTopicViewToTargetPost,
        updateLoadMoreStatus,
        syncAutoLoadProgressHint,
        queueAutoLoadCheck,
        syncReadTracking,
        normalizeUsername,
        resolveTopicAuthorUserId,
        closeImagePreview,
        cancelReplyRequest,
        cancelReadProgressReport,
        clearHighlight,
        setSettingsPanelOpen
      });
    }
    return drawerTopicFlowApi;
  };
  const openDrawer = (topicUrl, fallbackTitle, activeLink) => getDrawerTopicFlowApi().openDrawer(topicUrl, fallbackTitle, activeLink);
  const closeDrawer = () => {
    if (state.bottomEdgeGlowTimer) {
      clearTimeout(state.bottomEdgeGlowTimer);
      state.bottomEdgeGlowTimer = null;
    }
    state.bottomEdgeGlowArmed = true;
    state.bottomEdgeGlowLockedUntil = 0;
    state.root?.classList.remove("ld-drawer-bottom-edge-glow-active");
    getDrawerTopicFlowApi().closeDrawer();
  };
  const loadTopic = (topicUrl, fallbackTitle, topicIdHint = null, options = {}) => getDrawerTopicFlowApi().loadTopic(topicUrl, fallbackTitle, topicIdHint, options);
  const renderTopic = (topic, topicUrl, fallbackTitle, resolvedTargetPostNumber = null, options = {}) => getDrawerTopicFlowApi().renderTopic(topic, topicUrl, fallbackTitle, resolvedTargetPostNumber, options);

  const init = () => {
    runtime.uiEventUtils.init({
      ensureDrawer,
      bindEvents,
      watchLocationChanges
    });
  };

  const bindEvents = () => {
    runtime.uiEventUtils.bindEvents({
      documentRef: document,
      windowRef: window,
      handleDocumentClick,
      handleKeydown,
      handleWindowResize
    });
  };

  const handleDocumentClick = (event) => {
    runtime.uiEventUtils.handleDocumentClick(state, event, {
      ElementClass: Element,
      rootId: ROOT_ID,
      mainContentSelector: MAIN_CONTENT_SELECTOR,
      excludedLinkContextSelector: EXCLUDED_LINK_CONTEXT_SELECTOR,
      getTopicUrlFromLink: runtime.topicLink.getTopicUrlFromLink,
      isPrimaryTopicLink: runtime.topicLink.isPrimaryTopicLink,
      normalizeTopicUrl: runtime.topicPath.normalizeTopicUrl,
      locationHref: location.href,
      locationOrigin: location.origin,
      openDrawer,
      setSettingsPanelOpen,
      setReplyPanelOpen
    });
  };

  const handleKeydown = (event) => {
    runtime.uiEventUtils.handleKeydown(state, event, {
      isTypingTarget: runtime.settingsUtils.isTypingTarget,
      closeImagePreview,
      setSettingsPanelOpen,
      setReplyPanelOpen,
      closeDrawer,
      navigateTopic,
      pageOpenClass: PAGE_OPEN_CLASS,
      bodyRef: document.body
    });
  };

  const highlightLink = (link) => {
    runtime.uiEventUtils.highlightLink(state, link, {
      clearHighlight,
      activeLinkClass: ACTIVE_LINK_CLASS
    });
  };

  const clearHighlight = () => {
    runtime.uiEventUtils.clearHighlight(state);
  };

  const reportTopicReadProgress = (topicId, postNumbers, reportKey) => runtime.readReportUtils.reportTopicReadProgress(state, topicId, postNumbers, reportKey, {
    locationOrigin: location.origin,
    fetchImpl,
    documentRef: document,
    clearCurrentEntryNewTopicBadge
  });

  const clearCurrentEntryNewTopicBadge = () => {
    runtime.readReportUtils.clearCurrentEntryNewTopicBadge(state, {
      ElementClass: Element,
      HTMLElementClass: HTMLElement
    });
  };

  const handleDrawerBodyScroll = () => {
    if (state.currentTopic && state.drawerBody instanceof HTMLElement) {
      const remainingDistance = state.drawerBody.scrollHeight - state.drawerBody.scrollTop - state.drawerBody.clientHeight;
      if (remainingDistance > 1 || runtime.topicStream.hasMoreTopicPostsBelowLoadedTail(state.currentTopic)) {
        state.bottomEdgeGlowArmed = true;
      }
    } else {
      state.bottomEdgeGlowArmed = true;
    }

    runtime.uiEventUtils.handleDrawerBodyScroll({
      maybeLoadMorePosts,
      scheduleReadVisibilityCheck,
      syncDrawerHeaderLiquidState
    });
  };

  const renderLoading = () => runtime.topicFetchUtils.renderLoading();

  const fetchTopicPostsBatch = (topicUrl, postIds, signal, topicIdHint = null) => runtime.topicFetchUtils.fetchTopicPostsBatch(topicUrl, postIds, signal, topicIdHint, {
    fetchImpl,
    toTopicPostsJsonUrl: runtime.topicUrlUtils.toTopicPostsJsonUrl,
    parseTopicPath: runtime.topicPath.parseTopicPath,
    stripTrailingSlash: runtime.topicPath.stripTrailingSlash
  });

  const appendCreatedReplyToCurrentTopic = (createdPost) => {
    runtime.replyViewUtils.appendCreatedReplyToCurrentTopic(state, createdPost, {
      mergeTopicPreviewData: runtime.topicTargetUtils.mergeTopicPreviewData,
      getTopicStreamIds: runtime.topicStream.getTopicStreamIds,
      getLoadedTopicPostIds: runtime.topicStream.getLoadedTopicPostIds,
      renderTopic,
      requestAnimationFrameFn: requestAnimationFrame
    });
  };

  const renderTopicMeta = (topic, loadedPostCount) => {
    runtime.topicMetaUtils.renderTopicMeta(state, topic, loadedPostCount, {
      documentRef: document
    });
  };

  function saveSettings() {
    runtime.settingsUtils.saveSettings(SETTINGS_KEY, state.settings);
  }

  const resetReplyComposer = () => {
    runtime.replyUiUtils.resetReplyComposer(state, {
      cancelReplyUploads,
      setReplyEmojiPanelOpen,
      setReplyPanelOpen,
      syncReplyUI
    });
  };

  const syncReplyUI = () => {
    runtime.replyUiUtils.syncReplyUI(state, {
      iframeModeClass: IFRAME_MODE_CLASS,
      setReplyEmojiPanelOpen,
      syncJumpFirstPostButtonUI
    });
  };

  const buildReplyTextareaPlaceholder = (prefix = "写点什么") => runtime.replyUiUtils.buildReplyTextareaPlaceholder(prefix);

  init();
})();
