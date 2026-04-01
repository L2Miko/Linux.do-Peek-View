(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function clampScale(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || min));
  }

  function looksLikeImageUrl(url) {
    try {
      const parsed = new URL(url, location.href);
      return /\.(avif|bmp|gif|jpe?g|png|svg|webp)(?:$|[?#])/i.test(parsed.pathname);
    } catch {
      return false;
    }
  }

  function getPreviewImageSrc(image) {
    if (!(image instanceof HTMLImageElement)) {
      return "";
    }

    const link = image.closest("a[href]");
    if (link instanceof HTMLAnchorElement && looksLikeImageUrl(link.href)) {
      return link.href;
    }

    return image.currentSrc || image.src || "";
  }

  runtime.imagePreviewUtils = {
    clampScale,
    getPreviewImageSrc
  };
})();
