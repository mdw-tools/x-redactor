(() => {
  const XR = globalThis.XR;

  // Never touch anything the user is typing into.
  const SKIP = 'script, style, noscript, textarea, input, [contenteditable="true"], [contenteditable=""]';
  const POST_TEXT = '[data-testid="tweetText"]';

  let settings;
  let matcher;

  // Only nodes' text values are rewritten (never the DOM structure), so React keeps working.
  function processText(node) {
    const replaced = XR.censor(node.nodeValue, matcher, settings.style);
    if (replaced === null) return;
    node.nodeValue = replaced;

    if (settings.mode === 'censor') return;
    const parent = node.parentElement;
    if (!parent || !parent.closest(POST_TEXT)) return;
    const article = parent.closest('article');
    // A data attribute, not a class: X rewrites the class attribute on hover, which would drop ours.
    if (!article || article.dataset.xr === 'revealed') return;
    article.dataset.xr = settings.mode === 'remove' ? 'removed' : 'collapsed';
  }

  const filter = {
    acceptNode(node) {
      if (node.nodeType === Node.TEXT_NODE) return NodeFilter.FILTER_ACCEPT;
      return node.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_SKIP;
    },
  };

  function processNode(root) {
    if (root.nodeType === Node.TEXT_NODE) {
      if (root.parentElement && !root.parentElement.closest(SKIP)) processText(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE || root.closest(SKIP)) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, filter);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) processText(node);
  }

  // Mutation callbacks run before the next paint, so profanity never flashes on screen.
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'characterData') processNode(mutation.target);
      else mutation.addedNodes.forEach(processNode);
    }
  });

  // Clicking a collapsed post reveals it instead of opening it.
  window.addEventListener(
    'click',
    (event) => {
      const article = event.target instanceof Element && event.target.closest('article[data-xr="collapsed"]');
      if (!article) return;
      event.preventDefault();
      event.stopPropagation();
      article.dataset.xr = 'revealed';
    },
    true,
  );

  chrome.storage.sync.get(XR.DEFAULT_SETTINGS, (stored) => {
    settings = stored;
    if (!settings.enabled) return;
    matcher = XR.buildMatcher(settings.words == null ? XR.DEFAULT_WORDS : settings.words);
    if (!matcher) return;
    processNode(document.documentElement);
    observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
  });

  // Censoring rewrites text in place, so a reload is the only way to apply looser settings.
  chrome.storage.onChanged.addListener((_, area) => {
    if (area === 'sync') location.reload();
  });
})();
