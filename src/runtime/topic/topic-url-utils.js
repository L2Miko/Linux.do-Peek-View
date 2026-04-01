(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function getTopicPostTargetUrl(topicUrl, postNumber, topicIdHint = null, deps = {}) {
    const targetPostNumber = Number(postNumber);
    if (!Number.isFinite(targetPostNumber) || targetPostNumber <= 0) {
      return topicUrl;
    }

    const { parseTopicPath, stripTrailingSlash } = deps;
    const url = new URL(topicUrl);
    const parsed = typeof parseTopicPath === "function"
      ? parseTopicPath(url.pathname, topicIdHint)
      : null;

    url.hash = "";
    url.search = "";
    url.pathname = parsed?.topicPath
      ? `${parsed.topicPath}/${targetPostNumber}`
      : `${typeof stripTrailingSlash === "function" ? stripTrailingSlash(url.pathname) : url.pathname}/${targetPostNumber}`;

    return url.toString().replace(/\/$/, "");
  }

  function toTopicJsonUrl(topicUrl, options = {}, deps = {}) {
    const { canonical = false, trackVisit = true, topicIdHint = null } = options;
    const { parseTopicPath, stripTrailingSlash } = deps;
    const url = new URL(topicUrl);
    const parsed = typeof parseTopicPath === "function"
      ? parseTopicPath(url.pathname, topicIdHint)
      : null;

    url.hash = "";
    url.search = "";
    const normalizedPath = typeof stripTrailingSlash === "function"
      ? stripTrailingSlash(url.pathname)
      : url.pathname;
    url.pathname = `${canonical ? (parsed?.topicPath || normalizedPath) : normalizedPath}.json`;
    if (trackVisit) {
      url.searchParams.set("track_visit", "true");
    }
    return url.toString();
  }

  function toTopicPostsJsonUrl(topicUrl, postIds, topicIdHint = null, deps = {}) {
    const { parseTopicPath, stripTrailingSlash } = deps;
    const url = new URL(topicUrl);
    const parsed = typeof parseTopicPath === "function"
      ? parseTopicPath(url.pathname, topicIdHint)
      : null;

    url.hash = "";
    url.search = "";
    url.pathname = parsed?.topicId
      ? `/t/${parsed.topicId}/posts.json`
      : `${typeof stripTrailingSlash === "function" ? stripTrailingSlash(url.pathname) : url.pathname}/posts.json`;

    for (const postId of postIds || []) {
      if (Number.isFinite(postId)) {
        url.searchParams.append("post_ids[]", String(postId));
      }
    }

    return url.toString().replace(/\/$/, "");
  }

  function buildTopicRequestHeaders(topicId) {
    const headers = {
      Accept: "application/json"
    };

    if (topicId) {
      headers["Discourse-Track-View"] = "true";
      headers["Discourse-Track-View-Topic-Id"] = String(topicId);
    }

    return headers;
  }

  runtime.topicUrlUtils = {
    getTopicPostTargetUrl,
    toTopicJsonUrl,
    toTopicPostsJsonUrl,
    buildTopicRequestHeaders
  };
})();
