(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function defaultTopicHasPostNumber(topic, postNumber) {
    if (runtime.topicStream?.topicHasPostNumber) {
      return runtime.topicStream.topicHasPostNumber(topic, postNumber);
    }
    if (!postNumber) {
      return false;
    }
    return (topic?.post_stream?.posts || []).some((post) => post?.post_number === postNumber);
  }

  function defaultTopicHasCompletePostStream(topic) {
    if (runtime.topicStream?.topicHasCompletePostStream) {
      return runtime.topicStream.topicHasCompletePostStream(topic);
    }
    return false;
  }

  function shouldFetchTargetedTopic(
    topic,
    targetSpec,
    topicHasPostNumber = defaultTopicHasPostNumber,
    topicHasCompletePostStream = defaultTopicHasCompletePostStream
  ) {
    if (!targetSpec?.hasTarget) {
      return false;
    }

    if (targetSpec.targetPostNumber) {
      return !topicHasPostNumber(topic, targetSpec.targetPostNumber);
    }

    if (targetSpec.targetToken === "last") {
      return !topicHasCompletePostStream(topic);
    }

    return true;
  }

  function shouldFetchLastReadTargetedTopic(
    topic,
    targetSpec,
    lastReadPostNumber,
    topicHasPostNumber = defaultTopicHasPostNumber
  ) {
    if (targetSpec?.hasTarget) {
      return false;
    }

    const target = Number(lastReadPostNumber);
    if (!Number.isFinite(target) || target <= 1) {
      return false;
    }

    return !topicHasPostNumber(topic, target);
  }

  function resolveTopicTargetPostNumber(
    targetSpec,
    topic,
    targetedTopic,
    topicHasPostNumber = defaultTopicHasPostNumber,
    topicHasCompletePostStream = defaultTopicHasCompletePostStream
  ) {
    if (!targetSpec?.hasTarget) {
      return null;
    }

    if (targetSpec.targetPostNumber) {
      if (topicHasPostNumber(targetedTopic, targetSpec.targetPostNumber) || topicHasPostNumber(topic, targetSpec.targetPostNumber)) {
        return targetSpec.targetPostNumber;
      }
      return null;
    }

    const sourcePosts = targetedTopic?.post_stream?.posts || [];
    if (sourcePosts.length > 0) {
      if (targetSpec.targetToken === "last") {
        return sourcePosts[sourcePosts.length - 1]?.post_number || null;
      }
      return sourcePosts[0]?.post_number || null;
    }

    const fallbackPosts = topic?.post_stream?.posts || [];
    if (targetSpec.targetToken === "last" && topicHasCompletePostStream(topic) && fallbackPosts.length > 0) {
      return fallbackPosts[fallbackPosts.length - 1]?.post_number || null;
    }

    return null;
  }

  function mergeTopicPreviewData(
    primaryTopic,
    supplementalTopic,
    getTopicStreamIds,
    getLoadedTopicPostIds
  ) {
    const mergedPosts = new Map();
    const mergedStream = [];
    const seenStreamPostIds = new Set();

    for (const post of primaryTopic?.post_stream?.posts || []) {
      if (typeof post?.post_number === "number") {
        mergedPosts.set(post.post_number, post);
      }
    }

    for (const post of supplementalTopic?.post_stream?.posts || []) {
      if (typeof post?.post_number === "number" && !mergedPosts.has(post.post_number)) {
        mergedPosts.set(post.post_number, post);
      }
    }

    for (const postId of (typeof getTopicStreamIds === "function" ? getTopicStreamIds(primaryTopic) : [])) {
      if (!seenStreamPostIds.has(postId)) {
        seenStreamPostIds.add(postId);
        mergedStream.push(postId);
      }
    }

    for (const postId of (typeof getTopicStreamIds === "function" ? getTopicStreamIds(supplementalTopic) : [])) {
      if (!seenStreamPostIds.has(postId)) {
        seenStreamPostIds.add(postId);
        mergedStream.push(postId);
      }
    }

    const mergedLoadedPostIds = typeof getLoadedTopicPostIds === "function"
      ? getLoadedTopicPostIds({ post_stream: { posts: Array.from(mergedPosts.values()) } })
      : [];
    for (const postId of mergedLoadedPostIds) {
      if (!seenStreamPostIds.has(postId)) {
        seenStreamPostIds.add(postId);
        mergedStream.push(postId);
      }
    }

    const posts = Array.from(mergedPosts.values()).sort((left, right) => left.post_number - right.post_number);

    return {
      ...primaryTopic,
      posts_count: Math.max(Number(primaryTopic?.posts_count || 0), Number(supplementalTopic?.posts_count || 0)) || primaryTopic?.posts_count || supplementalTopic?.posts_count,
      post_stream: {
        ...(primaryTopic?.post_stream || {}),
        stream: mergedStream,
        posts
      }
    };
  }

  runtime.topicTargetUtils = {
    shouldFetchTargetedTopic,
    shouldFetchLastReadTargetedTopic,
    resolveTopicTargetPostNumber,
    mergeTopicPreviewData
  };
})();
