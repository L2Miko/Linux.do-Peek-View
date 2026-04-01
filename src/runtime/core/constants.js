(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  runtime.constants = Object.freeze({
    ROOT_ID: "ld-drawer-root",
    PAGE_OPEN_CLASS: "ld-drawer-page-open",
    PAGE_IFRAME_OPEN_CLASS: "ld-drawer-page-iframe-open",
    ACTIVE_LINK_CLASS: "ld-drawer-topic-link-active",
    IFRAME_MODE_CLASS: "ld-drawer-iframe-mode",
    SETTINGS_KEY: "ld-drawer-settings-v1",
    LOAD_MORE_TRIGGER_OFFSET: 240,
    IMAGE_PREVIEW_SCALE_MIN: 1,
    IMAGE_PREVIEW_SCALE_MAX: 4,
    IMAGE_PREVIEW_SCALE_STEP: 0.2,
    IMAGE_PREVIEW_DRAG_THRESHOLD_PX: 3,
    JUMP_BACK_BUTTON_DURATION_MS: 10000,
    REPLY_UPLOAD_MARKER: "\u2063",
    REACTION_OPTIONS_CACHE_KEY: "ld-drawer-reaction-options-cache-v1",
    DEFAULT_SETTINGS: Object.freeze({
      drawerWidth: "medium",
      drawerWidthCustom: 1080
    }),
    DRAWER_WIDTHS: Object.freeze({
      narrow: "clamp(640px, 66vw, 1180px)",
      medium: "clamp(820px, 78vw, 1500px)",
      wide: "clamp(980px, 88vw, 1720px)"
    }),
    LIST_ROW_SELECTOR: [
      "tr.topic-list-item",
      ".topic-list-item",
      ".latest-topic-list-item",
      "tbody.topic-list-body tr"
    ].join(", "),
    PRIMARY_TOPIC_LINK_SELECTOR: [
      "a.title",
      ".main-link a.raw-topic-link",
      ".main-link a.title",
      ".search-link",
      ".search-result-topic a",
      ".user-stream .title a",
      ".user-main .item .title a"
    ].join(", "),
    ENTRY_CONTAINER_SELECTOR: [
      "tr.topic-list-item",
      ".topic-list-item",
      ".latest-topic-list-item",
      "tbody.topic-list-body tr",
      ".search-result",
      ".fps-result",
      ".user-stream .item",
      ".user-main .item"
    ].join(", "),
    MAIN_CONTENT_SELECTOR: "#main-outlet",
    EXCLUDED_LINK_CONTEXT_SELECTOR: [
      ".cooked",
      ".topic-post",
      ".topic-body",
      ".topic-map",
      ".timeline-container",
      "#reply-control",
      ".d-editor-container",
      ".composer-popup",
      ".select-kit",
      ".modal",
      ".menu-panel",
      ".popup-menu",
      ".user-card",
      ".group-card"
    ].join(", ")
  });
})();
