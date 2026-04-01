(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function queueAutoLoadCheck(options = {}) {
    const requestAnimationFrameFn = options.requestAnimationFrameFn || globalThis.requestAnimationFrame;
    const maybeLoadMorePosts = options.maybeLoadMorePosts;
    if (typeof requestAnimationFrameFn !== "function" || typeof maybeLoadMorePosts !== "function") {
      return;
    }

    requestAnimationFrameFn(() => {
      maybeLoadMorePosts();
    });
  }

  function maybeLoadMorePosts(state, options = {}) {
    const hasMoreTopicPosts = options.hasMoreTopicPosts;
    const updateLoadMoreStatus = options.updateLoadMoreStatus;
    const loadMorePosts = options.loadMorePosts;
    const loadMoreTriggerOffset = Number(options.loadMoreTriggerOffset || 0);
    if (
      !state
      || typeof hasMoreTopicPosts !== "function"
      || typeof updateLoadMoreStatus !== "function"
      || typeof loadMorePosts !== "function"
    ) {
      return;
    }

    if (!state.drawerBody || !state.currentTopic) {
      return;
    }

    if (state.isLoadingMorePosts || !hasMoreTopicPosts(state.currentTopic)) {
      updateLoadMoreStatus();
      return;
    }

    const remainingDistance = state.drawerBody.scrollHeight - state.drawerBody.scrollTop - state.drawerBody.clientHeight;
    if (remainingDistance > loadMoreTriggerOffset) {
      updateLoadMoreStatus();
      return;
    }

    loadMorePosts().catch(() => {});
  }

  async function appendPostsToCurrentTopicView(state, newPosts, expectedUrl, signal, nextTopic, options = {}) {
    const HTMLElementClass = options.HTMLElementClass || globalThis.HTMLElement;
    const buildPostCard = options.buildPostCard;
    const updateReactionOptionsFromTopicPayload = options.updateReactionOptionsFromTopicPayload;
    const renderTopicMeta = options.renderTopicMeta;
    const syncReplyUI = options.syncReplyUI;
    const syncAutoLoadProgressHint = options.syncAutoLoadProgressHint;
    const syncReadTracking = options.syncReadTracking;
    const queueAutoLoadCheck = options.queueAutoLoadCheck;
    const requestAnimationFrameFn = options.requestAnimationFrameFn || globalThis.requestAnimationFrame;
    if (
      !state
      || typeof buildPostCard !== "function"
      || typeof updateReactionOptionsFromTopicPayload !== "function"
      || typeof renderTopicMeta !== "function"
      || typeof syncReplyUI !== "function"
      || typeof syncAutoLoadProgressHint !== "function"
      || typeof syncReadTracking !== "function"
      || typeof queueAutoLoadCheck !== "function"
      || typeof requestAnimationFrameFn !== "function"
    ) {
      return false;
    }

    if (!Array.isArray(newPosts) || newPosts.length === 0) {
      return false;
    }
    if (!(state.content instanceof HTMLElementClass) || !(state.drawerBody instanceof HTMLElementClass)) {
      return false;
    }
    const postList = state.content.querySelector(".ld-topic-view .ld-topic-post-list");
    if (!(postList instanceof HTMLElementClass)) {
      return false;
    }
    const footer = postList.querySelector(":scope > .ld-topic-footer");

    const existingPostNumbers = new Set(
      Array.from(postList.querySelectorAll(".ld-post-card[data-post-number]"))
        .map((item) => Number(item.dataset.postNumber))
        .filter((postNumber) => Number.isFinite(postNumber))
    );
    const pendingPosts = newPosts
      .filter((post) => Number.isFinite(Number(post?.post_number)))
      .sort((left, right) => Number(left.post_number) - Number(right.post_number))
      .filter((post) => !existingPostNumbers.has(Number(post.post_number)));

    if (!pendingPosts.length) {
      state.currentTopic = nextTopic;
      renderTopicMeta(nextTopic, (nextTopic.post_stream?.posts || []).length);
      updateReactionOptionsFromTopicPayload(nextTopic);
      syncReplyUI();
      syncAutoLoadProgressHint();
      syncReadTracking(nextTopic.post_stream?.posts || []);
      return true;
    }

    const chunkSize = 6;
    for (let index = 0; index < pendingPosts.length; index += chunkSize) {
      if (signal?.aborted || state.currentUrl !== expectedUrl) {
        return false;
      }

      const fragment = globalThis.document.createDocumentFragment();
      for (const post of pendingPosts.slice(index, index + chunkSize)) {
        fragment.appendChild(buildPostCard(post));
      }
      if (footer instanceof HTMLElementClass && footer.parentElement === postList) {
        postList.insertBefore(fragment, footer);
      } else {
        postList.appendChild(fragment);
      }

      // Yield one frame between chunks to avoid long main-thread stalls.
      await new Promise((resolve) => {
        requestAnimationFrameFn(() => resolve());
      });
    }

    state.currentTopic = nextTopic;
    updateReactionOptionsFromTopicPayload(nextTopic);
    renderTopicMeta(nextTopic, (nextTopic.post_stream?.posts || []).length);
    syncReplyUI();
    syncAutoLoadProgressHint();
    syncReadTracking(nextTopic.post_stream?.posts || []);
    queueAutoLoadCheck();
    return true;
  }

  async function loadMorePosts(state, options = {}) {
    const getNextTopicPostIdsAfterLoadedTail = options.getNextTopicPostIdsAfterLoadedTail;
    const getNextTopicPostIds = options.getNextTopicPostIds;
    const updateLoadMoreStatus = options.updateLoadMoreStatus;
    const cancelLoadMoreRequest = options.cancelLoadMoreRequest;
    const fetchTopicPostsBatch = options.fetchTopicPostsBatch;
    const mergeTopicPreviewData = options.mergeTopicPreviewData;
    const getTopicStreamIds = options.getTopicStreamIds;
    const getLoadedTopicPostIds = options.getLoadedTopicPostIds;
    const appendPostsToCurrentTopicView = options.appendPostsToCurrentTopicView;
    const renderTopic = options.renderTopic;
    if (
      !state
      || (
        typeof getNextTopicPostIdsAfterLoadedTail !== "function"
        && typeof getNextTopicPostIds !== "function"
      )
      || typeof updateLoadMoreStatus !== "function"
      || typeof cancelLoadMoreRequest !== "function"
      || typeof fetchTopicPostsBatch !== "function"
      || typeof mergeTopicPreviewData !== "function"
      || typeof getTopicStreamIds !== "function"
      || typeof getLoadedTopicPostIds !== "function"
      || typeof appendPostsToCurrentTopicView !== "function"
      || typeof renderTopic !== "function"
    ) {
      return;
    }

    if (!state.currentTopic || state.isLoadingMorePosts) {
      return;
    }

    const nextPostIds = typeof getNextTopicPostIdsAfterLoadedTail === "function"
      ? getNextTopicPostIdsAfterLoadedTail(state.currentTopic)
      : getNextTopicPostIds(state.currentTopic);
    if (!nextPostIds.length) {
      updateLoadMoreStatus();
      return;
    }

    cancelLoadMoreRequest();
    state.isLoadingMorePosts = true;
    state.loadMoreError = "";
    updateLoadMoreStatus();

    const controller = new AbortController();
    const currentUrl = state.currentUrl;
    const previousScrollTop = state.drawerBody?.scrollTop || 0;
    state.loadMoreAbortController = controller;

    try {
      const posts = await fetchTopicPostsBatch(currentUrl, nextPostIds, controller.signal, state.currentTopicIdHint);
      if (controller.signal.aborted || state.currentUrl !== currentUrl || !posts.length) {
        return;
      }

      const nextTopic = mergeTopicPreviewData(state.currentTopic, {
        posts_count: state.currentTopic.posts_count,
        post_stream: {
          posts
        }
      }, getTopicStreamIds, getLoadedTopicPostIds);

      const appended = await appendPostsToCurrentTopicView(posts, currentUrl, controller.signal, nextTopic);
      if (controller.signal.aborted || state.currentUrl !== currentUrl) {
        return;
      }

      state.isLoadingMorePosts = false;
      state.loadMoreError = "";
      if (!appended) {
        renderTopic(nextTopic, currentUrl, state.currentFallbackTitle, state.currentResolvedTargetPostNumber, {
          targetSpec: state.currentTargetSpec,
          preserveScrollTop: previousScrollTop
        });
      }
      updateLoadMoreStatus();
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      state.isLoadingMorePosts = false;
      state.loadMoreError = error?.message || "加载更多失败";
      updateLoadMoreStatus();
    } finally {
      if (state.loadMoreAbortController === controller) {
        state.loadMoreAbortController = null;
      }
    }
  }

  runtime.topicLoadMoreUtils = {
    queueAutoLoadCheck,
    maybeLoadMorePosts,
    appendPostsToCurrentTopicView,
    loadMorePosts
  };
})();
