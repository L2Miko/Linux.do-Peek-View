(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function registerEmojiCatalogIcons(data, wantedSet, options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const registerReactionIconUrl = options.registerReactionIconUrl;
    if (typeof normalizeReactionId !== "function" || typeof registerReactionIconUrl !== "function") {
      return;
    }

    const push = (item) => {
      if (!item || typeof item !== "object") {
        return;
      }
      const id = normalizeReactionId(
        item.name
        || item.id
        || item.short_name
        || item.alias
        || item.emoji
      );
      if (!id || !wantedSet.has(id)) {
        return;
      }
      registerReactionIconUrl(id, item.url || item.src || item.image_url || item.path);
    };

    if (Array.isArray(data)) {
      data.forEach(push);
    }

    const lists = [
      data?.emoji,
      data?.emojis,
      data?.custom_emoji,
      data?.customEmojis,
      data?.site?.emoji,
      data?.site?.emojis,
      data?.site?.custom_emoji
    ];

    for (const list of lists) {
      if (Array.isArray(list)) {
        list.forEach(push);
      } else if (list && typeof list === "object") {
        for (const [key, value] of Object.entries(list)) {
          if (value && typeof value === "object") {
            push({ name: key, ...value });
          } else if (typeof value === "string") {
            push({ name: key, url: value });
          }
        }
      }
    }
  }

  async function ensureReactionIconsLoaded(reactionOptions, options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const getForcedReactionIconUrl = options.getForcedReactionIconUrl;
    const isKnownOfficialReactionId = options.isKnownOfficialReactionId;
    const reactionIconMap = options.reactionIconMap;
    const emojiSet = options.emojiSet;
    const locationOrigin = options.locationOrigin;
    const onAfter = options.onAfter;
    if (
      typeof normalizeReactionId !== "function"
      || typeof getForcedReactionIconUrl !== "function"
      || typeof isKnownOfficialReactionId !== "function"
      || !(reactionIconMap instanceof Map)
    ) {
      return;
    }

    const optionsList = Array.isArray(reactionOptions)
      ? reactionOptions.map(normalizeReactionId).filter(Boolean)
      : [];
    if (!optionsList.length) {
      return;
    }

    for (const id of optionsList) {
      if (reactionIconMap.has(id)) {
        continue;
      }

      const forcedUrl = getForcedReactionIconUrl(id);
      if (forcedUrl) {
        reactionIconMap.set(id, forcedUrl);
        continue;
      }

      if (isKnownOfficialReactionId(id)) {
        const setName = normalizeReactionId(emojiSet) || "twitter";
        reactionIconMap.set(id, `${locationOrigin}/images/emoji/${encodeURIComponent(setName)}/${encodeURIComponent(id)}.png`);
      }
    }

    if (typeof onAfter === "function") {
      onAfter();
    }
  }

  function collectReactionIconsFromDom(reactionOptions, options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const extractEmojiIdFromText = options.extractEmojiIdFromText;
    const registerReactionIconUrl = options.registerReactionIconUrl;
    const documentRef = options.documentRef || globalThis.document;
    const ImageClass = options.imageClass || globalThis.HTMLImageElement;
    if (
      typeof normalizeReactionId !== "function"
      || typeof extractEmojiIdFromText !== "function"
      || typeof registerReactionIconUrl !== "function"
      || !documentRef
    ) {
      return;
    }

    const wanted = new Set((reactionOptions || []).map(normalizeReactionId).filter(Boolean));
    for (const img of documentRef.querySelectorAll("img[src]")) {
      if (!(img instanceof ImageClass)) {
        continue;
      }
      const rawId = extractEmojiIdFromText(
        img.getAttribute("title")
        || img.getAttribute("alt")
        || img.dataset?.emoji
        || ""
      );
      const id = normalizeReactionId(rawId);
      if (!id || !wanted.has(id)) {
        continue;
      }
      registerReactionIconUrl(id, img.currentSrc || img.src);
    }
  }

  function collectReactionIconsFromLoadedTopicPosts(reactionOptions, options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const extractEmojiIdFromText = options.extractEmojiIdFromText;
    const registerReactionIconUrl = options.registerReactionIconUrl;
    const currentTopic = options.currentTopic;
    const DOMParserClass = options.DOMParserClass || globalThis.DOMParser;
    if (
      typeof normalizeReactionId !== "function"
      || typeof extractEmojiIdFromText !== "function"
      || typeof registerReactionIconUrl !== "function"
      || typeof DOMParserClass !== "function"
    ) {
      return;
    }

    const wanted = new Set((reactionOptions || []).map(normalizeReactionId).filter(Boolean));
    const topics = [currentTopic];

    for (const topic of topics) {
      for (const post of topic?.post_stream?.posts || []) {
        const cooked = String(post?.cooked || "");
        if (!cooked.includes("<img")) {
          continue;
        }
        const doc = new DOMParserClass().parseFromString(cooked, "text/html");
        for (const img of doc.querySelectorAll("img[src]")) {
          const rawId = extractEmojiIdFromText(
            img.getAttribute("title")
            || img.getAttribute("alt")
            || img.getAttribute("data-emoji")
            || ""
          );
          const id = normalizeReactionId(rawId);
          if (!id || !wanted.has(id)) {
            continue;
          }
          registerReactionIconUrl(id, img.getAttribute("src"));
        }
      }
    }
  }

  async function fetchEmojiCatalogAndRegisterIcons(reactionOptions, options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const locationOrigin = options.locationOrigin;
    const fetchImpl = options.fetchImpl || globalThis.fetch?.bind(globalThis);
    if (typeof normalizeReactionId !== "function" || typeof fetchImpl !== "function") {
      return;
    }

    const wanted = new Set((reactionOptions || []).map(normalizeReactionId).filter(Boolean));
    if (!wanted.size) {
      return;
    }

    const endpoints = [
      `${locationOrigin}/emoji.json`,
      `${locationOrigin}/site/emoji.json`,
      `${locationOrigin}/custom_emoji.json`,
      `${locationOrigin}/site/custom_emoji.json`
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetchImpl(endpoint, {
          credentials: "include",
          headers: {
            Accept: "application/json"
          }
        });
        if (!response.ok) {
          continue;
        }
        const data = await response.json();
        registerEmojiCatalogIcons(data, wanted, options);
      } catch {
        // ignore and try next endpoint
      }
    }
  }

  async function resolveSingleReactionIconViaMarkdown(reactionId, options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const extractEmojiIdFromText = options.extractEmojiIdFromText;
    const normalizeIconUrl = options.normalizeIconUrl;
    const getCsrfToken = options.getCsrfToken;
    const fetchImpl = options.fetchImpl || globalThis.fetch?.bind(globalThis);
    const documentRef = options.documentRef || globalThis.document;
    const locationOrigin = options.locationOrigin;
    const DOMParserClass = options.DOMParserClass || globalThis.DOMParser;
    if (
      typeof normalizeReactionId !== "function"
      || typeof extractEmojiIdFromText !== "function"
      || typeof normalizeIconUrl !== "function"
      || typeof fetchImpl !== "function"
      || typeof DOMParserClass !== "function"
    ) {
      return "";
    }

    const shortcode = normalizeReactionId(reactionId);
    if (!shortcode) {
      return "";
    }

    const csrfToken = typeof getCsrfToken === "function" ? getCsrfToken(documentRef) : "";
    const rawText = `:${shortcode}:`;
    const requests = [
      {
        url: `${locationOrigin}/markdown.json`,
        body: (() => {
          const body = new URLSearchParams();
          body.set("text", rawText);
          return body;
        })()
      },
      {
        url: `${locationOrigin}/markdown.json`,
        body: (() => {
          const body = new URLSearchParams();
          body.set("raw", rawText);
          return body;
        })()
      },
      {
        url: `${locationOrigin}/posts/markdown`,
        body: (() => {
          const body = new URLSearchParams();
          body.set("raw", rawText);
          return body;
        })()
      }
    ];

    for (const req of requests) {
      try {
        const response = await fetchImpl(req.url, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            ...(csrfToken ? { "X-CSRF-Token": csrfToken } : {})
          },
          body: req.body
        });

        if (!response.ok) {
          continue;
        }

        const contentType = response.headers.get("content-type") || "";
        if (!contentType.includes("json")) {
          continue;
        }

        const data = await response.json();
        const cooked = String(data?.cooked || data?.html || "");
        if (!cooked) {
          continue;
        }

        const doc = new DOMParserClass().parseFromString(cooked, "text/html");
        for (const img of doc.querySelectorAll("img[src]")) {
          const idFromImg = normalizeReactionId(
            extractEmojiIdFromText(img.getAttribute("title") || img.getAttribute("alt") || "")
          );
          if (idFromImg && idFromImg !== shortcode) {
            continue;
          }

          const src = normalizeIconUrl(img.getAttribute("src"));
          if (src) {
            return src;
          }
        }
      } catch {
        // try next endpoint
      }
    }

    return "";
  }

  async function resolveReactionIconsViaMarkdown(reactionOptions, options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const reactionIconMap = options.reactionIconMap;
    const registerReactionIconUrl = options.registerReactionIconUrl;
    if (
      typeof normalizeReactionId !== "function"
      || !(reactionIconMap instanceof Map)
      || typeof registerReactionIconUrl !== "function"
    ) {
      return;
    }

    const missing = (reactionOptions || [])
      .map(normalizeReactionId)
      .filter(Boolean)
      .filter((id) => !reactionIconMap.has(id));
    if (!missing.length) {
      return;
    }

    for (const reactionId of missing) {
      const iconUrl = await resolveSingleReactionIconViaMarkdown(reactionId, options).catch(() => "");
      if (iconUrl) {
        registerReactionIconUrl(reactionId, iconUrl);
      }
    }
  }

  async function checkIconUrlExists(url, options = {}) {
    const invalidReactionIconUrls = options.invalidReactionIconUrls;
    const fetchImpl = options.fetchImpl || globalThis.fetch?.bind(globalThis);
    if (!(invalidReactionIconUrls instanceof Set) || typeof fetchImpl !== "function") {
      return false;
    }

    if (!url || invalidReactionIconUrls.has(url)) {
      return false;
    }

    try {
      const head = await fetchImpl(url, {
        method: "HEAD",
        credentials: "include"
      });
      if (head.ok) {
        return true;
      }
      invalidReactionIconUrls.add(url);
    } catch {
      // fall through
    }

    try {
      const get = await fetchImpl(url, {
        method: "GET",
        credentials: "include"
      });
      const ok = get.ok;
      if (!ok) {
        invalidReactionIconUrls.add(url);
      }
      return ok;
    } catch {
      invalidReactionIconUrls.add(url);
      return false;
    }
  }

  async function hydrateMissingReactionIcons(reactionOptions, options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const reactionIconMap = options.reactionIconMap;
    const generateIconCandidatesForReaction = options.generateIconCandidatesForReaction;
    const registerReactionIconUrl = options.registerReactionIconUrl;
    if (
      typeof normalizeReactionId !== "function"
      || !(reactionIconMap instanceof Map)
      || typeof generateIconCandidatesForReaction !== "function"
      || typeof registerReactionIconUrl !== "function"
    ) {
      return;
    }

    const missing = (reactionOptions || [])
      .map(normalizeReactionId)
      .filter(Boolean)
      .filter((id) => !reactionIconMap.has(id));
    if (!missing.length) {
      return;
    }

    for (const reactionId of missing) {
      const candidates = generateIconCandidatesForReaction(reactionId);
      for (const candidate of candidates) {
        if (!(await checkIconUrlExists(candidate, options))) {
          continue;
        }
        registerReactionIconUrl(reactionId, candidate);
        break;
      }
    }
  }

  runtime.reactionIconResolver = {
    ensureReactionIconsLoaded,
    collectReactionIconsFromDom,
    collectReactionIconsFromLoadedTopicPosts,
    fetchEmojiCatalogAndRegisterIcons,
    resolveReactionIconsViaMarkdown,
    hydrateMissingReactionIcons
  };
})();
