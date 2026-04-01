(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function createApi(state, options = {}) {
    const imagePreviewScaleMin = Number(options.imagePreviewScaleMin || 1);
    const imagePreviewScaleMax = Number(options.imagePreviewScaleMax || 4);
    const imagePreviewScaleStep = Number(options.imagePreviewScaleStep || 0.2);
    const imagePreviewDragThresholdPx = Number(options.imagePreviewDragThresholdPx || 3);
    const closeDrawer = options.closeDrawer;
    if (!state || typeof closeDrawer !== "function") {
      return null;
    }

    function resetImagePreviewScale() {
      runtime.imagePreviewCore.resetScale(state, imagePreviewScaleMin);
    }

    function applyImagePreviewScale() {
      runtime.imagePreviewCore.applyScale(state, imagePreviewScaleMin);
    }

    function endImagePreviewDrag() {
      runtime.imagePreviewCore.endDrag(state);
    }

    function clampImagePreviewOffsets() {
      runtime.imagePreviewCore.clampOffsets(state, imagePreviewScaleMin);
    }

    function openImagePreview(image) {
      runtime.imagePreviewEvents.open({
        state,
        image,
        getPreviewImageSrc: runtime.imagePreviewUtils.getPreviewImageSrc,
        resetImagePreviewScale,
        handlePreviewImageLoad
      });
    }

    function closeImagePreview() {
      runtime.imagePreviewEvents.close({
        state,
        endImagePreviewDrag,
        resetImagePreviewScale
      });
    }

    function handlePreviewImageLoad() {
      runtime.imagePreviewEvents.onLoad({
        state,
        clampImagePreviewOffsets,
        applyImagePreviewScale
      });
    }

    function handleDrawerRootWheel(event) {
      runtime.imagePreviewEvents.onWheel({
        state,
        event,
        imagePreviewScaleMin,
        imagePreviewScaleStep,
        clampImagePreviewScale: (value) => runtime.imagePreviewUtils.clampScale(value, imagePreviewScaleMin, imagePreviewScaleMax),
        clampImagePreviewOffsets,
        applyImagePreviewScale
      });
    }

    function handleImagePreviewPointerDown(event) {
      runtime.imagePreviewEvents.onPointerDown({
        state,
        event,
        imagePreviewScaleMin
      });
    }

    function handleImagePreviewPointerMove(event) {
      runtime.imagePreviewEvents.onPointerMove({
        state,
        event,
        imagePreviewScaleMin,
        imagePreviewDragThresholdPx,
        clampImagePreviewOffsets,
        applyImagePreviewScale
      });
    }

    function handleImagePreviewPointerEnd(event) {
      runtime.imagePreviewEvents.onPointerEnd({
        state,
        event,
        endImagePreviewDrag
      });
    }

    function handleDrawerRootClick(event) {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      if (
        !state.replyEmojiPanel?.hidden
        && !target.closest(".ld-reply-emoji-panel")
        && !target.closest(".ld-reply-emoji-toggle")
      ) {
        if (typeof options.setReplyEmojiPanelOpen === "function") {
          options.setReplyEmojiPanelOpen(false);
        }
      }

      if (target === state.root) {
        closeDrawer();
        return;
      }

      if (!state.imagePreview?.hidden) {
        if (state.imagePreviewSuppressClick && !target.closest(".ld-image-preview-close")) {
          event.preventDefault();
          event.stopPropagation();
          state.imagePreviewSuppressClick = false;
          return;
        }
        if (target.closest(".ld-image-preview-close") || !target.closest(".ld-image-preview-image")) {
          event.preventDefault();
          closeImagePreview();
        }
        return;
      }

      const image = target.closest(".ld-post-body img");
      if (!(image instanceof HTMLImageElement)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      openImagePreview(image);
    }

    return {
      handleDrawerRootClick,
      openImagePreview,
      closeImagePreview,
      handlePreviewImageLoad,
      handleDrawerRootWheel,
      resetImagePreviewScale,
      applyImagePreviewScale,
      handleImagePreviewPointerDown,
      handleImagePreviewPointerMove,
      handleImagePreviewPointerEnd,
      endImagePreviewDrag,
      clampImagePreviewOffsets
    };
  }

  runtime.imagePreviewBridgeUtils = {
    createApi
  };
})();
