(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function normalizeReactionId(value) {
    const normalized = String(value || "").trim().toLowerCase().replace(/^:+|:+$/g, "");
    if (!normalized) {
      return "";
    }
    if (!/^[a-z0-9_+\-]+$/.test(normalized)) {
      return "";
    }
    return normalized;
  }

  function normalizeIconUrl(rawUrl, baseOrigin) {
    const value = String(rawUrl || "").trim();
    if (!value) {
      return "";
    }

    try {
      const fallbackBase = globalThis.location?.origin || "https://linux.do";
      return new URL(value, baseOrigin || fallbackBase).toString();
    } catch {
      return "";
    }
  }

  function extractEmojiIdFromText(value) {
    const text = String(value || "").trim();
    if (!text) {
      return "";
    }
    const matched = text.match(/^:([^:]+):$/);
    if (matched) {
      return matched[1];
    }
    return text.replace(/^:+|:+$/g, "");
  }

  function reactionIdToEmoji(reactionId) {
    const map = {
      heart: "\u2764\ufe0f",
      thumbsup: "\ud83d\udc4d",
      thumbsdown: "\ud83d\udc4e",
      laughing: "\ud83d\ude06",
      open_mouth: "\ud83d\ude2e",
      cry: "\ud83d\ude22",
      angry: "\ud83d\ude21",
      clap: "\ud83d\udc4f",
      tada: "\ud83c\udf89",
      rocket: "\ud83d\ude80",
      eyes: "\ud83d\udc40"
    };
    return map[String(reactionId || "").trim().toLowerCase()] || "";
  }

  function isKnownOfficialReactionId(reactionId, defaultReactionOptions = []) {
    const id = normalizeReactionId(reactionId);
    if (!id) {
      return false;
    }

    const known = new Set([
      ...defaultReactionOptions,
      "+1",
      "-1",
      "thumbsup",
      "thumbsdown",
      "heart",
      "laughing",
      "open_mouth",
      "cry",
      "angry",
      "clap",
      "tada",
      "rocket",
      "eyes",
      "hugs"
    ]);
    return known.has(id);
  }

  function isCustomReactionId(reactionId, defaultReactionOptions = []) {
    const id = normalizeReactionId(reactionId);
    return Boolean(id) && !isKnownOfficialReactionId(id, defaultReactionOptions);
  }

  function getForcedReactionIconUrl(reactionId, options = {}) {
    const normalized = normalizeReactionId(reactionId);
    if (!normalized) {
      return "";
    }
    const forcedOptions = Array.isArray(options.forcedReactionOptions)
      ? options.forcedReactionOptions
      : [];
    if (!forcedOptions.includes(normalized)) {
      return "";
    }
    const path = options.forcedReactionIconUrls && options.forcedReactionIconUrls[normalized];
    if (!path) {
      return "";
    }
    return normalizeIconUrl(path, options.locationOrigin);
  }

  function getReactionIconUrl(reactionId, options = {}) {
    const normalized = normalizeReactionId(reactionId);
    if (!normalized) {
      return "";
    }

    const reactionIconMap = options.reactionIconMap;
    if (!(reactionIconMap instanceof Map)) {
      return "";
    }

    const direct = reactionIconMap.get(normalized);
    if (direct) {
      return direct;
    }

    const aliases = {
      "+1": "thumbsup",
      thumbs_up: "thumbsup",
      thumb_up: "thumbsup",
      "-1": "thumbsdown",
      thumbs_down: "thumbsdown",
      thumb_down: "thumbsdown"
    };

    const alias = aliases[normalized];
    if (alias && reactionIconMap.has(alias)) {
      return reactionIconMap.get(alias);
    }

    if (reactionIconMap.size > 0 || !isKnownOfficialReactionId(normalized, options.defaultReactionOptions || [])) {
      return "";
    }

    const setName = normalizeReactionId(options.emojiSet) || "twitter";
    const origin = options.locationOrigin || globalThis.location?.origin || "https://linux.do";
    return `${origin}/images/emoji/${encodeURIComponent(setName)}/${encodeURIComponent(normalized)}.png`;
  }

  runtime.reactionUtils = {
    normalizeReactionId,
    normalizeIconUrl,
    extractEmojiIdFromText,
    reactionIdToEmoji,
    isKnownOfficialReactionId,
    isCustomReactionId,
    getForcedReactionIconUrl,
    getReactionIconUrl
  };
})();
