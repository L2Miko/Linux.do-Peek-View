(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  async function readOptionalJson(response) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("json")) {
      return null;
    }

    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  async function readRequestError(response, fallbackMessage) {
    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("json")) {
      return `${fallbackMessage}（${response.status}）`;
    }

    try {
      const data = await response.json();
      if (Array.isArray(data?.errors) && data.errors.length > 0) {
        return data.errors.join("；");
      }
      if (typeof data?.error === "string" && data.error.trim()) {
        return data.error.trim();
      }
      return `${fallbackMessage}（${response.status}）`;
    } catch {
      return `${fallbackMessage}（${response.status}）`;
    }
  }

  runtime.networkResponse = {
    readOptionalJson,
    readRequestError
  };
})();
