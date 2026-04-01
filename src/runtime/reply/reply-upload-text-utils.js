(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function insertReplyTextareaText(textarea, text, options = {}) {
    if (!textarea) {
      return;
    }
    const EventClass = options.EventClass || globalThis.Event;
    const start = Number.isFinite(textarea.selectionStart)
      ? textarea.selectionStart
      : textarea.value.length;
    const end = Number.isFinite(textarea.selectionEnd)
      ? textarea.selectionEnd
      : start;

    textarea.focus();
    textarea.setRangeText(String(text || ""), start, end, "end");
    textarea.dispatchEvent(new EventClass("input", { bubbles: true }));
  }

  function replaceReplyTextareaText(textarea, searchText, replacementText, options = {}) {
    if (!textarea) {
      return false;
    }
    const EventClass = options.EventClass || globalThis.Event;
    const source = String(searchText || "");
    if (!source) {
      return false;
    }
    const start = textarea.value.indexOf(source);
    if (start === -1) {
      return false;
    }

    textarea.setRangeText(
      String(replacementText || ""),
      start,
      start + source.length,
      "preserve"
    );
    textarea.dispatchEvent(new EventClass("input", { bubbles: true }));
    return true;
  }

  function replaceReplyUploadPlaceholder(textarea, marker, replacement, options = {}) {
    return replaceReplyTextareaText(textarea, marker, replacement, options);
  }

  function removeReplyUploadPlaceholder(textarea, marker, options = {}) {
    replaceReplyTextareaText(textarea, marker, "", options);
  }

  function buildReplyUploadPlaceholder(file, options = {}) {
    const makeUploadId = options.makeUploadId;
    const sanitizeReplyUploadFileName = options.sanitizeReplyUploadFileName;
    const replyUploadMarker = options.replyUploadMarker || "";
    if (typeof makeUploadId !== "function" || typeof sanitizeReplyUploadFileName !== "function" || !replyUploadMarker) {
      return null;
    }

    const uploadId = makeUploadId();
    const visibleLabel = `[图片上传中：${sanitizeReplyUploadFileName(file?.name || "image.png")}]`;
    const marker = `${replyUploadMarker}${uploadId}${replyUploadMarker}${visibleLabel}${replyUploadMarker}/${uploadId}${replyUploadMarker}`;

    return {
      file,
      marker,
      insertedText: `${marker}\n`
    };
  }

  function insertReplyUploadPlaceholders(textarea, files, options = {}) {
    if (!textarea || !Array.isArray(files) || !files.length) {
      return [];
    }
    const buildPlaceholder = options.buildReplyUploadPlaceholder;
    const insertText = options.insertReplyTextareaText;
    if (typeof buildPlaceholder !== "function" || typeof insertText !== "function") {
      return [];
    }

    const entries = files
      .map((file) => buildPlaceholder(file))
      .filter(Boolean);
    if (!entries.length) {
      return [];
    }
    insertText(textarea, entries.map((entry) => entry.insertedText).join(""));
    return entries;
  }

  runtime.replyUploadTextUtils = {
    insertReplyTextareaText,
    replaceReplyTextareaText,
    replaceReplyUploadPlaceholder,
    removeReplyUploadPlaceholder,
    buildReplyUploadPlaceholder,
    insertReplyUploadPlaceholders
  };
})();
