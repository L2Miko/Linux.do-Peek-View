(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function getPostLikeSummary(post) {
    const summaries = Array.isArray(post?.actions_summary) ? post.actions_summary : [];
    return summaries.find((item) => Number(item?.id) === 2 || Number(item?.post_action_type_id) === 2) || null;
  }

  function getPostBookmarkSummary(post) {
    const summaries = Array.isArray(post?.actions_summary) ? post.actions_summary : [];
    return summaries.find((item) => Number(item?.id) === 3 || Number(item?.post_action_type_id) === 3) || null;
  }

  function isPostBookmarked(post) {
    if (post?.bookmarked === true) {
      return true;
    }

    const summary = getPostBookmarkSummary(post);
    return Boolean(summary?.acted || summary?.can_undo === true);
  }

  function canTogglePostBookmark(post) {
    if (isPostBookmarked(post)) {
      return true;
    }

    const summary = getPostBookmarkSummary(post);
    if (summary?.can_act === false) {
      return false;
    }

    if (post?.can_bookmark === false || post?.can_act === false) {
      return false;
    }

    return Number.isFinite(Number(post?.id));
  }

  function getCurrentUserReactionId(post, likeReactionId = "heart") {
    if (typeof post?.current_user_reaction?.id === "string" && post.current_user_reaction.id.trim()) {
      return post.current_user_reaction.id.trim();
    }

    if (post?.current_user_used_main_reaction) {
      return likeReactionId || "heart";
    }

    const summary = getPostLikeSummary(post);
    if (summary?.acted || summary?.can_undo === true) {
      return likeReactionId || "heart";
    }

    return "";
  }

  function getPostLikeCount(post) {
    const summary = getPostLikeSummary(post);
    const summaryCount = Number(summary?.count);
    if (Number.isFinite(summaryCount) && summaryCount >= 0) {
      return summaryCount;
    }

    const likeCount = Number(post?.like_count);
    if (Number.isFinite(likeCount) && likeCount >= 0) {
      return likeCount;
    }

    return 0;
  }

  function getPostReactionTotalCount(post) {
    const reactions = Array.isArray(post?.reactions) ? post.reactions : [];
    if (reactions.length > 0) {
      const total = reactions.reduce((sum, item) => {
        const count = Number(item?.count);
        return sum + (Number.isFinite(count) && count > 0 ? count : 0);
      }, 0);
      if (total > 0) {
        return total;
      }
    }

    return getPostLikeCount(post);
  }

  function canTogglePostReactions(post) {
    if (post?.likeAction && typeof post.likeAction.canToggle === "boolean") {
      return post.likeAction.canToggle;
    }

    if (post?.current_user_reaction && post.current_user_reaction.can_undo === false) {
      return false;
    }

    const summary = getPostLikeSummary(post);
    if (summary) {
      if (summary.can_undo === true || summary.acted === true) {
        return true;
      }
      if (summary.can_act === false) {
        return false;
      }
    }

    if (post?.can_like === false || post?.can_act === false) {
      return false;
    }

    return Number.isFinite(Number(post?.id));
  }

  function getPostReactionCounts(post, likeReactionId = "heart") {
    const counts = new Map();
    const reactionList = Array.isArray(post?.reactions) ? post.reactions : [];

    for (const reaction of reactionList) {
      const reactionId = String(reaction?.id || reaction?.reaction || "").trim();
      const count = Number(reaction?.count);
      if (reactionId && Number.isFinite(count) && count >= 0) {
        counts.set(reactionId, count);
      }
    }

    if (counts.size === 0) {
      const currentReactionId = getCurrentUserReactionId(post, likeReactionId);
      if (currentReactionId) {
        counts.set(currentReactionId, Math.max(1, counts.get(currentReactionId) || 0));
      }
    }

    return counts;
  }

  runtime.postStateUtils = {
    getPostLikeSummary,
    getPostBookmarkSummary,
    isPostBookmarked,
    canTogglePostBookmark,
    getCurrentUserReactionId,
    getPostReactionTotalCount,
    canTogglePostReactions,
    getPostReactionCounts
  };
})();
