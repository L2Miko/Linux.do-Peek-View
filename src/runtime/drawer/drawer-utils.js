(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function buildAutoLoadProgressHintText(loadedCount, totalCount, done, options = {}) {
    const firstPostNumber = Number(options.firstPostNumber);
    const lastPostNumber = Number(options.lastPostNumber);
    const hasHiddenEarlier = options.hasHiddenEarlier === true;
    const hasRange = Number.isFinite(firstPostNumber)
      && Number.isFinite(lastPostNumber)
      && firstPostNumber > 0
      && lastPostNumber >= firstPostNumber;
    const rangeText = hasRange
      ? (firstPostNumber === lastPostNumber ? `#${firstPostNumber}` : `#${firstPostNumber}-#${lastPostNumber}`)
      : "";

    if (done) {
      if (hasHiddenEarlier) {
        if (rangeText) {
          return `当前窗口已加载到最新回复（${rangeText}，${loadedCount} / ${totalCount}）。`;
        }
        return `当前窗口已加载到最新回复（${loadedCount} / ${totalCount}）。`;
      }
      return `已加载完当前主题内容（${totalCount} / ${totalCount}）`;
    }

    if (rangeText) {
      return `当前窗口已加载 ${rangeText}（${loadedCount} / ${totalCount}），继续下滑会自动加载后续回复。`;
    }

    return `当前已加载 ${loadedCount} / ${totalCount} 条帖子，继续下滑会自动加载更多回复。`;
  }

  function clampDrawerWidth(value, options = {}) {
    const {
      defaultDrawerWidthCustom = 1080,
      viewportWidth = globalThis.window?.innerWidth || 0
    } = options;

    const numeric = Number(value);
    const maxWidth = Math.min(1400, Math.max(420, viewportWidth - 40));
    const minWidth = Math.min(760, maxWidth);

    if (!Number.isFinite(numeric)) {
      return Math.min(Math.max(defaultDrawerWidthCustom, minWidth), maxWidth);
    }

    return Math.min(Math.max(Math.round(numeric), minWidth), maxWidth);
  }

  runtime.drawerUtils = {
    buildAutoLoadProgressHintText,
    clampDrawerWidth
  };
})();
