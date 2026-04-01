(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function normalizeBiliEmojiShortcode(value) {
    const text = String(value || "").trim().toLowerCase();
    if (!text) {
      return "";
    }
    const matched = text.match(/^:?(bili_\d{3}):?$/i);
    return matched ? matched[1].toLowerCase() : "";
  }

  function collectBiliEmojiItemsFromDocument(options = {}) {
    const documentRef = options.documentRef || globalThis.document;
    const ImageClass = options.ImageClass || globalThis.HTMLImageElement;
    const normalizeIconUrl = options.normalizeIconUrl;
    const normalizeShortcode = options.normalizeBiliEmojiShortcode || normalizeBiliEmojiShortcode;
    const biliEmojiShortcodePrefix = options.biliEmojiShortcodePrefix || "bili_";
    const biliEmojiIconUrls = options.biliEmojiIconUrls || {};
    if (!documentRef || typeof normalizeIconUrl !== "function") {
      return [];
    }

    const map = new Map();
    const selector = ".emoji-picker__section-emojis img.emoji[data-emoji]";
    for (const node of documentRef.querySelectorAll(selector)) {
      if (!(node instanceof ImageClass)) {
        continue;
      }
      const shortcode = normalizeShortcode(node.dataset.emoji || node.getAttribute("data-emoji"));
      if (!shortcode || !shortcode.startsWith(biliEmojiShortcodePrefix)) {
        continue;
      }
      const titleShortcode = normalizeShortcode(node.title);
      const name = titleShortcode || shortcode;
      const src = normalizeIconUrl(node.currentSrc || node.src || "");
      if (!map.has(name)) {
        map.set(name, {
          shortcode: name,
          src
        });
      } else if (src) {
        map.get(name).src = src;
      }
    }
    for (const [shortcode, src] of Object.entries(biliEmojiIconUrls)) {
      if (!map.has(shortcode)) {
        map.set(shortcode, { shortcode, src: normalizeIconUrl(src) });
      } else if (!map.get(shortcode).src) {
        map.get(shortcode).src = normalizeIconUrl(src);
      }
    }
    return Array.from(map.values()).sort((a, b) => a.shortcode.localeCompare(b.shortcode, "en"));
  }

  function buildFallbackBiliEmojiItems(options = {}) {
    const normalizeIconUrl = options.normalizeIconUrl;
    const fallbackCount = Number(options.biliEmojiFallbackCount || 120);
    const shortcodePrefix = options.biliEmojiShortcodePrefix || "bili_";
    const biliEmojiIconUrls = options.biliEmojiIconUrls || {};
    if (typeof normalizeIconUrl !== "function") {
      return [];
    }

    const fallback = [];
    for (let index = 1; index <= fallbackCount; index += 1) {
      const suffix = String(index).padStart(3, "0");
      const shortcode = `${shortcodePrefix}${suffix}`;
      fallback.push({
        shortcode,
        src: normalizeIconUrl(biliEmojiIconUrls[shortcode] || "")
      });
    }
    return fallback;
  }

  function ensureReplyEmojiItemsLoaded(state, options = {}) {
    if (!state || typeof state !== "object") {
      return;
    }
    if (state.replyEmojiLoaded) {
      return;
    }
    const collectFn = options.collectBiliEmojiItemsFromDocument;
    const fallbackFn = options.buildFallbackBiliEmojiItems;
    if (typeof collectFn !== "function" || typeof fallbackFn !== "function") {
      return;
    }
    const items = collectFn();
    state.replyEmojiItems = items.length ? items : fallbackFn();
    state.replyEmojiLoaded = true;
  }

  function renderReplyEmojiGrid(state, options = {}) {
    if (!state || typeof state !== "object") {
      return;
    }
    const grid = state.replyEmojiGrid;
    const HTMLElementClass = options.HTMLElementClass || globalThis.HTMLElement;
    if (!(grid instanceof HTMLElementClass)) {
      return;
    }

    const normalizeShortcode = options.normalizeBiliEmojiShortcode || normalizeBiliEmojiShortcode;
    const documentRef = options.documentRef || globalThis.document;
    if (!documentRef) {
      return;
    }
    grid.replaceChildren();
    const fragment = documentRef.createDocumentFragment();
    for (const item of state.replyEmojiItems || []) {
      const shortcode = normalizeShortcode(item?.shortcode);
      if (!shortcode) {
        continue;
      }
      const button = documentRef.createElement("button");
      button.type = "button";
      button.className = "ld-reply-emoji-item";
      button.dataset.shortcode = shortcode;
      button.setAttribute("aria-label", `插入 :${shortcode}:`);
      button.title = `:${shortcode}:`;
      if (item?.src) {
        const img = documentRef.createElement("img");
        img.className = "ld-reply-emoji-img";
        img.width = 28;
        img.height = 28;
        img.loading = "lazy";
        img.decoding = "async";
        img.alt = shortcode;
        img.src = item.src;
        button.appendChild(img);
      } else {
        const text = documentRef.createElement("span");
        text.className = "ld-reply-emoji-fallback";
        text.textContent = `:${shortcode}:`;
        button.appendChild(text);
      }
      fragment.appendChild(button);
    }
    grid.appendChild(fragment);
  }

  runtime.replyEmojiUtils = {
    normalizeBiliEmojiShortcode,
    collectBiliEmojiItemsFromDocument,
    buildFallbackBiliEmojiItems,
    ensureReplyEmojiItemsLoaded,
    renderReplyEmojiGrid
  };
})();
