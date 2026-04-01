(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function finalizeReactionOptions(state, primaryOptions, options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const isCustomReactionId = options.isCustomReactionId;
    const defaultReactionOptions = Array.isArray(options.defaultReactionOptions)
      ? options.defaultReactionOptions
      : [];
    if (typeof normalizeReactionId !== "function" || typeof isCustomReactionId !== "function") {
      return [];
    }

    const merged = [];
    const push = (value) => {
      const normalized = normalizeReactionId(value);
      if (normalized && !merged.includes(normalized)) {
        merged.push(normalized);
      }
    };

    for (const item of primaryOptions || []) {
      push(item);
    }

    for (const item of state?.cachedReactionOptions || []) {
      push(item);
    }

    const hasCustom = merged.some((id) => isCustomReactionId(id));
    if (!hasCustom) {
      for (const item of defaultReactionOptions) {
        push(item);
        if (merged.length >= 10) {
          break;
        }
      }
    }

    return merged.slice(0, 10);
  }

  function maybePersistReactionOptions(state, reactionOptions, source, options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const isCustomReactionId = options.isCustomReactionId;
    const reactionOptionsCacheKey = options.reactionOptionsCacheKey;
    const storage = options.storage || globalThis.localStorage;
    if (
      typeof normalizeReactionId !== "function"
      || typeof isCustomReactionId !== "function"
      || !reactionOptionsCacheKey
      || !storage
    ) {
      return;
    }

    const normalized = (reactionOptions || []).map(normalizeReactionId).filter(Boolean).slice(0, 10);
    if (!normalized.length) {
      return;
    }

    if (!normalized.some((id) => isCustomReactionId(id))) {
      return;
    }

    state.cachedReactionOptions = normalized;
    try {
      storage.setItem(reactionOptionsCacheKey, JSON.stringify({
        source,
        options: normalized
      }));
    } catch {
      // ignore
    }
  }

  function loadCachedReactionOptions(options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const reactionOptionsCacheKey = options.reactionOptionsCacheKey;
    const storage = options.storage || globalThis.localStorage;
    if (typeof normalizeReactionId !== "function" || !reactionOptionsCacheKey || !storage) {
      return [];
    }

    try {
      const raw = JSON.parse(storage.getItem(reactionOptionsCacheKey) || "null");
      const list = Array.isArray(raw?.options) ? raw.options : [];
      return list.map(normalizeReactionId).filter(Boolean).slice(0, 10);
    } catch {
      return [];
    }
  }

  async function fetchReactionOptions(state, options = {}) {
    const locationOrigin = options.locationOrigin || globalThis.location?.origin || "";
    const fetchImpl = options.fetchImpl || globalThis.fetch?.bind(globalThis);
    const registerReactionIconsFromData = options.registerReactionIconsFromData;
    const detectEmojiSetFromData = options.detectEmojiSetFromData;
    const normalizeReactionOptions = options.normalizeReactionOptions;
    const normalizeReactionId = options.normalizeReactionId;
    if (
      typeof fetchImpl !== "function"
      || typeof registerReactionIconsFromData !== "function"
      || typeof detectEmojiSetFromData !== "function"
      || typeof normalizeReactionOptions !== "function"
      || typeof normalizeReactionId !== "function"
    ) {
      throw new Error("加载点赞选项失败");
    }

    const endpoints = [
      `${locationOrigin}/discourse-reactions/custom-reactions.json`,
      `${locationOrigin}/discourse-reactions/reactions.json`,
      `${locationOrigin}/discourse-reactions/posts/reactions.json`,
      `${locationOrigin}/site.json`
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
        registerReactionIconsFromData(data);
        const detectedEmojiSet = detectEmojiSetFromData(data);
        if (detectedEmojiSet) {
          state.emojiSet = detectedEmojiSet;
        }
        const siteJsonSettings = extractReactionSettingsFromSiteJson(data);
        if (siteJsonSettings) {
          const optionsFromSiteSettings = normalizeReactionOptions({
            enabled_reactions: siteJsonSettings.enabledReactions
          });
          const likeReactionIdFromSiteSettings = normalizeReactionId(siteJsonSettings.likeReactionId);
          if (optionsFromSiteSettings.length > 0) {
            return {
              options: optionsFromSiteSettings,
              likeReactionId: likeReactionIdFromSiteSettings || optionsFromSiteSettings[0] || "heart"
            };
          }
        }

        const likeReactionId = String(
          data?.reaction_for_like
          || data?.like_reaction
          || data?.discourse_reactions_reaction_for_like
          || ""
        ).trim().toLowerCase();
        const normalizedOptions = normalizeReactionOptions(data);
        if (normalizedOptions.length > 0) {
          return {
            options: normalizedOptions,
            likeReactionId: likeReactionId || normalizedOptions[0] || "heart"
          };
        }
      } catch {
        // try next endpoint
      }
    }

    throw new Error("加载点赞选项失败");
  }

  function extractReactionSettingsFromSiteJson(data) {
    const settings = Array.isArray(data?.site_settings) ? data.site_settings : [];
    if (!settings.length) {
      return null;
    }

    const readValue = (name) => {
      const found = settings.find((item) => item?.setting === name || item?.name === name);
      return found?.value;
    };

    const enabledReactions = readValue("discourse_reactions_enabled_reactions");
    const likeReactionId = readValue("discourse_reactions_reaction_for_like");
    if (typeof enabledReactions !== "string" || !enabledReactions.trim()) {
      return null;
    }

    return {
      enabledReactions,
      likeReactionId: typeof likeReactionId === "string" ? likeReactionId : ""
    };
  }

  async function fetchReactionOptionsFromCurrentPageHtml(options = {}) {
    const fetchImpl = options.fetchImpl || globalThis.fetch?.bind(globalThis);
    const locationHref = options.locationHref || globalThis.location?.href || "";
    const normalizeReactionOptions = options.normalizeReactionOptions;
    const normalizeReactionId = options.normalizeReactionId;
    if (
      typeof fetchImpl !== "function"
      || typeof normalizeReactionOptions !== "function"
      || typeof normalizeReactionId !== "function"
    ) {
      throw new Error("无法读取页面配置");
    }

    const response = await fetchImpl(locationHref, {
      credentials: "include",
      headers: {
        Accept: "text/html"
      }
    });

    if (!response.ok) {
      throw new Error("无法读取页面配置");
    }

    const html = await response.text();
    const enabledReactions = extractValueFromHtml(
      html,
      "discourse_reactions_enabled_reactions"
    );
    if (!enabledReactions) {
      throw new Error("页面中未找到 reactions 配置");
    }

    const likeReactionId = extractValueFromHtml(
      html,
      "discourse_reactions_reaction_for_like"
    );

    const optionsFromHtml = normalizeReactionOptions({
      enabled_reactions: enabledReactions
    });

    return {
      options: optionsFromHtml,
      likeReactionId: normalizeReactionId(likeReactionId || "")
    };
  }

  function extractValueFromHtml(html, key) {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(`"${escapedKey}"\\s*:\\s*"([^"]+)"`),
      new RegExp(`'${escapedKey}'\\s*:\\s*'([^']+)'`),
      new RegExp(`${escapedKey}=([\"'])(.*?)\\1`)
    ];

    for (const pattern of patterns) {
      const matched = html.match(pattern);
      if (matched && matched[1]) {
        return decodeHtmlSettingValue(matched[1]);
      }
      if (matched && matched[2]) {
        return decodeHtmlSettingValue(matched[2]);
      }
    }

    return "";
  }

  function decodeHtmlSettingValue(value) {
    return String(value || "")
      .replace(/\\u0026/g, "&")
      .replace(/\\u003c/g, "<")
      .replace(/\\u003e/g, ">")
      .replace(/\\\//g, "/")
      .replace(/&quot;/g, "\"")
      .replace(/&#34;/g, "\"")
      .trim();
  }

  function getReactionOptionsFromPageGlobals(options = {}) {
    const normalizeReactionOptions = options.normalizeReactionOptions;
    if (typeof normalizeReactionOptions !== "function") {
      return {
        options: [],
        likeReactionId: ""
      };
    }

    const candidates = [];

    const discourseSettings = globalThis?.Discourse?.SiteSettings;
    if (discourseSettings && typeof discourseSettings === "object") {
      candidates.push(discourseSettings);
    }

    const siteSettings = globalThis?.siteSettings;
    if (siteSettings && typeof siteSettings === "object") {
      candidates.push(siteSettings);
    }

    for (const settings of candidates) {
      const enabledRaw = settings.discourse_reactions_enabled_reactions;
      const likeRaw = settings.discourse_reactions_reaction_for_like || settings.discourse_reactions_like_icon;
      const normalizedOptions = normalizeReactionOptions({
        enabled_reactions: typeof enabledRaw === "string" ? enabledRaw : ""
      });
      const likeReactionId = String(likeRaw || "").trim().toLowerCase();
      if (normalizedOptions.length > 0) {
        return {
          options: normalizedOptions,
          likeReactionId: likeReactionId || normalizedOptions[0] || "heart"
        };
      }
    }

    return {
      options: [],
      likeReactionId: ""
    };
  }

  function updateReactionOptionsFromTopicPayload(state, topic, options = {}) {
    const collectReactionOptionsFromTopics = options.collectReactionOptionsFromTopics;
    const forcedReactionOptions = Array.isArray(options.forcedReactionOptions)
      ? options.forcedReactionOptions
      : [];
    const getForcedReactionIconUrl = options.getForcedReactionIconUrl;
    const ensureReactionIconsLoaded = options.ensureReactionIconsLoaded;
    if (
      typeof collectReactionOptionsFromTopics !== "function"
      || typeof getForcedReactionIconUrl !== "function"
      || typeof ensureReactionIconsLoaded !== "function"
    ) {
      return;
    }

    // Keep drawer reaction order deterministic for every post card, including OP.
    // We still parse topic payload to harvest icon metadata via side effects.
    collectReactionOptionsFromTopics(topic);
    state.reactionOptions = [...forcedReactionOptions];
    state.likeReactionId = "heart";
    for (const id of forcedReactionOptions) {
      const forcedUrl = getForcedReactionIconUrl(id);
      if (forcedUrl) {
        state.reactionIconMap.set(id, forcedUrl);
      }
    }
    ensureReactionIconsLoaded(state.reactionOptions).catch(() => {});
  }

  function collectReactionOptionsFromTopics(topics, options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const registerReactionIconFromObject = options.registerReactionIconFromObject;
    const inferLikeReactionIdFromUi = options.inferLikeReactionIdFromUi;
    if (
      typeof normalizeReactionId !== "function"
      || typeof registerReactionIconFromObject !== "function"
      || typeof inferLikeReactionIdFromUi !== "function"
    ) {
      return {
        options: [],
        likeReactionId: ""
      };
    }

    const optionsList = [];
    const pushId = (value) => {
      const normalized = normalizeReactionId(value);
      if (normalized && !optionsList.includes(normalized)) {
        optionsList.push(normalized);
      }
    };

    for (const topic of topics) {
      if (!topic || typeof topic !== "object") {
        continue;
      }

      pushFromTopicLikeObject(topic, pushId, { registerReactionIconFromObject });

      for (const post of topic?.post_stream?.posts || []) {
        pushFromTopicLikeObject(post, pushId, { registerReactionIconFromObject });
      }
    }

    const likeReactionId = inferLikeReactionIdFromUi(optionsList);
    return {
      options: optionsList.slice(0, 10),
      likeReactionId
    };
  }

  function pushFromTopicLikeObject(source, pushId, options = {}) {
    const registerReactionIconFromObject = options.registerReactionIconFromObject;
    if (!source || typeof source !== "object" || typeof pushId !== "function") {
      return;
    }

    const possibleLists = [
      source.reactions,
      source.available_reactions,
      source.custom_reactions
    ];
    for (const list of possibleLists) {
      if (!Array.isArray(list)) {
        continue;
      }
      for (const item of list) {
        if (typeof item === "string") {
          pushId(item);
        } else if (item && typeof item === "object") {
          pushId(item.id);
          pushId(item.reaction);
          pushId(item.name);
          pushId(item.emoji);
          registerReactionIconFromObject(item);
        }
      }
    }

    if (typeof source.enabled_reactions === "string") {
      for (const item of source.enabled_reactions.split("|")) {
        pushId(item);
      }
    }
    if (typeof source.discourse_reactions_enabled_reactions === "string") {
      for (const item of source.discourse_reactions_enabled_reactions.split("|")) {
        pushId(item);
      }
    }
    if (typeof source.current_user_reaction?.id === "string") {
      pushId(source.current_user_reaction.id);
      registerReactionIconFromObject(source.current_user_reaction);
    }
  }

  function getReactionOptionsFromExistingUi(options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const registerReactionIconUrl = options.registerReactionIconUrl;
    const inferLikeReactionIdFromUi = options.inferLikeReactionIdFromUi;
    const documentRef = options.documentRef || globalThis.document;
    const HTMLElementClass = options.HTMLElementClass || globalThis.HTMLElement;
    const HTMLImageElementClass = options.HTMLImageElementClass || globalThis.HTMLImageElement;
    if (
      typeof normalizeReactionId !== "function"
      || typeof registerReactionIconUrl !== "function"
      || typeof inferLikeReactionIdFromUi !== "function"
      || !documentRef
    ) {
      return {
        options: [],
        likeReactionId: ""
      };
    }

    const ids = [];
    const pushId = (value) => {
      const normalized = normalizeReactionId(value);
      if (normalized && !ids.includes(normalized)) {
        ids.push(normalized);
      }
    };

    const selectors = [
      ".discourse-reactions-picker [data-reaction-id]",
      ".discourse-reactions-picker [data-reaction]",
      ".discourse-reactions-picker [data-id]",
      ".discourse-reactions-picker .pickable-reaction",
      ".discourse-reactions-picker .discourse-reactions-picker-reaction"
    ];

    for (const selector of selectors) {
      for (const el of documentRef.querySelectorAll(selector)) {
        if (!(el instanceof HTMLElementClass)) {
          continue;
        }
        pushId(el.dataset.reactionId);
        pushId(el.dataset.reaction);
        pushId(el.dataset.id);
        pushId(el.getAttribute("data-reaction"));
        pushId(el.getAttribute("data-reaction-id"));
        pushId(el.getAttribute("data-id"));

        const imgAlt = el.querySelector("img[alt]")?.getAttribute("alt");
        if (imgAlt) {
          pushId(imgAlt.replace(/^:+|:+$/g, ""));
        }

        const img = el.querySelector("img[src]");
        const reactionId = normalizeReactionId(
          el.dataset.reactionId
          || el.dataset.reaction
          || el.dataset.id
          || imgAlt?.replace(/^:+|:+$/g, "")
        );
        if (img instanceof HTMLImageElementClass && reactionId) {
          registerReactionIconUrl(reactionId, img.currentSrc || img.src);
        }
      }
    }

    if (ids.length === 0) {
      for (const post of documentRef.querySelectorAll(".topic-post[data-post-id]")) {
        if (!(post instanceof HTMLElementClass)) {
          continue;
        }
        for (const el of post.querySelectorAll("[data-reaction-id], [data-reaction], [data-id]")) {
          if (!(el instanceof HTMLElementClass)) {
            continue;
          }
          pushId(el.dataset.reactionId);
          pushId(el.dataset.reaction);
          pushId(el.dataset.id);
        }
      }
    }

    const likeReactionId = inferLikeReactionIdFromUi(ids);
    return {
      options: ids.slice(0, 10),
      likeReactionId
    };
  }

  function inferLikeReactionIdFromUi(options) {
    if (!Array.isArray(options) || options.length === 0) {
      return "";
    }

    const preferred = ["heart", "thumbsup"];
    for (const id of preferred) {
      if (options.includes(id)) {
        return id;
      }
    }
    return options[0] || "";
  }

  function normalizeReactionOptions(state, data, options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    if (typeof normalizeReactionId !== "function") {
      return [];
    }

    const source = [];

    if (Array.isArray(data)) {
      source.push(...data);
    } else if (Array.isArray(data?.reactions)) {
      source.push(...data.reactions);
    } else if (Array.isArray(data?.custom_reactions)) {
      source.push(...data.custom_reactions);
    } else if (typeof data?.enabled_reactions === "string") {
      source.push(...data.enabled_reactions.split("|"));
    } else if (typeof data?.reactions === "string") {
      source.push(...data.reactions.split("|"));
    }

    const normalized = source
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }
        if (item && typeof item === "object") {
          return item.id || item.name || item.reaction || "";
        }
        return "";
      })
      .map((item) => normalizeReactionId(item))
      .filter(Boolean);

    const likeReactionId = normalizeReactionId(state?.likeReactionId || "heart") || "heart";
    if (!normalized.includes(likeReactionId)) {
      normalized.unshift(likeReactionId);
    }

    return Array.from(new Set(normalized)).slice(0, 10);
  }

  runtime.reactionOptionsUtils = {
    finalizeReactionOptions,
    maybePersistReactionOptions,
    loadCachedReactionOptions,
    fetchReactionOptions,
    fetchReactionOptionsFromCurrentPageHtml,
    getReactionOptionsFromPageGlobals,
    updateReactionOptionsFromTopicPayload,
    collectReactionOptionsFromTopics,
    getReactionOptionsFromExistingUi,
    inferLikeReactionIdFromUi,
    normalizeReactionOptions
  };
})();
