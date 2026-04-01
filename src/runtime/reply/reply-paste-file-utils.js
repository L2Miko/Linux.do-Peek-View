(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function mimeTypeToFileExtension(mimeType) {
    const normalized = String(mimeType || "").toLowerCase();
    if (normalized === "image/jpeg") {
      return "jpg";
    }
    if (normalized === "image/svg+xml") {
      return "svg";
    }

    const match = normalized.match(/^image\/([a-z0-9.+-]+)$/i);
    if (!match) {
      return "png";
    }
    return match[1].replace("svg+xml", "svg");
  }

  function resolveReplyUploadFileName(file, options = {}) {
    const mimeTypeToFileExtensionFn = options.mimeTypeToFileExtension || mimeTypeToFileExtension;
    const originalName = typeof file?.name === "string"
      ? file.name.trim()
      : "";
    if (originalName) {
      return originalName;
    }
    return `image.${mimeTypeToFileExtensionFn(file?.type)}`;
  }

  function normalizeReplyUploadFile(file, options = {}) {
    const BlobClass = options.BlobClass || globalThis.Blob;
    const FileClass = options.FileClass || globalThis.File;
    const now = options.now || Date.now;
    const resolveReplyUploadFileNameFn = options.resolveReplyUploadFileName || resolveReplyUploadFileName;
    if (!(file instanceof BlobClass)) {
      return null;
    }

    const fileName = resolveReplyUploadFileNameFn(file);
    if (file instanceof FileClass && file.name) {
      return file;
    }

    if (typeof FileClass === "function") {
      return new FileClass([file], fileName, {
        type: file.type || "image/png",
        lastModified: file instanceof FileClass ? file.lastModified : now()
      });
    }

    try {
      file.name = fileName;
    } catch {
      // ignore readonly name
    }
    return file;
  }

  function getReplyPasteImageFiles(event, options = {}) {
    const normalizeReplyUploadFileFn = options.normalizeReplyUploadFile || normalizeReplyUploadFile;
    const isImageUploadName = options.isImageUploadName;
    const FileClass = options.FileClass || globalThis.File;
    const clipboardData = event?.clipboardData;
    if (!clipboardData || typeof isImageUploadName !== "function") {
      return [];
    }

    const types = Array.from(clipboardData.types || []);
    if (types.includes("text/plain") || types.includes("text/html")) {
      return [];
    }

    return Array.from(clipboardData.files || [])
      .map(normalizeReplyUploadFileFn)
      .filter((file) => file instanceof FileClass && (
        String(file.type || "").toLowerCase().startsWith("image/")
        || isImageUploadName(file.name || "")
      ));
  }

  runtime.replyPasteFileUtils = {
    mimeTypeToFileExtension,
    resolveReplyUploadFileName,
    normalizeReplyUploadFile,
    getReplyPasteImageFiles
  };
})();
