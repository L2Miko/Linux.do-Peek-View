(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function getPostById(postId, sourceLists = []) {
    if (!Number.isFinite(postId)) {
      return null;
    }

    for (const list of sourceLists) {
      const found = (list || []).find((item) => Number(item?.id) === postId);
      if (found) {
        return found;
      }
    }

    return null;
  }

  function getPostByNumber(postNumber, sourceLists = []) {
    if (!Number.isFinite(postNumber)) {
      return null;
    }

    for (const list of sourceLists) {
      const found = (list || []).find((item) => Number(item?.post_number) === postNumber);
      if (found) {
        return found;
      }
    }

    return null;
  }

  runtime.postLookup = {
    getPostById,
    getPostByNumber
  };
})();
