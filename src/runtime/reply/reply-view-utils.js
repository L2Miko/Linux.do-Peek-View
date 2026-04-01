(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function getFirstTopicPost(topic) {
    const posts = topic?.post_stream?.posts || [];
    return posts.find((post) => post?.post_number === 1) || posts[0] || null;
  }

  function appendCreatedReplyToCurrentTopic(state, createdPost, options = {}) {
    const mergeTopicPreviewData = options.mergeTopicPreviewData;
    const getTopicStreamIds = options.getTopicStreamIds;
    const getLoadedTopicPostIds = options.getLoadedTopicPostIds;
    const renderTopic = options.renderTopic;
    const requestAnimationFrameFn = options.requestAnimationFrameFn || globalThis.requestAnimationFrame;
    if (
      !state
      || !state.currentTopic
      || !createdPost
      || typeof createdPost !== "object"
      || typeof mergeTopicPreviewData !== "function"
      || typeof getTopicStreamIds !== "function"
      || typeof getLoadedTopicPostIds !== "function"
      || typeof renderTopic !== "function"
      || typeof requestAnimationFrameFn !== "function"
    ) {
      return;
    }

    const createdPostId = Number(createdPost.id);
    const createdPostNumber = Number(createdPost.post_number);
    if (!Number.isFinite(createdPostId) || !Number.isFinite(createdPostNumber)) {
      return;
    }

    const previousScrollTop = state.drawerBody?.scrollTop || 0;
    const nextTopic = mergeTopicPreviewData(state.currentTopic, {
      posts_count: Math.max(
        Number(state.currentTopic.posts_count || 0),
        Number(createdPost.topic_posts_count || 0),
        (state.currentTopic.post_stream?.posts || []).length + 1
      ),
      post_stream: {
        stream: [createdPostId],
        posts: [createdPost]
      }
    }, getTopicStreamIds, getLoadedTopicPostIds);

    renderTopic(nextTopic, state.currentUrl, state.currentFallbackTitle, null, {
      targetSpec: state.currentTargetSpec,
      preserveScrollTop: previousScrollTop
    });

    requestAnimationFrameFn(() => {
      const target = state.content?.querySelector(`.ld-post-card[data-post-number="${createdPostNumber}"]`);
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

  runtime.replyViewUtils = {
    getFirstTopicPost,
    appendCreatedReplyToCurrentTopic
  };
})();
