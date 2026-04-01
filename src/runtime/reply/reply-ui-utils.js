(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function buildReplyTextareaPlaceholder(prefix = "写点什么") {
    return `${prefix}... 支持 Markdown，可直接粘贴图片自动上传。Ctrl+Enter 或 Cmd+Enter 可发送`;
  }

  function resetReplyComposer(state, options = {}) {
    const cancelReplyUploads = options.cancelReplyUploads;
    const setReplyEmojiPanelOpen = options.setReplyEmojiPanelOpen;
    const setReplyPanelOpen = options.setReplyPanelOpen;
    const syncReplyUI = options.syncReplyUI;
    if (
      !state
      || typeof cancelReplyUploads !== "function"
      || typeof setReplyEmojiPanelOpen !== "function"
      || typeof setReplyPanelOpen !== "function"
      || typeof syncReplyUI !== "function"
    ) {
      return;
    }

    state.replyComposerSessionId += 1;
    cancelReplyUploads();

    if (state.replyTextarea) {
      state.replyTextarea.value = "";
      state.replyTextarea.placeholder = buildReplyTextareaPlaceholder();
    }

    if (state.replyStatus) {
      state.replyStatus.textContent = "";
    }

    setReplyEmojiPanelOpen(false);
    state.isReplySubmitting = false;
    setReplyPanelOpen(false);
    syncReplyUI();
  }

  function syncReplyUI(state, options = {}) {
    const iframeModeClass = options.iframeModeClass || "ld-drawer-iframe-mode";
    const setReplyEmojiPanelOpen = options.setReplyEmojiPanelOpen;
    const syncJumpFirstPostButtonUI = options.syncJumpFirstPostButtonUI;
    if (
      !state
      || typeof setReplyEmojiPanelOpen !== "function"
      || typeof syncJumpFirstPostButtonUI !== "function"
    ) {
      return;
    }

    const hasTopic = Boolean(state.currentTopic?.id);
    const isTargetedReply = Number.isFinite(state.replyTargetPostNumber);
    const isReplyUploading = state.replyUploadPendingCount > 0;

    const isIframeMode = state.root?.classList.contains(iframeModeClass);

    if (state.replyButton) {
      state.replyButton.hidden = !Boolean(state.currentUrl) || isIframeMode;
      state.replyButton.disabled = !hasTopic || state.isReplySubmitting;
      state.replyButton.classList.toggle("is-disabled", !hasTopic || state.isReplySubmitting);
    }

    if (state.replyTextarea) {
      state.replyTextarea.disabled = !hasTopic || state.isReplySubmitting;
      if (hasTopic) {
        state.replyTextarea.placeholder = isTargetedReply
          ? buildReplyTextareaPlaceholder(`回复 ${state.replyTargetLabel}`)
          : buildReplyTextareaPlaceholder(`回复《${state.currentTopic.title || state.currentFallbackTitle || "当前主题"}》`);
      }
    }

    if (state.replySubmitButton) {
      state.replySubmitButton.disabled = !hasTopic || state.isReplySubmitting || isReplyUploading;
      const submitLabel = state.isReplySubmitting
        ? "发送中..."
        : (isReplyUploading
          ? (state.replyUploadPendingCount > 1
            ? `上传 ${state.replyUploadPendingCount} 张图片中...`
            : "图片上传中...")
          : "发送");
      state.replySubmitButton.textContent = submitLabel;
    }

    if (state.replyCancelButton) {
      state.replyCancelButton.disabled = state.isReplySubmitting;
    }

    if (state.replyEmojiToggleButton) {
      state.replyEmojiToggleButton.disabled = !hasTopic || state.isReplySubmitting;
      if (state.replyEmojiToggleButton.disabled) {
        setReplyEmojiPanelOpen(false);
      }
    }

    syncJumpFirstPostButtonUI();
  }

  runtime.replyUiUtils = {
    buildReplyTextareaPlaceholder,
    resetReplyComposer,
    syncReplyUI
  };
})();
