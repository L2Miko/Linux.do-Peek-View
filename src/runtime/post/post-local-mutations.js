(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function applyPostReactionLocally(postId, reactionId, sourceLists = [], options = {}) {
    if (!Number.isFinite(postId) || !reactionId) {
      return;
    }

    const {
      getCurrentUserReactionId,
      likeReactionId = "heart",
      getPostLikeSummary,
      getPostReactionTotalCount
    } = options;

    const seen = new Set();
    for (const list of sourceLists) {
      for (const post of list || []) {
        if (Number(post?.id) !== postId || seen.has(post) || typeof post !== "object") {
          continue;
        }
        seen.add(post);

        const currentReactionId = typeof getCurrentUserReactionId === "function"
          ? getCurrentUserReactionId(post)
          : "";
        const nextReactionId = currentReactionId === reactionId ? "" : reactionId;
        const likeDelta = nextReactionId ? (currentReactionId ? 0 : 1) : -1;

        post.current_user_reaction = nextReactionId
          ? { id: nextReactionId, type: "emoji" }
          : null;
        post.current_user_used_main_reaction = nextReactionId === (likeReactionId || "heart");

        if (!Array.isArray(post.reactions)) {
          post.reactions = [];
        }

        const touchReactionCount = (id, delta) => {
          if (!id || !delta) {
            return;
          }
          let item = post.reactions.find((entry) => entry?.id === id);
          if (!item) {
            item = { id, type: "emoji", count: 0 };
            post.reactions.push(item);
          }
          item.count = Math.max(0, Number(item.count || 0) + delta);
        };

        if (currentReactionId && currentReactionId !== nextReactionId) {
          touchReactionCount(currentReactionId, -1);
        }
        if (nextReactionId) {
          touchReactionCount(nextReactionId, 1);
        }

        if (!Array.isArray(post.actions_summary)) {
          post.actions_summary = [];
        }
        let summary = typeof getPostLikeSummary === "function" ? getPostLikeSummary(post) : null;
        if (!summary) {
          summary = { id: 2, count: 0, can_act: true, acted: false };
          post.actions_summary.push(summary);
        }
        summary.count = Math.max(0, Number(summary.count || 0) + likeDelta);
        summary.acted = Boolean(nextReactionId);
        summary.can_undo = Boolean(nextReactionId);
        summary.can_act = !nextReactionId;
        post.like_count = typeof getPostReactionTotalCount === "function"
          ? getPostReactionTotalCount(post)
          : Number(post.like_count || 0);
      }
    }
  }

  function applyPostBookmarkLocally(postId, sourceLists = [], options = {}) {
    if (!Number.isFinite(postId)) {
      return;
    }

    const {
      isPostBookmarked,
      getPostBookmarkSummary
    } = options;

    const seen = new Set();
    for (const list of sourceLists) {
      for (const post of list || []) {
        if (Number(post?.id) !== postId || seen.has(post) || typeof post !== "object") {
          continue;
        }
        seen.add(post);

        const nextBookmarked = !(typeof isPostBookmarked === "function" ? isPostBookmarked(post) : Boolean(post.bookmarked));
        post.bookmarked = nextBookmarked;

        if (!Array.isArray(post.actions_summary)) {
          post.actions_summary = [];
        }
        let summary = typeof getPostBookmarkSummary === "function" ? getPostBookmarkSummary(post) : null;
        if (!summary) {
          summary = { id: 3, count: 0, can_act: true, acted: false };
          post.actions_summary.push(summary);
        }
        summary.acted = nextBookmarked;
        summary.can_undo = nextBookmarked;
        summary.can_act = !nextBookmarked;
      }
    }
  }

  function applyPostBoostLocally(postId, boost, sourceLists = [], options = {}) {
    if (!Number.isFinite(postId) || !boost || typeof boost !== "object") {
      return;
    }

    const getBoostSignature = typeof options.getBoostSignature === "function"
      ? options.getBoostSignature
      : (item) => `${String(item?.username || "").trim()}|${String(item?.raw || "").trim()}|${String(item?.cookedHtml || "").trim()}`;
    const getBoostLookupKeys = typeof options.getBoostLookupKeys === "function"
      ? options.getBoostLookupKeys
      : (item) => {
        const keys = [];
        const id = Number(item?.id);
        const signature = getBoostSignature(item);
        if (Number.isFinite(id) && id > 0) {
          keys.push(`id:${id}`);
        }
        if (signature) {
          keys.push(`sig:${signature}`);
        }
        return keys;
      };

    const nextBoost = { ...boost };
    const nextSignature = getBoostSignature(nextBoost);
    if (!nextSignature) {
      return;
    }

    const seen = new Set();
    for (const list of sourceLists) {
      for (const post of list || []) {
        if (Number(post?.id) !== postId || seen.has(post) || typeof post !== "object") {
          continue;
        }
        seen.add(post);

        const current = Array.isArray(post.__ld_local_boosts) ? [...post.__ld_local_boosts] : [];
        const nextLookupKeys = getBoostLookupKeys(nextBoost);
        const hasSameBoost = current.some((item) => getBoostSignature(item) === nextSignature);
        if (!hasSameBoost) {
          current.push(nextBoost);
        }
        post.__ld_local_boosts = current;

        if (Array.isArray(post.__ld_removed_boost_keys) && nextLookupKeys.length) {
          post.__ld_removed_boost_keys = post.__ld_removed_boost_keys.filter((key) => !nextLookupKeys.includes(key));
        }
      }
    }
  }

  function applyPostBoostRemovalLocally(postId, boost, sourceLists = [], options = {}) {
    if (!Number.isFinite(postId) || !boost || typeof boost !== "object") {
      return;
    }

    const getBoostSignature = typeof options.getBoostSignature === "function"
      ? options.getBoostSignature
      : (item) => `${String(item?.username || "").trim()}|${String(item?.raw || "").trim()}|${String(item?.cookedHtml || "").trim()}`;
    const getBoostLookupKeys = typeof options.getBoostLookupKeys === "function"
      ? options.getBoostLookupKeys
      : (item) => {
        const keys = [];
        const id = Number(item?.id);
        const signature = getBoostSignature(item);
        if (Number.isFinite(id) && id > 0) {
          keys.push(`id:${id}`);
        }
        if (signature) {
          keys.push(`sig:${signature}`);
        }
        return keys;
      };

    const removedKeys = getBoostLookupKeys(boost);
    if (!removedKeys.length) {
      return;
    }

    const seen = new Set();
    for (const list of sourceLists) {
      for (const post of list || []) {
        if (Number(post?.id) !== postId || seen.has(post) || typeof post !== "object") {
          continue;
        }
        seen.add(post);

        const currentRemoved = Array.isArray(post.__ld_removed_boost_keys) ? [...post.__ld_removed_boost_keys] : [];
        for (const key of removedKeys) {
          if (!currentRemoved.includes(key)) {
            currentRemoved.push(key);
          }
        }
        post.__ld_removed_boost_keys = currentRemoved;

        if (Array.isArray(post.__ld_local_boosts)) {
          post.__ld_local_boosts = post.__ld_local_boosts.filter((item) => {
            const itemKeys = getBoostLookupKeys(item);
            return !itemKeys.some((key) => currentRemoved.includes(key));
          });
        }
      }
    }
  }

  runtime.postLocalMutations = {
    applyPostReactionLocally,
    applyPostBookmarkLocally,
    applyPostBoostLocally,
    applyPostBoostRemovalLocally
  };
})();
