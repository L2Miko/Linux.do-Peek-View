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
    const pendingBoostPostIds = new Set();
    const pendingBoostDeleteIds = new Set();
    let boostPanel = null;
    let boostPanelEditor = null;
    let boostPanelSubmitButton = null;
    let boostPanelCancelButton = null;
    let boostPanelPostId = null;
    let boostPanelAnchor = null;
    let boostPanelHideTimer = null;
    let cachedCurrentUsername = "";
    let currentUsernameRequest = null;

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
      const replyToAvatarUrl = parentPost?.avatar_url || post?.reply_to_user?.avatar_url || "";
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

      if (replyToAvatarUrl || replyToAvatarTemplate) {
        const avatar = document.createElement("img");
        avatar.className = "ld-reply-to-tab-avatar";
        avatar.alt = replyToUsername || `#${replyToPostNumber}`;
        avatar.width = 24;
        avatar.height = 24;
        avatar.loading = "lazy";
        runtime.topicRenderUtils.applyAvatarImage(avatar, {
          avatarUrl: replyToAvatarUrl,
          avatarTemplate: replyToAvatarTemplate
        }, locationOrigin, {
          size: 24,
          animatedSize: 48
        });
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

    function buildPostBoostIconHtml() {
      return `
        <svg class="fa d-icon d-icon-rocket svg-icon fa-width-auto svg-string" width="1em" height="1em" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
          <use href="#rocket"></use>
        </svg>
      `;
    }

    function normalizeBoostText(value) {
      return String(value || "").replace(/\s+/g, " ").trim();
    }

    function readBoostTextFromHtml(html) {
      const markup = String(html || "").trim();
      if (!markup) {
        return "";
      }

      const template = document.createElement("template");
      template.innerHTML = markup;
      return normalizeBoostText(template.content.textContent || "");
    }

    function normalizeBoostItem(item) {
      if (!item) {
        return null;
      }

      if (typeof item === "string") {
        const rawText = normalizeBoostText(item);
        return rawText ? { raw: rawText } : null;
      }

      if (typeof item !== "object") {
        return null;
      }

      const user = item.user && typeof item.user === "object" ? item.user : null;
      const cookedHtml = String(
        item.cooked
        || item.cookedHtml
        || item.cooked_html
        || item.html
        || item.rendered
        || item.excerpt
        || ""
      ).trim();
      const rawText = normalizeBoostText(
        item.raw
        || item.text
        || item.content
        || item.body
        || readBoostTextFromHtml(cookedHtml)
      );

      if (!rawText && !cookedHtml) {
        return null;
      }

      return {
        id: Number(item.id || item.boost_id || item.boostId) || 0,
        username: normalizeBoostText(item.username || item.user_username || user?.username || user?.name),
        avatarTemplate: String(item.avatarTemplate || item.avatar_template || item.user_avatar_template || user?.avatar_template || "").trim(),
        avatarUrl: String(item.avatarUrl || item.avatar_url || item.user_avatar_url || user?.avatar_url || user?.avatar || "").trim(),
        canDelete: item.canDelete === true || item.can_delete === true,
        raw: rawText,
        cookedHtml
      };
    }

    function getBoostSignature(boost) {
      const normalized = normalizeBoostItem(boost);
      if (!normalized) {
        return "";
      }

      return [
        normalized.username,
        normalized.raw || readBoostTextFromHtml(normalized.cookedHtml)
      ].map((value) => normalizeBoostText(value)).join("|");
    }

    function resolveCurrentUsername() {
      if (cachedCurrentUsername) {
        return cachedCurrentUsername;
      }

      const selectors = [
        ".d-header .current-user [data-user-card]",
        ".d-header .header-dropdown-toggle.current-user [data-user-card]",
        ".d-header-icons .current-user [data-user-card]",
        ".current-user [data-user-card]",
        ".user-menu [data-user-card]"
      ];

      for (const selector of selectors) {
        const element = document.querySelector(selector);
        const username = normalizeBoostText(element?.getAttribute?.("data-user-card"));
        if (username) {
          cachedCurrentUsername = username;
          return username;
        }
      }

      const datasetUsername = normalizeBoostText(
        document.body?.dataset?.currentUsername
        || document.body?.dataset?.username
        || document.documentElement?.dataset?.currentUsername
        || document.documentElement?.dataset?.username
      );
      if (datasetUsername) {
        cachedCurrentUsername = datasetUsername;
        return datasetUsername;
      }

      return "";
    }

    async function loadCurrentUsername() {
      if (cachedCurrentUsername) {
        return cachedCurrentUsername;
      }
      if (currentUsernameRequest) {
        return currentUsernameRequest;
      }

      currentUsernameRequest = fetch(`${locationOrigin}/session/current.json`, {
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }
      })
        .then(async (response) => {
          if (!response.ok) {
            return "";
          }
          const data = await response.json().catch(() => null);
          const username = normalizeBoostText(
            data?.current_user?.username
            || data?.currentUser?.username
            || data?.user?.username
            || data?.username
          );
          if (username) {
            cachedCurrentUsername = username;
          }
          return username;
        })
        .catch(() => "")
        .finally(() => {
          currentUsernameRequest = null;
        });

      return currentUsernameRequest;
    }

    function isOwnBoost(boost) {
      const currentUsername = normalizeBoostText(resolveCurrentUsername()).toLowerCase();
      const boostUsername = normalizeBoostText(boost?.username).toLowerCase();
      if (!boostUsername || !currentUsername) {
        return Boolean(boost?.canDelete);
      }
      return boostUsername === currentUsername;
    }

    function ensureCurrentUsernameLoaded() {
      if (cachedCurrentUsername || !state.content) {
        return;
      }

      loadCurrentUsername().then((username) => {
        if (!username || !state.content) {
          return;
        }
        refreshBoostControls();
      });
    }

    function getBoostLookupKeys(boost) {
      const normalized = normalizeBoostItem(boost);
      if (!normalized) {
        return [];
      }

      const keys = [];
      const id = Number(normalized.id);
      const signature = getBoostSignature(normalized);
      if (Number.isFinite(id) && id > 0) {
        keys.push(`id:${id}`);
      }
      if (signature) {
        keys.push(`sig:${signature}`);
      }
      return keys;
    }

    function mergeBoostItem(base, incoming) {
      if (!base) {
        return incoming;
      }
      if (!incoming) {
        return base;
      }

      return {
        ...base,
        id: Number(base.id) || Number(incoming.id) || 0,
        username: base.username || incoming.username,
        avatarTemplate: base.avatarTemplate || incoming.avatarTemplate,
        avatarUrl: base.avatarUrl || incoming.avatarUrl,
        canDelete: Boolean(base.canDelete || incoming.canDelete),
        raw: base.raw || incoming.raw,
        cookedHtml: base.cookedHtml || incoming.cookedHtml
      };
    }

    function pushBoostArray(target, value, seenArrays) {
      if (!Array.isArray(value) || seenArrays.has(value)) {
        return;
      }
      seenArrays.add(value);
      for (const item of value) {
        target.push(item);
      }
    }

    function collectBoostCandidates(post) {
      const candidates = [];
      const seenArrays = new Set();
      const discourseBoosts = post?.discourse_boosts && typeof post.discourse_boosts === "object"
        ? post.discourse_boosts
        : null;

      pushBoostArray(candidates, post?.boosts, seenArrays);
      pushBoostArray(candidates, post?.post_boosts, seenArrays);
      pushBoostArray(candidates, discourseBoosts, seenArrays);
      pushBoostArray(candidates, discourseBoosts?.boosts, seenArrays);
      pushBoostArray(candidates, discourseBoosts?.items, seenArrays);
      pushBoostArray(candidates, discourseBoosts?.list, seenArrays);
      pushBoostArray(candidates, post?.__ld_local_boosts, seenArrays);

      return candidates;
    }

    function findSourcePostElement(post) {
      const postId = Number(post?.id);
      const postNumber = Number(post?.post_number);
      const selectors = [
        Number.isFinite(postId) ? `.topic-post[data-post-id="${postId}"]` : "",
        Number.isFinite(postId) ? `[data-post-id="${postId}"]` : "",
        Number.isFinite(postNumber) ? `#post_${postNumber}` : ""
      ].filter(Boolean);

      for (const selector of selectors) {
        for (const element of document.querySelectorAll(selector)) {
          if (!(element instanceof HTMLElement)) {
            continue;
          }
          if (state.root instanceof HTMLElement && state.root.contains(element)) {
            continue;
          }
          return element;
        }
      }

      return null;
    }

    function extractBoostsFromSourceDom(post) {
      const sourcePost = findSourcePostElement(post);
      if (!(sourcePost instanceof HTMLElement)) {
        return [];
      }

      const result = [];
      for (const bubble of sourcePost.querySelectorAll(".discourse-boosts__bubble")) {
        if (!(bubble instanceof HTMLElement)) {
          continue;
        }

        const userCard = bubble.querySelector("[data-user-card]");
        const avatar = bubble.querySelector("img.avatar");
        const cookedButton = bubble.querySelector(".discourse-boosts__cooked");
        const cookedHtml = String(cookedButton?.innerHTML || "").trim();
        const rawText = normalizeBoostText(cookedButton?.textContent || "");

        if (!rawText && !cookedHtml) {
          continue;
        }

        result.push({
          username: normalizeBoostText(userCard?.getAttribute("data-user-card")),
          avatarUrl: avatar instanceof HTMLImageElement ? String(avatar.currentSrc || avatar.src || "").trim() : "",
          canDelete: bubble.querySelector(".discourse-boosts__delete") instanceof HTMLElement,
          raw: rawText,
          cookedHtml
        });
      }

      return result;
    }

    function getNormalizedPostBoosts(post) {
      const seen = new Map();
      const result = [];
      const removedKeys = new Set(Array.isArray(post?.__ld_removed_boost_keys) ? post.__ld_removed_boost_keys : []);

      const upsertBoost = (item) => {
        const normalized = normalizeBoostItem(item);
        const signature = getBoostSignature(normalized);
        if (!normalized || !signature) {
          return;
        }
        const lookupKeys = getBoostLookupKeys(normalized);
        if (lookupKeys.some((key) => removedKeys.has(key))) {
          return;
        }

        const existingIndex = seen.get(signature);
        if (typeof existingIndex === "number") {
          result[existingIndex] = mergeBoostItem(result[existingIndex], normalized);
          return;
        }

        seen.set(signature, result.length);
        result.push(normalized);
      };

      for (const item of extractBoostsFromSourceDom(post)) {
        upsertBoost(item);
      }

      for (const item of collectBoostCandidates(post)) {
        upsertBoost(item);
      }

      return result;
    }

    function postHasOwnedBoost(post) {
      ensureCurrentUsernameLoaded();
      return getNormalizedPostBoosts(post).some((boost) => isOwnBoost(boost));
    }

    function extractBoostsFromResponse(data) {
      if (!data || typeof data !== "object") {
        return [];
      }

      const candidates = [];
      if (data.boost && typeof data.boost === "object") {
        candidates.push(data.boost);
      }
      if (data.created_boost && typeof data.created_boost === "object") {
        candidates.push(data.created_boost);
      }
      candidates.push(data);

      const normalized = candidates
        .map((item) => normalizeBoostItem(item))
        .filter(Boolean);

      return normalized.length ? [normalized[0]] : [];
    }

    function syncPostBoostListElement(container, post) {
      if (!(container instanceof HTMLElement)) {
        return;
      }

      const boosts = getNormalizedPostBoosts(post);
      container.replaceChildren();
      container.hidden = boosts.length === 0;
      container.classList.toggle("is-empty", boosts.length === 0);

      if (boosts.length === 0) {
        return;
      }

      const list = document.createElement("div");
      list.className = "ld-post-boost-list-inner";

      for (const boost of boosts) {
        const bubble = document.createElement("span");
        bubble.className = "ld-post-boost-bubble";
        if (isOwnBoost(boost)) {
          bubble.classList.add("is-owned");
        }

        const avatar = document.createElement(boost.username ? "a" : "span");
        avatar.className = "ld-post-boost-avatar-link";
        if (boost.username) {
          avatar.setAttribute("data-user-card", boost.username);
        }

        const image = document.createElement("img");
        image.className = "avatar";
        image.alt = "";
        image.width = 24;
        image.height = 24;
        image.loading = "lazy";
        runtime.topicRenderUtils.applyAvatarImage(image, {
          avatarUrl: boost.avatarUrl,
          avatarTemplate: boost.avatarTemplate
        }, locationOrigin, {
          size: 24,
          animatedSize: 48
        });
        avatar.appendChild(image);

        const content = document.createElement("span");
        content.className = "ld-post-boost-bubble-content";
        if (boost.cookedHtml) {
          content.innerHTML = boost.cookedHtml;
        } else {
          content.textContent = boost.raw || readBoostTextFromHtml(boost.cookedHtml);
        }

        bubble.append(avatar, content);

        const boostId = Number(boost.id);
        if (isOwnBoost(boost) && Number.isFinite(boostId) && boostId > 0) {
          bubble.classList.add("is-deletable");
          content.setAttribute("role", "button");
          content.setAttribute("tabindex", "0");
          content.setAttribute("aria-expanded", "false");

          const deleteButton = document.createElement("button");
          deleteButton.type = "button";
          deleteButton.className = "ld-post-boost-delete btn-transparent --danger";
          deleteButton.setAttribute("aria-label", "Remove boost");
          deleteButton.disabled = pendingBoostDeleteIds.has(boostId);
          deleteButton.innerHTML = `
            <svg class="fa d-icon d-icon-trash-can svg-icon fa-width-auto svg-string" width="1em" height="1em" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#trash-can"></use></svg>
          `;
          deleteButton.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            handlePostBoostDelete(Number(post?.id), boost);
          });

          const toggleDeleteButton = () => {
            const nextSelected = !bubble.classList.contains("is-selected");
            bubble.classList.toggle("is-selected", nextSelected);
            content.setAttribute("aria-expanded", String(nextSelected));
          };

          content.addEventListener("click", (event) => {
            event.preventDefault();
            event.stopPropagation();
            toggleDeleteButton();
          });
          content.addEventListener("keydown", (event) => {
            if (event.key !== "Enter" && event.key !== " ") {
              return;
            }
            event.preventDefault();
            event.stopPropagation();
            toggleDeleteButton();
          });

          bubble.appendChild(deleteButton);
        }

        list.appendChild(bubble);
      }

      container.appendChild(list);
    }

    function syncPostBoostButton(button, post) {
      if (!(button instanceof HTMLButtonElement)) {
        return;
      }

      const postId = Number(post?.id || button.dataset.postId);
      const disabled = Number.isFinite(postId) && pendingBoostPostIds.has(postId);
      const hasOwnedBoost = postHasOwnedBoost(post);
      button.hidden = hasOwnedBoost;
      button.disabled = disabled;
      button.setAttribute("aria-disabled", String(disabled));
      button.setAttribute("aria-label", "发送 Boost");
      button.setAttribute("title", "发送 Boost");
      button.innerHTML = `
        <span class="ld-post-boost-icon" aria-hidden="true">${buildPostBoostIconHtml()}</span>
      `;
    }

    async function handlePostBoostDelete(postId, boost) {
      const boostId = Number(boost?.id);
      if (!Number.isFinite(postId) || !Number.isFinite(boostId) || boostId <= 0 || pendingBoostDeleteIds.has(boostId)) {
        return;
      }

      pendingBoostDeleteIds.add(boostId);
      const post = getPostById(postId);
      syncPostBoostControls(postId, post);

      try {
        await removePostBoost(boostId);
        runtime.postLocalMutations.applyPostBoostRemovalLocally(postId, boost, getPostLists(), {
          getBoostSignature,
          getBoostLookupKeys
        });
        if (state.replyStatus) {
          state.replyStatus.textContent = "Boost 已删除";
        }
      } catch (error) {
        if (state.replyStatus) {
          state.replyStatus.textContent = error?.message || "Boost 删除失败";
        }
      } finally {
        pendingBoostDeleteIds.delete(boostId);
        const latestPost = getPostById(postId) || post;
        syncPostBoostControls(postId, latestPost);
      }
    }

    async function addPostBoost(postId, raw) {
      const csrfToken = runtime.securityUtils.getCsrfToken(document);
      if (!csrfToken) {
        throw new Error("未找到登录令牌，请刷新页面后重试");
      }

      const body = new URLSearchParams();
      body.set("raw", raw);

      const response = await fetch(`${locationOrigin}/discourse-boosts/posts/${postId}/boosts`, {
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

      const contentType = response.headers.get("content-type") || "";
      const data = contentType.includes("json") ? await response.json() : null;
      if (!response.ok) {
        throw new Error(await runtime.networkResponse.readRequestError(response, "Boost 发送失败"));
      }

      return data;
    }

    async function removePostBoost(boostId) {
      const csrfToken = runtime.securityUtils.getCsrfToken(document);
      if (!csrfToken) {
        throw new Error("未找到登录令牌，请刷新页面后重试");
      }

      const response = await fetch(`${locationOrigin}/discourse-boosts/boosts/${boostId}`, {
        method: "DELETE",
        credentials: "include",
        headers: {
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRF-Token": csrfToken
        }
      });

      if (response.ok || response.status === 204 || response.status === 404) {
        return;
      }

      throw new Error(await runtime.networkResponse.readRequestError(response, "Boost 删除失败"));
    }

    function clearBoostPanelHideTimer() {
      if (boostPanelHideTimer) {
        clearTimeout(boostPanelHideTimer);
        boostPanelHideTimer = null;
      }
    }

    function scheduleBoostPanelHide() {
      clearBoostPanelHideTimer();
      boostPanelHideTimer = setTimeout(() => {
        closeBoostPanel();
      }, reactionPickerHideDelayMs);
    }

    function ensureBoostPanel() {
      if (boostPanel instanceof HTMLElement) {
        return boostPanel;
      }
      if (!(state.root instanceof HTMLElement)) {
        return null;
      }

      boostPanel = document.createElement("div");
      boostPanel.className = "ld-post-boost-floating-panel ld-post-boost-panel fk-d-menu discourse-boosts-content -animated";
      boostPanel.setAttribute("data-identifier", "discourse-boosts");
      boostPanel.setAttribute("data-content", "");
      boostPanel.setAttribute("role", "dialog");
      boostPanel.innerHTML = `
        <div class="fk-d-menu__inner-content">
          <div class="ld-post-boost-input-container">
            <div class="ld-post-boost-editor" contenteditable="true"></div>
            <button class="ld-post-boost-submit btn no-text btn-icon btn-default --success btn-icon-only" type="button" title="Boost" aria-label="Boost">
              <svg class="fa d-icon d-icon-check svg-icon fa-width-auto svg-string" width="1em" height="1em" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#check"></use></svg>
            </button>
            <button class="ld-post-boost-cancel btn no-text btn-icon btn-default --danger btn-icon-only" type="button" title="Cancel" aria-label="Cancel">
              <svg class="fa d-icon d-icon-xmark svg-icon fa-width-auto svg-string" width="1em" height="1em" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><use href="#xmark"></use></svg>
            </button>
          </div>
        </div>
      `;

      boostPanelEditor = boostPanel.querySelector(".ld-post-boost-editor");
      boostPanelSubmitButton = boostPanel.querySelector(".ld-post-boost-submit");
      boostPanelCancelButton = boostPanel.querySelector(".ld-post-boost-cancel");

      boostPanel.addEventListener("mouseenter", clearBoostPanelHideTimer);
      boostPanel.addEventListener("mouseleave", scheduleBoostPanelHide);

      if (boostPanelEditor instanceof HTMLElement) {
        boostPanelEditor.addEventListener("input", () => syncBoostPanelComposer());
        boostPanelEditor.addEventListener("keydown", (event) => {
          if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
            event.preventDefault();
            handlePostBoostSubmit(boostPanelPostId);
          }
        });
      }

      if (boostPanelSubmitButton instanceof HTMLButtonElement) {
        boostPanelSubmitButton.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          handlePostBoostSubmit(boostPanelPostId);
        });
      }

      if (boostPanelCancelButton instanceof HTMLButtonElement) {
        boostPanelCancelButton.addEventListener("click", (event) => {
          event.preventDefault();
          event.stopPropagation();
          closeBoostPanel();
        });
      }

      state.root.appendChild(boostPanel);
      return boostPanel;
    }

    function syncBoostPanelComposer() {
      const post = getPostById(Number(boostPanelPostId));
      const isPending = pendingBoostPostIds.has(Number(boostPanelPostId));
      const raw = boostPanelEditor instanceof HTMLElement ? boostPanelEditor.textContent.trim() : "";
      const placeholderName = post?.username || post?.name || "该用户";

      if (boostPanelEditor instanceof HTMLElement) {
        boostPanelEditor.setAttribute("data-placeholder", `Boost ${placeholderName}...`);
        boostPanelEditor.contentEditable = isPending ? "false" : "true";
      }
      if (boostPanelSubmitButton instanceof HTMLButtonElement) {
        boostPanelSubmitButton.disabled = isPending || !raw;
      }
      if (boostPanelCancelButton instanceof HTMLButtonElement) {
        boostPanelCancelButton.disabled = isPending;
      }
    }

    function positionBoostPanel() {
      if (!(boostPanel instanceof HTMLElement) || !(boostPanelAnchor instanceof HTMLElement) || !(state.root instanceof HTMLElement)) {
        return;
      }
      const rootRect = state.root.getBoundingClientRect();
      const anchorRect = boostPanelAnchor.getBoundingClientRect();
      const panelWidth = Math.min(360, Math.max(260, rootRect.width - 32));
      const preferredLeft = anchorRect.left - rootRect.left - panelWidth + anchorRect.width - 6;
      const left = Math.max(16, Math.min(rootRect.width - panelWidth - 16, preferredLeft));
      const bottom = Math.max(12, rootRect.bottom - anchorRect.top + 8);
      boostPanel.style.left = `${left}px`;
      boostPanel.style.top = "auto";
      boostPanel.style.bottom = `${bottom}px`;
      boostPanel.style.width = `${panelWidth}px`;
      boostPanel.style.transform = "none";
    }

    function openBoostPanel(postId, anchor) {
      const panel = ensureBoostPanel();
      if (!(panel instanceof HTMLElement) || !(anchor instanceof HTMLElement)) {
        return;
      }
      clearBoostPanelHideTimer();
      boostPanelPostId = postId;
      boostPanelAnchor = anchor;
      panel.classList.add("is-expanded");
      syncBoostPanelComposer();
      positionBoostPanel();
      requestAnimationFrame(() => {
        positionBoostPanel();
        if (boostPanelEditor instanceof HTMLElement) {
          boostPanelEditor.focus();
        }
      });
    }

    function closeBoostPanel() {
      clearBoostPanelHideTimer();
      if (boostPanel instanceof HTMLElement) {
        boostPanel.classList.remove("is-expanded");
      }
      boostPanelPostId = null;
      boostPanelAnchor = null;
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

    function syncPostBoostControls(postId, post, scope = state.content) {
      if (!Number.isFinite(postId) || !(scope instanceof Element || scope instanceof DocumentFragment || scope instanceof Document)) {
        return;
      }

      const buttons = [];
      const wraps = [];
      const lists = [];
      if (scope instanceof Element && scope.matches(`.ld-post-boost-wrap[data-post-id="${postId}"]`)) {
        wraps.push(scope);
      }
      if (scope instanceof Element && scope.matches(`.ld-post-boost-button[data-post-id="${postId}"]`)) {
        buttons.push(scope);
      }
      if (scope instanceof Element && scope.matches(`.ld-post-boost-list[data-post-id="${postId}"]`)) {
        lists.push(scope);
      }
      for (const wrap of scope.querySelectorAll(`.ld-post-boost-wrap[data-post-id="${postId}"]`)) {
        wraps.push(wrap);
      }
      for (const button of scope.querySelectorAll(`.ld-post-boost-button[data-post-id="${postId}"]`)) {
        buttons.push(button);
      }
      for (const list of scope.querySelectorAll(`.ld-post-boost-list[data-post-id="${postId}"]`)) {
        lists.push(list);
      }

      const hasOwnedBoost = postHasOwnedBoost(post);
      for (const wrap of wraps) {
        wrap.hidden = hasOwnedBoost;
      }
      for (const button of buttons) {
        syncPostBoostButton(button, post);
      }
      for (const list of lists) {
        syncPostBoostListElement(list, post);
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

    async function handlePostBoostSubmit(postId) {
      if (!Number.isFinite(postId) || pendingBoostPostIds.has(postId)) {
        return;
      }

      const post = getPostById(postId);
      if (!post || !(boostPanel instanceof HTMLElement)) {
        return;
      }

      const raw = String(boostPanelEditor?.textContent || "").trim();
      if (!raw) {
        syncBoostPanelComposer();
        return;
      }

      pendingBoostPostIds.add(postId);
      syncBoostPanelComposer();

      try {
        const result = await addPostBoost(postId, raw);
        const payload = runtime.postPayload.normalizePostMutationPayload(result);
        if (payload && typeof payload === "object") {
          runtime.postPayload.applyPostServerPayload(postId, payload, getPostLists());
        }
        for (const boost of extractBoostsFromResponse(result)) {
          runtime.postLocalMutations.applyPostBoostLocally(postId, boost, getPostLists(), {
            getBoostSignature,
            getBoostLookupKeys
          });
        }
        if (boostPanelEditor instanceof HTMLElement) {
          boostPanelEditor.textContent = "";
        }
        closeBoostPanel();
        syncPostBoostControls(postId, getPostById(postId) || post);
        setTimeout(() => {
          const latestPost = getPostById(postId) || post;
          syncPostBoostControls(postId, latestPost);
        }, 300);
        if (state.replyStatus) {
          state.replyStatus.textContent = "Boost 已发送";
        }
      } catch (error) {
        if (state.replyStatus) {
          state.replyStatus.textContent = error?.message || "Boost 发送失败";
        }
      } finally {
        pendingBoostPostIds.delete(postId);
        syncBoostPanelComposer();
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

    function buildPostBoostButton(post) {
      const postId = Number(post?.id);
      if (!Number.isFinite(postId)) {
        return null;
      }

      const wrap = document.createElement("div");
      wrap.className = "ld-post-boost-wrap";
      wrap.dataset.postId = String(postId);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "ld-post-boost-button btn no-text btn-icon fk-d-menu__trigger discourse-boosts-trigger post-action-menu__boost boost btn-flat";
      button.dataset.postId = String(postId);
      button.setAttribute("data-identifier", "discourse-boosts");
      button.setAttribute("data-trigger", "");
      button.addEventListener("mouseenter", () => {
        clearBoostPanelHideTimer();
        openBoostPanel(postId, button);
      });
      button.addEventListener("mouseleave", () => {
        if (boostPanelPostId === postId && boostPanel?.classList.contains("is-expanded")) {
          scheduleBoostPanelHide();
        }
      });
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (boostPanelPostId === postId && boostPanel?.classList.contains("is-expanded")) {
          closeBoostPanel();
        } else {
          openBoostPanel(postId, button);
        }
      });

      wrap.append(button);
      syncPostBoostControls(postId, post, wrap);
      return wrap;
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
      if (typeof post.id === "number") {
        article.dataset.postId = String(post.id);
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
      runtime.topicRenderUtils.applyAvatarImage(avatar, {
        avatarUrl: post.avatar_url,
        avatarTemplate: post.avatar_template
      }, locationOrigin, {
        size: 40,
        animatedSize: 48
      });

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

      const boostWrap = buildPostBoostButton(post);
      if (boostWrap) {
        actions.insertBefore(boostWrap, bookmarkButton || null);
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
      const boostList = document.createElement("div");
      boostList.className = "ld-post-boost-list";
      if (Number.isFinite(Number(post?.id))) {
        boostList.dataset.postId = String(post.id);
      }
      syncPostBoostListElement(boostList, post);
      if (replyToTab) {
        article.append(replyToTab);
      }
      article.append(header, body, actions, boostList);
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

    function refreshBoostControls() {
      if (!state.content) {
        return;
      }

      for (const button of state.content.querySelectorAll(".ld-post-boost-button[data-post-id]")) {
        const postId = Number(button.getAttribute("data-post-id"));
        if (!Number.isFinite(postId)) {
          continue;
        }
        const post = getPostById(postId);
        if (post) {
          syncPostBoostControls(postId, post, state.content);
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
      refreshBoostControls,
      ensureReactionOptionsLoaded
    };
  }

  runtime.postInteractionUtils = {
    createApi
  };
})();
