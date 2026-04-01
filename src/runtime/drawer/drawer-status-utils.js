(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function syncAutoLoadProgressHint(state, options = {}) {
    void state;
    void options;
  }

  function updateLoadMoreStatus(state, options = {}) {
    const hasMoreTopicPosts = options.hasMoreTopicPostsBelowLoadedTail || options.hasMoreTopicPosts;
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
    syncAutoLoadProgressHint,
    updateLoadMoreStatus
  };
})();
