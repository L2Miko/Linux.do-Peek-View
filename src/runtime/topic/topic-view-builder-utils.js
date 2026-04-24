(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function buildTopicView(state, topic, viewModel, options = {}) {
    const documentRef = options.documentRef || globalThis.document;
    const buildPostCard = options.buildPostCard;
    if (
      !state
      || !documentRef
      || typeof buildPostCard !== "function"
    ) {
      return documentRef ? documentRef.createElement("div") : null;
    }

    const wrapper = documentRef.createElement("div");
    wrapper.className = "ld-topic-view";

    const visiblePosts = viewModel.posts;

    const postList = documentRef.createElement("div");
    postList.className = "ld-topic-post-list";

    for (const post of visiblePosts) {
      postList.appendChild(buildPostCard(post));
    }

    wrapper.appendChild(postList);

    if (viewModel.canAutoLoadMore) {
      const footer = documentRef.createElement("div");
      footer.className = "ld-topic-footer";
      const placeholders = documentRef.createElement("div");
      placeholders.className = "ld-topic-load-more-placeholders";
      placeholders.hidden = true;
      const status = documentRef.createElement("div");
      status.className = "ld-topic-note-loading";
      status.setAttribute("aria-live", "polite");
      status.setAttribute("aria-label", "继续下滑可自动加载后续回复");
      footer.append(placeholders, status);
      state.loadMoreStatus = status;
      state.loadMorePlaceholderContainer = placeholders;
      postList.appendChild(footer);
      return wrapper;
    }

    state.loadMoreStatus = null;
    state.loadMorePlaceholderContainer = null;
    return wrapper;
  }

  function buildTopicViewModel(topic, targetSpec = null, forcedTargetPostNumber = null, options = {}) {
    const hasMoreTopicPosts = options.hasMoreTopicPosts;
    const hasMoreTopicPostsBelowLoadedTail = options.hasMoreTopicPostsBelowLoadedTail;
    if (typeof hasMoreTopicPosts !== "function") {
      return {
        posts: topic?.post_stream?.posts || [],
        mode: "default",
        canAutoLoadMore: true,
        hasHiddenPosts: false
      };
    }

    const posts = topic?.post_stream?.posts || [];
    const moreAvailable = hasMoreTopicPosts(topic);
    const moreAvailableBelowLoadedTail = typeof hasMoreTopicPostsBelowLoadedTail === "function"
      ? hasMoreTopicPostsBelowLoadedTail(topic)
      : moreAvailable;
    const effectiveTargetPostNumber = Number(targetSpec?.targetPostNumber || forcedTargetPostNumber);

    if (Number.isFinite(effectiveTargetPostNumber) && effectiveTargetPostNumber > 0) {
      return {
        posts,
        mode: "targeted",
        canAutoLoadMore: moreAvailableBelowLoadedTail,
        hasHiddenPosts: moreAvailable
      };
    }

    return {
      posts,
      mode: "default",
      canAutoLoadMore: moreAvailableBelowLoadedTail,
      hasHiddenPosts: moreAvailable
    };
  }

  runtime.topicViewBuilderUtils = {
    buildTopicView,
    buildTopicViewModel
  };
})();
