// UI-only localization. Model names and lesson IDs remain stable; changing language
// never rebuilds the WebGL scene or resets selection, camera, or animation state.
const messages = {
  '返回主站': 'Back to home',
  '返回 ROBO Hub': 'Back to ROBO Hub',
  '3D 外观组件 · 软件与插件': '3D Exterior Components · Software & plugins',
  '想把 ROBO 带回家？': 'Want to bring ROBO home?',
  '感谢你对 ROBO 的关注！目前整机暂未开放批量销售，我们正在了解大家的购买需求。': 'Thanks for your interest in ROBO! Complete units are not yet available for volume sales. We are learning about purchase demand.',
  '如果你有兴趣，可以联系我咨询。当前不接受在线下单或付款，具体供货安排与交付时间将另行确认。': 'Get in touch if you are interested. Online orders and payments are not available. Availability and delivery timing will be confirmed separately.',
  '咨询购买 ↗': 'Enquire about buying ↗',
  '仅咨询，不构成订单或购买承诺。': 'An enquiry only. No order or purchase commitment.',

  '联系我们': 'Contact',
  '功能建议': 'Feedback',
  '通过邮件与我们分享建议，不会在网站公开。': 'Share your suggestions by email. They will not be published on the website.',
  '你的想法，让 ROBO 更好。': 'Your ideas make ROBO better.',
  '留言公开可见，请勿填写私人信息。': 'Messages are public. Please keep private information out.',
  '留下你想要的功能，与大家一起完善 ROBO。留言将公开显示，请勿填写私人信息。': 'Suggest a feature and help improve ROBO. Messages are public; do not include private information.',
  '昵称（选填）': 'Nickname (optional)',
  '发布留言': 'Post message',
  '大家的留言': 'Community messages',
  '刷新': 'Refresh',
  '加载更多': 'Load more',
  '匿名访客': 'Anonymous visitor',
  '正在加载留言…': 'Loading messages…',
  '还没有留言，来留下第一个想法吧。': 'No messages yet. Share the first idea.',
  '留言加载失败，请点击刷新重试。': 'Unable to load messages. Select Refresh to retry.',
  '正在发布…': 'Posting…',
  '发布过于频繁，请一分钟后重试。': 'Too many messages. Please try again in one minute.',
  '发布失败，内容已保留，请重试。': 'Could not post. Your message is still here; please retry.',
  '留言已发布，所有访客均可查看。': 'Posted. Your message is visible to everyone.',

  '点击发送邮件将打开你的邮件应用，请在邮件应用中确认发送。': 'Send email opens your email app. Review and send your message there.',
  '发送邮件 ↗': 'Send email ↗',
  '请在邮件应用中确认发送。如未打开，请复制留言并发送至上方邮箱。': 'Review and send in your email app. If it did not open, copy your message and email the address above.',
  '留言板': 'Feedback',
  '留下你想要的功能 ↗': 'Suggest a feature ↗',
  '留下你想要的功能': 'Suggest a feature',
  '你希望 ROBO 能做什么？': 'What would you like ROBO to do?',
  '留言接收通道尚未开通。你可以先保存草稿，草稿仅保存在本浏览器，不会发送给我们。': 'Feedback submission is not available yet. You can save a draft in this browser; it will not be sent to us.',
  '保存草稿': 'Save draft',
  '草稿已保存在本浏览器，尚未发送。': 'Draft saved in this browser. It has not been sent.',
  '无法保存草稿，请复制文字自行保存。': 'Unable to save. Please copy your text to keep it.',
  '联系方式即将公布。': 'Contact details will be available soon.',
  '关闭窗口': 'Close dialog',

  '元器件购买': 'Buy component',
  '关闭购买信息': 'Close purchase details',
  '若干': 'TBD',
  '电子元器件': 'ELECTRONICS',
  '连接线材': 'CABLES',
  '焊接连线': 'Hook-up wire',
  '规格按实际接线需要准备': 'Choose specifications to suit the wiring',
  'DIY 需要准备焊接工具。': 'Soldering tools are required for DIY assembly.',
  '紧固件': 'FASTENERS',
  '机械件': 'MECHANICAL',
  '滚珠轴承': 'Ball bearing', '底部旋转轴承': 'Base rotation bearing',
  'Φ35 × 4 mm（按模型外形）· 型号以商品页为准': 'Φ35 × 4 mm (from CAD) · See product page for model',
  '返回产品资源': 'Back to product resources',
  '查看元器件材料清单与购买链接': 'View parts and purchase links',
  '购买时请核对型号与选项，点阵屏需两块。': 'Check models and options before buying. Two LED matrices are required.',
  '配套线束与紧固件的完整规格、数量待补充。': 'Full cable and fastener specifications and quantities are to be confirmed.',
  '完整清单': 'Full parts list',
  '关闭购买标注': 'Close purchase labels',
  '¥368': '$60',
  '整机售价 ¥368，尚未开放购买': 'Price $60; purchasing is not open yet',
  '购买整机，人民币368元，尚未开放购买': 'Buy ROBO, $60; purchasing is not open yet',
  '鼠标操作说明': 'Mouse controls',
  '滚轮缩放': 'Scroll to zoom',
  '左键拖拽旋转': 'Left-drag to rotate',
  '右键拖拽平移': 'Right-drag to pan',
  '下载 3D 打印模型': 'Download 3D print models',
  'STEP 模型 · ZIP 下载': 'STEP models · ZIP download',
  '元器件材料清单': 'Parts & materials',
  '软件端下载': 'Software download',
  '软件开源平台': 'Open-source Software',
  '软件开源平台：待上线': 'Open-source software platform: coming soon',
  '软件开源平台，待上线': 'Open-source software platform, coming soon',
  '购买整机': 'Buy ROBO',
  '查看清单': 'View list',
  '待上线': 'Coming soon',
  '结构探索': 'Explore', '接线教学': 'Wiring guide',
  '重置视角': 'Reset view', '查看内部': 'See inside', '显示外壳': 'Show shell',
  '爆炸视图': 'Exploded view', '完整装配': 'Assembled', '展开结构': 'Exploded',
  '展开模型': 'Expand model', '还原装配': 'Reassemble',
  '模型部件': 'Components', '打印部件': 'Printed parts', '模块部件': 'Electronics',
  '全部显示': 'Show all', '隐藏部件': 'Hide part', '显示部件': 'Show part',
  '底部舵机双臂舵盘': 'Base servo horn', '底部旋转支承环': 'Base bearing ring',
  '中部关节舵臂': 'Middle servo horn', '中部关节右侧盖': 'Middle right cap',
  '中部关节左侧盖': 'Middle left cap', '顶部关节舵臂': 'Top servo horn',
  '顶部关节右侧盖': 'Top right cap', '顶部关节左侧盖': 'Top left cap',
  '头部舵机安装架': 'Head servo bracket', '机械臂镂空支架': 'Arm support frame',
  '头部上壳': 'Head upper shell', '显示器安装支架': 'Monitor mount',
  '底部镂空安装座': 'Base mounting frame', '底部旋转连接盘': 'Base rotation plate',
  '中部舵机安装座': 'Middle servo mount', '机械臂左连接板': 'Arm link · left',
  '机械臂右连接板': 'Arm link · right', '头部前面板': 'Head front panel',
  '头部橙色底壳': 'Head lower shell', '五路正负极分电板': '5-way power board',
  '底部舵机': 'Base servo', '中部舵机': 'Middle servo', '顶部舵机': 'Top servo',
  '双 LED 点阵': 'Dual LED matrix', '控制板': 'Controller', '摄像头': 'Camera', '集线器': 'USB hub',
  'Nano 接线': 'Nano wiring', 'USB Hub 接线': 'USB Hub wiring',
  '连接底部舵机': 'Connect base servo', '连接中部舵机': 'Connect middle servo',
  '连接顶部舵机': 'Connect top servo', '连接点阵屏': 'Connect LED matrices',
  'Nano 电源接入分电板': 'Connect Nano to power board',
  '摄像头 → Hub': 'Camera → Hub', 'Hub → 电脑': 'Hub → Computer',
  '+ → 电源（红）': '+ → Power (red)', '− → GND（棕）': '− → GND (brown)',
  '舵机 SIG': 'Servo SIG', '配套四针线束': 'Matching 4-pin cable',
  'Hub 下行': 'Hub downstream', 'Hub 上行': 'Hub upstream', '电脑 USB': 'Computer USB',
  '第 1 组 · 电源输入': 'Pair 1 · Power input', '电源 + / 地线 −': 'Power + / Ground −',
  '第一块 → 第二块 · 五线级联': 'Matrix 1 → Matrix 2 · 5-wire link',
  'Hub 上行针序（板正面左 → 右）：5V · D− · D+ · GND': 'Hub upstream pins (board front, left → right): 5V · D− · D+ · GND',
  'Hub 下行针序（板正面左 → 右）：GND · D+ · D− · 5V': 'Hub downstream pins (board front, left → right): GND · D+ · D− · 5V',
  '单台 ROBO 所需主要元器件。购买时请核对型号与选项，点阵屏需两块。': 'Main components for one ROBO. Check the model and options before ordering. Two LED matrix modules are required.',
  '链接由项目提供，商品选项及包装数量以购买页面为准。配套线束与紧固件的完整规格、数量待补充。': 'Project-supplied links. Check the product page for options and pack sizes. Full cable and fastener specifications and quantities are still to be added.',
  'LED 点阵屏': 'LED matrix', 'USB Hub 上行数据线': 'USB Hub upstream cable',
  'USB-A 公头 → PH2.0 4P · 插头及线序待卖家确认': 'USB-A male → PH2.0 4P · Confirm connector and pin order with seller',
  'Nano 控制板': 'Nano controller', '舵机': 'Servo', '螺丝': 'Screws', '热熔螺母': 'Heat-set inserts',
  '22 × 8 mm · 2.54 mm 间距': '22 × 8 mm · 2.54 mm pitch',
  'M2 / M3 · 长度待补充': 'M2 / M3 · Lengths to be confirmed',
  'M2 / M3 · 外径与长度待补充': 'M2 / M3 · Diameter and lengths to be confirmed',
  '数量待补充': 'Qty. TBD', '购买 ↗': 'Shop ↗', '链接待补充': 'Link pending',
  '正在加载三维模型…': 'Loading 3D model…',
  '模型加载失败，请刷新页面重试。': 'Model failed to load. Please refresh to try again.',
  '无法启动 3D 显示，请开启浏览器硬件加速后刷新。': 'Unable to start 3D view. Enable browser hardware acceleration and refresh.',
  'ROBO 首页': 'ROBO home', '产品资源': 'Product resources', '产品资源与购买': 'Resources and shopping',
  '下载 robocam.STEP 装配模型压缩包': 'Download the robocam.STEP assembly archive',
  '下载 3D 打印模型，STEP 模型 ZIP 压缩包': 'Download 3D print files, STEP model ZIP archive',
  '查看元器件材料清单与购买链接': 'View parts, materials and purchase links',
  '软件端下载：链接待补充': 'Software download: link pending', '软件端下载，待上线': 'Software download, coming soon',
  '购买整机：链接待补充': 'Buy ROBO: link pending', '购买整机，待上线': 'Buy ROBO, coming soon',
  '爆炸视图控制': 'Exploded view controls', '展示模式': 'View mode', '接线板块': 'Wiring category',
  '接线步骤': 'Wiring steps', '教学步骤': 'Guide steps', '接线标识': 'Wire labels',
  '选中部件操作': 'Selected part actions', '取消选择': 'Clear selection', '关闭材料清单': 'Close parts list',
  '三维产品：左键拖动旋转，右键拖动有限平移，滚轮缩放，支持查看顶部和底部': '3D product: left-drag to rotate, right-drag for limited panning, scroll to zoom; top and bottom views available',
  '视图缩放': 'View zoom', '放大模型': 'Zoom in', '缩小模型': 'Zoom out', '放大': 'Zoom in', '缩小': 'Zoom out',
  '模型缩放': 'Model zoom', '当前缩放': 'Current zoom',
};

