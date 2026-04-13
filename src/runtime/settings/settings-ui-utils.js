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

    const drawerWidthValue = Number(state.settings.drawerWidthCustom);
    const slider = state.settingsPanel.querySelector('[data-setting="drawerWidthCustom"]');
    if (slider) {
      slider.value = String(drawerWidthValue);
    }
  }

  function handleSettingsChange(state, event, options = {}) {
    const HTMLInputElementClass = options.HTMLInputElementClass || globalThis.HTMLInputElement;
    const HTMLSelectElementClass = options.HTMLSelectElementClass || globalThis.HTMLSelectElement;
    const saveSettings = options.saveSettings;
    const applyDrawerWidth = options.applyDrawerWidth;
    const setSettingsPanelOpen = options.setSettingsPanelOpen;
    const refreshCurrentView = options.refreshCurrentView;
    if (
      !state
      || !(
        event?.target instanceof HTMLInputElementClass
        || event?.target instanceof HTMLSelectElementClass
      )
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

    state.settings[key] = key === "drawerWidthCustom"
      ? Number(target.value)
      : target.value;
    saveSettings();

    if (key === "drawerWidth") {
      applyDrawerWidth();
      syncSettingsUI(state);
      setSettingsPanelOpen(false);
      return;
    }

    if (key === "drawerWidthCustom") {
      state.settings.drawerWidth = "custom";
      applyDrawerWidth();
      syncSettingsUI(state);
      return;
    }

    refreshCurrentView();
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
    const updateSettingsPopoverPosition = options.updateSettingsPopoverPosition;
    const documentRef = options.documentRef || globalThis.document;
    if (!state || typeof clampDrawerWidth !== "function" || !documentRef?.documentElement || typeof updateSettingsPopoverPosition !== "function") {
      return;
    }

    state.settings.drawerWidth = "custom";
    state.settings.drawerWidthCustom = clampDrawerWidth(state.settings.drawerWidthCustom);
    const width = `${state.settings.drawerWidthCustom}px`;

    documentRef.documentElement.style.setProperty("--ld-drawer-width", width);
    updateSettingsPopoverPosition();
  }

  function updateSettingsPopoverPosition(state, options = {}) {
    if (!state?.header || !state?.settingsPanel || !state?.root || !state?.settingsCard) {
      return;
    }

    const lockPosition = options.lockPosition === true;
    const panelRect = state.settingsPanel.getBoundingClientRect();
    const cardWidth = state.settingsCard.offsetWidth || 240;
    const naturalLeft = panelRect.right - cardWidth;
    const naturalTop = panelRect.bottom + 10;

    if (lockPosition || !Number.isFinite(state.settingsPopoverLockedLeft) || !Number.isFinite(state.settingsPopoverLockedTop)) {
      state.settingsPopoverLockedLeft = naturalLeft;
      state.settingsPopoverLockedTop = naturalTop;
    }

    const shiftX = state.settingsPopoverLockedLeft - naturalLeft;
    const shiftY = state.settingsPopoverLockedTop - naturalTop;
    state.settingsCard.style.setProperty("--ld-settings-card-shift-x", `${shiftX}px`);
    state.settingsCard.style.setProperty("--ld-settings-card-shift-y", `${shiftY}px`);
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

    state.settings.drawerWidth = "custom";
    state.settings.drawerWidthCustom = clampDrawerWidth(state.settings.drawerWidthCustom);
    applyDrawerWidth();
    saveSettings();

    if (!state.imagePreview?.hidden) {
      clampImagePreviewOffsets();
      applyImagePreviewScale();
    }
  }

  runtime.settingsUiUtils = {
    syncSettingsUI,
    handleSettingsChange,
    resetSettings,
    applyDrawerWidth,
    updateSettingsPopoverPosition,
    handleWindowResize
  };
})();
