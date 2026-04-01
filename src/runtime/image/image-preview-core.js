(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function clampOffsets(state, minScale) {
    if (!state.imagePreviewStage || !state.imagePreviewImage) {
      state.imagePreviewOffsetX = 0;
      state.imagePreviewOffsetY = 0;
      return;
    }

    if (state.imagePreviewScale <= minScale) {
      state.imagePreviewOffsetX = 0;
      state.imagePreviewOffsetY = 0;
      return;
    }

    const stageWidth = state.imagePreviewStage.clientWidth;
    const stageHeight = state.imagePreviewStage.clientHeight;
    const naturalWidth = state.imagePreviewImage.naturalWidth;
    const naturalHeight = state.imagePreviewImage.naturalHeight;
    if (stageWidth <= 0 || stageHeight <= 0 || naturalWidth <= 0 || naturalHeight <= 0) {
      return;
    }

    const fitScale = Math.min(stageWidth / naturalWidth, stageHeight / naturalHeight, 1);
    const baseWidth = naturalWidth * fitScale;
    const baseHeight = naturalHeight * fitScale;
    const scaledWidth = baseWidth * state.imagePreviewScale;
    const scaledHeight = baseHeight * state.imagePreviewScale;
    const maxOffsetX = Math.max(0, (scaledWidth - stageWidth) / 2);
    const maxOffsetY = Math.max(0, (scaledHeight - stageHeight) / 2);

    state.imagePreviewOffsetX = Math.min(maxOffsetX, Math.max(-maxOffsetX, state.imagePreviewOffsetX));
    state.imagePreviewOffsetY = Math.min(maxOffsetY, Math.max(-maxOffsetY, state.imagePreviewOffsetY));
  }

  function applyScale(state, minScale) {
    if (!state.imagePreview || !state.imagePreviewImage) {
      return;
    }

    clampOffsets(state, minScale);
    state.imagePreviewImage.style.setProperty("--ld-image-preview-scale", String(state.imagePreviewScale));
    state.imagePreviewImage.style.setProperty("--ld-image-preview-offset-x", `${state.imagePreviewOffsetX}px`);
    state.imagePreviewImage.style.setProperty("--ld-image-preview-offset-y", `${state.imagePreviewOffsetY}px`);
    state.imagePreview.classList.toggle("is-zoomed", state.imagePreviewScale > minScale);
  }

  function resetScale(state, minScale) {
    state.imagePreviewScale = minScale;
    state.imagePreviewOffsetX = 0;
    state.imagePreviewOffsetY = 0;
    if (state.imagePreviewImage) {
      state.imagePreviewImage.style.transformOrigin = "center center";
    }
    applyScale(state, minScale);
  }

  function endDrag(state) {
    if (state.imagePreviewPointerId !== null && state.imagePreviewStage?.hasPointerCapture(state.imagePreviewPointerId)) {
      state.imagePreviewStage.releasePointerCapture(state.imagePreviewPointerId);
    }
    state.imagePreviewPointerId = null;
    state.imagePreviewDragMoved = false;
    state.imagePreview?.classList.remove("is-dragging");
  }

  runtime.imagePreviewCore = {
    clampOffsets,
    applyScale,
    resetScale,
    endDrag
  };
})();

