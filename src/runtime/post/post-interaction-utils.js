(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function createApi(state, options = {}) {
    const reactionPickerHideDelayMs = Number(options.reactionPickerHideDelayMs || 120);
    const openReplyPanelForPost = options.openReplyPanelForPost;
    const scrollToPostNumber = options.scrollToPostNumber;
    const getForcedReactionIconUrl = options.getForcedReactionIconUrl;
    const getReactionIconUrl = options.getReactionIconUrl;
    const reactionIdToEmoji = options.reactionIdToEmoji;
    const ensureReactionIconsLoaded = options.ensureReactionIconsLoaded;
    const forcedReactionOptions = Array.isArray(options.forcedReactionOptions)
      ? options.forcedReactionOptions
      : [];
    const isTopicAuthorPost = options.isTopicAuthorPost;
    const locationOrigin = options.locationOrigin || globalThis.location?.origin || "";

    function getPostLists() {
      return [
        state.currentTopic?.post_stream?.posts || []
      ];
    }

    function getPostById(postId) {
      return runtime.postLookup.getPostById(postId, getPostLists());
    }

    function buildReplyToTab(post) {
      const replyToPostNumber = Number(post?.reply_to_post_number);
      if (!Number.isFinite(replyToPostNumber) || replyToPostNumber <= 0) {
        return null;
      }

      const parentPost = runtime.postLookup.getPostByNumber(replyToPostNumber, getPostLists());
      const replyToUsername = parentPost?.username || post?.reply_to_user?.username || "";
      const replyToAvatarTemplate = parentPost?.avatar_template || post?.reply_to_user?.avatar_template || "";

      const tab = document.createElement("a");
      tab.href = "#";
      tab.className = "ld-reply-to-tab";
      tab.setAttribute("role", "button");
      tab.setAttribute("title", `跳转到被回复楼层 #${replyToPostNumber}`);
      tab.innerHTML = `
        <span class="ld-reply-to-tab-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M14 5a1 1 0 0 1 1 1v4h2.59L12 15.59 6.41 10H9V6a1 1 0 0 1 1-1h4Z" fill="currentColor"></path>
            <path d="M5 17a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H6a1 1 0 0 1-1-1Z" fill="currentColor"></path>
          </svg>
        </span>
      `;

      if (replyToAvatarTemplate) {
        const avatar = document.createElement("img");
        avatar.className = "ld-reply-to-tab-avatar";
        avatar.alt = replyToUsername || `#${replyToPostNumber}`;
        avatar.width = 24;
        avatar.height = 24;
        avatar.loading = "lazy";
        avatar.src = runtime.topicRenderUtils.avatarUrl(replyToAvatarTemplate, locationOrigin);
        tab.appendChild(avatar);
      }

      const label = document.createElement("span");
      label.className = "ld-reply-to-tab-label";
      label.textContent = replyToUsername || `#${replyToPostNumber}`;
      tab.appendChild(label);

      tab.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        scrollToPostNumber(replyToPostNumber, true, {
          jumpBackPostNumber: Number(post?.post_number)
        });
      });

      return tab;
    }

    function buildPostBookmarkIconHtml(isBookmarked) {
      if (isBookmarked) {
        return `
          <svg class="fa d-icon d-icon-bookmark svg-icon fa-width-auto svg-string" viewBox="0 0 20 20" focusable="false">
            <path d="M5 2.5A1.5 1.5 0 0 0 3.5 4v12.3c0 .63.72 1 1.24.64L10 13.3l5.26 3.64c.52.36 1.24-.01 1.24-.64V4A1.5 1.5 0 0 0 15 2.5H5Z" fill="currentColor"></path>
          </svg>
        `;
      }

      return `
        <svg class="fa d-icon d-icon-far-bookmark svg-icon fa-width-auto svg-string" width="1em" height="1em" aria-hidden="true" viewBox="0 0 20 20" focusable="false">
          <use href="#far-bookmark"></use>
        </svg>
      `;
    }

    function buildReactionHeartOutlineHtml() {
      return `
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 20.25a.75.75 0 0 1-.43-.14C10.17 19.14 4.5 15.1 4.5 9.75A4.5 4.5 0 0 1 12 6.41a4.5 4.5 0 0 1 7.5 3.34c0 5.35-5.67 9.39-7.07 10.36a.75.75 0 0 1-.43.14Z" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>
      `;
    }

    function buildReactionVisualHtml(reactionId) {
      const normalizedId = String(reactionId || "").trim().toLowerCase() || "heart";
      const forcedIconUrl = typeof getForcedReactionIconUrl === "function"
        ? getForcedReactionIconUrl(normalizedId)
        : "";
      if (forcedIconUrl) {
        return `<img class="ld-post-reaction-emoji" src="${runtime.textUtils.escapeHtmlAttribute(forcedIconUrl)}" alt=":${runtime.textUtils.escapeHtmlAttribute(normalizedId)}:" loading="lazy" decoding="async" onerror="this.onerror=null;this.style.display='none';var n=document.createElement('span');n.className='ld-post-reaction-fallback';n.textContent=':${runtime.textUtils.escapeHtmlAttribute(normalizedId)}:';this.parentNode&&this.parentNode.appendChild(n);" />`;
      }

      const iconUrl = typeof getReactionIconUrl === "function"
        ? getReactionIconUrl(normalizedId)
        : "";
      if (iconUrl) {
        return `<img class="ld-post-reaction-emoji" src="${runtime.textUtils.escapeHtmlAttribute(iconUrl)}" alt=":${runtime.textUtils.escapeHtmlAttribute(normalizedId)}:" loading="lazy" decoding="async" onerror="this.onerror=null;this.style.display='none';var n=document.createElement('span');n.className='ld-post-reaction-fallback';n.textContent=':${runtime.textUtils.escapeHtmlAttribute(normalizedId)}:';this.parentNode&&this.parentNode.appendChild(n);" />`;
      }
      const emojiChar = typeof reactionIdToEmoji === "function" ? reactionIdToEmoji(normalizedId) : "";
      return emojiChar
        ? `<span class="ld-post-reaction-emoji" aria-hidden="true">${emojiChar}</span>`
        : `<span class="ld-post-reaction-fallback">:${normalizedId}:</span>`;
    }

    function syncPostBookmarkButton(button, post) {
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      const postId = Number(post?.id || button.dataset.postId);
      const isPending = Number.isFinite(postId) && state.pendingBookmarkPostIds.has(postId);
      const isBookmarked = runtime.postStateUtils.isPostBookmarked(post);
      const canToggle = runtime.postStateUtils.canTogglePostBookmark(post);

      button.classList.toggle("is-bookmarked", isBookmarked);
      button.disabled = isPending || !canToggle;
      button.setAttribute("aria-pressed", String(isBookmarked));
      button.setAttribute("aria-label", isBookmarked ? "取消收藏" : "收藏");
      button.setAttribute("title", isBookmarked ? "取消收藏" : "收藏");
      button.innerHTML = `
        <span class="ld-post-bookmark-icon" aria-hidden="true">${buildPostBookmarkIconHtml(isBookmarked)}</span>
      `;
    }

    function syncPostReactionButton(button, post) {
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      const postId = Number(post?.id || button.dataset.postId);
      const isPending = Number.isFinite(postId) && state.pendingReactionPostIds.has(postId);
      const canToggle = runtime.postStateUtils.canTogglePostReactions(post);
      const reactionId = runtime.postStateUtils.getCurrentUserReactionId(post, state.likeReactionId || "heart");
      const count = runtime.postStateUtils.getPostReactionTotalCount(post);

      button.classList.toggle("is-liked", Boolean(reactionId));
      button.disabled = isPending || !canToggle;
      button.setAttribute("aria-pressed", String(Boolean(reactionId)));
      button.setAttribute("aria-label", `${reactionId ? "取消反应" : "点赞"}${count > 0 ? `（${count}）` : ""}`);
      const reactionIconHtml = reactionId
        ? buildReactionVisualHtml(reactionId)
        : buildReactionHeartOutlineHtml();
      button.innerHTML = `
        <span class="ld-post-reaction-icon" aria-hidden="true">${reactionIconHtml}</span>
        <span class="ld-post-reaction-count">${count}</span>
      `;
    }

    function syncPostReactionPicker(picker, post) {
      if (!(picker instanceof HTMLElement)) {
        return;
      }

      const postId = Number(post?.id || picker.dataset.postId);
      const isPending = Number.isFinite(postId) && state.pendingReactionPostIds.has(postId);
      const canToggle = runtime.postStateUtils.canTogglePostReactions(post);
      const currentReactionId = runtime.postStateUtils.getCurrentUserReactionId(post, state.likeReactionId || "heart");
      const counts = runtime.postStateUtils.getPostReactionCounts(post, state.likeReactionId || "heart");
      const options = state.reactionOptions.slice(0, 10);

      picker.replaceChildren();

      for (const reactionId of options) {
        const item = document.createElement("button");
        item.type = "button";
        item.className = "ld-post-reaction-item";
        item.dataset.reactionId = reactionId;
        item.disabled = isPending || !canToggle;
        item.classList.toggle("is-active", reactionId === currentReactionId);
        item.setAttribute("aria-label", `${reactionId}${counts.get(reactionId) ? `（${counts.get(reactionId)}）` : ""}`);
        item.innerHTML = `
          <span class="ld-post-reaction-item-icon" aria-hidden="true">${buildReactionVisualHtml(reactionId)}</span>
          <span class="ld-post-reaction-item-count">${counts.get(reactionId) || 0}</span>
        `;
        item.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          handlePostReactionClick(postId, reactionId);
        });
        picker.appendChild(item);
      }
    }

    function syncPostReactionControls(postId, post, scope = state.content) {
      if (!Number.isFinite(postId) || !(scope instanceof Element || scope instanceof DocumentFragment || scope instanceof Document)) {
        return;
      }

      const wraps = [];
      if (scope instanceof Element && scope.matches(`.ld-post-reaction-wrap[data-post-id="${postId}"]`)) {
        wraps.push(scope);
      }
      for (const wrap of scope.querySelectorAll(`.ld-post-reaction-wrap[data-post-id="${postId}"]`)) {
        wraps.push(wrap);
      }

      for (const wrap of wraps) {
        const button = wrap.querySelector(".ld-post-reaction-button");
        const picker = wrap.querySelector(".ld-post-reaction-picker");

        syncPostReactionButton(button, post);
        syncPostReactionPicker(picker, post);
      }
    }

    function syncPostBookmarkControls(postId, post, scope = state.content) {
      if (!Number.isFinite(postId) || !(scope instanceof Element || scope instanceof DocumentFragment || scope instanceof Document)) {
        return;
      }

      const buttons = [];
      if (scope instanceof Element && scope.matches(`.ld-post-bookmark-button[data-post-id="${postId}"]`)) {
        buttons.push(scope);
      }
      for (const button of scope.querySelectorAll(`.ld-post-bookmark-button[data-post-id="${postId}"]`)) {
        buttons.push(button);
      }

      for (const button of buttons) {
        syncPostBookmarkButton(button, post);
      }
    }

    async function readPostMutationResponse(response) {
      return runtime.postPayload.normalizePostMutationPayload(await runtime.networkResponse.readOptionalJson(response));
    }

    async function addPostLike(postId) {
      const csrfToken = runtime.securityUtils.getCsrfToken(document);
      if (!csrfToken) {
        throw new Error("未找到登录令牌，请刷新页面后重试");
      }

      const body = new URLSearchParams();
      body.set("id", String(postId));
      body.set("post_action_type_id", "2");
      body.set("flag_topic", "false");

      const response = await fetch(`${locationOrigin}/post_actions`, {
        method: "POST",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-Token": csrfToken
        },
        body
      });

      if (response.ok || response.status === 422) {
        return;
      }

      throw new Error(await runtime.networkResponse.readRequestError(response, "点赞失败"));
    }

    async function removePostLike(postId) {
      const csrfToken = runtime.securityUtils.getCsrfToken(document);
      if (!csrfToken) {
        throw new Error("未找到登录令牌，请刷新页面后重试");
      }

      const body = new URLSearchParams();
      body.set("post_action_type_id", "2");

      const attempts = [
        `${locationOrigin}/post_actions/${postId}`,
        `${locationOrigin}/post_actions/${postId}.json`
      ];

      for (const endpoint of attempts) {
        const response = await fetch(endpoint, {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-Token": csrfToken
          },
          body
        });

        if (response.ok || response.status === 404) {
          return;
        }

        if (response.status === 405 || response.status === 422) {
          continue;
        }

        throw new Error(await runtime.networkResponse.readRequestError(response, "取消点赞失败"));
      }

      throw new Error("取消点赞失败");
    }

    async function toggleMainLikeFallback(postId) {
      const post = getPostById(postId);
      const isLiked = Boolean(runtime.postStateUtils.getCurrentUserReactionId(post, state.likeReactionId || "heart"));
      if (isLiked) {
        await removePostLike(postId);
        return null;
      }

      await addPostLike(postId);
      return null;
    }

    async function togglePostReaction(postId, reactionId) {
      const csrfToken = runtime.securityUtils.getCsrfToken(document);
      if (!csrfToken) {
        throw new Error("未找到登录令牌，请刷新页面后重试");
      }

      const response = await fetch(
        `${locationOrigin}/discourse-reactions/posts/${postId}/custom-reactions/${encodeURIComponent(reactionId)}/toggle.json`,
        {
          method: "PUT",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-Token": csrfToken
          }
        }
      );

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("json") ? await response.json() : null;

      if (!response.ok) {
        if (reactionId === (state.likeReactionId || "heart")) {
          return toggleMainLikeFallback(postId);
        }
        throw new Error(await runtime.networkResponse.readRequestError(response, "点赞失败"));
      }

      return data?.post || data?.result || data;
    }

    async function addPostBookmarkViaLegacyEndpoint(postId, csrfToken) {
      const attempts = [
        `${locationOrigin}/posts/${postId}/bookmark`,
        `${locationOrigin}/posts/${postId}/bookmark.json`
      ];

      for (const endpoint of attempts) {
        const body = new URLSearchParams();
        body.set("bookmarked", "true");

        const response = await fetch(endpoint, {
          method: "PUT",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-Token": csrfToken
          },
          body
        });

        if (response.ok || response.status === 422) {
          return readPostMutationResponse(response);
        }

        if (response.status === 404 || response.status === 405) {
          continue;
        }

        throw new Error(await runtime.networkResponse.readRequestError(response, "收藏失败"));
      }

      throw new Error("收藏失败");
    }

    async function addPostBookmarkViaCollectionEndpoint(postId, csrfToken) {
      const attempts = [
        `${locationOrigin}/bookmarks`,
        `${locationOrigin}/bookmarks.json`
      ];

      for (const endpoint of attempts) {
        const body = new URLSearchParams();
        body.set("bookmarkable_id", String(postId));
        body.set("bookmarkable_type", "Post");

        const response = await fetch(endpoint, {
          method: "POST",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-Token": csrfToken
          },
          body
        });

        if (response.ok || response.status === 422) {
          return readPostMutationResponse(response);
        }

        if (response.status === 404 || response.status === 405) {
          continue;
        }

        throw new Error(await runtime.networkResponse.readRequestError(response, "收藏失败"));
      }

      throw new Error("收藏失败");
    }

    async function addPostBookmark(postId) {
      const csrfToken = runtime.securityUtils.getCsrfToken(document);
      if (!csrfToken) {
        throw new Error("未找到登录令牌，请刷新页面后重试");
      }

      try {
        return await addPostBookmarkViaLegacyEndpoint(postId, csrfToken);
      } catch {
        return addPostBookmarkViaCollectionEndpoint(postId, csrfToken);
      }
    }

    async function removePostBookmarkById(bookmarkId, csrfToken) {
      const attempts = [
        `${locationOrigin}/bookmarks/${bookmarkId}`,
        `${locationOrigin}/bookmarks/${bookmarkId}.json`
      ];

      for (const endpoint of attempts) {
        const response = await fetch(endpoint, {
          method: "DELETE",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-Token": csrfToken
          }
        });

        if (response.ok || response.status === 404) {
          return readPostMutationResponse(response);
        }

        if (response.status === 405) {
          continue;
        }

        throw new Error(await runtime.networkResponse.readRequestError(response, "取消收藏失败"));
      }

      return null;
    }

    async function removePostBookmarkViaLegacyEndpoint(postId, csrfToken) {
      const attempts = [
        `${locationOrigin}/posts/${postId}/bookmark`,
        `${locationOrigin}/posts/${postId}/bookmark.json`
      ];

      for (const endpoint of attempts) {
        const body = new URLSearchParams();
        body.set("bookmarked", "false");

        const response = await fetch(endpoint, {
          method: "PUT",
          credentials: "include",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-Token": csrfToken
          },
          body
        });

        if (response.ok || response.status === 404 || response.status === 422) {
          return readPostMutationResponse(response);
        }

        if (response.status === 405) {
          continue;
        }

        throw new Error(await runtime.networkResponse.readRequestError(response, "取消收藏失败"));
      }

      throw new Error("取消收藏失败");
    }

    async function removePostBookmark(postId) {
      const csrfToken = runtime.securityUtils.getCsrfToken(document);
      if (!csrfToken) {
        throw new Error("未找到登录令牌，请刷新页面后重试");
      }

      const bookmarkId = Number(getPostById(postId)?.bookmark_id);
      if (Number.isFinite(bookmarkId) && bookmarkId > 0) {
        const bookmarkPayload = await removePostBookmarkById(bookmarkId, csrfToken);
        if (bookmarkPayload) {
          return bookmarkPayload;
        }
      }

      return removePostBookmarkViaLegacyEndpoint(postId, csrfToken);
    }

    async function togglePostBookmark(postId) {
      if (runtime.postStateUtils.isPostBookmarked(getPostById(postId))) {
        return removePostBookmark(postId);
      }
      return addPostBookmark(postId);
    }

    async function handlePostReactionClick(postId, reactionId) {
      if (!Number.isFinite(postId) || !reactionId || state.pendingReactionPostIds.has(postId)) {
        return;
      }

      const post = getPostById(postId);
      if (!post || !runtime.postStateUtils.canTogglePostReactions(post)) {
        return;
      }

      state.pendingReactionPostIds.add(postId);
      syncPostReactionControls(postId, post);

      try {
        const result = await togglePostReaction(postId, reactionId);
        if (result && typeof result === "object") {
          runtime.postPayload.applyPostServerPayload(postId, result, getPostLists());
        } else {
          runtime.postLocalMutations.applyPostReactionLocally(
            postId,
            reactionId,
            getPostLists(),
            {
              getCurrentUserReactionId: (item) => runtime.postStateUtils.getCurrentUserReactionId(item, state.likeReactionId || "heart"),
              likeReactionId: state.likeReactionId || "heart",
              getPostLikeSummary: runtime.postStateUtils.getPostLikeSummary,
              getPostReactionTotalCount: runtime.postStateUtils.getPostReactionTotalCount
            }
          );
        }
      } catch (error) {
        if (state.replyStatus) {
          state.replyStatus.textContent = error?.message || "点赞操作失败";
        }
      } finally {
        state.pendingReactionPostIds.delete(postId);
        const latestPost = getPostById(postId) || post;
        syncPostReactionControls(postId, latestPost);
      }
    }

    async function handlePostBookmarkClick(postId) {
      if (!Number.isFinite(postId) || state.pendingBookmarkPostIds.has(postId)) {
        return;
      }

      const post = getPostById(postId);
      if (!post || !runtime.postStateUtils.canTogglePostBookmark(post)) {
        return;
      }

      state.pendingBookmarkPostIds.add(postId);
      syncPostBookmarkControls(postId, post);

      try {
        const result = await togglePostBookmark(postId);
        if (result && typeof result === "object") {
          runtime.postPayload.applyPostServerPayload(postId, result, getPostLists());
        } else {
          runtime.postLocalMutations.applyPostBookmarkLocally(
            postId,
            getPostLists(),
            {
              isPostBookmarked: runtime.postStateUtils.isPostBookmarked,
              getPostBookmarkSummary: runtime.postStateUtils.getPostBookmarkSummary
            }
          );
        }
      } catch (error) {
        if (state.replyStatus) {
          state.replyStatus.textContent = error?.message || "收藏操作失败";
        }
      } finally {
        state.pendingBookmarkPostIds.delete(postId);
        const latestPost = getPostById(postId) || post;
        syncPostBookmarkControls(postId, latestPost);
      }
    }

    function buildPostReactionButton(post) {
      const postId = Number(post?.id);
      if (!Number.isFinite(postId)) {
        return null;
      }

      const wrap = document.createElement("div");
      wrap.className = "ld-post-reaction-wrap";
      wrap.dataset.postId = String(postId);
      let hideTimer = null;
      const clearHideTimer = () => {
        if (hideTimer) {
          clearTimeout(hideTimer);
          hideTimer = null;
        }
      };
      wrap.addEventListener("mouseenter", () => {
        clearHideTimer();
        wrap.classList.add("is-expanded");
      });
      wrap.addEventListener("mouseleave", () => {
        clearHideTimer();
        hideTimer = setTimeout(() => {
          wrap.classList.remove("is-expanded");
        }, reactionPickerHideDelayMs);
      });

      const button = document.createElement("button");
      button.type = "button";
      button.className = "ld-post-reaction-button";
      button.dataset.postId = String(postId);
      button.addEventListener("click", () => {
        const currentPost = getPostById(postId) || post;
        const currentReactionId = runtime.postStateUtils.getCurrentUserReactionId(currentPost, state.likeReactionId || "heart");
        const reactionId = currentReactionId || state.likeReactionId || "heart";
        handlePostReactionClick(postId, reactionId);
      });

      const picker = document.createElement("div");
      picker.className = "ld-post-reaction-picker";
      picker.dataset.postId = String(postId);

      wrap.append(button, picker);
      syncPostReactionControls(postId, post, wrap);
      ensureReactionOptionsLoaded();
      return wrap;
    }

    function buildPostBookmarkButton(post) {
      const postId = Number(post?.id);
      if (!Number.isFinite(postId)) {
        return null;
      }

      const button = document.createElement("button");
      button.type = "button";
      button.className = "ld-post-bookmark-button btn no-text btn-icon btn-flat bookmark widget-button bookmark-menu__trigger";
      button.dataset.postId = String(postId);
      button.setAttribute("data-identifier", "bookmark-menu");
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        handlePostBookmarkClick(postId);
      });

      syncPostBookmarkButton(button, post);
      return button;
    }

    function buildPostCard(post) {
      const article = document.createElement("article");
      article.className = "ld-post-card";
      if (typeof isTopicAuthorPost === "function" && isTopicAuthorPost(post)) {
        article.classList.add("ld-post-card-op");
      }
      if (typeof post.post_number === "number") {
        article.dataset.postNumber = String(post.post_number);
      }
      const replyToTab = buildReplyToTab(post);
      if (replyToTab) {
        article.classList.add("ld-post-card-has-reply-to");
      }

      const header = document.createElement("div");
      header.className = "ld-post-header";

      const avatar = document.createElement("img");
      avatar.className = "ld-post-avatar";
      avatar.alt = post.username || "avatar";
      avatar.loading = "lazy";
      avatar.src = runtime.topicRenderUtils.avatarUrl(post.avatar_template, locationOrigin);

      const authorBlock = document.createElement("div");
      authorBlock.className = "ld-post-author";

      const authorRow = document.createElement("div");
      authorRow.className = "ld-post-author-row";

      const displayName = document.createElement("strong");
      displayName.textContent = post.name || post.username || "匿名用户";

      const username = document.createElement("span");
      username.className = "ld-post-username";
      username.textContent = post.username ? `@${post.username}` : "";

      authorRow.append(displayName, username);

      const meta = document.createElement("div");
      meta.className = "ld-post-meta";
      meta.textContent = runtime.topicRenderUtils.buildPostMeta(post);

      authorBlock.append(authorRow, meta);
      header.append(avatar, authorBlock);

      const body = document.createElement("div");
      body.className = "ld-post-body cooked";
      body.innerHTML = post.cooked || "";

      for (const link of body.querySelectorAll("a[href]")) {
        link.target = "_blank";
        link.rel = "noopener noreferrer";
      }

      const actions = document.createElement("div");
      actions.className = "ld-post-actions";

      const reactionButton = buildPostReactionButton(post);
      if (reactionButton) {
        actions.appendChild(reactionButton);
      }

      const bookmarkButton = buildPostBookmarkButton(post);
      if (bookmarkButton) {
        actions.appendChild(bookmarkButton);
      }

      const replyButton = document.createElement("button");
      replyButton.type = "button";
      replyButton.className = "ld-post-reply-button";
      replyButton.setAttribute("aria-label", "回复");
      replyButton.innerHTML = `
        <span class="ld-post-reply-button-label">回复</span>
      `;
      replyButton.addEventListener("click", () => {
        if (typeof openReplyPanelForPost === "function") {
          openReplyPanelForPost(post);
        }
      });

      actions.appendChild(replyButton);
      if (replyToTab) {
        article.append(replyToTab);
      }
      article.append(header, body, actions);
      return article;
    }

    function refreshReactionControls() {
      if (!state.content) {
        return;
      }

      for (const wrap of state.content.querySelectorAll(".ld-post-reaction-wrap[data-post-id]")) {
        const postId = Number(wrap.getAttribute("data-post-id"));
        if (!Number.isFinite(postId)) {
          continue;
        }
        const post = getPostById(postId);
        if (post) {
          syncPostReactionControls(postId, post, state.content);
        }
      }
    }

    function refreshBookmarkControls() {
      if (!state.content) {
        return;
      }

      for (const button of state.content.querySelectorAll(".ld-post-bookmark-button[data-post-id]")) {
        const postId = Number(button.getAttribute("data-post-id"));
        if (!Number.isFinite(postId)) {
          continue;
        }
        const post = getPostById(postId);
        if (post) {
          syncPostBookmarkControls(postId, post, state.content);
        }
      }
    }

    function ensureReactionOptionsLoaded() {
      state.reactionOptions = [...forcedReactionOptions];
      state.likeReactionId = "heart";
      for (const id of forcedReactionOptions) {
        const forcedUrl = typeof getForcedReactionIconUrl === "function"
          ? getForcedReactionIconUrl(id)
          : "";
        if (forcedUrl) {
          state.reactionIconMap.set(id, forcedUrl);
        }
      }
      if (typeof ensureReactionIconsLoaded === "function") {
        ensureReactionIconsLoaded(state.reactionOptions).catch(() => {});
      }
      refreshReactionControls();
      return state.reactionOptions;
    }

    return {
      buildPostCard,
      refreshReactionControls,
      refreshBookmarkControls,
      ensureReactionOptionsLoaded
    };
  }

  runtime.postInteractionUtils = {
    createApi
  };
})();
