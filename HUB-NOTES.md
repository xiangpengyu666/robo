# ROBO Hub · 第一阶段

## 页面与范围

- index.html 为 ROBO Hub 官方作品首页；旧 hub.html 自动跳转首页。
- 首个作品为 ROBO 1.0，点击卡片或“探索”进入 robo-1.html。产品页 Logo 和 ROBO Hub 入口返回首页。
- 第一阶段仅发布官方内容，不提供账号、社区投稿、文件上传、来源筛选或在线热度统计。
- 搜索、分类筛选、中英文切换在浏览器完成；ROBO 产品和基础软件优先展示，其余按收录日期和配置顺序展示。
- 联系、购买咨询和功能建议通过 mailto 打开访客自己的邮件应用，需访客自行确认发送。
- 公开留言板暂改为邮件反馈，不在网站保存或公开建议。
- 首页左侧“告诉我们你的想法💡”打开反馈弹窗，发送邮件至 xiangpengyu020104@gmail.com。

## 发布官方作品

目录由维护者编辑 src/hub-catalog.js；仅展示 source 为 official 的条目。文件和预览图放在 public 下对应目录，填写真实名称、描述、分类与 listedAt（Hub 收录日期）。

带 page 的条目进入产品页面；当前为“ROBO 版本”分类下的 ROBO 1.0。现有 3D 下载在产品页，文件为 downloads/robocam.zip（包含 robocam.STEP）。3D 外观分类暂未发布内容。

软件与插件现已收录 ROBO Windows x64 纯净基础款，以及待办日历、番茄钟、互动壁纸、网易云音乐控制、AI 对话与控制 - Seed、Gmail 邮件六个独立插件。packageType 区分 base 与 plugin；卡片与详情读取各自的 fileName、bytes、version。插件版本来自 manifest.json，部分包内 README 的旧版本号未改动。

原始 ZIP 按字节复制到 public/downloads/software 和 public/downloads/plugins，未重打包；public/downloads/packages.json 记录原始文件名、字节数及 SHA-256。全部 ZIP 经过 CRC 检查，副本与原文件 SHA-256 一致。此检查验证文件完整性，不代表插件已完成运行测试。

安装：完整解压 ROBO.zip 后运行 ROBO.exe；插件 ZIP 单独解压后，将含 manifest.json 的文件夹拖入「工具 → 拓展中心」，不要拖入「插件」总目录。账号和云服务密钥由使用者自行配置。有 tutorial.html 的插件可查看离线教程。

新增其他非软件文件型资源时，需完善 renderDetail 中的具体文件信息、许可与使用说明。修改后重新构建。

## 部署与旧数据

当前页面无投稿、热度或留言 API 请求。Vite 不再挂载 API 中间件，npm start 只提供构建产物的静态文件服务。部署不要求数据库或业务后端。

七个软件包合计约 1.06 GB；GitHub Pages 部署前应将它们放到 GitHub Releases 或文件托管，再在目录条目填写 downloadUrl。页面优先使用该外部地址，省略时使用当前本地文件。Pages 发布目录应排除这些已经转移到外部托管的 ZIP，具体见 DEPLOYMENT-HANDOFF.md。

server/messages.js、server/hub.js、server/hub-popularity.js 保留供后续社区阶段参考，但没有启用。既有 data 目录及历史投稿、留言、计数原样保留，不迁移或删除，也不要放进 public、dist 或公开仓库。

## 验证

- npm run build
- node scripts/validate-hub-catalog.mjs
- npm run preview：在没有 API 的静态预览中检查搜索、分类、中英文、ROBO 1.0 跳转、返回、下载与邮件反馈。

旧交接 ZIP 不含当前改动；重新交付时使用当前源码或重新构建的 dist。
