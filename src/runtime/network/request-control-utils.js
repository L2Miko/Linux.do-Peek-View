(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function cancelLoadMoreRequest(state) {
    if (!state?.loadMoreAbortController) {
      return;
    }
    state.loadMoreAbortController.abort();
    state.loadMoreAbortController = null;
  }

  function cancelReplyRequest(state) {
    if (!state?.replyAbortController) {
      return;
    }
    state.replyAbortController.abort();
    state.replyAbortController = null;
  }

  runtime.requestControlUtils = {
    cancelLoadMoreRequest,
    cancelReplyRequest
  };
})();
