(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function stripTrailingSlash(pathname) {
    return pathname.replace(/\/+$/, "") || pathname;
  }

  function parseTopicPath(pathname, topicIdHint = null) {
    const trimmedPath = stripTrailingSlash(pathname);
    const segments = trimmedPath.split("/");
    const first = segments[2] || "";
    const second = segments[3] || "";

    if (segments[1] !== "t") {
      return null;
    }

    const firstIsNumber = /^\d+$/.test(first);
    const secondIsNumber = /^\d+$/.test(second);

    let topicId = null;
    let topicPath = "";
    let extraSegments = [];

    if (firstIsNumber) {
      topicId = Number(first);
      topicPath = `/t/${first}`;
      extraSegments = segments.slice(3).filter(Boolean);
    } else if (secondIsNumber) {
      topicId = Number(second);
      topicPath = `/t/${first}/${second}`;
      extraSegments = segments.slice(4).filter(Boolean);
    } else {
      return null;
    }

    const destinationPath = extraSegments.length > 0
      ? `${topicPath}/${extraSegments.join("/")}`
      : topicPath;
    const targetPostNumber = /^\d+$/.test(extraSegments[0] || "")
      ? Number(extraSegments[0])
      : null;
    const targetToken = !targetPostNumber && extraSegments[0]
      ? String(extraSegments[0])
      : null;

    return {
      topicId,
      topicPath,
      destinationPath,
      targetSegments: extraSegments,
      targetPostNumber,
      targetToken
    };
  }

  function normalizeTopicUrl(url) {
    const parsed = parseTopicPath(url.pathname);
    url.hash = "";
    url.search = "";
    url.pathname = parsed?.destinationPath || stripTrailingSlash(url.pathname);
    return url.toString().replace(/\/$/, "");
  }

  function getTopicIdFromUrl(topicUrl, topicIdHint = null) {
    try {
      return parseTopicPath(new URL(topicUrl).pathname, topicIdHint)?.topicId || null;
    } catch {
      return null;
    }
  }

  function getTopicTargetSpec(topicUrl, topicIdHint = null) {
    try {
      const parsed = parseTopicPath(new URL(topicUrl).pathname, topicIdHint);
      if (!parsed) {
        return null;
      }

      return {
        hasTarget: parsed.targetSegments.length > 0,
        targetSegments: parsed.targetSegments,
        targetPostNumber: parsed.targetPostNumber,
        targetToken: parsed.targetToken
      };
    } catch {
      return null;
    }
  }

  function getTopicTrackingKey(topicUrl, topicIdHint = null) {
    try {
      const parsed = parseTopicPath(new URL(topicUrl).pathname, topicIdHint);
      if (parsed?.topicId) {
        return `topic:${parsed.topicId}`;
      }
      return parsed?.topicPath || topicUrl;
    } catch {
      return topicUrl;
    }
  }

  runtime.topicPath = {
    stripTrailingSlash,
    parseTopicPath,
    normalizeTopicUrl,
    getTopicIdFromUrl,
    getTopicTargetSpec,
    getTopicTrackingKey
  };
})();
