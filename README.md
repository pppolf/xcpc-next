<div align="center">

# 🚀 NovaJudge

**专为 XCPC 算法竞赛打造的现代化、高性能轻量级评测平台**

[![GitHub Repo stars](https://img.shields.io/github/stars/pppolf/NovaJudge?style=social)](https://github.com/pppolf/NovaJudge/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/pppolf/NovaJudge?style=social)](https://github.com/pppolf/NovaJudge/network/members)
[![License](https://img.shields.io/github/license/pppolf/NovaJudge?color=blue)](https://github.com/pppolf/NovaJudge/blob/main/LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/pppolf/NovaJudge?color=green)](https://github.com/pppolf/NovaJudge/commits/main)

<br/>

**核心技术栈**

![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)
![Redis](https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white)
![Go](https://img.shields.io/badge/Go_Judge-00ADD8?style=for-the-badge&logo=go&logoColor=white)

</div>

<br/>

## 📖 简介 (Introduction)

**NovaJudge** 是一款基于 Next.js App Router 架构开发的全新一代 Online Judge 系统。区别于传统沉重的 OJ 平台，NovaJudge 追求**极致的轻量化、极速的渲染响应**以及**最纯粹的赛场体验**。

底层的代码沙箱采用了业界领先的 [go-judge](https://github.com/criyle/go-judge)，结合 BullMQ 分布式队列与 Redis 内存缓存，完美支撑全校级别高并发选拔赛。

无论是作为高校算法协会的日常训练平台，还是承办标准的 ICPC/CCPC 线下赛，NovaJudge 都能为你提供最专业的服务保障。

## ✨ 核心特性 (Features)

### 🏆 专为 XCPC 比赛而生

- **高性能静态榜单**：基于 Redis 缓存与 SWR 轮询，支持数百人同频观榜 0 延迟。
- **完美的赛制支持**：内置 ACM 罚时计算规则、最后一小时封榜 (Scoreboard Freeze) 悬念机制。
- **赛场互动系统**：内置赛中答疑 (Clarifications) 与裁判全局广播 (Announcements)。
- **一键重测机制**：支持管理员赛中一键 Rejudge 某道题目，榜单自动重算。

### ⚡ 现代化开发者体验

- **资源管理器式大厅**：突破传统的单调列表，比赛大厅采用类 Windows 文件系统的树形目录架构。
- **沉浸式代码编辑**：集成 Monaco Editor，提供丝滑的代码高亮与智能缩进。
- **无损题目导入导出**：支持标准 Polygon/FPS 格式，内置智能 ID 重写算法，彻底杜绝外源题目覆盖冲突。
- **高并发判题队列**：基于 BullMQ 构建的强力任务队列，支持多 Worker 节点横向扩容。

---

## 🧩 现场赛生态工具链 (Ecosystem)

NovaJudge 不仅是一个 Web 评测平台，更是一套为线下赛量身定制的完整解决方案。我们为其开发了专属的辅助周边工具链：

- 🛠️ **[Nova Toolkit (现场赛工具箱) ➔](你可以换成实际链接)**
  - **Nova Guard (选手端)**: 赛场防切屏监控、本地代码防丢备份。
  - **Nova Warden (场务端)**: 气球分发追踪器 (Balloon Tracker)、赛中打印代码服务大屏。

> **提示**：线下举办大型校赛或省赛时，强烈建议开启 Caddy 的 `tls internal` 内网 HTTPS 绿锁，并配合 Nova Toolkit 食用，以获得极致的专业赛场体验！

---

## 🛠️ 快速部署 (Quick Start)

NovaJudge 采用全容器化部署，极其简单。请确保你的服务器已安装 `Docker` 和 `Docker Compose`。

### 1. 克隆代码

```bash
git clone https://github.com/pppolf/NovaJudge.git
cd NovaJudge
```

### 2. 配置环境变量

复制环境配置模板并填写你的数据库与 Redis 密码：

```bash
cp .env.example .env
```

### 3. 一键启动基础设施

启动 PostgreSQL 数据库、Redis 队列以及 Go-Judge 沙箱容器：

```bash
docker-compose up -d
```

### 4. 初始化数据库与项目

```bash
npm install
npx prisma db push
npm run prisma
npm run build
npm run start
```

**判题队列服务启动**

```bash
npm run worker
```

服务启动后，访问 `http://localhost:3001` 即可进入 NovaJudge。默认超管账号信息请参考 `.env` 配置文件。

---

## 📁 目录结构 (Structure)

```text
NovaJudge/
├── app/
│   ├── (main)/          # 用户端前台页面 (比赛大厅、题目、榜单)
│   ├── admin/           # 管理员控制台
│   └── api/             # Next.js 服务端路由 (RESTful API)
├── components/          # React 全局复用 UI 组件
├── lib/                 # 核心逻辑 (数据库实例、评测队列、身份认证)
├── prisma/              # ORM 模型定义与迁移文件
└── docker-compose.yml   # 基础设施容器编排
```

---

## 🤝 贡献与支持 (Contributing)

欢迎提交 Issue 和 Pull Request！如果你在部署或使用中遇到任何问题，欢迎在 GitHub Discussions 中讨论。

如果 NovaJudge 帮助你们协会成功举办了比赛，请毫不吝啬地给我们点亮一颗 **Star ⭐️** ！

## 📄 开源协议 (License)

本项目采用 [MIT License](https://www.google.com/search?q=LICENSE) 协议开源。

---

<div align="center">
<b>Made with ❤️ by CWNU PAA (西华师范大学程序设计算法协会) @ Gao Ming</b>
</div>
