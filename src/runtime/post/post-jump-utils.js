(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function createApi(state, options = {}) {
    const jumpBackButtonDurationMs = Number(options.jumpBackButtonDurationMs || 10000);
    const syncDrawerHeaderLiquidState = options.syncDrawerHeaderLiquidState;
    const alignTargetPostBelowHeaderCapsule = options.alignTargetPostBelowHeaderCapsule;
    const requestAnimationFrameFn = options.requestAnimationFrameFn || globalThis.requestAnimationFrame;
    const setTimeoutFn = options.setTimeoutFn || globalThis.setTimeout;
    const clearTimeoutFn = options.clearTimeoutFn || globalThis.clearTimeout;
    if (
      !state
      || typeof syncDrawerHeaderLiquidState !== "function"
      || typeof alignTargetPostBelowHeaderCapsule !== "function"
      || typeof requestAnimationFrameFn !== "function"
      || typeof setTimeoutFn !== "function"
      || typeof clearTimeoutFn !== "function"
    ) {
      return null;
    }

    function clearJumpBackButton() {
      if (state.jumpBackButtonTimer) {
        clearTimeoutFn(state.jumpBackButtonTimer);
        state.jumpBackButtonTimer = null;
      }

      if (state.jumpBackButton instanceof HTMLElement) {
        state.jumpBackButton.remove();
      }
      state.jumpBackButton = null;
    }

    function applyReadPositionGlow(target) {
      if (!(target instanceof HTMLElement)) {
        return;
      }

      target.classList.remove("ld-post-card-read-line-glow");
      void target.offsetWidth;
      target.classList.add("ld-post-card-read-line-glow");
      setTimeoutFn(() => {
        target.classList.remove("ld-post-card-read-line-glow");
      }, 5100);
    }

    function applyJumpPositionGlow(target) {
      if (!(target instanceof HTMLElement)) {
        return;
      }

      target.classList.remove("ld-post-card-jump-line-glow");
      void target.offsetWidth;
      target.classList.add("ld-post-card-jump-line-glow");
      setTimeoutFn(() => {
        target.classList.remove("ld-post-card-jump-line-glow");
      }, 5100);
    }

    function scrollToPostNumber(postNumber, withHighlight = false, options = {}) {
      if (!Number.isFinite(postNumber)) {
        return;
      }

      const target = state.content?.querySelector(`.ld-post-card[data-post-number="${postNumber}"]`);
      if (!(target instanceof HTMLElement)) {
        return;
      }

      target.scrollIntoView({ block: "center", behavior: "smooth" });
      if (Number.isFinite(options.jumpBackPostNumber) && options.jumpBackPostNumber > 0 && options.jumpBackPostNumber !== postNumber) {
        showJumpBackButton(target, options.jumpBackPostNumber);
      }
      if (!withHighlight) {
        return;
      }
      applyJumpPositionGlow(target);
    }

    function showJumpBackButton(targetCard, backPostNumber) {
      if (!(targetCard instanceof HTMLElement) || !Number.isFinite(backPostNumber) || backPostNumber <= 0) {
        return;
      }

      const actions = targetCard.querySelector(".ld-post-actions");
      if (!(actions instanceof HTMLElement)) {
        return;
      }

      clearJumpBackButton();

      const button = document.createElement("button");
      button.type = "button";
      button.className = "ld-post-jump-back-button";
      button.dataset.backPostNumber = String(backPostNumber);
      button.innerHTML = `
        <span class="ld-post-jump-back-button-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" focusable="false">
            <path d="M15.53 5.47a1.5 1.5 0 0 1 0 2.12L11.12 12l4.41 4.41a1.5 1.5 0 1 1-2.12 2.12l-5.47-5.47a1.5 1.5 0 0 1 0-2.12l5.47-5.47a1.5 1.5 0 0 1 2.12 0Z" fill="currentColor"></path>
          </svg>
        </span>
        <span class="ld-post-jump-back-button-label">返回 #${backPostNumber}</span>
      `;
      button.setAttribute("aria-label", `返回跳转前楼层 #${backPostNumber}`);
      button.addEventListener("click", (event) => {
        event.preventDefault();
        event.stopPropagation();
        clearJumpBackButton();
        scrollToPostNumber(backPostNumber, true);
      });

      actions.insertBefore(button, actions.firstChild);
      state.jumpBackButton = button;
      state.jumpBackButtonTimer = setTimeoutFn(() => {
        if (state.jumpBackButton === button) {
          clearJumpBackButton();
        }
      }, jumpBackButtonDurationMs);
    }

    function scrollTopicViewToTargetPost(targetPostNumber, options = {}) {
      if (!targetPostNumber) {
        return;
      }

      requestAnimationFrameFn(() => {
        const target = state.content?.querySelector(`.ld-post-card[data-post-number="${targetPostNumber}"]`);
        if (!(target instanceof HTMLElement)) {
          return;
        }
        target.scrollIntoView({ block: "start", behavior: "auto" });
        syncDrawerHeaderLiquidState(true);
        requestAnimationFrameFn(() => {
          alignTargetPostBelowHeaderCapsule(target);
          if (options.withReadGlow) {
            applyReadPositionGlow(target);
          }
        });
      });
    }

    return {
      clearJumpBackButton,
      applyReadPositionGlow,
      applyJumpPositionGlow,
      scrollToPostNumber,
      showJumpBackButton,
      scrollTopicViewToTargetPost
    };
  }

  runtime.postJumpUtils = {
    createApi
  };
})();
