(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function formatDateSafe(value) {
    if (runtime.textUtils?.formatDate) {
      return runtime.textUtils.formatDate(value);
    }
    try {
      return new Intl.DateTimeFormat("zh-CN", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      }).format(new Date(value));
    } catch {
      return value;
    }
  }

  function getTagLabel(tag) {
    if (typeof tag === "string") {
      return tag;
    }

    if (!tag || typeof tag !== "object") {
      return "";
    }

    return tag.name || tag.id || tag.text || tag.label || "";
  }

  function buildTopicMeta(topic, loadedPostCount) {
    const parts = [];

    if (topic.created_by?.username) {
      parts.push(`楼主 @${topic.created_by.username}`);
    }

    if (topic.created_at) {
      parts.push(formatDateSafe(topic.created_at));
    }

    if (typeof topic.views === "number") {
      parts.push(`${topic.views.toLocaleString()} 浏览`);
    }

    const totalPosts = topic.posts_count || loadedPostCount;
    parts.push(`${totalPosts} 帖`);

    return parts.join(" · ");
  }

  function buildPostMeta(post) {
    const parts = [];

    if (post.created_at) {
      parts.push(formatDateSafe(post.created_at));
    }

    if (typeof post.reads === "number") {
      parts.push(`${post.reads} 阅读`);
    }

    if (typeof post.reply_count === "number" && post.reply_count > 0) {
      parts.push(`${post.reply_count} 回复`);
    }

    return parts.join(" · ");
  }

  function avatarUrl(template, baseOrigin, size = 96) {
    if (!template) {
      return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='96' height='96'%3E%3Crect width='96' height='96' fill='%23d8dee9'/%3E%3C/svg%3E";
    }

    return new URL(template.replace("{size}", String(size || 96)), baseOrigin || globalThis.location?.origin || "").toString();
  }

  function normalizeAvatarUrl(url, baseOrigin) {
    const value = String(url || "").trim();
    if (!value) {
      return "";
    }

    try {
      return new URL(value, baseOrigin || globalThis.location?.origin || "").toString();
    } catch {
      return "";
    }
  }

  function deriveAnimatedAvatarUrl(url, baseOrigin, size = 96) {
    const normalized = normalizeAvatarUrl(url, baseOrigin);
    if (!normalized) {
      return "";
    }

    try {
      const parsed = new URL(normalized);
      if (!/\/user_avatar\//.test(parsed.pathname) || !/\.png$/i.test(parsed.pathname)) {
        return "";
      }

      parsed.pathname = parsed.pathname.replace(/\/(?:\{size\}|%7Bsize%7D)\//i, `/${String(size || 96)}/`);
      parsed.pathname = parsed.pathname.replace(/\.png$/i, ".gif");
      parsed.hostname = "cdn.ldstatic.com";
      return parsed.toString();
    } catch {
      return "";
    }
  }

  function getAvatarCandidateUrls(avatar, baseOrigin, options = {}) {
    const size = Number(options.size) || 96;
    const animatedSize = Number(options.animatedSize) || size;
    const fallbackSize = Number(options.fallbackAnimatedSize) || (size < 48 ? 48 : 0);
    const avatarUrlValue = typeof avatar === "string"
      ? avatar
      : (avatar?.avatarUrl || avatar?.url || avatar?.src || "");
    const avatarTemplate = typeof avatar === "object" && avatar
      ? (avatar.avatarTemplate || avatar.template || "")
      : "";
    const candidates = [];
    const seen = new Set();

    const push = (value) => {
      const normalized = normalizeAvatarUrl(value, baseOrigin);
      if (!normalized || seen.has(normalized)) {
        return;
      }
      seen.add(normalized);
      candidates.push(normalized);
    };

    push(deriveAnimatedAvatarUrl(avatarUrlValue, baseOrigin, animatedSize));
    if (fallbackSize && fallbackSize !== animatedSize) {
      push(deriveAnimatedAvatarUrl(avatarUrlValue, baseOrigin, fallbackSize));
    }
    push(deriveAnimatedAvatarUrl(avatarTemplate, baseOrigin, animatedSize));
    if (fallbackSize && fallbackSize !== animatedSize) {
      push(deriveAnimatedAvatarUrl(avatarTemplate, baseOrigin, fallbackSize));
    }
    push(avatarUrlValue);
    push(avatarTemplate ? avatarUrl(avatarTemplate, baseOrigin, size) : "");

    if (!candidates.length) {
      candidates.push(avatarUrl("", baseOrigin, size));
    }

    return candidates;
  }

  function applyAvatarImage(image, avatar, baseOrigin, options = {}) {
    if (!(image instanceof HTMLImageElement)) {
      return;
    }

    const candidates = getAvatarCandidateUrls(avatar, baseOrigin, options);
    let index = 0;
    image.onerror = () => {
      index += 1;
      if (index >= candidates.length) {
        image.onerror = null;
        return;
      }
      image.src = candidates[index];
    };
    image.src = candidates[0];
  }

  runtime.topicRenderUtils = {
    getTagLabel,
    buildTopicMeta,
    buildPostMeta,
    avatarUrl,
    applyAvatarImage
  };
})();
