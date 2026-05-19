<div align="center">

# NovaJudge

**面向 XCPC/ICPC 训练与现场赛的现代化轻量评测平台**

[![License](https://img.shields.io/github/license/pppolf/NovaJudge?color=blue)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-149eca?logo=react&logoColor=white)](https://react.dev/)
[![Prisma](https://img.shields.io/badge/Prisma-7-2d3748?logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Redis](https://img.shields.io/badge/Redis-7-dc382d?logo=redis&logoColor=white)](https://redis.io/)

</div>

## 项目简介

NovaJudge 是一套围绕 XCPC 赛制设计的 Online Judge 系统，覆盖从题库维护、比赛组织、队伍账号、实时评测、封榜榜单、答疑公告到气球配送的完整流程。

它不是只做“提交代码并返回结果”的通用 OJ，而是更关注现场赛和校内训练的实际工作流：管理员要快速建赛、导题、导队伍，选手要稳定提交和查看状态，裁判要重测和排障，现场要有榜单、气球、CCS/Event Feed 等配套能力。

底层评测接入 [go-judge](https://github.com/criyle/go-judge)，任务队列使用 BullMQ + Redis，数据层使用 PostgreSQL + Prisma，前端基于 Next.js App Router 与 React 构建。

## 核心优势

- **为比赛现场设计**：内置比赛状态流转、私有赛账号、ACM 罚时榜、封榜/解榜、公告答疑、气球管理等现场赛关键功能。
- **实时评测反馈**：提交状态通过 Redis 缓存与 SSE 推送更新，选手能及时看到等待、评测中、AC/WA/TLE/MLE/RE/CE 等状态。
- **赛中信息保护**：比赛进行中普通参赛者只看到评测状态，不暴露 WA/TLE/RE 出现在第几个测试点；管理员和评委仍可完整排障。
- **强管理后台**：提供比赛、题目、账号、提交、测试数据、附件、API Key、训练目录等集中管理能力。
- **题目工程化维护**：支持 Markdown/LaTeX 题面、样例调试、测试数据上传、YAML 判题配置、SPJ、交互题与附件管理。
- **易集成外部工具**：提供 API Key 认证接口与 ICPC CCS 兼容接口，可接入外部榜单、Resolver、现场展示和数据同步工具。
- **可横向扩展的评测队列**：BullMQ 队列解耦 Web 与 Judge Worker，可按比赛规模扩展评测节点。
- **部署依赖清晰**：PostgreSQL、Redis、Go-Judge 均可通过 Docker Compose 启动，本地开发和现场部署路径一致。

## 功能一览

### 比赛与选手侧

- 比赛列表、公开赛/私有赛、比赛倒计时与状态展示。
- 题目列表、题面渲染、样例、限制信息、气球颜色展示。
- Monaco Editor 在线提交，支持 `C`、`C++23`、`Java 21`、`PyPy3`。
- 提交状态页支持筛选、分页、个人提交视图和管理员全局视图。
- 实时提交状态更新，支持 Pending、Judging、Accepted、Wrong Answer、TLE、MLE、Runtime Error、Compile Error、Presentation Error、System Error。
- 比赛中隐藏普通参赛者的失败测试点，保护测试数据结构和赛题信息。
- Clarification 答疑/公告系统，支持赛中问题和裁判回复。

### 榜单与现场能力

- ACM/ICPC 风格排名表，自动计算通过题数与罚时。
- 支持封榜时段，封榜后普通视角隐藏未公开结果，管理员可查看完整信息。
- 支持手动/自动解榜配置，为现场滚榜和颁奖保留悬念。
- 气球中心支持根据 AC 生成气球任务、分配 Runner、标记配送完成。
- 气球页提供二维码入口，方便现场志愿者移动端操作。

### 管理后台

- Dashboard 展示比赛数、题目数、提交数、用户数、Judge 状态、服务器资源和语言配置。
- 比赛创建、编辑、显示/隐藏、导入/导出。
- 比赛题目绑定、题号编辑、队伍账号导入与管理。
- 题库创建、编辑、导入/导出、删除、批量重测。
- 题面 Markdown 编辑，支持数学公式、代码块和附件资源。
- 测试数据管理：上传、查看、编辑、删除数据文件和 `problem.yaml`。
- 管理端样例调试与提交测试，方便出题阶段快速验证。
- 提交详情查看、编译错误查看、单条提交重测。
- API Key 管理，用于外部系统安全访问。

### 评测能力

- 基于 go-judge 的隔离执行环境。
- 支持普通标准输出比对、Special Judge、Interactive Problem。
- 支持按语言配置时间/内存倍率，Java 默认额外放宽资源限制。
- Redis 记录评测进度，Worker 评测完成后写回数据库。
- 支持按题目重测和按提交重测，榜单随结果自动更新。

### 数据与集成

- 比赛数据导入/导出：包含比赛信息、用户、题目、提交记录等。
- 题目数据导入/导出：ZIP 包格式，包含 `problem.json`、`data/`、`assets/`。
- API Key 认证的开放接口，便于外部平台拉取题目和提交。
- ICPC CCS 兼容接口：contests、problems、teams、languages、submissions、judgements、runs、event-feed、ghost 等。
- 支持 Event Feed，为 Resolver 和现场大屏提供数据基础。

## 技术架构

```text
Browser
  │
  ▼
Next.js App Router + React
  │
  ├─ Prisma ORM ───────── PostgreSQL
  │
  ├─ BullMQ Queue ─────── Redis
  │                         │
  │                         ▼
  └──────────────────── Judge Worker ── go-judge
```

## 技术栈

- **Web 框架**：Next.js 16、React 19、TypeScript
- **样式与交互**：Tailwind CSS、Heroicons、Sonner、Monaco Editor
- **数据库**：PostgreSQL、Prisma 7
- **缓存与队列**：Redis、BullMQ
- **评测内核**：go-judge
- **题面与公式**：React Markdown、remark-gfm、KaTeX/MathJax
- **部署基础设施**：Docker Compose

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/pppolf/NovaJudge.git
cd NovaJudge
```

### 2. 配置环境变量

```bash
cp .env.example .env
```

常用配置项：

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/xcpc_oj?schema=public"
REDIS_URL="redis://localhost:6379"
GO_JUDGE_API="http://localhost:5050"
JWT_SECRET="please-change-this-secret"
SUPER_ADMIN_USERNAME="admin"
SUPER_ADMIN_PASSWORD="123456"
JUDGE_CONCURRENCY=4
```

生产环境请务必修改 `JWT_SECRET`、超级管理员密码以及数据库密码。

### 3. 启动基础服务

```bash
docker-compose up -d
```

该命令会启动：

- PostgreSQL
- Redis
- Go-Judge

### 4. 安装依赖并初始化数据库

```bash
npm install
npx prisma db push
npm run prisma
```

### 5. 启动 Web 服务

开发模式：

```bash
npm run dev
```

生产模式：

```bash
npm run build
npm run start
```

默认访问地址：`http://localhost:3001`

### 6. 启动评测 Worker

另开一个终端运行：

```bash
npm run worker
```

Web 服务负责接收提交，Worker 负责从队列中取出任务并调用 go-judge 完成评测。正式比赛时请确认 Web、Redis、PostgreSQL、Go-Judge、Worker 均处于可用状态。

## 常用脚本

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 运行 ESLint
npm run prisma       # 生成 Prisma Client
npm run worker       # 启动评测 Worker
npm run worker:dev   # 以 watch 模式启动 Worker
```

## 目录结构

```text
NovaJudge/
├─ app/
│  ├─ (main)/                 # 选手侧：比赛、题目、提交、榜单、答疑、气球
│  ├─ admin/                  # 管理后台
│  └─ api/                    # REST API 与 CCS API
├─ components/                # 通用 UI 与管理端组件
├─ context/                   # 前端上下文
├─ docs/                      # API 文档与变更记录
├─ lib/
│  ├─ ccs/                    # CCS 数据转换与认证
│  ├─ judge.ts                # 核心评测逻辑
│  ├─ queue.ts                # BullMQ 队列
│  ├─ redis.ts                # Redis 连接
│  └─ prisma.ts               # Prisma Client
├─ prisma/                    # 数据库 Schema
├─ public/                    # 静态资源
├─ uploads/                   # 题目数据与附件
├─ worker.ts                  # 评测 Worker 与比赛状态调度
└─ docker-compose.yml         # PostgreSQL / Redis / Go-Judge 编排
```

## API 与 CCS

NovaJudge 提供两类对外接口：

- **平台 API**：如 `/api/contests/:contestId/problems`、`/api/contests/:contestId/submissions`，使用 `x-api-key` 认证。
- **CCS API**：如 `/api/ccs/contests`、`/api/ccs/contests/:contestId/event-feed`，用于 ICPC 工具链和现场 Resolver。

更详细的接口说明见 [docs/API_DOCS.md](docs/API_DOCS.md)。

## 适用场景

- 校内 ICPC/CCPC 选拔赛
- 算法协会日常训练赛
- 课程实验或程序设计竞赛
- 小中型线下赛现场系统
- 题库维护、出题验题与重测流程

## 部署建议

- 现场赛建议将 Web、Worker、PostgreSQL、Redis、Go-Judge 分别纳入进程守护或容器编排。
- Worker 可以按机器性能和并发需求横向扩展，但要合理设置 `JUDGE_CONCURRENCY`。
- 生产环境请使用反向代理和 HTTPS，并保护好后台入口与 API Key。
- 比赛前建议提前进行全题样例测试、压力提交测试、榜单冻结/解冻演练和气球流程演练。

## 开源协议

本项目基于 [MIT License](LICENSE) 开源。

<div align="center">

Made with care by CWNU PAA @ Gao Ming

</div>
