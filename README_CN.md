# Mem0 - AI 智能记忆层

> **Mem0**（读作 "mem-zero"）为 AI 助手和智能体提供智能记忆层，实现个性化 AI 交互。它能记住用户偏好、适应个体需求，并持续学习——适用于客服聊天机器人、AI 助手和自主系统。

## 📋 目录

- [项目简介](#项目简介)
- [技术栈](#技术栈)
- [架构总览](#架构总览)
- [环境要求](#环境要求)
- [依赖安装](#依赖安装)
- [当前部署状态](#当前部署状态)
- [部署方式](#部署方式)
  - [方式一：本地 Python 直接部署（无 Docker）](#方式一本地-python-直接部署无-docker)
  - [方式二：本地 Node.js 部署前端 UI](#方式二本地-nodejs-部署前端-ui)
  - [方式三：Docker Compose 一键部署](#方式三docker-compose-一键部署)
  - [方式四：一键脚本部署](#方式四一键脚本部署)
- [API 使用指南](#api-使用指南)
- [MCP 客户端配置](#mcp-客户端配置)
- [mem0 核心库使用](#mem0-核心库使用)
- [项目结构说明](#项目结构说明)
- [常见问题](#常见问题)
- [许可证](#许可证)

---

## 项目简介

**Mem0** 是一个开源的 AI 记忆管理平台，包含以下核心组件：

| 组件 | 说明 |
|------|------|
| **mem0 核心库** (`mem0/`) | Python SDK，提供记忆的增删改查、语义搜索、图记忆等能力 |
| **OpenMemory API** (`openmemory/api/`) | 基于 FastAPI 的后端服务 + MCP Server |
| **OpenMemory UI** (`openmemory/ui/`) | 基于 Next.js 的 Web 管理界面 |

### 🔥 核心亮点

- **+26% 准确率**：相比 OpenAI Memory（基于 LOCOMO 基准测试）
- **91% 更快响应**：低延迟，适合大规模场景
- **90% 更少 Token 消耗**：降低成本不妥协
- **多级记忆**：支持 User / Session / Agent 级别
- **多向量数据库**：支持 Qdrant、Chroma、Milvus、PgVector、Redis、Elasticsearch、FAISS 等 20+ 种
- **多 LLM 支持**：OpenAI、Anthropic、Ollama、Together 等 10+ 提供商
- **MCP 集成**：可与 Claude Desktop、Cursor、Cline 等 AI 客户端集成

---

## 技术栈

### 🧠 AI / 模型层

| 技术 | 版本 / 说明 | 用途 |
|------|------------|------|
| **Ollama** | 本地推理引擎 | 本地运行大语言模型和 Embedding 模型 |
| **Qwen3** | `qwen3:0.6b`（0.6B 参数） | LLM 推理：记忆提取、更新、分类、语义理解 |
| **nomic-embed-text** | 768 维向量 | 文本向量嵌入（Embedding），用于语义搜索和记忆匹配 |
| **mem0ai** | `1.0.5` | 核心记忆引擎 SDK，提供记忆的增删改查、语义搜索、智能去重 |

### 🔧 后端

| 技术 | 版本 | 用途 |
|------|------|------|
| **Python** | `≥ 3.9`（推荐 3.10+） | 后端主要开发语言 |
| **FastAPI** | `≥ 0.68.0` | Web API 框架，提供 RESTful 接口 |
| **Uvicorn** | `≥ 0.15.0` | ASGI 高性能服务器 |
| **SQLAlchemy** | `≥ 1.4.0` | ORM 框架，管理 SQLite 元数据存储 |
| **Alembic** | `≥ 1.7.0` | 数据库迁移工具 |
| **Pydantic** | `≥ 2.7.3` | 数据校验和序列化 |
| **MCP (Model Context Protocol)** | `≥ 1.3.0` | AI 客户端通信协议（SSE），集成 Cursor / Claude 等 |
| **OpenAI SDK** | `≥ 1.40.0` | LLM API 客户端（兼容 Ollama 接口） |
| **Anthropic SDK** | `0.51.0` | Anthropic Claude API 客户端 |
| **Tenacity** | `9.1.2` | 重试机制库 |

### 🗄️ 数据存储

| 技术 | 说明 | 用途 |
|------|------|------|
| **Qdrant** | 向量数据库（Docker 部署） | 存储和检索记忆向量，支持语义相似度搜索 |
| **SQLite** | 轻量级关系数据库 | 元数据存储：用户、应用、记忆、分类、权限、日志 |
| 可选：Chroma / Milvus / PgVector / Redis / Elasticsearch / FAISS 等 20+ 种 | — | 可替换的向量存储后端 |

### 🖥️ 前端

| 技术 | 版本 | 用途 |
|------|------|------|
| **Next.js** | `15.2.4` | React 全栈框架，SSR / SSG 支持 |
| **React** | `19.x` | UI 组件库 |
| **TypeScript** | `5.x` | 类型安全的 JavaScript 超集 |
| **Tailwind CSS** | `3.4.17` | 原子化 CSS 框架 |
| **Radix UI** | — | 无障碍 Headless UI 组件库 |
| **Redux Toolkit** | `2.7.0` | 全局状态管理 |
| **Recharts** | `2.15.0` | 数据可视化图表库 |
| **Axios** | `1.8.4` | HTTP 请求客户端 |
| **Lucide React** | `0.454.0` | 图标库 |
| **Sass** | `1.86.3` | CSS 预处理器 |

### 🏗️ 基础设施 & 工具链

| 技术 | 版本 / 说明 | 用途 |
|------|------------|------|
| **Docker** + **Docker Compose V2** | — | 容器化部署（API + Qdrant） |
| **Node.js** | `18+` | 前端构建运行环境 |
| **pnpm** | `10.5.2` | 前端包管理器（高效磁盘利用） |
| **pip** | — | Python 包管理器 |
| **Hatchling** | — | Python 项目构建后端 |
| **Ruff** | `≥ 0.6.5` | Python 代码格式化 & Lint 工具 |
| **Makefile** | — | 快捷命令管理 |

---

## 架构总览

```
┌─────────────────────────────────────────────────────────┐
│                    OpenMemory 系统架构                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌──────────────┐    ┌────────────┐ │
│  │  Next.js UI  │───▶│  FastAPI 后端  │───▶│ 向量数据库  │ │
│  │ (端口 3000)  │    │  (端口 8765)  │    │  (Qdrant)  │ │
│  └─────────────┘    └──────┬───────┘    └────────────┘ │
│                            │                            │
│                     ┌──────┴───────┐                    │
│                     │  MCP Server  │                    │
│                     │  (SSE 协议)   │                    │
│                     └──────┬───────┘                    │
│                            │                            │
│               ┌────────────┼────────────┐               │
│               ▼            ▼            ▼               │
│          ┌────────┐  ┌────────┐  ┌──────────┐          │
│          │ Cursor  │  │ Claude │  │   Cline  │          │
│          └────────┘  └────────┘  └──────────┘          │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │         SQLite 数据库（元数据存储）            │       │
│  │  用户 / 应用 / 记忆 / 分类 / 权限 / 日志       │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │          mem0 核心库 (Python SDK)             │       │
│  │  记忆提取 / 语义搜索 / 智能去重 / 图记忆       │       │
│  └─────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
```

---

## 环境要求

### 最低要求
- **Python** 3.9+（推荐 3.10+）
- **pip** 包管理器
- **OpenAI API Key**（用于 LLM 和 Embedding）

### 完整部署（含 UI）额外需要
- **Docker** + **Docker Compose V2**（Docker 部署方式）
- **Node.js 18+** + **pnpm**（本地开发前端时需要）

---

## 依赖安装

### 1. 安装 mem0 核心库

```bash
# 方式一：从 PyPI 安装（推荐生产使用）
pip install mem0ai

# 方式二：从本地源码安装（开发模式）
pip install -e /path/to/mem0
```

验证安装：
```bash
python3 -c "import mem0; print('mem0 版本:', mem0.__version__)"
# 输出: mem0 版本: 1.0.5
```

### 2. 安装 OpenMemory API 后端依赖

```bash
pip install -r openmemory/api/requirements.txt
```

主要依赖包括：
- `fastapi` - Web 框架
- `uvicorn` - ASGI 服务器
- `sqlalchemy` - ORM 数据库
- `mem0ai` - 核心记忆引擎
- `mcp[cli]` - MCP 协议支持
- `openai` - OpenAI API 客户端
- `alembic` - 数据库迁移

### 3. 安装可选依赖（按需）

```bash
# 图记忆支持
pip install mem0ai[graph]

# 额外向量数据库支持
pip install mem0ai[vector_stores]

# 更多 LLM 提供商支持
pip install mem0ai[llms]

# 安装所有可选依赖
pip install mem0ai[graph,vector_stores,llms,extras]
```

---

## 当前部署状态

> ✅ 以下为本项目在当前环境中的实际部署情况：

| 服务 | 状态 | 地址 | 说明 |
|------|------|------|------|
| **API 后端** | ✅ 已部署 | http://21.6.186.148:8765 | FastAPI + MCP Server，后台运行中 |
| **前端 UI** | ✅ 已部署 | http://21.6.186.148:3000 | Next.js 生产模式，后台运行中 |
| **API 文档** | ✅ 可用 | http://21.6.186.148:8765/docs | Swagger UI |
| **向量数据库** | ⚠️ 需配置 | - | 默认 Qdrant 未部署，需另行配置 |

### 部署环境信息

- **操作系统**：TencentOS Server 3.2（基于 RHEL 8）
- **Python**：3.10+
- **Node.js**：v18.20.8
- **pnpm**：v10.5.2
- **部署方式**：本地 Python（API 后端）+ 本地 Node.js（前端 UI）

---

## 部署方式

### 方式一：本地 Python 直接部署（无 Docker）

适合快速体验和开发调试 API 后端，使用 SQLite 作为元数据存储，无需额外数据库服务。

#### 步骤 1：配置环境变量

```bash
# 复制环境变量模板
cp openmemory/api/.env.example openmemory/api/.env
```

编辑 `openmemory/api/.env`，填入你的 API Key：
```env
OPENAI_API_KEY=sk-your-actual-api-key
USER=your_username
```

#### 步骤 2：启动 API 后端

```bash
cd openmemory/api

# 启动服务（开发模式，支持热重载）
python3 -m uvicorn main:app --host 0.0.0.0 --port 8765 --reload

# 或后台运行
nohup python3 -m uvicorn main:app --host 0.0.0.0 --port 8765 --reload > server.log 2>&1 &
```

启动成功后：
- **API 服务**：http://21.6.186.148:8765
- **API 文档（Swagger）**：http://21.6.186.148:8765/docs
- **API 文档（ReDoc）**：http://21.6.186.148:8765/redoc

> ⚠️ **注意**：本地模式下默认使用 SQLite 存储元数据。向量存储需要额外配置（默认使用 Qdrant，需确保 Qdrant 服务可用，或通过 API 配置其他向量数据库）。

#### 步骤 3（可选）：配置向量数据库

通过 API 配置向量存储（以 Qdrant 为例）：
```bash
curl -X PUT http://21.6.186.148:8765/api/v1/config/mem0/vector_store \
  -H 'Content-Type: application/json' \
  -d '{
    "provider": "qdrant",
    "config": {
      "collection_name": "openmemory",
      "embedding_model_dims": 1536,
      "host": "21.6.186.148",
      "port": 6333
    }
  }'
```

---

### 方式二：本地 Node.js 部署前端 UI

适合在无 Docker 环境下部署前端 Web 管理界面，需配合方式一的 API 后端使用。

#### 前提条件

- 已按方式一启动 API 后端（http://21.6.186.148:8765）
- 已安装 Node.js 18+ 和 pnpm

#### 步骤 1：安装 Node.js 和 pnpm

```bash
# CentOS/RHEL/TencentOS 安装 Node.js 18
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
dnf install nodejs -y

# Ubuntu/Debian 安装 Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install nodejs -y

# 安装 pnpm
npm install -g pnpm@10.5.2
```

验证安装：
```bash
node --version   # v18.x.x
pnpm --version   # 10.5.2
```

> ⚠️ **注意**：如果 `pnpm` 命令找不到，可能需要手动创建符号链接：
> ```bash
> ln -sf $(find /root/.npm -name "pnpm.cjs" -path "*/pnpm/bin/*" | head -1) /usr/local/bin/pnpm
> ```

#### 步骤 2：配置前端环境变量

```bash
# 复制环境变量模板
cp openmemory/ui/.env.example openmemory/ui/.env
```

编辑 `openmemory/ui/.env`：
```env
NEXT_PUBLIC_API_URL=http://21.6.186.148:8765
NEXT_PUBLIC_USER_ID=user
```

> `NEXT_PUBLIC_USER_ID` 的值应与 `openmemory/api/.env` 中的 `USER` 保持一致。

#### 步骤 3：安装前端依赖

```bash
cd openmemory/ui
pnpm install
```

#### 步骤 4：构建并启动

```bash
# 构建生产版本
NEXT_PUBLIC_API_URL=http://21.6.186.148:8765 NEXT_PUBLIC_USER_ID=user pnpm build

# 以生产模式启动（前台运行）
pnpm start -p 3000 -H 0.0.0.0

# 或以生产模式后台运行
nohup pnpm start -p 3000 -H 0.0.0.0 > frontend.log 2>&1 &

# 或以开发模式启动（支持热重载，适合开发调试）
NEXT_PUBLIC_API_URL=http://21.6.186.148:8765 NEXT_PUBLIC_USER_ID=user pnpm dev
```

启动成功后：
- **前端 UI**：http://21.6.186.148:3000
- **Dashboard**：http://21.6.186.148:3000（首页即为 Dashboard）
- **记忆管理**：http://21.6.186.148:3000/memories
- **应用管理**：http://21.6.186.148:3000/apps
- **系统设置**：http://21.6.186.148:3000/settings

#### 停止前端服务

```bash
# 查找并停止进程
pkill -f "next start"
# 或
pkill -f "next-server"
```

---

### 方式三：Docker Compose 一键部署

适合生产部署，包含完整的向量数据库和前端 UI。

#### 步骤 1：配置环境变量

```bash
cd openmemory
make env  # 自动复制 .env.example 到 .env
```

编辑 `openmemory/api/.env` 和 `openmemory/ui/.env`：

**api/.env**:
```env
OPENAI_API_KEY=sk-your-actual-api-key
USER=your_username
```

**ui/.env**:
```env
NEXT_PUBLIC_API_URL=http://21.6.186.148:8765
NEXT_PUBLIC_USER_ID=your_username
```

#### 步骤 2：构建并启动

```bash
cd openmemory

# 构建镜像
make build

# 启动所有服务（API + Qdrant + UI）
make up
```

启动成功后：
- **API 服务**：http://21.6.186.148:8765
- **前端 UI**：http://21.6.186.148:3000
- **API 文档**：http://21.6.186.148:8765/docs

#### 常用管理命令

```bash
make down      # 停止所有服务并清理
make logs      # 查看容器日志
make shell     # 进入 API 容器 shell
make migrate   # 运行数据库迁移
make ui-dev    # 本地开发模式启动前端
```

---

### 方式四：一键脚本部署

适合快速体验，支持选择不同的向量数据库。

```bash
# 默认使用 Qdrant
curl -sL https://raw.githubusercontent.com/mem0ai/mem0/main/openmemory/run.sh | OPENAI_API_KEY=your_api_key bash

# 使用其他向量数据库（支持：qdrant/chroma/milvus/pgvector/redis/elasticsearch/faiss/weaviate）
curl -sL https://raw.githubusercontent.com/mem0ai/mem0/main/openmemory/run.sh | OPENAI_API_KEY=your_api_key VECTOR_STORE=milvus bash
```

---

## API 使用指南

### 核心 API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| `GET` | `/api/v1/memories/?user_id=xxx` | 获取记忆列表（分页） |
| `POST` | `/api/v1/memories/` | 创建新记忆 |
| `GET` | `/api/v1/memories/{id}` | 获取单条记忆 |
| `PUT` | `/api/v1/memories/{id}` | 更新记忆 |
| `DELETE` | `/api/v1/memories/` | 批量删除记忆 |
| `POST` | `/api/v1/memories/filter` | 高级过滤查询 |
| `POST` | `/api/v1/memories/actions/pause` | 暂停/恢复记忆 |
| `POST` | `/api/v1/memories/actions/archive` | 归档记忆 |
| `GET` | `/api/v1/memories/categories` | 获取分类列表 |
| `GET` | `/api/v1/memories/{id}/access-log` | 获取访问日志 |
| `GET` | `/api/v1/memories/{id}/related` | 获取关联记忆 |
| `GET` | `/api/v1/apps/?user_id=xxx` | 获取应用列表 |
| `GET` | `/api/v1/stats?user_id=xxx` | 获取统计信息 |
| `GET` | `/api/v1/config` | 获取配置 |
| `PUT` | `/api/v1/config/mem0/{key}` | 更新配置 |
| `POST` | `/api/v1/backup/export` | 导出备份 |
| `POST` | `/api/v1/backup/import` | 导入备份 |

### 示例：创建记忆

```bash
curl -X POST http://21.6.186.148:8765/api/v1/memories/ \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "root",
    "text": "我喜欢用 Python 写后端，用 Next.js 写前端",
    "app": "openmemory"
  }'
```

### 示例：搜索记忆（MCP 方式）

通过 MCP 协议连接后，AI 客户端可以自动调用以下工具：
- `add_memories` - 添加记忆
- `search_memory` - 语义搜索记忆
- `get_all_memories` - 获取所有记忆
- `delete_memory` - 删除单条记忆
- `delete_all_memories` - 删除所有记忆

---

## MCP 客户端配置

### 通用配置格式

MCP Server SSE 连接地址：
```
http://21.6.186.148:8765/mcp/<client-name>/sse/<user-id>
```

### Cursor 配置

在 Cursor 的 MCP 设置中添加：
```json
{
  "mcpServers": {
    "openmemory": {
      "url": "http://21.6.186.148:8765/mcp/cursor/sse/your_username"
    }
  }
}
```

### Claude Desktop 配置

在 `claude_desktop_config.json` 中添加：
```json
{
  "mcpServers": {
    "openmemory": {
      "url": "http://21.6.186.148:8765/mcp/claude/sse/your_username"
    }
  }
}
```

### 一键安装命令

```bash
npx @openmemory/install local http://21.6.186.148:8765/mcp/<client-name>/sse/<user-id> --client <client-name>
```

---

## mem0 核心库使用

### 基础用法

```python
from openai import OpenAI
from mem0 import Memory

openai_client = OpenAI()
memory = Memory()

def chat_with_memories(message: str, user_id: str = "default_user") -> str:
    # 检索相关记忆
    relevant_memories = memory.search(query=message, user_id=user_id, limit=3)
    memories_str = "\n".join(f"- {entry['memory']}" for entry in relevant_memories["results"])

    # 生成回复
    system_prompt = f"你是一个智能助手。根据用户记忆回答问题。\n用户记忆:\n{memories_str}"
    messages = [{"role": "system", "content": system_prompt}, {"role": "user", "content": message}]
    response = openai_client.chat.completions.create(model="gpt-4.1-nano-2025-04-14", messages=messages)
    assistant_response = response.choices[0].message.content

    # 从对话中提取新记忆
    messages.append({"role": "assistant", "content": assistant_response})
    memory.add(messages, user_id=user_id)

    return assistant_response

# 使用示例
print(chat_with_memories("我是一名 Python 开发者，喜欢用 FastAPI"))
print(chat_with_memories("我之前说过我用什么语言来着？"))
```

### 使用托管平台

```python
from mem0 import MemoryClient

# 使用 app.mem0.ai 的 API Key
client = MemoryClient(api_key="your-mem0-api-key")

# 添加记忆
client.add("用户偏好 Python 开发", user_id="user123")

# 搜索记忆
results = client.search("编程语言偏好", user_id="user123")
```

---

## 项目结构说明

```
mem0/
├── mem0/                          # 核心 Python SDK
│   ├── memory/                    # 记忆管理核心模块
│   ├── client/                    # 托管平台客户端
│   ├── graphs/                    # 图记忆实现
│   ├── vector_stores/             # 向量数据库适配层（20+ 种）
│   ├── llms/                      # LLM 提供商适配层（10+ 种）
│   ├── embeddings/                # Embedding 模型适配层
│   ├── configs/                   # 配置管理
│   └── proxy/                     # OpenAI 兼容代理
├── openmemory/                    # OpenMemory 自托管版本
│   ├── api/                       # FastAPI 后端 + MCP Server
│   │   ├── main.py                # 应用入口
│   │   ├── app/
│   │   │   ├── models.py          # 数据库模型
│   │   │   ├── mcp_server.py      # MCP 服务器实现
│   │   │   ├── routers/           # API 路由
│   │   │   │   ├── memories.py    # 记忆管理 API
│   │   │   │   ├── apps.py        # 应用管理 API
│   │   │   │   ├── stats.py       # 统计 API
│   │   │   │   ├── config.py      # 配置管理 API
│   │   │   │   └── backup.py      # 备份导入导出 API
│   │   │   └── utils/             # 工具函数
│   │   ├── requirements.txt       # Python 依赖
│   │   └── config.json            # mem0 配置文件
│   ├── ui/                        # Next.js 前端
│   │   ├── app/                   # 页面路由
│   │   │   ├── memories/          # 记忆管理页
│   │   │   ├── apps/              # 应用管理页
│   │   │   └── settings/          # 设置页
│   │   ├── components/            # React 组件
│   │   ├── hooks/                 # 自定义 Hooks
│   │   └── store/                 # Redux 状态管理
│   ├── compose/                   # 不同向量数据库的 Docker 配置
│   ├── docker-compose.yml         # Docker Compose 主配置
│   ├── run.sh                     # 一键启动脚本
│   └── Makefile                   # 快捷命令
├── docs/                          # 文档
├── pyproject.toml                 # Python 项目配置
├── Makefile                       # 根目录快捷命令
└── README.md                      # 英文说明文档
```

---

## 常见问题

### Q: 不配置向量数据库可以运行吗？

**A:** API 服务可以正常启动，但创建和搜索记忆功能需要向量数据库。推荐使用 Docker 方式部署，会自动包含 Qdrant 服务。如果是本地模式，可以通过配置 API 使用 FAISS（纯本地文件存储，无需额外服务）。

### Q: 支持哪些向量数据库？

**A:** 支持 Qdrant、Chroma、Milvus、PgVector、Redis、Elasticsearch、OpenSearch、FAISS、Weaviate、Pinecone 等 20+ 种向量数据库。通过 Docker Compose 可直接部署以下向量库：
- `qdrant`（默认）、`chroma`、`milvus`、`pgvector`、`redis`、`elasticsearch`、`faiss`、`weaviate`、`opensearch`

### Q: 可以使用非 OpenAI 的模型吗？

**A:** 可以。通过配置 API 可以切换到其他 LLM 和 Embedding 提供商。支持 Anthropic、Ollama（本地模型）、Together、Google Vertex AI 等。修改 `openmemory/api/config.json` 中的 `llm` 和 `embedder` 配置即可。

### Q: 启动报错 `datetime.UTC` 相关？

**A:** 这是 Python 版本兼容性问题。`datetime.UTC` 是 Python 3.11+ 才有的属性。本项目已修复此问题，如果从旧版代码拉取，请确保使用最新代码。

### Q: 如何停止后台运行的服务？

```bash
# 停止 API 后端服务
pkill -f "uvicorn main:app"

# 停止前端 UI 服务
pkill -f "next start"
pkill -f "next-server"

# 停止 Docker 服务
cd openmemory && make down
```

### Q: 前端页面显示空白或数据加载失败？

**A:** 请检查以下几点：
1. 确认 API 后端已启动且可访问：`curl http://21.6.186.148:8765/docs`
2. 确认前端 `.env` 中的 `NEXT_PUBLIC_API_URL` 配置正确（默认为 `http://21.6.186.148:8765`）
3. 确认 `NEXT_PUBLIC_USER_ID` 与 API 后端 `.env` 中的 `USER` 值一致
4. 如果修改了 `.env`，需要重新执行 `pnpm build` 后再启动（环境变量在构建时注入）

### Q: 没有 Docker 如何部署前端？

**A:** 可以使用本地 Node.js 方式部署。安装 Node.js 18+ 和 pnpm 后，按照 [方式二：本地 Node.js 部署前端 UI](#方式二本地-nodejs-部署前端-ui) 的步骤操作即可。无需 Docker，效果与 Docker 部署完全一致。

### Q: 数据存储在哪里？

- **元数据（SQLite）**：`openmemory/api/openmemory.db`
- **向量数据（Qdrant Docker）**：Docker Volume `mem0_storage`
- **向量数据（FAISS 本地）**：`/tmp/faiss` 目录
- **前端构建产物**：`openmemory/ui/.next/` 目录
- **前端日志**：`openmemory/ui/frontend.log`（后台运行时）

---

## 许可证

本项目采用 **Apache 2.0** 开源许可证。详见 [LICENSE](LICENSE) 文件。
