(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function clampDrawerWidth(value, options = {}) {
    const defaultDrawerWidthCustom = options.defaultDrawerWidthCustom ?? 1080;
    const viewportWidth = options.viewportWidth ?? globalThis.window?.innerWidth ?? 0;

    if (typeof runtime.drawerUtils?.clampDrawerWidth === "function") {
      return runtime.drawerUtils.clampDrawerWidth(value, {
        defaultDrawerWidthCustom,
        viewportWidth
      });
    }

    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return defaultDrawerWidthCustom;
    }
    return Math.max(420, Math.round(numeric));
  }

  function loadSettingsSafe(options = {}) {
    const settingsUtils = runtime.settingsUtils;
    const defaultSettings = options.defaultSettings || {};

    if (typeof settingsUtils?.loadSettings !== "function") {
      return { ...defaultSettings };
    }

    return settingsUtils.loadSettings(options);
  }

  runtime.settingsBootstrapUtils = {
    clampDrawerWidth,
    loadSettingsSafe
  };
})();
