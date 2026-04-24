(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function syncLoadMorePlaceholders(state, options = {}) {
    const documentRef = options.documentRef || globalThis.document;
    if (!state?.loadMorePlaceholderContainer || !documentRef) {
      return;
    }

    const count = Math.max(0, Number(state.loadMorePlaceholderCount) || 0);
    const container = state.loadMorePlaceholderContainer;
    container.hidden = count <= 0;
    if (count <= 0) {
      container.replaceChildren();
      return;
    }

    const fragment = documentRef.createDocumentFragment();
    for (let index = 0; index < count; index += 1) {
      const card = documentRef.createElement("div");
      card.className = "ld-post-card ld-post-card-skeleton";
      card.setAttribute("aria-hidden", "true");
      card.innerHTML = `
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
      `;
      fragment.appendChild(card);
    }

    container.replaceChildren(fragment);
  }

  function syncAutoLoadProgressHint(state, options = {}) {
    void state;
    void options;
  }

  function updateLoadMoreStatus(state, options = {}) {
    const hasMoreTopicPosts = options.hasMoreTopicPostsBelowLoadedTail || options.hasMoreTopicPosts;
    syncLoadMorePlaceholders(state, options);
    if (!state?.loadMoreStatus) {
      return;
    }

    if (!state.currentTopic) {
      state.loadMoreStatus.textContent = "";
      state.loadMoreStatus.hidden = true;
      return;
    }

    state.loadMoreStatus.hidden = false;
    state.loadMoreStatus.classList.remove("is-loading", "is-error");
    if (state.isLoadingMorePosts) {
      state.loadMoreStatus.textContent = "";
      state.loadMoreStatus.classList.add("is-loading");
      return;
    }
    if (state.loadMoreError) {
      state.loadMoreStatus.textContent = `加载更多失败：${state.loadMoreError}`;
      state.loadMoreStatus.classList.add("is-error");
      return;
    }
    if (typeof hasMoreTopicPosts === "function" && hasMoreTopicPosts(state.currentTopic)) {
      state.loadMoreStatus.textContent = "";
      return;
    }
    state.loadMoreStatus.textContent = "";
    state.loadMoreStatus.hidden = true;
  }

  runtime.drawerStatusUtils = {
    syncLoadMorePlaceholders,
    syncAutoLoadProgressHint,
    updateLoadMoreStatus
  };
})();
