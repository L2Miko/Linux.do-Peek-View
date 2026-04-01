(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function open(options) {
    const state = options?.state;
    const image = options?.image;
    const getPreviewImageSrc = options?.getPreviewImageSrc;
    const resetImagePreviewScale = options?.resetImagePreviewScale;
    const handlePreviewImageLoad = options?.handlePreviewImageLoad;
    if (!state?.imagePreview || !state?.imagePreviewImage || typeof getPreviewImageSrc !== "function" || typeof resetImagePreviewScale !== "function") {
      return false;
    }

    const previewSrc = getPreviewImageSrc(image);
    if (!previewSrc) {
      return true;
    }

    resetImagePreviewScale();
    state.imagePreviewImage.src = previewSrc;
    state.imagePreviewImage.alt = image.alt || "图片预览";
    state.imagePreviewImage.classList.remove("is-ready");
    state.imagePreview.hidden = false;
    state.imagePreview.setAttribute("aria-hidden", "false");
    state.imagePreviewSuppressClick = false;
    if (state.imagePreviewImage.complete) {
      state.imagePreviewImage.classList.add("is-ready");
    } else {
      state.imagePreviewImage.addEventListener("load", handlePreviewImageLoad, { once: true });
      state.imagePreviewImage.addEventListener("error", handlePreviewImageLoad, { once: true });
    }
    state.imagePreviewCloseButton?.focus();
    return true;
  }

  function close(options) {
    const state = options?.state;
    const endImagePreviewDrag = options?.endImagePreviewDrag;
    const resetImagePreviewScale = options?.resetImagePreviewScale;
    if (!state?.imagePreview || !state?.imagePreviewImage || typeof endImagePreviewDrag !== "function" || typeof resetImagePreviewScale !== "function") {
      return false;
    }

    endImagePreviewDrag();
    state.imagePreview.hidden = true;
    state.imagePreview.setAttribute("aria-hidden", "true");
    state.imagePreview.classList.remove("is-dragging");
    state.imagePreviewSuppressClick = false;
    resetImagePreviewScale();
    state.imagePreviewImage.classList.remove("is-ready");
    state.imagePreviewImage.removeAttribute("src");
    state.imagePreviewImage.alt = "图片预览";
    return true;
  }

  function onLoad(options) {
    const state = options?.state;
    const clampImagePreviewOffsets = options?.clampImagePreviewOffsets;
    const applyImagePreviewScale = options?.applyImagePreviewScale;
    if (!state || typeof clampImagePreviewOffsets !== "function" || typeof applyImagePreviewScale !== "function") {
      return false;
    }

    state.imagePreviewImage?.classList.add("is-ready");
    clampImagePreviewOffsets();
    applyImagePreviewScale();
    return true;
  }

  function onWheel(options) {
    const state = options?.state;
    const event = options?.event;
    const imagePreviewScaleMin = options?.imagePreviewScaleMin;
    const imagePreviewScaleStep = options?.imagePreviewScaleStep;
    const clampImagePreviewScale = options?.clampImagePreviewScale;
    const clampImagePreviewOffsets = options?.clampImagePreviewOffsets;
    const applyImagePreviewScale = options?.applyImagePreviewScale;
    if (
      !state
      || !(event instanceof Event)
      || typeof clampImagePreviewScale !== "function"
      || typeof clampImagePreviewOffsets !== "function"
      || typeof applyImagePreviewScale !== "function"
    ) {
      return false;
    }

    if (state.imagePreview?.hidden) {
      return true;
    }

    const target = event.target;
    if (!(target instanceof Element) || !target.closest(".ld-image-preview-stage")) {
      return true;
    }

    event.preventDefault();

    const nextScale = clampImagePreviewScale(
      state.imagePreviewScale + (event.deltaY < 0 ? imagePreviewScaleStep : -imagePreviewScaleStep)
    );

    if (nextScale === state.imagePreviewScale) {
      return true;
    }

    state.imagePreviewScale = nextScale;
    if (state.imagePreviewScale <= imagePreviewScaleMin) {
      state.imagePreviewOffsetX = 0;
      state.imagePreviewOffsetY = 0;
    }
    clampImagePreviewOffsets();
    applyImagePreviewScale();
    return true;
  }

  function onPointerDown(options) {
    const state = options?.state;
    const event = options?.event;
    const imagePreviewScaleMin = options?.imagePreviewScaleMin;
    if (!state || !(event instanceof Event)) {
      return false;
    }

    if (state.imagePreview?.hidden || !state.imagePreviewStage || state.imagePreviewScale <= imagePreviewScaleMin) {
      return true;
    }

    if (event.button !== 0) {
      return true;
    }

    const target = event.target;
    if (!(target instanceof Element) || !target.closest(".ld-image-preview-image")) {
      return true;
    }

    event.preventDefault();
    state.imagePreviewPointerId = event.pointerId;
    state.imagePreviewDragStartX = event.clientX;
    state.imagePreviewDragStartY = event.clientY;
    state.imagePreviewDragStartOffsetX = state.imagePreviewOffsetX;
    state.imagePreviewDragStartOffsetY = state.imagePreviewOffsetY;
    state.imagePreviewDragMoved = false;
    state.imagePreviewSuppressClick = false;
    state.imagePreview.classList.add("is-dragging");
    state.imagePreviewStage.setPointerCapture(event.pointerId);
    return true;
  }

  function onPointerMove(options) {
    const state = options?.state;
    const event = options?.event;
    const imagePreviewScaleMin = options?.imagePreviewScaleMin;
    const imagePreviewDragThresholdPx = options?.imagePreviewDragThresholdPx;
    const clampImagePreviewOffsets = options?.clampImagePreviewOffsets;
    const applyImagePreviewScale = options?.applyImagePreviewScale;
    if (
      !state
      || !(event instanceof Event)
      || typeof clampImagePreviewOffsets !== "function"
      || typeof applyImagePreviewScale !== "function"
    ) {
      return false;
    }

    if (state.imagePreview?.hidden || state.imagePreviewPointerId !== event.pointerId || state.imagePreviewScale <= imagePreviewScaleMin) {
      return true;
    }

    event.preventDefault();
    const deltaX = event.clientX - state.imagePreviewDragStartX;
    const deltaY = event.clientY - state.imagePreviewDragStartY;
    if (!state.imagePreviewDragMoved && Math.hypot(deltaX, deltaY) >= imagePreviewDragThresholdPx) {
      state.imagePreviewDragMoved = true;
    }

    state.imagePreviewOffsetX = state.imagePreviewDragStartOffsetX + deltaX;
    state.imagePreviewOffsetY = state.imagePreviewDragStartOffsetY + deltaY;
    clampImagePreviewOffsets();
    applyImagePreviewScale();
    return true;
  }

  function onPointerEnd(options) {
    const state = options?.state;
    const event = options?.event;
    const endImagePreviewDrag = options?.endImagePreviewDrag;
    if (!state || !(event instanceof Event) || typeof endImagePreviewDrag !== "function") {
      return false;
    }

    if (state.imagePreviewPointerId !== event.pointerId) {
      return true;
    }

    const didDrag = state.imagePreviewDragMoved;
    endImagePreviewDrag();
    if (didDrag) {
      state.imagePreviewSuppressClick = true;
      setTimeout(() => {
        state.imagePreviewSuppressClick = false;
      }, 0);
    }
    return true;
  }

  runtime.imagePreviewEvents = {
    open,
    close,
    onLoad,
    onWheel,
    onPointerDown,
    onPointerMove,
    onPointerEnd
  };
})();

