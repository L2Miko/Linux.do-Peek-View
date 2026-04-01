(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function addReplyUploadController(state, controller) {
    if (!state || !Array.isArray(state.replyUploadControllers) || !controller) {
      return;
    }
    state.replyUploadControllers.push(controller);
  }

  function removeReplyUploadController(state, controller) {
    if (!state || !Array.isArray(state.replyUploadControllers)) {
      return;
    }
    state.replyUploadControllers = state.replyUploadControllers.filter((item) => item !== controller);
  }

  function cancelReplyUploads(state) {
    if (!state || !Array.isArray(state.replyUploadControllers)) {
      return;
    }
    for (const controller of state.replyUploadControllers) {
      controller.abort();
    }
    state.replyUploadControllers = [];
    state.replyUploadPendingCount = 0;
  }

  function updateReplyUploadStatus(state) {
    if (!state?.replyStatus || state.replyUploadPendingCount <= 0) {
      return;
    }
    state.replyStatus.textContent = state.replyUploadPendingCount > 1
      ? `正在上传 ${state.replyUploadPendingCount} 张图片...`
      : "正在上传图片...";
  }

  runtime.replyUploadStateUtils = {
    addReplyUploadController,
    removeReplyUploadController,
    cancelReplyUploads,
    updateReplyUploadStatus
  };
})();
