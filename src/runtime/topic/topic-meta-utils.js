(function () {
  const runtime = globalThis.__LINUXDO_PV__ && globalThis.__LINUXDO_PV__.runtime;
  if (!runtime) {
    return;
  }

  function appendTopicTagChip(parent, documentRef, label, icon) {
    if (!parent || !documentRef || !label) {
      return;
    }

    const item = documentRef.createElement("span");
    item.className = "ld-drawer-meta-tag";

    if (icon?.type === "svg" && typeof icon.html === "string") {
      const iconWrap = documentRef.createElement("span");
      iconWrap.className = "ld-drawer-meta-tag-icon";
      if (icon.color) {
        iconWrap.style.color = icon.color;
      }
      iconWrap.innerHTML = icon.html;
      item.appendChild(iconWrap);
    } else if (icon?.type === "img" && icon.src) {
      const iconWrap = documentRef.createElement("span");
      iconWrap.className = "ld-drawer-meta-tag-icon";
      const image = documentRef.createElement("img");
      image.src = icon.src;
      image.alt = icon.alt || label;
      image.loading = "lazy";
      image.decoding = "async";
      iconWrap.appendChild(image);
      item.appendChild(iconWrap);
    }

    const text = documentRef.createElement("span");
    text.className = "ld-drawer-meta-tag-label";
    text.textContent = label;
    item.appendChild(text);
    parent.appendChild(item);
  }

  function renderTopicMeta(state, topic, loadedPostCount, options = {}) {
    const documentRef = options.documentRef || globalThis.document;
    if (!state?.meta || !documentRef) {
      return;
    }

    const metaText = runtime.topicRenderUtils.buildTopicMeta(topic, loadedPostCount);
    const fragment = documentRef.createDocumentFragment();

    if (metaText) {
      const textNode = documentRef.createElement("span");
      textNode.className = "ld-drawer-meta-text";
      textNode.textContent = metaText;
      fragment.appendChild(textNode);
    }

    if (Array.isArray(topic?.tags) && topic.tags.length) {
      const tags = documentRef.createElement("span");
      tags.className = "ld-drawer-meta-tags";
      const visibleTags = [];
      const overflowTags = [];

      for (const tag of topic.tags) {
        const label = runtime.topicRenderUtils.getTagLabel(tag);
        if (!label) {
          continue;
        }

        const normalizedLabel = runtime.topicDisplayUtils?.normalizeTagLabel
          ? runtime.topicDisplayUtils.normalizeTagLabel(label)
          : String(label || "").trim().toLowerCase();
        const icon = state.currentTagIconMap instanceof Map
          ? state.currentTagIconMap.get(normalizedLabel)
          : null;
        const tagRecord = { label, icon };
        if (visibleTags.length < 4) {
          visibleTags.push(tagRecord);
        } else {
          overflowTags.push(tagRecord);
        }
      }

      for (const tagRecord of visibleTags) {
        appendTopicTagChip(tags, documentRef, tagRecord.label, tagRecord.icon);
      }

      if (overflowTags.length > 0) {
        const overflow = documentRef.createElement("span");
        overflow.className = "ld-drawer-meta-tag-overflow";

        const trigger = documentRef.createElement("button");
        trigger.type = "button";
        trigger.className = "ld-drawer-meta-tag-overflow-trigger";
        trigger.setAttribute("aria-label", `显示剩余 ${overflowTags.length} 个标签`);
        trigger.textContent = ">";
        overflow.appendChild(trigger);

        const popup = documentRef.createElement("span");
        popup.className = "ld-drawer-meta-tag-overflow-popup";
        for (const tagRecord of overflowTags) {
          appendTopicTagChip(popup, documentRef, tagRecord.label, tagRecord.icon);
        }
        overflow.appendChild(popup);
        tags.appendChild(overflow);
      }

      if (tags.childElementCount > 0) {
        fragment.appendChild(tags);
      }
    }

    state.meta.replaceChildren(fragment);
  }

  runtime.topicMetaUtils = {
    renderTopicMeta
  };
})();
