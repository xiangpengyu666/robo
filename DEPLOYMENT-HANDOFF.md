# ROBO 网站 · 第一阶段部署交接

更新：2026-11-09。当前仅发布官方作品，本文替代此前需要留言与投稿后端的部署方案。

## 当前版本

- 首页：ROBO Hub（index.html）。
- 产品：ROBO 1.0 → robo-1.html（结构探索、接线、元器件材料清单和 3D 下载）。
- 旧 hub.html 自动转到首页。
- 官方内容由维护者更新目录并重新构建；不开放用户上传。
- 软件与插件：ROBO Windows x64 纯净基础款及六个独立插件 ZIP，分别下载；没有捆绑插件。
- 功能建议、联系我们和购买咨询通过邮件应用发送，不保存服务器数据。
- 无账号、公开留言、投稿、热度统计的业务后端依赖。
- Clarity 尚未接入；购买事件钩子不代表已有统计。
- 联系邮箱：xiangpengyu020104@gmail.com。中文展示 ¥398，英文 $60；整机仍为咨询，不收款。

## 给朋友什么

提供当前项目源码，保留 package.json、package-lock.json、index.html、hub.html、robo-1.html、vite.config.js、src 和 public，以及本说明。不要提供 node_modules、data、日志或旧交接 ZIP；历史留言和投稿不是网站公开资源。

也可由你构建后只提供 dist 文件夹；发布 GitHub Pages 前先处理下文的大文件下载托管。修改源码后需要重新构建。

## 构建

安装符合 Vite 要求的 Node.js（22.12 或以上的受支持版本），在项目根目录执行：

```sh
npm ci
npm run build
npm run preview
```

通过终端给出的 HTTP 地址预览，不能双击 HTML。npm start 也可提供 dist 的静态预览，默认 http://127.0.0.1:3000；不需要启用任何 /api 接口。

## 发布静态网站

### 先处理软件安装包

ROBO.zip 约 344.5 MB、互动壁纸.zip 约 678.3 MB，七个包合计约 1.06 GB。它们不能直接提交到普通 GitHub 仓库并随 Pages 网站发布：GitHub 普通仓库阻止超过 100 MiB 的单文件，Pages 发布站点上限为 1 GB。

1. 将七个独立 ZIP 上传至你控制的 GitHub Release 或其他文件托管，并确认每个地址可供访客下载。
2. 在 src/hub-catalog.js 对应条目添加 downloadUrl，填写该包的完整 HTTPS 下载地址。不要使用 Release 介绍页地址。
3. 仅在外部地址已配置并核验后，把 public/downloads/software、public/downloads/plugins 中的软件 ZIP 移到站点发布目录以外保留；这些大文件不要提交 Git。
4. 保留 public/downloads/robocam.zip 和 packages.json，再重新构建 dist，检查七个下载入口都指向正确外部地址。
5. 如采用自动化部署，也可在构建后从 Pages 上传产物中排除上述软件目录；必须先确认 downloadUrl 全部配置，避免下载断链。

目前没有 Release 地址，网站使用已验证的本地下载文件；未替你上传公网或创建 Release。

参考：[GitHub 大文件限制与 Releases](https://docs.github.com/en/repositories/working-with-files/managing-large-files/about-large-files-on-github)、[Pages 容量限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)。

### 发布网页

把 dist 内的全部内容交给静态托管，确保 index.html 位于发布目录根部，robo-1.html、assets、models、fonts、images、downloads 等实际生成目录一起发布。

如果网站位于域名根路径，使用默认构建。若部署到仓库子路径（例如 /robo/），使用实际路径重新构建：

```sh
npm run build -- --base=/robo/
```

GitHub Pages 使用自动构建时，将 Pages 发布产物指定为 dist；仅上传源码并不会自动生成 Vite 网站。此版本不需要租业务服务器或配置数据库。

## 验收

- 默认进入 ROBO Hub；ROBO 1.0 卡片进入结构探索，Logo 可返回首页。
- 搜索、分类、中英文正常；没有投稿入口、来源筛选或热度加载报错。
- 模型、字体、图片及 3D ZIP 下载正常，尤其检查仓库子路径下的资源地址。
- 「软件与插件」包含一个基础款、六个插件；各项下载文件、大小和安装说明匹配，中英文都可用。GitHub Pages 上需确认外部 ZIP 下载链接可访问。
- 结构探索、接线、爆炸、旋转、缩放和重置正常。
- 功能建议打开页内输入窗口，邮件按钮只准备草稿，由访客自行发送；没有公开留言承诺。
- 联系与购买咨询邮件地址正确；测试时不必真的发送。
- 不应出现 /api/messages、/api/hub/submissions 或 /api/hub/popularity 请求。

后续开放社区时，再设计账号、文件存储、作品审核与发布后台。保留的旧 API 模块未启用，不能直接视为完整社区平台。

目前尚未部署到公网。大模型资源和 JavaScript 包的首屏速度需在正式网络中验证。
