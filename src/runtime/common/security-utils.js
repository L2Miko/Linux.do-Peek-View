(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function getCsrfToken(doc = document) {
    const token = doc.querySelector('meta[name="csrf-token"]')?.getAttribute("content") || "";
    return token.trim();
  }

  runtime.securityUtils = {
    getCsrfToken
  };
})();
