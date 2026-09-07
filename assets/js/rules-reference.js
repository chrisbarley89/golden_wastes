// Native fragment links keep browser history, Back, and cross-page navigation.
function highlightFragment() {
  let id;
  try {
    id = decodeURIComponent(window.location.hash.slice(1));
  } catch {
    return;
  }

  document.querySelectorAll('.rules-reference .is-anchor-highlighted').forEach((node) => {
    node.classList.remove('is-anchor-highlighted');
  });
  document.querySelectorAll('.rules-reference .is-current-anchor').forEach((node) => {
    node.classList.remove('is-current-anchor');
  });

  const target = id && document.getElementById(id);
  if (!target || !target.closest('.rules-reference')) return;

  // Also reveal the destination if the reader has closed its containing table.
  let ancestor = target;
  while (ancestor) {
    if (ancestor.tagName === 'DETAILS') ancestor.open = true;
    ancestor = ancestor.parentElement;
  }

  const highlighted = target.closest('tr') || target;
  window.requestAnimationFrame(() => {
    highlighted.classList.add('is-anchor-highlighted');
    target.scrollIntoView({ block: 'start', inline: 'nearest' });
  });

  document.querySelectorAll('.rules-reference a[href]').forEach((anchor) => {
    const url = new URL(anchor.href, window.location.href);
    if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.hash === window.location.hash) {
      anchor.classList.add('is-current-anchor');
    }
  });
}

function init() {
  highlightFragment();
  window.addEventListener('hashchange', highlightFragment);
  document.addEventListener('click', (event) => {
    if (event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest?.('.rules-reference a[href]');
    if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
    const url = new URL(anchor.href, window.location.href);
    if (url.origin === window.location.origin && url.pathname === window.location.pathname && url.hash && url.hash === window.location.hash) {
      // hashchange does not fire when clicking the current fragment again.
      window.requestAnimationFrame(highlightFragment);
    }
  });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
else init();
