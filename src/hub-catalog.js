// Files over GitHub's 100 MB limit are hosted on the repo's GitHub Release instead of Pages.
const RELEASE = 'https://github.com/xiangpengyu666/robo/releases/download/v1.0/';

// Phase one: maintain published official projects and resources here.
export const catalog = [{
  id: 'robo-1',
  category: 'robot',
  source: 'official',
  name: ['ROBO 1.0', 'ROBO 1.0'],
  description: ['探索 ROBO 1.0 的结构、接线与元器件，下载 DIY 文件，或咨询购买整机。', 'Explore the structure, wiring and components of ROBO 1.0. Download DIY files or enquire about buying a complete unit.'],
  page: 'robo-1.html',
  format: 'STEP · ZIP',
  file: 'downloads/robocam.zip',
  image: 'images/robo-assembly.png',
  video: 'videos/robo-video.mp4',
  poster: 'videos/robo-video-poster.jpg',
  // Date listed in Hub, not a claim about the model's original release date.
  listedAt: '2026-11-05',
  featuredOrder: 0,
}, {
  id: 'robo-base', category: 'software', source: 'official', packageType: 'base',
  name: ['ROBO 基础软件', 'ROBO Base Software'],
  description: ['提供机器人连接、动作与表情编辑等基础功能，可按需安装插件，扩展更多功能。', 'Connect your robot and edit motions and expressions. Install plugins as needed to add more features.'],
  format: 'Windows x64 · ZIP', platform: ['Windows · 64 位', 'Windows · 64-bit'],
  file: 'downloads/software/robo-base.zip', downloadUrl: RELEASE + 'robo-base.zip', fileName: 'ROBO.zip', bytes: 344471554,
  icon: 'app', listedAt: '2026-11-09', featuredOrder: 1,
}, {
  id: 'todo-calendar', category: 'plugin', source: 'official', packageType: 'plugin',
  name: ['待办日历', 'To-do Calendar'],
  description: ['将待办安排进日历，集中查看任务与到点提醒，让每天的计划更清楚。', 'Plan to-dos on your calendar and keep track of tasks and due reminders in one place.'],
  setupNote: ['安装后即可在工具中管理待办，无需配置云服务密钥。通过对话添加待办，需另装并配置「AI 对话与控制 - Seed」。', 'Manage to-dos from Tools without cloud service keys. To add tasks through chat, install and configure AI Chat & Control - Seed.'],
  version: '1.0', format: 'ZIP', file: 'downloads/plugins/todo-calendar.zip',
  fileName: '待办日历.zip', bytes: 29859, icon: 'calendar', listedAt: '2026-11-09', order: 1,
}, {
  id: 'pomodoro', category: 'plugin', source: 'official', packageType: 'plugin',
  name: ['番茄钟', 'Pomodoro Timer'],
  description: ['用专注计时和自动休息安排工作节奏，连接机器人后，还可在 ROBO 上查看倒计时。', 'Build a work rhythm with focus timers and automatic breaks, with a countdown displayed on your connected robot.'],
  setupNote: ['安装后即可使用，无需账号或云服务密钥。机器人倒计时需先连接 ROBO。', 'Ready to use after installation, with no account or cloud service key required. Connect ROBO to display the countdown on your robot.'],
  version: '1.0', format: 'ZIP', file: 'downloads/plugins/pomodoro.zip',
  fileName: '番茄钟.zip', bytes: 6668, icon: 'timer', listedAt: '2026-11-09', order: 2,
}, {
  id: 'interactive-wallpaper', category: 'plugin', source: 'official', packageType: 'plugin',
  name: ['互动壁纸', 'Interactive Wallpapers'],
  description: ['把海底、猫咪与太空场景带到桌面，搭配机器人动作联动，让壁纸成为可互动的陪伴。', 'Bring underwater, cat and space scenes to your desktop, with robot motion interaction that brings your wallpaper to life.'],
  setupNote: ['安装后选择喜欢的场景即可使用，无需云服务密钥。动作联动需先连接机器人。', 'Choose a scene after installation; no cloud service key is required. Connect your robot to enable motion interaction.'],
  version: '1.0', format: 'ZIP', file: 'downloads/plugins/interactive-wallpaper.zip', downloadUrl: RELEASE + 'interactive-wallpaper.zip',
  fileName: '互动壁纸.zip', bytes: 678263164, icon: 'wallpaper', tutorial: true, listedAt: '2026-11-09', order: 3,
}, {
  id: 'netease-music', category: 'plugin', source: 'official', packageType: 'plugin',
  name: ['网易云音乐控制', 'NetEase Music Control'],
  description: ['在 ROBO 中点歌、暂停和继续播放网易云音乐；搭配 AI 对话插件，还可用自然语言控制播放。', 'Request songs, pause and resume NetEase Music in ROBO. Add the AI chat plugin to control playback in natural language.'],
  setupNote: ['按接入教程配置自己的网易云音乐应用并完成扫码授权。对话点歌需另装并配置「AI 对话与控制 - Seed」。', 'Follow the setup guide to configure your own NetEase Music app and authorize it by scanning the QR code. Song requests through chat require AI Chat & Control - Seed.'],
  version: '1.0', format: 'ZIP', file: 'downloads/plugins/netease-music.zip',
  fileName: '网易云音乐控制.zip', bytes: 28028339, icon: 'music', tutorial: true, listedAt: '2026-11-09', order: 4,
}, {
  id: 'seed-ai', category: 'plugin', source: 'official', packageType: 'plugin',
  featured: true, featuredOrder: 2,
  name: ['AI 对话与控制 - Seed', 'AI Chat & Control - Seed'],
  description: ['与 ROBO 自然对话、联网查询信息，并通过语言控制机器人和已安装的工具；支持选配云端语音识别。', 'Chat with ROBO, look up information online, and control your robot and installed tools through natural language. Cloud speech recognition is optional.'],
  setupNote: ['需配置自己的方舟 API Key 与模型 ID。可继续使用本地语音识别；如选择云端识别，需单独配置豆包语音密钥。语音播报在 ROBO 设置中另行配置。', 'Configure your own Ark API key and model ID. You can keep using local speech recognition; cloud recognition requires a separate Doubao speech key. Configure spoken responses separately in ROBO Settings.'],
  version: '1.0', format: 'ZIP', file: 'downloads/plugins/seed-ai.zip',
  fileName: 'AI 对话与控制 - Seed.zip', bytes: 3846158, icon: 'chat', tutorial: true, listedAt: '2026-11-09', order: 5,
}, {
  id: 'gmail', category: 'plugin', source: 'official', packageType: 'plugin',
  name: ['Gmail 邮件', 'Gmail'],
  description: ['在 ROBO 中查看 Gmail 新邮件，接收来信提醒；搭配共用文本模型与播报语音，还能提炼并播报邮件重点。', 'View new Gmail messages and receive mail notifications in ROBO. Add the shared text model and announcement voice to summarize and read out key points.'],
  setupNote: ['需按接入教程配置 Google OAuth 并授权自己的 Gmail 账号。邮件摘要需安装并配置「AI 对话与控制 - Seed」的共用文本模型；语音播报需在设置中配置播报语音。', 'Configure Google OAuth and authorize your Gmail account using the setup guide. Summaries require the shared text model in AI Chat & Control - Seed; spoken announcements also require an announcement voice in Settings.'],
  version: '1.0', format: 'ZIP', file: 'downloads/plugins/gmail.zip',
  fileName: 'Gmail 邮件.zip', bytes: 1463805, icon: 'mail', tutorial: true, listedAt: '2026-11-09', order: 6,
}];

