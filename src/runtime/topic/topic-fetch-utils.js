(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function renderLoading() {
    return `
      <div class="ld-loading-state" aria-label="loading">
        <div class="ld-post-card ld-post-card-skeleton" aria-hidden="true">
          <div class="ld-post-skeleton-header">
            <span class="ld-post-skeleton-avatar"></span>
            <span class="ld-post-skeleton-meta">
              <span class="ld-post-skeleton-author-row">
                <span class="ld-post-skeleton-block ld-post-skeleton-name"></span>
                <span class="ld-post-skeleton-badge"></span>
              </span>
              <span class="ld-post-skeleton-block ld-post-skeleton-time"></span>
            </span>
          </div>
          <div class="ld-post-skeleton-body">
            <span class="ld-post-skeleton-block ld-post-skeleton-title"></span>
            <span class="ld-post-skeleton-text">
              <span class="ld-post-skeleton-block ld-post-skeleton-line"></span>
              <span class="ld-post-skeleton-block ld-post-skeleton-line ld-post-skeleton-line-wide"></span>
              <span class="ld-post-skeleton-block ld-post-skeleton-line ld-post-skeleton-line-short"></span>
            </span>
          </div>
          <div class="ld-post-skeleton-toolbar">
            <span class="ld-post-skeleton-tools">
              <span class="ld-post-skeleton-tool">
                <span class="ld-post-skeleton-icon"></span>
                <span class="ld-post-skeleton-block ld-post-skeleton-count"></span>
              </span>
              <span class="ld-post-skeleton-tool">
                <span class="ld-post-skeleton-icon"></span>
                <span class="ld-post-skeleton-block ld-post-skeleton-count"></span>
              </span>
            </span>
            <span class="ld-post-skeleton-icon ld-post-skeleton-icon-bookmark"></span>
          </div>
        </div>
        <div class="ld-post-card ld-post-card-skeleton" aria-hidden="true">
          <div class="ld-post-skeleton-header">
            <span class="ld-post-skeleton-avatar"></span>
            <span class="ld-post-skeleton-meta">
              <span class="ld-post-skeleton-author-row">
                <span class="ld-post-skeleton-block ld-post-skeleton-name"></span>
                <span class="ld-post-skeleton-badge"></span>
              </span>
              <span class="ld-post-skeleton-block ld-post-skeleton-time"></span>
            </span>
          </div>
          <div class="ld-post-skeleton-body">
            <span class="ld-post-skeleton-block ld-post-skeleton-title"></span>
            <span class="ld-post-skeleton-text">
              <span class="ld-post-skeleton-block ld-post-skeleton-line"></span>
              <span class="ld-post-skeleton-block ld-post-skeleton-line ld-post-skeleton-line-wide"></span>
              <span class="ld-post-skeleton-block ld-post-skeleton-line ld-post-skeleton-line-short"></span>
            </span>
          </div>
          <div class="ld-post-skeleton-toolbar">
            <span class="ld-post-skeleton-tools">
              <span class="ld-post-skeleton-tool">
                <span class="ld-post-skeleton-icon"></span>
                <span class="ld-post-skeleton-block ld-post-skeleton-count"></span>
              </span>
              <span class="ld-post-skeleton-tool">
                <span class="ld-post-skeleton-icon"></span>
                <span class="ld-post-skeleton-block ld-post-skeleton-count"></span>
              </span>
            </span>
            <span class="ld-post-skeleton-icon ld-post-skeleton-icon-bookmark"></span>
          </div>
        </div>
        <div class="ld-post-card ld-post-card-skeleton" aria-hidden="true">
          <div class="ld-post-skeleton-header">
            <span class="ld-post-skeleton-avatar"></span>
            <span class="ld-post-skeleton-meta">
              <span class="ld-post-skeleton-author-row">
                <span class="ld-post-skeleton-block ld-post-skeleton-name"></span>
                <span class="ld-post-skeleton-badge"></span>
              </span>
              <span class="ld-post-skeleton-block ld-post-skeleton-time"></span>
            </span>
          </div>
          <div class="ld-post-skeleton-body">
            <span class="ld-post-skeleton-block ld-post-skeleton-title"></span>
            <span class="ld-post-skeleton-text">
              <span class="ld-post-skeleton-block ld-post-skeleton-line"></span>
              <span class="ld-post-skeleton-block ld-post-skeleton-line ld-post-skeleton-line-wide"></span>
              <span class="ld-post-skeleton-block ld-post-skeleton-line ld-post-skeleton-line-short"></span>
            </span>
          </div>
          <div class="ld-post-skeleton-toolbar">
            <span class="ld-post-skeleton-tools">
              <span class="ld-post-skeleton-tool">
                <span class="ld-post-skeleton-icon"></span>
                <span class="ld-post-skeleton-block ld-post-skeleton-count"></span>
              </span>
              <span class="ld-post-skeleton-tool">
                <span class="ld-post-skeleton-icon"></span>
                <span class="ld-post-skeleton-block ld-post-skeleton-count"></span>
              </span>
            </span>
            <span class="ld-post-skeleton-icon ld-post-skeleton-icon-bookmark"></span>
          </div>
        </div>
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
