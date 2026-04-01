(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function insertReplyText(state, value, options = {}) {
    const TextAreaClass = options.TextAreaClass || globalThis.HTMLTextAreaElement;
    const EventClass = options.EventClass || globalThis.Event;
    if (!(state?.replyTextarea instanceof TextAreaClass)) {
      return;
    }
    const textarea = state.replyTextarea;
    const insert = String(value || "");
    if (!insert) {
      return;
    }
    const start = Number.isFinite(textarea.selectionStart) ? textarea.selectionStart : textarea.value.length;
    const end = Number.isFinite(textarea.selectionEnd) ? textarea.selectionEnd : start;
    const previous = textarea.value.slice(0, start);
    const next = textarea.value.slice(end);
    const shouldPrependSpace = previous.length > 0 && !/\s$/.test(previous);
    const shouldAppendSpace = next.length > 0 && !/^\s/.test(next);
    const token = `${shouldPrependSpace ? " " : ""}${insert}${shouldAppendSpace ? " " : ""}`;
    textarea.setRangeText(token, start, end, "end");
    textarea.dispatchEvent(new EventClass("input", { bubbles: true }));
  }

  function buildReplyTargetLabel(post) {
    const parts = [];
    if (Number.isFinite(post?.post_number)) {
      parts.push(`#${post.post_number}`);
    }
    if (post?.username) {
      parts.push(`@${post.username}`);
    }
    return parts.join(" ") || "回复";
  }

  function setReplyTarget(state, post, options = {}) {
    const buildReplyTargetLabelFn = options.buildReplyTargetLabel || buildReplyTargetLabel;
    const syncReplyUI = options.syncReplyUI;
    if (post && typeof post === "object" && Number.isFinite(post.post_number)) {
      state.replyTargetPostNumber = Number(post.post_number);
      state.replyTargetLabel = buildReplyTargetLabelFn(post);
    } else {
      state.replyTargetPostNumber = null;
      state.replyTargetLabel = "";
    }
    if (typeof syncReplyUI === "function") {
      syncReplyUI();
    }
  }

  function handleReplyTextareaKeydown(event, options = {}) {
    const onSubmit = options.onSubmit;
    if (!event?.metaKey && !event?.ctrlKey) {
      return;
    }
    if (event.key !== "Enter") {
      return;
    }
    event.preventDefault();
    if (typeof onSubmit === "function") {
      onSubmit();
    }
  }

  runtime.replyComposeUtils = {
    insertReplyText,
    buildReplyTargetLabel,
    setReplyTarget,
    handleReplyTextareaKeydown
  };
})();