export const pluginInstallSteps = [
  ['打开 ROBO 基础软件，进入「工具 → 拓展中心」。', 'Open ROBO Base Software and go to Tools → Extension Center.'],
  ['下载所需插件并解压，将解压后以插件名称命名的文件夹直接拖入拓展中心。', 'Download and extract the plugin, then drag the folder named after the plugin directly into Extension Center.'],
  ['等待安装完成，在「工具」中打开插件，按插件的使用说明完成配置。', 'Wait for installation to finish, then open the plugin in Tools and follow its setup instructions.'],
];

export const baseInstallSteps = [
  ['完整解压 ROBO.zip，保留 ROBO 文件夹内的所有文件。', 'Fully extract ROBO.zip and keep all files in the ROBO folder together.'],
  ['在 Windows 64 位系统上双击 ROBO.exe 运行，请勿单独移动 EXE。', 'On 64-bit Windows, double-click ROBO.exe. Do not move the EXE out of its folder.'],
  ['基础软件不预装插件；需要新功能时，再下载对应插件并安装。', 'No plugins are preinstalled. Download and install individual plugins when you need new features.'],
];

export function formatFileSize(bytes) {
  return bytes >= 1000000 ? (bytes / 1000000).toFixed(1) + ' MB' : (bytes / 1000).toFixed(1) + ' KB';
}

export function downloadUrl(item, base = '/') {
  return item.downloadUrl || base + item.file;
}

export function filterCatalog(items, {category = 'all', source = 'all', query = '', sort = 'recent', popularity = {}} = {}) {
  const term = query.trim().toLowerCase();
  return items.filter(item =>
    (category === 'all' || (category === 'software' ? ['software', 'plugin'].includes(item.category) : item.category === category)) &&
    (source === 'all' || item.source === source) &&
    [...item.name, ...item.description, item.format].join(' ').toLowerCase().includes(term)
  ).sort((a, b) => {
    const recent = (Date.parse(b.listedAt) || 0) - (Date.parse(a.listedAt) || 0);
    return (a.featuredOrder ?? 3) - (b.featuredOrder ?? 3) ||
      (sort === 'popular' ? (popularity[b.id] || 0) - (popularity[a.id] || 0) : 0) || recent || (a.order ?? 0) - (b.order ?? 0) || a.id.localeCompare(b.id);
  });
}
