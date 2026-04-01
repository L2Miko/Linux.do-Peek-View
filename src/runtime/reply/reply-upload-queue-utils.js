(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  async function queueReplyPasteUploads(state, files, options = {}) {
    if (!state?.replyTextarea || !state?.currentTopic || !Array.isArray(files) || !files.length) {
      return;
    }
    const insertReplyUploadPlaceholders = options.insertReplyUploadPlaceholders;
    const uploadReplyPasteFile = options.uploadReplyPasteFile;
    const syncReplyUI = options.syncReplyUI;
    const updateReplyUploadStatus = options.updateReplyUploadStatus;
    if (
      typeof insertReplyUploadPlaceholders !== "function"
      || typeof uploadReplyPasteFile !== "function"
      || typeof syncReplyUI !== "function"
      || typeof updateReplyUploadStatus !== "function"
    ) {
      return;
    }

    const sessionId = state.replyComposerSessionId;
    const placeholders = insertReplyUploadPlaceholders(files);
    if (!placeholders.length) {
      return;
    }

    state.replyUploadPendingCount += placeholders.length;
    syncReplyUI();
    updateReplyUploadStatus();

    const results = await Promise.allSettled(
      placeholders.map((entry) => uploadReplyPasteFile(entry, sessionId))
    );

    if (sessionId !== state.replyComposerSessionId || state.replyUploadPendingCount > 0 || !state.replyStatus) {
      return;
    }

    const successCount = results.filter((result) => result.status === "fulfilled").length;
    const failures = results.filter((result) => result.status === "rejected");

    if (!failures.length) {
      state.replyStatus.textContent = successCount > 1
        ? `已上传 ${successCount} 张图片，已插入回复内容。`
        : "图片已上传，已插入回复内容。";
      return;
    }

    if (!successCount) {
      state.replyStatus.textContent = failures.length > 1
        ? `图片上传失败（${failures.length} 张）：${failures.map((item) => item.reason?.message || "未知错误").join("；")}`
        : `图片上传失败：${failures[0].reason?.message || "未知错误"}`;
      return;
    }

    state.replyStatus.textContent = `图片上传完成：${successCount} 张成功，${failures.length} 张失败。`;
  }

  function handleReplyTextareaPaste(state, event, options = {}) {
    const getReplyPasteImageFiles = options.getReplyPasteImageFiles;
    const queueReplyPasteUploads = options.queueReplyPasteUploads;
    if (
      event?.defaultPrevented
      || event?.target !== state?.replyTextarea
      || !state?.currentTopic
      || state?.isReplySubmitting
      || typeof getReplyPasteImageFiles !== "function"
      || typeof queueReplyPasteUploads !== "function"
    ) {
      return;
    }

    const files = getReplyPasteImageFiles(event);
    if (!files.length) {
      return;
    }

    event.preventDefault();
    queueReplyPasteUploads(files).catch(() => {});
  }

  runtime.replyUploadQueueUtils = {
    queueReplyPasteUploads,
    handleReplyTextareaPaste
  };
})();
