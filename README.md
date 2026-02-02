# XCPC Online Judge 项目搭建指南

## 项目概述

这是一个基于 Next.js 16 + React 19 + TypeScript 的在线判题系统（OJ），支持比赛管理、题目管理、提交判题等功能。

## 技术栈

- **前端**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4
- **后端**: Next.js API Routes + Server Actions
- **数据库**: PostgreSQL + Prisma ORM
- **缓存/队列**: Redis + BullMQ
- **判题引擎**: Go-Judge
- **编辑器**: Monaco Editor

## 环境要求

- Node.js 20+
- Docker Desktop (用于运行 PostgreSQL、Redis 和 Go-Judge)
- Git

## 快速开始

### 1. 安装项目依赖

```bash
npm install
```

依赖已安装完成 ✅

### 2. 启动基础服务

使用 Docker Compose 启动 PostgreSQL、Redis 和 Go-Judge：

```bash
docker-compose up -d
```

服务包括：
- **PostgreSQL**: 端口 5432
- **Redis**: 端口 6379
- **Go-Judge**: 端口 5050 (HTTP), 5051 (gRPC)

### 3. 配置环境变量

项目已包含 `.env` 文件，配置如下：

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/xcpc_oj?schema=public"
JWT_SECRET="xcpc-oj-jwt-secret"
NODE_ENV="development"

SUPER_ADMIN_USERNAME="admin"
SUPER_ADMIN_PASSWORD="123456"

GO_JUDGE_API="http://localhost:5050"
JUDGE_CONCURRENCY=4

REDIS_URL="redis://localhost:6379"
```

### 4. 初始化数据库

等待 PostgreSQL 服务启动完成后（约 10-20 秒），运行数据库迁移：

```bash
npx prisma db push
```

这将创建所有数据表和初始结构。

### 5. 生成 Prisma Client

```bash
npx prisma generate
```

Prisma Client 已生成 ✅

### 6. 启动开发服务器

```bash
npm run dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动。

### 7. 启动 Worker（判题队列）

在新的终端窗口中运行：

```bash
npm run worker:dev
```

Worker 会监听提交队列并调用 Go-Judge 进行判题。

## 项目结构

```
xcpc-next/
├── app/                    # Next.js App Router
│   ├── (main)/            # 主应用页面
│   │   ├── contest/       # 比赛相关页面
│   │   └── layout.tsx     # 主布局
│   ├── admin/             # 管理后台
│   │   ├── contests/      # 比赛管理
│   │   ├── problems/      # 题目管理
│   │   └── submissions/   # 提交管理
│   └── api/               # API 路由
├── components/            # React 组件
├── context/               # React Context (Auth, Language)
├── lib/                   # 工具库
│   ├── generated/prisma/  # Prisma Client
│   ├── judge.ts           # 判题逻辑
│   └── queue.ts           # BullMQ 队列
├── prisma/                # Prisma Schema
└── public/                # 静态资源
```

## 主要功能

### 比赛管理
- 创建/编辑比赛
- 比赛题目配置
- 封榜/解封
- 排名实时更新

### 题目管理
- 题目编辑器（支持 YAML 配置）
- 测试用例管理
- SPJ/Interactive 题目支持
- 题目资源管理

### 判题系统
- 多语言支持（C/C++, Java, Python, Go 等）
- 实时判题状态
- 代码查看
- 重判功能

### 用户系统
- 全局管理员
- 比赛用户（队伍）
- 角色权限控制

### 答疑系统
- 提问/回复
- 公告发布
- 问题分类

## 开发命令

```bash
# 开发服务器
npm run dev

# 构建生产版本
npm run build

# 启动生产服务器
npm start

# Lint 检查
npm run lint

# Prisma 相关
npx prisma generate    # 生成 Prisma Client
npx prisma db push     # 推送 schema 到数据库
npx prisma studio      # 打开 Prisma Studio

# Worker（判题队列）
npm run worker         # 生产环境
npm run worker:dev     # 开发环境（自动重启）
```

## 默认账户

- **超级管理员**: `admin` / `123456`
- 首次登录后可在管理后台修改密码

## 故障排除

### Docker 服务启动失败

检查 Docker Desktop 是否正在运行：

```bash
docker ps
```

### 数据库连接失败

确保 PostgreSQL 容器已启动并健康：

```bash
docker logs xcpc-postgres
```

### Redis 连接失败

检查 Redis 容器状态：

```bash
docker logs xcpc-redis
```

### Go-Judge 连接失败

确保 Go-Judge 容器已启动：

```bash
docker logs xcpc-go-judge
```

### 判题不工作

确保 Worker 正在运行：

```bash
npm run worker:dev
```

## 生产部署

生产环境部署建议：

1. 使用独立的 PostgreSQL 和 Redis 实例
2. 配置环境变量 `NODE_ENV=production`
3. 使用 PM2 或类似工具管理进程
4. 配置反向代理（Nginx）
5. 启用 HTTPS

## 许可证

MIT License
