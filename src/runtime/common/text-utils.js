(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function escapeHtmlAttribute(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  function sanitizeReplyUploadFileName(fileName) {
    return String(fileName || "image.png")
      .replace(/\s+/g, " ")
      .trim();
  }

  function markdownNameFromFileName(fileName) {
    const normalized = String(fileName || "").trim();
    const dotIndex = normalized.lastIndexOf(".");
    const baseName = dotIndex > 0
      ? normalized.slice(0, dotIndex)
      : normalized;

    return (baseName || "image").replace(/[\[\]|]/g, "");
  }

  function isImageUploadName(fileName) {
    return /\.(avif|bmp|gif|jpe?g|png|svg|webp)$/i.test(String(fileName || ""));
  }

  function formatDate(value) {
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(value));
    } catch {
      return value;
    }
  }

  runtime.textUtils = {
    escapeHtmlAttribute,
    sanitizeReplyUploadFileName,
    markdownNameFromFileName,
    isImageUploadName,
    formatDate
  };
})();

