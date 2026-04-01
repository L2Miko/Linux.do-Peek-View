(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function resolveTopicLastReadPostNumber(topic) {
    const candidates = [
      topic?.last_read_post_number,
      topic?.last_read_post_number_in_topic,
      topic?.details?.last_read_post_number,
      topic?.topic_tracking_state?.last_read_post_number
    ];

    for (const value of candidates) {
      const num = Number(value);
      if (Number.isFinite(num) && num > 0) {
        return num;
      }
    }

    return null;
  }

  function findNearestVisiblePostNumber(targetPostNumber, displayPosts) {
    const numbers = (Array.isArray(displayPosts) ? displayPosts : [])
      .map((post) => Number(post?.post_number))
      .filter((num) => Number.isFinite(num) && num > 0);

    if (!numbers.length) {
      return null;
    }

    if (numbers.includes(targetPostNumber)) {
      return targetPostNumber;
    }

    let lower = null;
    let upper = null;

    for (const value of numbers) {
      if (value < targetPostNumber && (lower === null || value > lower)) {
        lower = value;
      }
      if (value > targetPostNumber && (upper === null || value < upper)) {
        upper = value;
      }
    }

    return lower ?? upper;
  }

  function resolveInitialScrollTarget(topic, displayPosts, resolvedTargetPostNumber, targetSpec) {
    if (Number.isFinite(resolvedTargetPostNumber) && resolvedTargetPostNumber > 0) {
      return {
        postNumber: resolvedTargetPostNumber,
        fromLastRead: !targetSpec?.hasTarget
          && resolvedTargetPostNumber > 1
      };
    }

    if (targetSpec?.hasTarget) {
      return {
        postNumber: null,
        fromLastRead: false
      };
    }

    const lastReadPostNumber = resolveTopicLastReadPostNumber(topic);
    if (!Number.isFinite(lastReadPostNumber) || lastReadPostNumber <= 1) {
      return {
        postNumber: null,
        fromLastRead: false
      };
    }

    const nearestVisiblePostNumber = findNearestVisiblePostNumber(lastReadPostNumber, displayPosts);
    return {
      postNumber: nearestVisiblePostNumber,
      fromLastRead: Number.isFinite(nearestVisiblePostNumber)
    };
  }

  runtime.scrollTargetUtils = {
    resolveInitialScrollTarget,
    resolveTopicLastReadPostNumber
  };
})();
