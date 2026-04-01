(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function buildComposerImageMarkdown(upload, uploadUrl, deps = {}) {
    const { markdownNameFromFileName } = deps;
    const resolveName = typeof markdownNameFromFileName === "function"
      ? markdownNameFromFileName
      : (value) => String(value || "image").replace(/[\[\]|]/g, "");

    const altText = resolveName(upload?.original_filename || "image.png");
    const width = Number(upload?.thumbnail_width || upload?.width || 0);
    const height = Number(upload?.thumbnail_height || upload?.height || 0);
    const sizeSegment = width > 0 && height > 0
      ? `|${width}x${height}`
      : "";

    return `![${altText}${sizeSegment}](${uploadUrl})`;
  }

  function buildComposerUploadMarkdown(upload, deps = {}) {
    const { isImageUploadName, buildComposerImageMarkdown: buildImage } = deps;
    const fileName = upload?.original_filename || "image.png";
    const uploadUrl = upload?.short_url || upload?.url || "";
    if (!uploadUrl) {
      throw new Error("上传成功但未返回可用图片地址");
    }

    if (typeof isImageUploadName === "function" && isImageUploadName(fileName)) {
      const imageBuilder = typeof buildImage === "function" ? buildImage : buildComposerImageMarkdown;
      return imageBuilder(upload, uploadUrl, deps);
    }

    return `[${fileName}|attachment](${uploadUrl})`;
  }

  runtime.composerMarkdownUtils = {
    buildComposerUploadMarkdown,
    buildComposerImageMarkdown
  };
})();
