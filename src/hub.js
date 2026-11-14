import './analytics.js';
import './chinese-fonts.css';
import './brand.css';
import './hub.css';
import {purchaseTitle, purchaseBody, trackPurchaseInquiry} from './feedback.js';
import {translate} from './language.js';
import {catalog, filterCatalog, formatFileSize, downloadUrl, pluginInstallSteps, baseInstallSteps} from './hub-catalog.js';

let language = 'zh';
try { language = localStorage.getItem('robo-language') === 'en' ? 'en' : 'zh'; } catch {}
const t = (zh, en) => language === 'en' ? en : zh;
const base = import.meta.env.BASE_URL;
const $ = id => document.getElementById(id);
const escape = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
let category = ['robot', '3d', 'software'].includes(location.hash.slice(1)) ? location.hash.slice(1) : 'all';
let detailItem = null;
const downloadIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m-5-5 5 5 5-5M5 17v4h14v-4"/></svg>';
const exploreIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="5.5"/><path d="m14.4 14.4 4.6 4.6"/></svg>';
const categoryLabels = {robot:['ROBO 版本','ROBO versions'], '3d':['3D 外观组件','3D Exterior Components'], software:['软件与插件','Software & plugins'], plugin:['插件','Plugins']};
const art = item => '<div class="card-art"><img src="' + base + item.image + '" alt="' + escape(t(...item.name) + t(' 模型预览', ' model preview')) + '" width="420" height="670"></div>';
const resourceIcons = {
  app: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M8 13v3m4-3v3m4-3v3"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4m10-4v4M3 10h18m-14 4h2m4 0h2m-8 3h2"/>',
  timer: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6m-3 0v3m6 1 2-2"/>',
  wallpaper: '<rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="8" cy="8" r="1.5"/><path d="m3 17 5-5 4 4 4-7 5 8"/>',
  music: '<path d="M10 17V5l10-2v12M10 9l10-2"/><ellipse cx="7" cy="17" rx="3" ry="2.5"/><ellipse cx="17" cy="15" rx="3" ry="2.5"/>',
  chat: '<path d="M6 4h12a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3h-7l-5 3v-3a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3Z"/><path d="M8 9h8m-8 4h5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="m4 7 8 6 8-6"/>',
};
const resourceIcon = item => '<span class="resource-icon" aria-hidden="true"><svg viewBox="0 0 24 24">' + resourceIcons[item.icon] + '</svg></span>';
const installList = steps => steps.map(step => '<li>' + escape(t(...step)) + '</li>').join('');

function renderDownloadCard(item) {
  const card = document.createElement('article');
  card.className = 'creation-card is-download' +
    (item.packageType === 'base' || item.featured ? ' is-wide' : '') +
    (item.packageType === 'base' ? ' is-base' : '') + (item.featured ? ' is-featured' : '');
  card.dataset.item = item.id;
  const typeLabel = item.packageType === 'base' ? t('基础软件', 'Base app')
    : item.featured ? t('推荐插件', 'Featured plugin') : t('独立插件', 'Plugin');
  const version = item.version ? 'v' + item.version : 'Windows x64';
  card.innerHTML = '<div class="card-copy"><div class="download-heading">' + resourceIcon(item) +
    '<div class="download-meta"><span>' + t('ROBO 官方', 'ROBO official') + ' · ' + typeLabel + '</span><span>' + escape(version) + '</span></div></div>' +
    '<h3><button type="button" class="card-open card-title" aria-haspopup="dialog" aria-controls="detail">' + escape(t(...item.name)) + '</button></h3>' +
    '<p>' + escape(t(...item.description)) + '</p><div class="card-foot"><span>ZIP · ' + formatFileSize(item.bytes) + '</span>' +
    '<div class="resource-actions"><button type="button" class="details-button" aria-haspopup="dialog" aria-controls="detail">' + t('安装说明', 'Install guide') + '</button>' +
    '<a href="' + escape(downloadUrl(item, base)) + '" download="' + escape(item.fileName) + '" aria-label="' + escape(t('下载 ', 'Download ') + t(...item.name)) + '">' + t('下载 ZIP', 'Download ZIP') + downloadIcon + '</a></div></div></div>';
  card.querySelectorAll('.card-open, .details-button').forEach(control => control.onclick = () => {
    detailItem = item;
    renderDetail(item);
    $('detail').showModal();
  });
  return card;
}

