// Microsoft Clarity: heatmaps, session recordings and purchase-intent events.
// Data is visible only to the Clarity project owner (clarity.microsoft.com).
//
// Set CLARITY_ID to the project ID from Clarity → Settings → Overview.
// While it is empty, nothing loads and the helpers below do nothing.
const CLARITY_ID = 'zbefe0jows';

// Not tracked: local development, and any browser that has opened the site once
// with ?notrack=1 (use this on your own devices; ?notrack=0 turns tracking back on).
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '']);

function trackingEnabled() {
  if (!CLARITY_ID || LOCAL_HOSTS.has(location.hostname)) return false;
  try {
    const flag = new URLSearchParams(location.search).get('notrack');
    if (flag === '1') localStorage.setItem('robo-notrack', '1');
    if (flag === '0') localStorage.removeItem('robo-notrack');
    return localStorage.getItem('robo-notrack') !== '1';
  } catch {
    return true;
  }
}

const enabled = trackingEnabled();
if (enabled) {
  (function (c, l, a, r, i, t, y) {
    c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments); };
    t = l.createElement(r); t.async = 1; t.src = 'https://www.clarity.ms/tag/' + i;
    y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
  })(window, document, 'clarity', 'script', CLARITY_ID);
}

function clarity(...args) {
  if (enabled && typeof window.clarity === 'function') window.clarity(...args);
}

// Custom events appear under Clarity → Filters → Custom events, so you can open
// heatmaps and recordings of just the visitors who did each thing.
export function trackEvent(name, tags = {}) {
  clarity('event', name);
  for (const [key, value] of Object.entries(tags)) clarity('set', key, String(value));
}

// --- Purchase intent -------------------------------------------------------
// "Buy ROBO" dialog: open = showed interest, contact = clicked the inquiry email.
window.addEventListener('robo:purchase-interest', event => {
  const { action, language } = event.detail || {};
  trackEvent(`purchase_${action}`, { purchase_interest: action, language });
  if (action === 'contact') clarity('upgrade', 'purchase_contact');
});

// --- Clicks that signal interest -------------------------------------------
const fileName = href => (href.split('?')[0].split('/').pop() || '').replace(/\.zip$/i, '');

document.addEventListener('click', event => {
  const el = event.target.closest('a, button');
  if (!el) return;
  const href = el.getAttribute('href') || '';

  if (el.closest('.purchase-card') && href) {
    trackEvent('component_buy_click', { component: el.closest('.purchase-card').querySelector('.purchase-card-name')?.textContent || '' });
  } else if (el.classList.contains('rail-bom-link') && href) {
    trackEvent('component_buy_click', { component: el.querySelector('span')?.textContent || '' });
  } else if (/\.zip(\?|$)/i.test(href)) {
    trackEvent('download_click', { download: fileName(href) });
  } else if (href.includes('robo-1.html')) {
    trackEvent('explore_click');
  } else if (el.getAttribute('aria-controls') === 'rail-bom') {
    trackEvent('bom_open');
  } else if (el.classList.contains('feedback-trigger')) {
    trackEvent('feedback_open');
  } else if (el.classList.contains('contact-trigger')) {
    trackEvent('contact_open');
  } else if (el.id === 'mode-teach') {
    trackEvent('wiring_guide_open');
  }
}, { capture: true });
