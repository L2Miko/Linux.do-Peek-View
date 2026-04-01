(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function getTopicStreamIds(topic) {
    const stream = topic?.post_stream?.stream;
    if (Array.isArray(stream) && stream.length > 0) {
      return stream.filter((postId) => Number.isFinite(postId));
    }

    return (topic?.post_stream?.posts || [])
      .map((post) => post?.id)
      .filter((postId) => Number.isFinite(postId));
  }

  function getLoadedTopicPostIds(topic) {
    return (topic?.post_stream?.posts || [])
      .map((post) => post?.id)
      .filter((postId) => Number.isFinite(postId));
  }

  function getNextTopicPostIds(topic, batchSize = 20) {
    const streamIds = getTopicStreamIds(topic);
    if (!streamIds.length) {
      return [];
    }

    const loadedPostIds = new Set(getLoadedTopicPostIds(topic));
    return streamIds.filter((postId) => !loadedPostIds.has(postId)).slice(0, batchSize);
  }

  function getLastLoadedTopicStreamIndex(topic) {
    const streamIds = getTopicStreamIds(topic);
    if (!streamIds.length) {
      return -1;
    }

    const loadedPostIds = new Set(getLoadedTopicPostIds(topic));
    let lastLoadedIndex = -1;

    for (let index = 0; index < streamIds.length; index += 1) {
      if (loadedPostIds.has(streamIds[index])) {
        lastLoadedIndex = index;
      }
    }

    return lastLoadedIndex;
  }

  function getFirstLoadedTopicStreamIndex(topic) {
    const streamIds = getTopicStreamIds(topic);
    if (!streamIds.length) {
      return -1;
    }

    const loadedPostIds = new Set(getLoadedTopicPostIds(topic));
    for (let index = 0; index < streamIds.length; index += 1) {
      if (loadedPostIds.has(streamIds[index])) {
        return index;
      }
    }

    return -1;
  }

  function getNextTopicPostIdsAfterLoadedTail(topic, batchSize = 20) {
    const streamIds = getTopicStreamIds(topic);
    if (!streamIds.length) {
      return [];
    }

    const loadedPostIds = new Set(getLoadedTopicPostIds(topic));
    const lastLoadedIndex = getLastLoadedTopicStreamIndex(topic);
    const nextPostIds = [];

    for (let index = Math.max(0, lastLoadedIndex + 1); index < streamIds.length; index += 1) {
      const postId = streamIds[index];
      if (loadedPostIds.has(postId)) {
        continue;
      }

      nextPostIds.push(postId);
      if (nextPostIds.length >= batchSize) {
        break;
      }
    }

    return nextPostIds;
  }

  function hasMoreTopicPosts(topic) {
    if (getNextTopicPostIds(topic, 1).length > 0) {
      return true;
    }

    const posts = topic?.post_stream?.posts || [];
    const totalPosts = Number(topic?.posts_count || 0);
    return totalPosts > 0 && posts.length < totalPosts;
  }

  function hasMoreTopicPostsBelowLoadedTail(topic) {
    return getNextTopicPostIdsAfterLoadedTail(topic, 1).length > 0;
  }

  function hasHiddenTopicPostsBeforeLoadedHead(topic) {
    return getFirstLoadedTopicStreamIndex(topic) > 0;
  }

  function topicHasPostNumber(topic, postNumber) {
    if (!postNumber) {
      return false;
    }

    return (topic?.post_stream?.posts || []).some((post) => post?.post_number === postNumber);
  }

  function topicHasCompletePostStream(topic) {
    return !hasMoreTopicPosts(topic);
  }

  runtime.topicStream = {
    getTopicStreamIds,
    getLoadedTopicPostIds,
    getNextTopicPostIds,
    getFirstLoadedTopicStreamIndex,
    getLastLoadedTopicStreamIndex,
    getNextTopicPostIdsAfterLoadedTail,
    hasMoreTopicPosts,
    hasMoreTopicPostsBelowLoadedTail,
    hasHiddenTopicPostsBeforeLoadedHead,
    topicHasPostNumber,
    topicHasCompletePostStream
  };
})();
