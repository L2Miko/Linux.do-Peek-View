(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function createApi(state, options = {}) {
    const locationOrigin = options.locationOrigin || globalThis.location?.origin || "";
    const cancelReplyRequest = options.cancelReplyRequest;
    const syncReplyUI = options.syncReplyUI;
    const setReplyPanelOpen = options.setReplyPanelOpen;
    const appendCreatedReplyToCurrentTopic = options.appendCreatedReplyToCurrentTopic;
    const fetchImpl = options.fetchImpl || globalThis.fetch?.bind(globalThis);
    const addReplyUploadController = options.addReplyUploadController;
    const removeReplyUploadController = options.removeReplyUploadController;
    const replaceReplyUploadPlaceholder = options.replaceReplyUploadPlaceholder;
    const removeReplyUploadPlaceholder = options.removeReplyUploadPlaceholder;
    const insertReplyTextareaText = options.insertReplyTextareaText;
    const updateReplyUploadStatus = options.updateReplyUploadStatus;
    if (
      !state
      || typeof cancelReplyRequest !== "function"
      || typeof syncReplyUI !== "function"
      || typeof setReplyPanelOpen !== "function"
      || typeof appendCreatedReplyToCurrentTopic !== "function"
      || typeof fetchImpl !== "function"
      || typeof addReplyUploadController !== "function"
      || typeof removeReplyUploadController !== "function"
      || typeof replaceReplyUploadPlaceholder !== "function"
      || typeof removeReplyUploadPlaceholder !== "function"
      || typeof insertReplyTextareaText !== "function"
      || typeof updateReplyUploadStatus !== "function"
    ) {
      return null;
    }

    async function createTopicReply(topicId, raw, signal, replyToPostNumber = null) {
      const csrfToken = runtime.securityUtils.getCsrfToken(document);
      if (!csrfToken) {
        throw new Error("未找到登录令牌，请刷新页面后重试");
      }

      const body = new URLSearchParams();
      body.set("raw", raw);
      body.set("topic_id", String(topicId));
      if (Number.isFinite(replyToPostNumber)) {
        body.set("reply_to_post_number", String(replyToPostNumber));
      }

      const response = await fetchImpl(`${locationOrigin}/posts.json`, {
        method: "POST",
        credentials: "include",
        signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-Token": csrfToken
        },
        body
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("json")
        ? await response.json()
        : null;

      if (!response.ok) {
        const message = Array.isArray(data?.errors) && data.errors.length > 0
          ? data.errors.join("；")
          : (data?.error || `Unexpected response: ${response.status}`);
        throw new Error(message);
      }

      return data;
    }

    async function createComposerUploadViaApi(file, signal, uploadOptions = {}) {
      const csrfToken = runtime.securityUtils.getCsrfToken(document);
      if (!csrfToken) {
        throw new Error("未找到登录令牌，请刷新页面后重试");
      }

      const formData = new FormData();
      formData.set("upload_type", "composer");
      formData.set("file", file, file.name || "image.png");
      if (uploadOptions.pasted) {
        formData.set("pasted", "true");
      }

      const response = await fetchImpl(`${locationOrigin}/uploads.json`, {
        method: "POST",
        credentials: "include",
        signal,
        headers: {
          Accept: "application/json",
          "X-CSRF-Token": csrfToken
        },
        body: formData
      });

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("json")
        ? await response.json()
        : null;

      if (!response.ok) {
        const message = Array.isArray(data?.errors) && data.errors.length > 0
          ? data.errors.join("；")
          : (data?.message || data?.error || `Unexpected response: ${response.status}`);
        throw new Error(message);
      }

      if (!data || typeof data !== "object") {
        throw new Error(`Unexpected response: ${response.status}`);
      }

      return data;
    }

    async function uploadReplyPasteFile(entry, sessionId) {
      const controller = new AbortController();
      addReplyUploadController(controller);

      try {
        const upload = await createComposerUploadViaApi(entry.file, controller.signal, { pasted: true });
        if (controller.signal.aborted || sessionId !== state.replyComposerSessionId) {
          return upload;
        }

        const markdown = runtime.composerMarkdownUtils.buildComposerUploadMarkdown(upload, {
          isImageUploadName: runtime.textUtils.isImageUploadName,
          buildComposerImageMarkdown: (item, uploadUrl) => runtime.composerMarkdownUtils.buildComposerImageMarkdown(item, uploadUrl, {
            markdownNameFromFileName: runtime.textUtils.markdownNameFromFileName
          }),
          markdownNameFromFileName: runtime.textUtils.markdownNameFromFileName
        });
        const inserted = replaceReplyUploadPlaceholder(entry.marker, `${markdown}\n`);
        if (!inserted) {
          insertReplyTextareaText(`\n${markdown}\n`);
        }

        return upload;
      } catch (error) {
        if (!controller.signal.aborted && sessionId === state.replyComposerSessionId) {
          removeReplyUploadPlaceholder(entry.marker);
        }

        if (controller.signal.aborted) {
          return null;
        }

        throw error;
      } finally {
        removeReplyUploadController(controller);
        if (state.replyUploadPendingCount > 0) {
          state.replyUploadPendingCount -= 1;
        }

        syncReplyUI();
        if (sessionId === state.replyComposerSessionId && state.replyUploadPendingCount > 0) {
          updateReplyUploadStatus();
        }
      }
    }

    async function handleReplySubmit() {
      if (!state.currentTopic || state.isReplySubmitting || !state.replyTextarea || !state.replyStatus) {
        return;
      }

      if (state.replyUploadPendingCount > 0) {
        state.replyStatus.textContent = state.replyUploadPendingCount > 1
          ? `还有 ${state.replyUploadPendingCount} 张图片正在上传，请稍候再发送。`
          : "图片还在上传中，请稍候再发送。";
        return;
      }

      const raw = state.replyTextarea.value.trim();
      if (!raw) {
        state.replyStatus.textContent = "先写点内容再发送。";
        state.replyTextarea.focus();
        return;
      }

      cancelReplyRequest();
      state.isReplySubmitting = true;
      syncReplyUI();
      state.replyStatus.textContent = "正在发送回复...";

      const controller = new AbortController();
      state.replyAbortController = controller;

      try {
        const createdPost = await createTopicReply(
          state.currentTopic.id,
          raw,
          controller.signal,
          state.replyTargetPostNumber
        );
        if (controller.signal.aborted) {
          return;
        }

        state.replyTextarea.value = "";
        state.replyStatus.textContent = "回复已发送。";
        appendCreatedReplyToCurrentTopic(createdPost);
        setReplyPanelOpen(false);
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        state.replyStatus.textContent = error?.message || "回复发送失败";
      } finally {
        if (state.replyAbortController === controller) {
          state.replyAbortController = null;
        }

        state.isReplySubmitting = false;
        syncReplyUI();
      }
    }

    return {
      createTopicReply,
      createComposerUploadViaApi,
      uploadReplyPasteFile,
      handleReplySubmit
    };
  }

  runtime.replySubmitUtils = {
    createApi
  };
})();
