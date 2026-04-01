(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function registerReactionIconUrl(reactionId, rawUrl, options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const normalizeIconUrl = options.normalizeIconUrl;
    const reactionIconMap = options.reactionIconMap;
    if (typeof normalizeReactionId !== "function" || typeof normalizeIconUrl !== "function" || !(reactionIconMap instanceof Map)) {
      return false;
    }

    const normalizedId = normalizeReactionId(reactionId);
    const normalizedUrl = normalizeIconUrl(rawUrl);
    if (!normalizedId || !normalizedUrl) {
      return false;
    }

    if (!reactionIconMap.has(normalizedId)) {
      reactionIconMap.set(normalizedId, normalizedUrl);
    }
    return true;
  }

  function registerReactionIconFromObject(item, options = {}) {
    if (!item || typeof item !== "object") {
      return;
    }

    const normalizeReactionId = options.normalizeReactionId;
    const registerIconUrl = options.registerReactionIconUrl;
    if (typeof normalizeReactionId !== "function" || typeof registerIconUrl !== "function") {
      return;
    }

    const reactionId = normalizeReactionId(item.id || item.reaction || item.name || item.emoji || item.short_name);
    if (!reactionId) {
      return;
    }

    const candidates = [
      item.url,
      item.src,
      item.image_url,
      item.icon,
      item.emoji_url,
      item.path
    ];

    for (const candidate of candidates) {
      if (registerIconUrl(reactionId, candidate)) {
        return;
      }
    }

    if (item.emoji && typeof item.emoji === "object") {
      registerIconUrl(reactionId, item.emoji.url || item.emoji.src || item.emoji.image_url || item.emoji.path);
    }
  }

  function looksLikeEmojiAssetUrl(url) {
    const value = String(url || "");
    return /emoji|emojis|custom_emoji/i.test(value) && /\.(png|webp|gif|svg)(?:$|[?#])/i.test(value);
  }

  function registerReactionIconsFromGenericObject(root, options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const registerIconFromObject = options.registerReactionIconFromObject;
    const registerIconUrl = options.registerReactionIconUrl;
    if (
      typeof normalizeReactionId !== "function"
      || typeof registerIconFromObject !== "function"
      || typeof registerIconUrl !== "function"
    ) {
      return;
    }

    const visited = new WeakSet();

    const walk = (value, depth = 0) => {
      if (!value || depth > 8) {
        return;
      }

      if (Array.isArray(value)) {
        for (const item of value) {
          walk(item, depth + 1);
        }
        return;
      }

      if (typeof value !== "object") {
        return;
      }

      if (visited.has(value)) {
        return;
      }
      visited.add(value);

      registerIconFromObject(value);

      for (const [key, child] of Object.entries(value)) {
        if (typeof child === "string") {
          const keyId = normalizeReactionId(key);
          if (keyId && looksLikeEmojiAssetUrl(child)) {
            registerIconUrl(keyId, child);
          }
        } else {
          walk(child, depth + 1);
        }
      }
    };

    walk(root, 0);
  }

  function registerReactionIconsFromData(data, options = {}) {
    if (!data || typeof data !== "object") {
      return;
    }

    const registerIconFromObject = options.registerReactionIconFromObject;
    const registerIconsFromGenericObject = options.registerReactionIconsFromGenericObject;
    if (typeof registerIconFromObject !== "function" || typeof registerIconsFromGenericObject !== "function") {
      return;
    }

    const lists = [
      data.reactions,
      data.custom_reactions,
      data.available_reactions,
      data.emoji,
      data.emojis,
      data.custom_emoji,
      data.site?.emoji,
      data.site?.emojis,
      data.site?.custom_emoji
    ];

    for (const list of lists) {
      if (!Array.isArray(list)) {
        continue;
      }
      for (const item of list) {
        registerIconFromObject(item);
      }
    }

    registerIconsFromGenericObject(data);
  }

  function detectEmojiSetFromData(data, normalizeReactionId) {
    if (typeof normalizeReactionId !== "function") {
      return "";
    }
    const candidates = [
      data?.emoji_set,
      data?.site?.emoji_set,
      data?.site?.settings?.emoji_set
    ];
    for (const item of candidates) {
      const normalized = normalizeReactionId(item);
      if (normalized) {
        return normalized;
      }
    }
    return "";
  }

  function generateIconCandidatesForReaction(reactionId, options = {}) {
    const normalizeReactionId = options.normalizeReactionId;
    const normalizeIconUrl = options.normalizeIconUrl;
    const reactionIconMap = options.reactionIconMap;
    const emojiSet = options.emojiSet;
    const locationOrigin = options.locationOrigin;
    if (typeof normalizeReactionId !== "function" || typeof normalizeIconUrl !== "function") {
      return [];
    }
    const id = normalizeReactionId(reactionId);
    if (!id) {
      return [];
    }

    const candidates = [];
    const push = (url) => {
      const normalized = normalizeIconUrl(url);
      if (normalized && !candidates.includes(normalized)) {
        candidates.push(normalized);
      }
    };

    const setName = normalizeReactionId(emojiSet) || "twitter";
    const origin = locationOrigin || globalThis.location?.origin || "https://linux.do";
    push(`${origin}/images/emoji/${encodeURIComponent(setName)}/${encodeURIComponent(id)}.png`);
    push(`${origin}/images/emoji/${encodeURIComponent(setName)}/${encodeURIComponent(id)}.webp`);
    push(`${origin}/images/emoji/twitter/${encodeURIComponent(id)}.png`);
    push(`${origin}/images/emoji/twitter/${encodeURIComponent(id)}.webp`);
    push(`${origin}/images/emoji/custom/${encodeURIComponent(id)}.png`);
    push(`${origin}/images/emoji/custom/${encodeURIComponent(id)}.webp`);
    push(`${origin}/emoji/${encodeURIComponent(id)}.png`);
    push(`${origin}/emoji/${encodeURIComponent(id)}.webp`);

    if (id === "+1") {
      push(`${origin}/images/emoji/${encodeURIComponent(setName)}/thumbsup.png`);
      push(`${origin}/images/emoji/twitter/thumbsup.png`);
    }

    if (reactionIconMap instanceof Map) {
      for (const [knownId, knownUrl] of reactionIconMap.entries()) {
        const known = normalizeReactionId(knownId);
        if (!known || !knownUrl) {
          continue;
        }
        const encodedKnown = encodeURIComponent(known);
        const encodedTarget = encodeURIComponent(id);

        if (knownUrl.includes(encodedKnown)) {
          push(knownUrl.split(encodedKnown).join(encodedTarget));
        }
        if (knownUrl.includes(known)) {
          push(knownUrl.split(known).join(id));
        }
      }
    }

    return candidates;
  }

  runtime.reactionIconRegistry = {
    registerReactionIconUrl,
    registerReactionIconFromObject,
    registerReactionIconsFromGenericObject,
    registerReactionIconsFromData,
    detectEmojiSetFromData,
    generateIconCandidatesForReaction
  };
})();
