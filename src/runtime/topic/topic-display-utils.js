(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function normalizeUsername(value) {
    return String(value || "").trim().toLowerCase();
  }

  function resolveTopicAuthorUserId(topic, getFirstTopicPost) {
    const createdById = Number(topic?.created_by?.id);
    if (Number.isFinite(createdById)) {
      return createdById;
    }
    if (typeof getFirstTopicPost !== "function") {
      return null;
    }
    const firstPost = getFirstTopicPost(topic);
    const firstPostUserId = Number(firstPost?.user_id);
    return Number.isFinite(firstPostUserId) ? firstPostUserId : null;
  }

  function isTopicAuthorPost(post, options = {}) {
    if (!post || typeof post !== "object") {
      return false;
    }
    if (Number(post.post_number) === 1) {
      return true;
    }

    const normalizeUsernameFn = options.normalizeUsername || normalizeUsername;
    const topicAuthorUserId = Number(options.currentTopicAuthorUserId);
    const postAuthorUserId = Number(post.user_id);
    if (Number.isFinite(topicAuthorUserId) && Number.isFinite(postAuthorUserId)) {
      return topicAuthorUserId === postAuthorUserId;
    }

    const topicAuthor = normalizeUsernameFn(options.currentTopicAuthorUsername);
    const postAuthor = normalizeUsernameFn(post.username);
    return Boolean(topicAuthor) && Boolean(postAuthor) && topicAuthor === postAuthor;
  }

  function normalizeTitleEmojiShortcode(value) {
    const text = String(value || "").trim().toLowerCase();
    if (!text) {
      return "";
    }
    return text.replace(/^:/, "").replace(/:$/, "");
  }

  function normalizeTagLabel(value) {
    return String(value || "").trim().replace(/\s+/g, " ").toLowerCase();
  }

  function collectTitleEmojiMapFromLink(link, options = {}) {
    const ElementClass = options.ElementClass || globalThis.Element;
    const ImageClass = options.ImageClass || globalThis.HTMLImageElement;
    const normalizeTitleEmojiShortcodeFn = options.normalizeTitleEmojiShortcode || normalizeTitleEmojiShortcode;
    const normalizeIconUrl = options.normalizeIconUrl;
    const map = new Map();
    if (!(link instanceof ElementClass) || typeof normalizeIconUrl !== "function") {
      return map;
    }

    for (const image of link.querySelectorAll("img.emoji")) {
      if (!(image instanceof ImageClass)) {
        continue;
      }
      const shortcode = normalizeTitleEmojiShortcodeFn(
        image.getAttribute("title")
        || image.getAttribute("alt")
        || image.dataset.emoji
      );
      const src = normalizeIconUrl(image.currentSrc || image.src || "");
      if (!shortcode || !src || map.has(shortcode)) {
        continue;
      }
      map.set(shortcode, src);
    }
    return map;
  }

  function collectTagIconMapFromLink(link, options = {}) {
    const ElementClass = options.ElementClass || globalThis.Element;
    const SVGElementClass = options.SVGElementClass || globalThis.SVGElement;
    const ImageClass = options.ImageClass || globalThis.HTMLImageElement;
    const getComputedStyleFn = options.getComputedStyleFn || globalThis.getComputedStyle;
    const getTopicEntryContainer = options.getTopicEntryContainer;
    const normalizeIconUrl = options.normalizeIconUrl;
    const normalizeTagLabelFn = options.normalizeTagLabel || normalizeTagLabel;
    const map = new Map();
    if (
      !(link instanceof ElementClass)
      || typeof getTopicEntryContainer !== "function"
      || typeof normalizeIconUrl !== "function"
    ) {
      return map;
    }

    const entry = getTopicEntryContainer(link);
    if (!(entry instanceof ElementClass)) {
      return map;
    }

    const tagSelectors = [
      ".discourse-tags .discourse-tag",
      ".discourse-tags a",
      ".topic-list-tags .discourse-tag",
      ".topic-list-tags a",
      ".simple-tag",
      ".discourse-tag",
      ".badge-category",
      ".topic-category"
    ].join(", ");

    for (const item of entry.querySelectorAll(tagSelectors)) {
      if (!(item instanceof ElementClass)) {
        continue;
      }

      const label = normalizeTagLabelFn(item.textContent);
      if (!label || map.has(label) || label.length > 48) {
        continue;
      }

      const svg = item.querySelector("svg");
      if (svg instanceof SVGElementClass) {
        const svgStyle = typeof getComputedStyleFn === "function" ? getComputedStyleFn(svg) : null;
        const itemStyle = typeof getComputedStyleFn === "function" ? getComputedStyleFn(item) : null;
        map.set(label, {
          type: "svg",
          html: svg.outerHTML,
          color: String(svgStyle?.color || itemStyle?.color || "").trim()
        });
        continue;
      }

      const image = item.querySelector("img");
      if (image instanceof ImageClass) {
        const src = normalizeIconUrl(image.currentSrc || image.src || "");
        if (!src) {
          continue;
        }
        map.set(label, {
          type: "img",
          src,
          alt: String(image.alt || item.textContent || "").trim()
        });
      }
    }

    return map;
  }

  function resolveTitleEmojiIconUrl(shortcode, options = {}) {
    const normalizeTitleEmojiShortcodeFn = options.normalizeTitleEmojiShortcode || normalizeTitleEmojiShortcode;
    const normalized = normalizeTitleEmojiShortcodeFn(shortcode);
    if (!normalized) {
      return "";
    }
    const currentTitleEmojiMap = options.currentTitleEmojiMap;
    if (currentTitleEmojiMap instanceof Map && currentTitleEmojiMap.has(normalized)) {
      return currentTitleEmojiMap.get(normalized) || "";
    }
    const origin = options.locationOrigin || globalThis.location?.origin || "https://linux.do";
    return `${origin}/images/emoji/twemoji/${encodeURIComponent(normalized)}.png`;
  }

  function renderDrawerTitle(titleElement, rawTitle, options = {}) {
    const HTMLElementClass = options.HTMLElementClass || globalThis.HTMLElement;
    if (!(titleElement instanceof HTMLElementClass)) {
      return;
    }

    const resolveTitleEmojiIconUrlFn = options.resolveTitleEmojiIconUrl;
    const escapeHtmlAttribute = options.escapeHtmlAttribute;
    const defaultTitle = options.defaultTitle || "帖子预览";
    if (typeof resolveTitleEmojiIconUrlFn !== "function" || typeof escapeHtmlAttribute !== "function") {
      titleElement.textContent = String(rawTitle || "").trim() || defaultTitle;
      return;
    }

    const text = String(rawTitle || "").trim() || defaultTitle;
    const emojiPattern = /:([a-z0-9_+\-]+):/gi;
    if (!emojiPattern.test(text)) {
      titleElement.textContent = text;
      return;
    }

    emojiPattern.lastIndex = 0;
    let cursor = 0;
    let html = "";
    let hasEmoji = false;
    let match = emojiPattern.exec(text);

    while (match) {
      const token = match[0];
      const rawCode = match[1];
      const index = match.index;
      html += escapeHtmlAttribute(text.slice(cursor, index));

      const shortcode = normalizeTitleEmojiShortcode(rawCode);
      const iconUrl = resolveTitleEmojiIconUrlFn(shortcode);
      if (shortcode && iconUrl) {
        hasEmoji = true;
        html += `<img class="ld-title-emoji" src="${escapeHtmlAttribute(iconUrl)}" alt=":${escapeHtmlAttribute(shortcode)}:" title=":${escapeHtmlAttribute(shortcode)}:" loading="lazy" decoding="async" />`;
      } else {
        html += escapeHtmlAttribute(token);
      }

      cursor = index + token.length;
      match = emojiPattern.exec(text);
    }

    html += escapeHtmlAttribute(text.slice(cursor));
    if (!hasEmoji) {
      titleElement.textContent = text;
      return;
    }
    titleElement.innerHTML = html;
  }

  runtime.topicDisplayUtils = {
    normalizeUsername,
    resolveTopicAuthorUserId,
    isTopicAuthorPost,
    normalizeTitleEmojiShortcode,
    normalizeTagLabel,
    collectTitleEmojiMapFromLink,
    collectTagIconMapFromLink,
    resolveTitleEmojiIconUrl,
    renderDrawerTitle
  };
})();