function translatePage() {
  document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
  document.querySelectorAll('[data-zh]').forEach(el => el.textContent = el.dataset[language]);
  document.querySelectorAll('[data-language]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.language === language)));
  document.querySelector('.hub-sidebar').setAttribute('aria-label', t('目录筛选', 'Catalog filters'));
  document.querySelector('.category-nav').setAttribute('aria-label', t('作品分类', 'Categories'));
  document.querySelector('.brand').setAttribute('aria-label', t('ROBO 首页', 'ROBO home'));
  document.querySelectorAll('.dialog-close').forEach(el => el.setAttribute('aria-label', t('关闭', 'Close')));
  render();
  $('software-install-steps').innerHTML = installList([baseInstallSteps[0], baseInstallSteps[1], ...pluginInstallSteps]);
  updateIdeaEmail();
  if ($('detail').open && detailItem) renderDetail(detailItem);
}

function render() {
  const filtered = filterCatalog(catalog, {category, source: 'official', sort: 'recent'});
  $('section-title').textContent = categoryLabels[category] ? t(...categoryLabels[category]) : t('全部作品', 'All creations');
  $('result-count').textContent = t(filtered.length + ' 项', filtered.length + (filtered.length === 1 ? ' item' : ' items'));
  $('catalog').replaceChildren();
  $('catalog').classList.toggle('is-single', filtered.length === 1 && !!filtered[0].page);
  $('software-guide').hidden = category !== 'software';
  $('empty').hidden = filtered.length > 0;
  $('empty-title').textContent = t('暂无作品', 'No creations yet');
  $('empty-description').textContent = category === 'software' ? t('官方软件与插件尚未发布。', 'Official software and plugins have not been released yet.')
    : t('此分类暂时没有已发布的作品。', 'There are no published creations in this category yet.');
  const firstDownload = filtered.find(item => item.packageType);
  const firstExtension = filtered.find(item => item.packageType === 'plugin' && !item.featured);
  for (const item of filtered) {
    if (item === firstDownload || item === firstExtension) {
      const heading = document.createElement('div');
      heading.className = 'catalog-section-heading';
      const title = document.createElement('h3');
      title.textContent = item === firstExtension ? t('按需扩展', 'Extend ROBO') : t('快速开始', 'Get started');
      const caption = document.createElement('p');
      caption.textContent = item === firstExtension
        ? t('选择你需要的插件，添加到 ROBO。', 'Choose the plugins you want to add to ROBO.')
        : t('下载基础软件，按需添加 AI 对话与控制。', 'Download the base app and add AI chat and control when you need it.');
      heading.append(title, caption);
      $('catalog').append(heading);
    }
    if (item.packageType) {
      $('catalog').append(renderDownloadCard(item));
      continue;
    }
    const card = document.createElement('article');
    card.className = 'creation-card' + (item.page ? ' is-product' : '');
    const categoryLabel = t(...categoryLabels[item.category]);
    const creatorLabel = t('ROBO 官方', 'ROBO official');
    const openTag = (className, content) => item.page
      ? '<a class="card-open ' + className + '" href="' + base + item.page + '">' + content + '</a>'
      : '<button type="button" class="card-open ' + className + '" aria-haspopup="dialog">' + content + '</button>';
    const action = item.page
      ? '<a class="explore-action" href="' + base + item.page + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 9 8-4.5M12 12 4 7.5M12 12v9"/></svg><span>' + t('探索结构', 'Explore') + '</span><span class="explore-action-icon">' + exploreIcon + '</span></a>'
      : '<a href="' + base + item.file + '" download>' + t('下载文件', 'Download') + downloadIcon + '</a>';
    const preview = item.video
      ? '<div class="product-media">' + openTag('card-preview', art(item)) +
        '<div class="product-player"><video class="product-video" controls playsinline preload="none" poster="' + escape(base + item.poster) + '" aria-label="' + t('ROBO 产品演示视频', 'ROBO product demo video') + '"><source src="' + escape(base + item.video) + '" type="video/mp4"></video><button class="video-play" type="button" aria-label="' + t('播放演示视频', 'Play demo video') + '"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7Z"/></svg></button></div></div>'
      : openTag('card-preview', art(item));
    if (item.video) card.classList.add('has-video');
    card.innerHTML = preview +
      '<div class="card-copy"><div class="card-meta"><span>' + escape(creatorLabel) + '</span>' +
      (item.page ? '' : '<span class="card-category">' + categoryLabel + '</span>') +
      '</div><h3>' + openTag('card-title', escape(t(...item.name))) + '</h3><p>' + escape(t(...item.description)) + '</p>' +
      '<div class="card-foot">' + (item.page ? '' : '<span>' + escape(item.format) + '</span>') + action + '</div>' +
      (item.id === 'robo-1' ? '<button class="hub-buy" type="button" aria-haspopup="dialog">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 8h14l1 12H4L5 8Z"/><path d="M9 10V6a3 3 0 0 1 6 0v4"/></svg>' +
        '<span>' + t('购买整机', 'Buy ROBO') + '</span><strong>' + t('¥228', '$39') + '</strong></button>' : '') + '</div>';
    const buy = card.querySelector('.hub-buy');
    if (buy) buy.onclick = () => {
      detailItem = null;
      const content = $('detail-content');
      content.innerHTML = '<h2 id="detail-title"></h2>' + purchaseBody;
      content.querySelector('h2').textContent = t(purchaseTitle, translate(purchaseTitle));
      content.querySelectorAll('p, a').forEach(element => {
        element.textContent = t(element.textContent, translate(element.textContent));
      });
      content.querySelector('a').classList.add('primary');
      $('detail').showModal();
      trackPurchaseInquiry($('detail'));
    };
    card.querySelectorAll('.card-open').forEach(control => {
      control.setAttribute('aria-label', t('探索 ', 'Explore ') + t(...item.name));
      if (!item.page) control.onclick = () => { detailItem = item; renderDetail(item); $('detail').showModal(); };
    });
    const video = card.querySelector('.product-video');
    if (video) {
      const play = card.querySelector('.video-play');
      play.onclick = async () => {
        try { await video.play(); } catch { play.hidden = false; }
      };
      video.addEventListener('play', () => { play.hidden = true; });
      video.addEventListener('pause', () => { play.hidden = false; });
      video.addEventListener('ended', () => { play.hidden = false; });
    }
    $('catalog').append(card);
  }
  if (filtered.some(item => item.packageType === 'plugin')) {
    const teaser = document.createElement('p');
    teaser.className = 'catalog-teaser';
    teaser.innerHTML = '<span class="teaser-icon" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="5" width="9" height="9" rx="2"/><rect x="5" y="18" width="9" height="9" rx="2"/><rect x="18" y="18" width="9" height="9" rx="2"/><path d="M22.5 5v9M18 9.5h9"/></svg></span>' +
      '<strong>' + t('更多功能', 'More features') + '</strong><span class="teaser-caption">' + t('敬请期待', 'Coming soon') + '</span>';
    $('catalog').append(teaser);
  }
  document.querySelectorAll('[data-category]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.category === category)));
}

function renderDetail(item) {
  if (item.packageType) {
    const isBase = item.packageType === 'base';
    const facts = [
      [t('文件', 'File'), item.fileName],
      [t('大小', 'Size'), formatFileSize(item.bytes)],
      [t('适用环境', 'Requirements'), isBase ? t(...item.platform) : t('ROBO 基础软件 · Windows', 'ROBO Base Software · Windows')],
      [t(isBase ? '内容' : '版本', isBase ? 'Includes' : 'Version'), isBase ? t('基础软件，不含插件', 'Base app, no plugins') : 'v' + item.version],
    ];
    $('detail-content').innerHTML = '<div class="resource-detail-heading">' + resourceIcon(item) + '<span>' + t('ROBO 官方', 'ROBO official') + '</span></div>' +
      '<h2 id="detail-title">' + escape(t(...item.name)) + '</h2><p class="dialog-lead">' + escape(t(...item.description)) + '</p>' +
      '<dl class="detail-facts">' + facts.map(([label, value]) => '<div><dt>' + escape(label) + '</dt><dd>' + escape(value) + '</dd></div>').join('') + '</dl>' +
      '<section class="detail-install"><h3>' + t('安装与使用', 'Installation') + '</h3><ol>' + installList(isBase ? baseInstallSteps : pluginInstallSteps) + '</ol></section>' +
      (isBase ? '' : '<p class="detail-note">' + t('请先解压 ZIP，再拖入插件文件夹；也可点击拓展中心的导入区域选择文件夹。', 'Extract the ZIP before dragging in the plugin folder. You can also click the import area in Extension Center to select the folder.') + '</p>') +
      (item.setupNote ? '<section class="detail-install"><h3>' + t('使用说明', 'Getting started') + '</h3><p class="detail-note">' + escape(t(...item.setupNote)) + '</p></section>' : '') +
      (item.tutorial ? '<p class="detail-note">' + t('配置步骤见插件文件夹中的 tutorial.html，双击即可查看离线接入教程。', 'Double-click tutorial.html in the plugin folder to view the offline setup guide.') + '</p>' : '') +
      '<div class="detail-actions"><a class="primary" href="' + escape(downloadUrl(item, base)) + '" download="' + escape(item.fileName) + '">' + t('下载 ZIP', 'Download ZIP') + downloadIcon + '</a></div>';
    return;
  }
  $('detail-content').innerHTML = '<h2 id="detail-title">' + escape(t(...item.name)) + '</h2><p class="dialog-lead">' +
    escape(t(...item.description)) + '</p><div class="detail-preview">' + art(item) + '</div>' +
    '<dl class="detail-facts"><div><dt>' + t('发布者', 'Publisher') + '</dt><dd>' + t('ROBO 官方', 'ROBO official') + '</dd></div><div><dt>' +
    t('文件', 'File') + '</dt><dd>robocam.zip · 897 KB</dd></div><div><dt>' + t('内容', 'Contents') +
    '</dt><dd>robocam.STEP</dd></div><div><dt>' + t('许可说明', 'License') + '</dt><dd>' + t('待补充', 'Not yet specified') + '</dd></div></dl>' +
    '<p class="detail-note">' + t('打印前需在 CAD 软件中导出所需零件，再进行切片。DIY 需要准备焊接工具。', 'Export the parts you need in CAD software, then slice them for printing. DIY assembly requires soldering tools.') + '</p>' +
    '<div class="detail-actions"><a class="primary" href="' + base + item.file + '" download="robocam.zip">' +
    t('下载文件 ↓', 'Download ↓') + '</a><a href="' + base + 'robo-1.html">' + t('查看交互模型 ↗', 'Explore the model ↗') + '</a></div>';
}

document.querySelector('.contact-trigger').onclick = () => $('contact').showModal();
function updateIdeaEmail() {
  const subject = t('ROBO 功能建议', 'ROBO feature suggestion');
  $('idea-send').href = 'mailto:xiangpengyu020104@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent($('idea-message').value.trim());
}
document.querySelector('.idea-trigger').onclick = () => {
  $('idea-status').textContent = '';
  updateIdeaEmail();
  $('idea-dialog').showModal();
};
$('idea-message').addEventListener('input', updateIdeaEmail);
$('idea-send').onclick = () => {
  updateIdeaEmail();
  $('idea-status').textContent = t('请在邮件应用中确认发送。如未打开，请复制内容并发送至上方邮箱。', 'Review and send in your email app. If it did not open, copy your message and email the address above.');
};
document.querySelectorAll('.dialog-close').forEach(button => button.onclick = () => button.closest('dialog').close());
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  });
});
document.querySelectorAll('[data-category]').forEach(button => button.onclick = () => { category = button.dataset.category; render(); });
document.querySelectorAll('[data-language]').forEach(button => button.onclick = () => {
  language = button.dataset.language;
  try { localStorage.setItem('robo-language', language); } catch {}
  translatePage();
});

