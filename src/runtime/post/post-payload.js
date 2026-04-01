(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  const POST_MUTATION_FIELDS = Object.freeze([
    "actions_summary",
    "reactions",
    "like_count",
    "can_like",
    "can_act",
    "can_bookmark",
    "bookmarked",
    "bookmark_id",
    "bookmark_name",
    "bookmark_reminder_at",
    "bookmark_auto_delete_preference",
    "likeAction",
    "current_user_reaction",
    "current_user_used_main_reaction"
  ]);

  function normalizePostMutationPayload(payload) {
    if (!payload || typeof payload !== "object") {
      return null;
    }

    if (payload.post && typeof payload.post === "object") {
      return payload.post;
    }

    if (
      "actions_summary" in payload
      || "reactions" in payload
      || "current_user_reaction" in payload
      || "bookmarked" in payload
      || "bookmark_id" in payload
    ) {
      return payload;
    }

    return null;
  }

  function patchPostWithPayload(post, payload, fields = POST_MUTATION_FIELDS) {
    if (!post || typeof post !== "object" || !payload || typeof payload !== "object") {
      return;
    }

    for (const key of fields) {
      if (key in payload) {
        post[key] = payload[key];
      }
    }
  }

  function applyPostServerPayload(postId, payload, sourceLists = []) {
    if (!Number.isFinite(postId)) {
      return;
    }

    const seen = new Set();
    for (const list of sourceLists) {
      for (const post of list || []) {
        if (Number(post?.id) !== postId || seen.has(post)) {
          continue;
        }
        seen.add(post);
        patchPostWithPayload(post, payload);
      }
    }
  }

  runtime.postPayload = {
    normalizePostMutationPayload,
    applyPostServerPayload
  };
})();
