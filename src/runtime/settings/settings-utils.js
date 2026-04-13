(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function isTypingTarget(target) {
    return target instanceof HTMLElement && (
      target.isContentEditable ||
      target.matches("input, textarea, select") ||
      Boolean(target.closest("input, textarea, select, [contenteditable='true']"))
    );
  }

  function loadSettings(options = {}) {
    const {
      settingsKey,
      defaultSettings = {},
      drawerWidths = {},
      clampDrawerWidth
    } = options;

    try {
      const saved = JSON.parse(localStorage.getItem(settingsKey) || "null");
      const settings = {
        ...defaultSettings,
        ...(saved && typeof saved === "object" ? saved : {})
      };

      if (!(settings.drawerWidth in drawerWidths) && settings.drawerWidth !== "custom") {
        settings.drawerWidth = defaultSettings.drawerWidth;
      }

      if (settings.drawerWidth !== "custom" && settings.drawerWidth in drawerWidths) {
        settings.drawerWidthCustom = drawerWidths[settings.drawerWidth];
        settings.drawerWidth = "custom";
      }

      settings.drawerWidthCustom = typeof clampDrawerWidth === "function"
        ? clampDrawerWidth(settings.drawerWidthCustom)
        : settings.drawerWidthCustom;
      return settings;
    } catch {
      return { ...defaultSettings };
    }
  }

  function saveSettings(settingsKey, settings) {
    localStorage.setItem(settingsKey, JSON.stringify(settings));
  }

  runtime.settingsUtils = {
    isTypingTarget,
    loadSettings,
    saveSettings
  };
})();
