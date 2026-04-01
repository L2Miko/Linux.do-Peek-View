(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function renderLoading() {
    return `
      <div class="ld-loading-state" aria-label="loading">
        <div class="ld-loading-bar"></div>
        <div class="ld-loading-bar ld-loading-bar-short"></div>
        <div class="ld-loading-card"></div>
        <div class="ld-loading-card"></div>
      </div>
    `;
  }

  async function fetchTopicPostsBatch(topicUrl, postIds, signal, topicIdHint = null, options = {}) {
    const fetchImpl = options.fetchImpl || globalThis.fetch?.bind(globalThis);
    const toTopicPostsJsonUrl = options.toTopicPostsJsonUrl;
    const parseTopicPath = options.parseTopicPath;
    const stripTrailingSlash = options.stripTrailingSlash;
    if (
      typeof fetchImpl !== "function"
      || typeof toTopicPostsJsonUrl !== "function"
      || typeof parseTopicPath !== "function"
      || typeof stripTrailingSlash !== "function"
    ) {
      throw new Error("Unexpected response: 0");
    }

    const response = await fetchImpl(toTopicPostsJsonUrl(topicUrl, postIds, topicIdHint, {
      parseTopicPath,
      stripTrailingSlash
    }), {
      credentials: "include",
      signal,
      headers: {
        Accept: "application/json"
      }
    });

    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.includes("json")) {
      throw new Error(`Unexpected response: ${response.status}`);
    }

    const data = await response.json();
    return data?.post_stream?.posts || [];
  }

  runtime.topicFetchUtils = {
    renderLoading,
    fetchTopicPostsBatch
  };
})();
