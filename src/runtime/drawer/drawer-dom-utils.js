(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function ensureDrawer(state, options = {}) {
    if (state.root) {
      return;
    }

    const documentRef = options.documentRef || globalThis.document;
    const rootId = options.rootId || "ld-drawer-root";
    const root = documentRef.createElement("aside");
    root.id = rootId;
    root.setAttribute("aria-hidden", "true");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("role", "dialog");
    root.innerHTML = `
      <div class="ld-drawer-shell">
        <div class="ld-drawer-header">
          <div class="ld-drawer-title-group">
            <h2 class="ld-drawer-title">点击帖子标题开始预览</h2>
          </div>
          <div class="ld-drawer-toolbar">
            <div class="ld-drawer-meta"></div>
            <div class="ld-drawer-actions">
              <div class="ld-drawer-settings" id="ld-drawer-settings" data-open="false">
                <button class="ld-drawer-settings-toggle" type="button" aria-expanded="false" aria-controls="ld-drawer-settings-menu" aria-haspopup="dialog">宽度</button>
                <div class="ld-drawer-settings-card" id="ld-drawer-settings-menu" role="group" aria-label="预览宽度调节">
                  <label class="ld-drawer-width-control" for="ld-drawer-width-slider">
                    <span class="ld-drawer-width-slider-shell">
                      <input
                        class="ld-drawer-width-slider"
                        id="ld-drawer-width-slider"
                        type="range"
                        min="760"
                        max="1400"
                        step="1"
                        value="1080"
                        data-setting="drawerWidthCustom"
                        aria-label="调节预览宽度"
                      />
                    </span>
                  </label>
                </div>
              </div>
              <a class="ld-drawer-link" href="https://linux.do/latest" target="_blank" rel="noopener noreferrer">新标签打开</a>
            </div>
          </div>
        </div>
        <div class="ld-drawer-body">
          <div class="ld-drawer-content"></div>
        </div>
        <button class="ld-drawer-reply-fab" type="button" aria-expanded="false" aria-controls="ld-drawer-reply-panel" aria-label="回复这个主题" title="回复这个主题">
          <span class="ld-drawer-reply-fab-icon" aria-hidden="true">
            <svg class="fa d-icon d-icon-reply svg-icon fa-fw svg-string" viewBox="0 0 24 24" focusable="false">
              <path d="M9 5.75a.75.75 0 0 0-1.28-.53l-5 5a.75.75 0 0 0 0 1.06l5 5A.75.75 0 0 0 9 15.75V12.5h8a3 3 0 0 1 3 3v2.75a.75.75 0 0 0 1.5 0V15.5A4.5 4.5 0 0 0 17 11H9V7.75Z" fill="currentColor"></path>
            </svg>
          </span>
          <span class="ld-drawer-reply-fab-label">回复</span>
        </button>
        <button class="ld-drawer-jump-first-post" type="button" aria-label="快速跳转到首贴" title="快速跳转到首贴" hidden>
          <span class="ld-drawer-jump-first-post-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" focusable="false">
              <path d="M12 5.75a1.5 1.5 0 0 1 1.06.44l5.25 5.25a1.5 1.5 0 1 1-2.12 2.12L13.5 10.87V18a1.5 1.5 0 0 1-3 0v-7.13L7.81 13.56a1.5 1.5 0 1 1-2.12-2.12l5.25-5.25A1.5 1.5 0 0 1 12 5.75Z" fill="currentColor"></path>
            </svg>
          </span>
          <span class="ld-drawer-jump-first-post-label">首贴</span>
        </button>
        <div class="ld-drawer-reply-panel" id="ld-drawer-reply-panel" hidden>
          <textarea class="ld-reply-textarea" rows="7" placeholder="写点什么... 支持 Markdown，可直接粘贴图片自动上传。Ctrl+Enter 或 Cmd+Enter 可发送"></textarea>
          <div class="ld-reply-status" aria-live="polite"></div>
          <div class="ld-reply-actions">
            <div class="ld-reply-tools">
              <button class="ld-reply-emoji-toggle" type="button" aria-expanded="false" aria-controls="ld-reply-emoji-panel">表情</button>
              <div class="ld-reply-emoji-panel" id="ld-reply-emoji-panel" hidden>
                <div class="ld-reply-emoji-grid" role="listbox" aria-label="插入 bili 表情"></div>
              </div>
            </div>
            <button class="ld-reply-action ld-reply-action-primary" type="button" data-action="submit">发送</button>
          </div>
        </div>
        <div class="ld-image-preview" hidden aria-hidden="true">
          <button class="ld-image-preview-close" type="button" aria-label="关闭图片预览">关闭</button>
          <div class="ld-image-preview-stage">
            <img class="ld-image-preview-image" alt="图片预览" />
          </div>
        </div>
      </div>
    `;

    documentRef.body.appendChild(root);

    state.root = root;
    state.header = root.querySelector(".ld-drawer-header");
    state.title = root.querySelector(".ld-drawer-title");
    state.meta = root.querySelector(".ld-drawer-meta");
    state.drawerBody = root.querySelector(".ld-drawer-body");
    state.content = root.querySelector(".ld-drawer-content");
    state.replyButton = root.querySelector(".ld-drawer-reply-fab");
    state.jumpFirstPostButton = root.querySelector(".ld-drawer-jump-first-post");
    state.replyPanel = root.querySelector(".ld-drawer-reply-panel");
    state.replyPanelTitle = root.querySelector(".ld-reply-panel-title");
    state.replyTextarea = root.querySelector(".ld-reply-textarea");
    state.replySubmitButton = root.querySelector('[data-action="submit"]');
    state.replyCancelButton = root.querySelector('[data-action="cancel"]');
    state.replyEmojiToggleButton = root.querySelector(".ld-reply-emoji-toggle");
    state.replyEmojiPanel = root.querySelector(".ld-reply-emoji-panel");
    state.replyEmojiGrid = root.querySelector(".ld-reply-emoji-grid");
    state.replyStatus = root.querySelector(".ld-reply-status");
    state.imagePreview = root.querySelector(".ld-image-preview");
    state.imagePreviewStage = root.querySelector(".ld-image-preview-stage");
    state.imagePreviewImage = root.querySelector(".ld-image-preview-image");
    state.imagePreviewCloseButton = root.querySelector(".ld-image-preview-close");
    state.openInTab = root.querySelector(".ld-drawer-link");
    state.settingsPanel = root.querySelector(".ld-drawer-settings");
    state.settingsCard = root.querySelector(".ld-drawer-settings-card");
    state.settingsToggle = root.querySelector(".ld-drawer-settings-toggle");
    let settingsCloseTimer = 0;
    const clearSettingsCloseTimer = () => {
      if (settingsCloseTimer) {
        clearTimeout(settingsCloseTimer);
        settingsCloseTimer = 0;
      }
    };
    const scheduleSettingsClose = () => {
      clearSettingsCloseTimer();
      settingsCloseTimer = globalThis.setTimeout(() => {
        settingsCloseTimer = 0;
        options.setSettingsPanelOpen(false);
      }, 220);
    };

    state.settingsToggle.addEventListener("click", options.toggleSettingsPanel);
    state.settingsPanel.addEventListener("mouseenter", () => {
      clearSettingsCloseTimer();
      options.setSettingsPanelOpen(true);
    });
    state.settingsPanel.addEventListener("mouseleave", scheduleSettingsClose);
    state.settingsPanel.addEventListener("focusin", () => {
      clearSettingsCloseTimer();
      options.setSettingsPanelOpen(true);
    });
    state.settingsPanel.addEventListener("focusout", (event) => {
      if (!state.settingsPanel.contains(event.relatedTarget)) {
        scheduleSettingsClose();
      }
    });
    state.replyButton.addEventListener("click", options.toggleReplyPanel);
    state.jumpFirstPostButton?.addEventListener("click", options.handleJumpToFirstPostClick);
    state.replyCancelButton?.addEventListener("click", () => options.setReplyPanelOpen(false));
    state.replySubmitButton.addEventListener("click", options.handleReplySubmit);
    state.replyTextarea.addEventListener("keydown", options.handleReplyTextareaKeydown);
    state.replyTextarea.addEventListener("paste", options.handleReplyTextareaPaste);
    state.replyEmojiToggleButton?.addEventListener("click", options.handleReplyEmojiToggleClick);
    state.replyEmojiGrid?.addEventListener("click", options.handleReplyEmojiGridClick);
    root.addEventListener("click", options.handleDrawerRootClick);
    root.addEventListener("wheel", options.handleDrawerRootWheel, { passive: false });
    state.imagePreviewStage?.addEventListener("pointerdown", options.handleImagePreviewPointerDown);
    root.addEventListener("pointermove", options.handleImagePreviewPointerMove, { passive: false });
    root.addEventListener("pointerup", options.handleImagePreviewPointerEnd);
    root.addEventListener("pointercancel", options.handleImagePreviewPointerEnd);
    state.drawerBody.addEventListener("scroll", options.handleDrawerBodyScroll, { passive: true });
    state.settingsPanel.addEventListener("input", options.handleSettingsChange);
    options.syncSettingsUI();
    options.applyDrawerWidth();
    options.syncReplyUI();
    options.syncDrawerHeaderLiquidState(true);
    options.updateSettingsPopoverPosition();
  }

  runtime.drawerDomUtils = {
    ensureDrawer
  };
})();