translatePage();

// Keep the sidebar clear of the intro before centering it as the page scrolls.
const sidebar = document.querySelector('.hub-sidebar');
const masthead = document.querySelector('.hub-masthead');
const pageScrollbar = document.createElement('div');
pageScrollbar.className = 'page-scrollbar';
pageScrollbar.tabIndex = 0;
pageScrollbar.setAttribute('role', 'scrollbar');
pageScrollbar.setAttribute('aria-orientation', 'vertical');
pageScrollbar.setAttribute('aria-controls', 'catalog');
pageScrollbar.setAttribute('aria-valuemin', '0');
pageScrollbar.innerHTML = '<div class="page-scrollbar-thumb"></div>';
document.body.append(pageScrollbar);
const pageThumb = pageScrollbar.firstElementChild;
let scrollTravel = 0, pageRange = 0, dragOffset = null;
function updatePageScrollbar() {
  const rect = sidebar.getBoundingClientRect();
  const top = dragOffset !== null ? parseFloat(pageScrollbar.style.top) : Math.max(24, Math.min(window.innerHeight - 144, masthead.getBoundingClientRect().bottom + 40));
  const trackHeight = Math.max(64, window.innerHeight - top - 24);
  pageRange = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  const thumbHeight = Math.min(trackHeight, Math.max(32, trackHeight * window.innerHeight / (pageRange + window.innerHeight)));
  scrollTravel = trackHeight - thumbHeight;
  Object.assign(pageScrollbar.style, {left: `${rect.right - 12}px`, top: `${top}px`, height: `${trackHeight}px`});
  Object.assign(pageThumb.style, {height: `${thumbHeight}px`, transform: `translateY(${pageRange ? window.scrollY / pageRange * scrollTravel : 0}px)`});
  pageScrollbar.setAttribute('aria-label', t('网页滚动进度', 'Page scroll position'));
  pageScrollbar.setAttribute('aria-valuemax', String(Math.round(pageRange)));
  pageScrollbar.setAttribute('aria-valuenow', String(Math.round(window.scrollY)));
}
function scrollFromPointer(event) {
  if (!scrollTravel) return;
  const fraction = (event.clientY - pageScrollbar.getBoundingClientRect().top - dragOffset) / scrollTravel;
  window.scrollTo({top: Math.max(0, Math.min(1, fraction)) * pageRange, behavior: 'instant'});
}
pageScrollbar.addEventListener('pointerdown', event => {
  if (event.button !== 0) return;
  event.preventDefault();
  dragOffset = event.target === pageThumb ? event.clientY - pageThumb.getBoundingClientRect().top : pageThumb.offsetHeight / 2;
  pageScrollbar.setPointerCapture(event.pointerId);
  scrollFromPointer(event);
});
pageScrollbar.addEventListener('pointermove', event => { if (dragOffset !== null) scrollFromPointer(event); });
pageScrollbar.addEventListener('lostpointercapture', () => { dragOffset = null; scheduleSidebarPosition(); });
pageScrollbar.addEventListener('keydown', event => {
  const moves = {ArrowDown: 48, ArrowUp: -48, PageDown: innerHeight * .85, PageUp: -innerHeight * .85, Home: -pageRange, End: pageRange};
  if (!(event.key in moves)) return;
  event.preventDefault(); window.scrollBy({top: moves[event.key], behavior: 'instant'});
});
let sidebarFrame = 0;
function positionSidebar() {
  sidebarFrame = 0;
  if (window.matchMedia('(max-width: 640px)').matches) return;
  const height = window.innerHeight;
  const contentHeight = Math.min(sidebar.scrollHeight, height - 48);
  const introBottom = masthead.getBoundingClientRect().bottom;
  const top = Math.min(height - 144, Math.max(24, (height - contentHeight) / 2, introBottom + 40));
  sidebar.style.setProperty('--sidebar-top', `${top}px`);
  updatePageScrollbar();
}
function scheduleSidebarPosition() {
  if (!sidebarFrame) sidebarFrame = requestAnimationFrame(positionSidebar);
}
window.addEventListener('scroll', scheduleSidebarPosition, {passive: true});
window.addEventListener('resize', scheduleSidebarPosition);
const sidebarObserver = new ResizeObserver(scheduleSidebarPosition);
[masthead, document.querySelector('.hub-results'), ...sidebar.children].forEach(element => sidebarObserver.observe(element));
document.fonts.ready.then(scheduleSidebarPosition);
positionSidebar();
