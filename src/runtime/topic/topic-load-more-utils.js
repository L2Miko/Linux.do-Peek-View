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
    const updateLoadMoreStatus = options.updateLoadMoreStatus;
    const requestAnimationFrameFn = options.requestAnimationFrameFn || globalThis.requestAnimationFrame;
    const renderChunkSize = Math.max(1, Number(options.renderChunkSize) || 6);
    if (
      !state
      || typeof buildPostCard !== "function"
      || typeof updateReactionOptionsFromTopicPayload !== "function"
      || typeof renderTopicMeta !== "function"
      || typeof syncReplyUI !== "function"
      || typeof syncAutoLoadProgressHint !== "function"
      || typeof syncReadTracking !== "function"
      || typeof queueAutoLoadCheck !== "function"
      || typeof updateLoadMoreStatus !== "function"
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
      state.loadMorePlaceholderCount = 0;
      state.currentTopic = nextTopic;
      renderTopicMeta(nextTopic, (nextTopic.post_stream?.posts || []).length);
      updateReactionOptionsFromTopicPayload(nextTopic);
      syncReplyUI();
      syncAutoLoadProgressHint();
      updateLoadMoreStatus();
      syncReadTracking(nextTopic.post_stream?.posts || [], []);
      return true;
    }

    const appendedCards = [];
    for (let index = 0; index < pendingPosts.length; index += renderChunkSize) {
      if (signal?.aborted || state.currentUrl !== expectedUrl) {
        return false;
      }

      const fragment = globalThis.document.createDocumentFragment();
      for (const post of pendingPosts.slice(index, index + renderChunkSize)) {
        const card = buildPostCard(post);
        appendedCards.push(card);
        fragment.appendChild(card);
      }
      if (footer instanceof HTMLElementClass && footer.parentElement === postList) {
        postList.insertBefore(fragment, footer);
      } else {
        postList.appendChild(fragment);
      }
      state.loadMorePlaceholderCount = Math.max(0, state.loadMorePlaceholderCount - Math.min(renderChunkSize, pendingPosts.length - index));
      updateLoadMoreStatus();

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
    syncReadTracking(nextTopic.post_stream?.posts || [], appendedCards);
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
    const earlyBatchSize = Math.max(1, Number(options.earlyBatchSize) || 6);
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
      const earlyPostIds = nextPostIds.slice(0, earlyBatchSize);
      const deferredPostIds = nextPostIds.slice(earlyBatchSize);
      state.loadMorePlaceholderCount = nextPostIds.length;
      updateLoadMoreStatus();

      const applyFetchedPosts = async (posts) => {
        if (controller.signal.aborted || state.currentUrl !== currentUrl || !posts.length) {
          return;
        }

        const mergedTopic = mergeTopicPreviewData(state.currentTopic, {
          posts_count: state.currentTopic?.posts_count,
          post_stream: {
            posts
          }
        }, getTopicStreamIds, getLoadedTopicPostIds);

        const appended = await appendPostsToCurrentTopicView(posts, currentUrl, controller.signal, mergedTopic);
        if (controller.signal.aborted || state.currentUrl !== currentUrl) {
          return;
        }

        if (!appended) {
          renderTopic(mergedTopic, currentUrl, state.currentFallbackTitle, state.currentResolvedTargetPostNumber, {
            targetSpec: state.currentTargetSpec,
            preserveScrollTop: previousScrollTop
          });
        }
      };

      const createDeferredPostsPromise = (postIds) => fetchTopicPostsBatch(
        currentUrl,
        postIds,
        controller.signal,
        state.currentTopicIdHint
      ).then(
        (posts) => ({ posts, error: null }),
        (error) => ({ posts: [], error })
      );

      let deferredPostsPromise = null;
      if (earlyPostIds.length) {
        const earlyPosts = await fetchTopicPostsBatch(currentUrl, earlyPostIds, controller.signal, state.currentTopicIdHint);
        if (deferredPostIds.length && !controller.signal.aborted && state.currentUrl === currentUrl) {
          deferredPostsPromise = createDeferredPostsPromise(deferredPostIds);
        }
        await applyFetchedPosts(earlyPosts);
      } else if (deferredPostIds.length) {
        deferredPostsPromise = createDeferredPostsPromise(deferredPostIds);
      }

      if (deferredPostsPromise && !controller.signal.aborted && state.currentUrl === currentUrl) {
        const deferredResult = await deferredPostsPromise;
        if (deferredResult?.error) {
          throw deferredResult.error;
        }
        await applyFetchedPosts(deferredResult?.posts || []);
      }

      if (controller.signal.aborted || state.currentUrl !== currentUrl) {
        return;
      }

      state.isLoadingMorePosts = false;
      state.loadMoreError = "";
      state.loadMorePlaceholderCount = 0;
      updateLoadMoreStatus();
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      state.isLoadingMorePosts = false;
      state.loadMoreError = error?.message || "加载更多失败";
      state.loadMorePlaceholderCount = 0;
      updateLoadMoreStatus();
    } finally {
      if (state.loadMoreAbortController === controller && controller.signal.aborted) {
        state.isLoadingMorePosts = false;
        state.loadMorePlaceholderCount = 0;
        updateLoadMoreStatus();
      }
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