export function translate(source) {
  const key = source.trim();
  let value = messages[key];
  if (value === undefined) {
    if (/^\d+ \/ \d+ 可见$/.test(key)) value = key.replace('可见', 'visible');
    else if (/^\d+ [个块根]$/.test(key)) value = key.replace(/ [个块根]$/, '');
    else if (/^分电板第 \d+ 组 · \+ \/ −$/.test(key)) value = key.replace(/^分电板第 (\d+) 组/, 'Power board · Pair $1');
    else if (/^(隐藏|显示)?部件 \d+ · /.test(key)) value = key.replace(/^(隐藏|显示)?部件 (\d+) · (.*)$/, (_, action, number, label) => `${action === '隐藏' ? 'Hide ' : action === '显示' ? 'Show ' : ''}Part ${number} · ${label.split(' · ').map(translate).join(' · ')}`);
    else if (/^购买.*（新窗口）$/.test(key)) value = `Buy ${translate(key.slice(2, -5))} (new tab)`;
  }
  return value === undefined ? source : source.replace(key, value);
}

export function setupLanguage() {
  let language = 'zh';
  try { if (localStorage.getItem('robo-language') === 'en') language = 'en'; } catch { /* Storage may be disabled. */ }
  const textSources = new WeakMap(), attributeSources = new WeakMap();
  const attributes = ['aria-label', 'title', 'placeholder'];
  function localized(current, previous) {
    const source = previous && current === previous.output ? previous.source : current;
    return {source, output: language === 'en' ? translate(source) : source};
  }
  function visit(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const entry = localized(node.nodeValue, textSources.get(node));
      textSources.set(node, entry);
      if (node.nodeValue !== entry.output) node.nodeValue = entry.output;
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE || node.matches('script, style, .message-user-content')) return;
    const entries = attributeSources.get(node) || {};
    for (const name of attributes) if (node.hasAttribute(name)) {
      entries[name] = localized(node.getAttribute(name), entries[name]);
      if (node.getAttribute(name) !== entries[name].output) node.setAttribute(name, entries[name].output);
    }
    attributeSources.set(node, entries);
    node.childNodes.forEach(visit);
  }
  // Localize newly generated part actions and lesson labels in place. Observe only
  // text/accessibility changes, never per-frame styles or WebGL state.
  const options = {subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: attributes};
  const observer = new MutationObserver(records => {
    observer.disconnect();
    for (const record of records) {
      if (record.type === 'childList') record.addedNodes.forEach(visit);
      else visit(record.target);
    }
    observer.observe(document.body, options);
  });
  function apply() {
    observer.disconnect();
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-CN';
    document.title = language === 'en' ? 'ROBO 1.0 — Product explorer' : 'ROBO 1.0 — 结构探索';
    document.querySelector('meta[name="description"]').content = language === 'en' ? 'Explore ROBO in 3D and learn how to connect its components.' : '探索 ROBO 的三维结构与部件。';
    document.querySelectorAll('[data-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.language === language)));
    visit(document.body);
    observer.observe(document.body, options);
  }
  document.querySelectorAll('[data-language]').forEach(button => button.addEventListener('click', () => {
    language = button.dataset.language;
    try { localStorage.setItem('robo-language', language); } catch { /* Keep the in-memory choice. */ }
    apply();
  }));
  apply();
}
