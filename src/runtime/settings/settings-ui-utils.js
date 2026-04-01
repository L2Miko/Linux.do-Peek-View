(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function syncSettingsUI(state) {
    if (!state?.settingsPanel) {
      return;
    }

    for (const control of state.settingsPanel.querySelectorAll("[data-setting]")) {
      const key = control.dataset.setting;
      if (key && key in state.settings) {
        control.value = state.settings[key];
      }
    }

    for (const button of state.settingsPanel.querySelectorAll("[data-drawer-width-option]")) {
      const isActive = button.dataset.drawerWidthOption === state.settings.drawerWidth;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-checked", String(isActive));
    }
  }

  function handleSettingsChange(state, event, options = {}) {
    const HTMLSelectElementClass = options.HTMLSelectElementClass || globalThis.HTMLSelectElement;
    const saveSettings = options.saveSettings;
    const applyDrawerWidth = options.applyDrawerWidth;
    const setSettingsPanelOpen = options.setSettingsPanelOpen;
    const refreshCurrentView = options.refreshCurrentView;
    if (
      !state
      || !(event?.target instanceof HTMLSelectElementClass)
      || typeof saveSettings !== "function"
      || typeof applyDrawerWidth !== "function"
      || typeof setSettingsPanelOpen !== "function"
      || typeof refreshCurrentView !== "function"
    ) {
      return;
    }

    const target = event.target;
    const key = target.dataset.setting;
    if (!key || !(key in state.settings)) {
      return;
    }

    state.settings[key] = target.value;
    saveSettings();

    if (key === "drawerWidth") {
      applyDrawerWidth();
      syncSettingsUI(state);
      setSettingsPanelOpen(false);
      return;
    }

    refreshCurrentView();
    setSettingsPanelOpen(false);
  }

  function handleSettingsOptionClick(state, event, options = {}) {
    const HTMLButtonElementClass = options.HTMLButtonElementClass || globalThis.HTMLButtonElement;
    const saveSettings = options.saveSettings;
    const applyDrawerWidth = options.applyDrawerWidth;
    const setSettingsPanelOpen = options.setSettingsPanelOpen;
    if (
      !state
      || typeof saveSettings !== "function"
      || typeof applyDrawerWidth !== "function"
      || typeof setSettingsPanelOpen !== "function"
    ) {
      return;
    }

    const target = event?.target instanceof HTMLButtonElementClass
      ? event.target
      : event?.target?.closest?.("[data-drawer-width-option]");
    if (!(target instanceof HTMLButtonElementClass)) {
      return;
    }

    const value = target.dataset.drawerWidthOption;
    if (!value || value === state.settings.drawerWidth) {
      setSettingsPanelOpen(false);
      return;
    }

    state.settings.drawerWidth = value;
    saveSettings();
    applyDrawerWidth();
    syncSettingsUI(state);
    setSettingsPanelOpen(false);
  }

  function resetSettings(state, options = {}) {
    const defaultSettings = options.defaultSettings || {};
    const syncSettingsUI = options.syncSettingsUI;
    const saveSettings = options.saveSettings;
    const applyDrawerWidth = options.applyDrawerWidth;
    const refreshCurrentView = options.refreshCurrentView;
    const setSettingsPanelOpen = options.setSettingsPanelOpen;
    if (
      !state
      || typeof syncSettingsUI !== "function"
      || typeof saveSettings !== "function"
      || typeof applyDrawerWidth !== "function"
      || typeof refreshCurrentView !== "function"
      || typeof setSettingsPanelOpen !== "function"
    ) {
      return;
    }

    state.settings = { ...defaultSettings };
    syncSettingsUI();
    saveSettings();
    applyDrawerWidth();
    refreshCurrentView();
    setSettingsPanelOpen(false);
  }

  function applyDrawerWidth(state, options = {}) {
    const clampDrawerWidth = options.clampDrawerWidth;
    const drawerWidths = options.drawerWidths || {};
    const updateSettingsPopoverPosition = options.updateSettingsPopoverPosition;
    const documentRef = options.documentRef || globalThis.document;
    if (!state || typeof clampDrawerWidth !== "function" || !documentRef?.documentElement || typeof updateSettingsPopoverPosition !== "function") {
      return;
    }

    const width = state.settings.drawerWidth === "custom"
      ? `${clampDrawerWidth(state.settings.drawerWidthCustom)}px`
      : (drawerWidths[state.settings.drawerWidth] || drawerWidths.medium);

    documentRef.documentElement.style.setProperty("--ld-drawer-width", width);
    updateSettingsPopoverPosition();
  }

  function updateSettingsPopoverPosition(state) {
    if (!state?.header || !state?.settingsPanel || !state?.root) {
      return;
    }
    state.root.style.setProperty("--ld-settings-top", `${state.header.offsetHeight + 8}px`);
  }

  function handleWindowResize(state, options = {}) {
    const clampDrawerWidth = options.clampDrawerWidth;
    const applyDrawerWidth = options.applyDrawerWidth;
    const saveSettings = options.saveSettings;
    const updateSettingsPopoverPosition = options.updateSettingsPopoverPosition;
    const clampImagePreviewOffsets = options.clampImagePreviewOffsets;
    const applyImagePreviewScale = options.applyImagePreviewScale;
    if (
      !state
      || typeof clampDrawerWidth !== "function"
      || typeof applyDrawerWidth !== "function"
      || typeof saveSettings !== "function"
      || typeof updateSettingsPopoverPosition !== "function"
      || typeof clampImagePreviewOffsets !== "function"
      || typeof applyImagePreviewScale !== "function"
    ) {
      return;
    }

    if (state.settings.drawerWidth === "custom") {
      state.settings.drawerWidthCustom = clampDrawerWidth(state.settings.drawerWidthCustom);
      applyDrawerWidth();
      saveSettings();
    } else {
      updateSettingsPopoverPosition();
    }

    if (!state.imagePreview?.hidden) {
      clampImagePreviewOffsets();
      applyImagePreviewScale();
    }
  }

  runtime.settingsUiUtils = {
    syncSettingsUI,
    handleSettingsChange,
    handleSettingsOptionClick,
    resetSettings,
    applyDrawerWidth,
    updateSettingsPopoverPosition,
    handleWindowResize
  };
})();
