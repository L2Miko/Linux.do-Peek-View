(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function setSettingsPanelOpen(state, isOpen, options = {}) {
    if (!state?.settingsPanel || !state?.settingsToggle) {
      return;
    }

    const updateSettingsPopoverPosition = options.updateSettingsPopoverPosition;
    const queueMicrotaskFn = options.queueMicrotaskFn || globalThis.queueMicrotask;
    const focusOnOpen = options.focusOnOpen === true;
    if (isOpen) {
      if (typeof updateSettingsPopoverPosition === "function") {
        updateSettingsPopoverPosition();
      }
      if (focusOnOpen && typeof queueMicrotaskFn === "function") {
        queueMicrotaskFn(() => state.settingsCard?.querySelector(".ld-setting-option")?.focus());
      }
    }

    state.settingsPanel.classList.toggle("is-open", Boolean(isOpen));
    state.settingsPanel.dataset.open = isOpen ? "true" : "false";
    state.settingsToggle.setAttribute("aria-expanded", String(isOpen));
  }

  function toggleSettingsPanel(state, options = {}) {
    if (!state?.settingsPanel) {
      return;
    }
    const setSettingsPanelOpenFn = options.setSettingsPanelOpen;
    if (typeof setSettingsPanelOpenFn !== "function") {
      return;
    }
    setSettingsPanelOpenFn(state.settingsPanel.dataset.open !== "true");
  }

  function handleSettingsPanelClick(state, event, options = {}) {
    const setSettingsPanelOpenFn = options.setSettingsPanelOpen;
    if (event?.target === state?.settingsPanel && typeof setSettingsPanelOpenFn === "function") {
      setSettingsPanelOpenFn(false);
    }
  }

  runtime.settingsPanelUtils = {
    setSettingsPanelOpen,
    toggleSettingsPanel,
    handleSettingsPanelClick
  };
})();
