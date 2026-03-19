# OpenMemory (Mem0) 项目启动运行指南

> 本指南适用于 **Linux 云服务器**（TencentOS Server 3.2）上的部署和启动。
> 通过 Windows 电脑远程连接 Linux 服务器操作。

---

## 一、项目总体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                      用户 (浏览器)                               │
│         http://<服务器IP>:3000  (前端 Dashboard)                  │
│         http://<服务器IP>:8765/docs  (Swagger API 文档)           │
└────────────────┬───────────────────────┬────────────────────────┘
                 │                       │
     ┌───────────▼──────────┐  ┌─────────▼──────────┐
     │   前端 UI (Next.js)   │  │  OpenMemory API    │
     │   端口: 3000          │  │  端口: 8765         │
     │   openmemory/ui/     │  │  openmemory/api/   │
     └───────────┬──────────┘  └──┬──────┬──────┬───┘
                 │                │      │      │
                 │      ┌────────▼──┐ ┌─▼──────┐ │
                 │      │  Ollama   │ │ Milvus │ │
                 │      │  LLM服务  │ │向量数据库│ │
                 │      │  :11434   │ │ :19530 │ │
                 │      └───────────┘ └────────┘ │
                 │                        ┌────▼────┐
                 │                        │ Neo4j   │
                 │                        │ 图数据库 │
                 │                        │ :7687   │
                 └────────────────────────┴─────────┘
```

### 核心组件一览

| 组件 | 路径/位置 | 端口 | 说明 |
|------|----------|------|------|
| **Ollama** | 系统服务 | `11434` | 本地 LLM 推理引擎 |
| **Neo4j** | `/opt/neo4j` | `7687`(Bolt) / `7474`(HTTP) | 图数据库，存储记忆关系 |
| **OpenMemory API** | `openmemory/api/` | `8765` | 后端 API 服务（FastAPI） |
| **前端 Dashboard** | `openmemory/ui/` | `3000` | 前端界面（Next.js） |
| **Milvus** | `milvus_data/` | `19530` | 向量数据库（Standalone 独立服务） |
| **SQLite** | `openmemory/api/openmemory.db` | 无需端口 | 业务元数据存储 |

### 模型配置

| 用途 | 模型名称 | Provider |
|------|---------|----------|
| **主模型 (LLM)** | `qwen3.5:4b` | Ollama |
| **嵌入模型 (Embedder)** | `qwen3-embedding:4b` (2560 维) | Ollama |

---

## 二、环境要求

### 2.1 服务器配置

- **操作系统**: TencentOS Server 3.2 (兼容 CentOS/RHEL)
- **内核**: 5.4.119+
- **内存**: 建议 16GB+（当前服务器 123GB）
- **CPU**: 建议 4 核+（当前服务器 48 核）

### 2.2 软件环境

| 软件 | 版本 | 安装方式 |
|------|------|---------|
| **Python** | 3.10.13 | 系统自带或手动安装 |
| **Node.js** | v18.20.8 | 推荐 nvm 安装 |
| **pnpm** | 10.5.2 | `npm install -g pnpm` |
| **Java** | OpenJDK 17 | Neo4j 运行依赖 |
| **Ollama** | 最新版 | 官方安装脚本 |
| **Neo4j** | 5.13.0 (Community) | 手动安装到 `/opt/neo4j` |

---

## 三、首次部署（从零开始）

### 3.1 安装 Ollama 并下载模型

```bash
# 安装 Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# 启动 Ollama 服务
ollama serve &

# 下载所需模型（需等待下载完成）
ollama pull qwen3.5:4b
ollama pull qwen3-embedding:4b

# 验证模型已安装
ollama list
```

### 3.2 安装 Neo4j 图数据库

```bash
# 下载 Neo4j Community Edition 5.13.0
wget https://dist.neo4j.org/neo4j-community-5.13.0-unix.tar.gz
tar -xzf neo4j-community-5.13.0-unix.tar.gz
sudo mv neo4j-community-5.13.0 /opt/neo4j

# 配置 Neo4j（修改 /opt/neo4j/conf/neo4j.conf）
# 确保以下配置项：
#   dbms.security.auth_enabled=true
#   server.default_listen_address=0.0.0.0
#   server.bolt.enabled=true
#   server.bolt.listen_address=:7687
#   server.http.enabled=true

# 设置 Neo4j 初始密码
/opt/neo4j/bin/neo4j-admin dbms set-initial-password mem0graph

# 启动 Neo4j
/opt/neo4j/bin/neo4j start
```

### 3.3 安装 Python 依赖

```bash
cd /data/workspace/anydev-mem0

# 以开发模式安装 mem0ai 核心库（含所有可选依赖）
pip install -e ".[graph,vector_stores,llms,extras]"

# 安装 server 模块依赖
pip install -r server/requirements.txt

# 安装 openmemory API 依赖
pip install -r openmemory/api/requirements.txt
```

### 3.4 安装前端依赖

```bash
cd /data/workspace/anydev-mem0/openmemory/ui

# 安装 Node.js 依赖
pnpm install

# 构建前端（生产模式需要）
pnpm build
```

### 3.5 配置环境变量

#### ① OpenMemory API 环境变量

文件路径: `openmemory/api/.env`

```env
# Ollama 本地模型配置（非 Docker 模式）
OLLAMA_BASE_URL=http://localhost:11434
# 使用 SQLite 本地数据库（无需 PostgreSQL）
DATABASE_URL=sqlite:///./openmemory.db
# 用户标识
USER=default_user

# Milvus 向量数据库配置（独立服务）
MILVUS_URL=http://localhost:19530
```

#### ② Server 模块环境变量

文件路径: `server/.env`

```env
# OpenAI API Key (如果使用OpenAI作为LLM/Embedder，请填写)
OPENAI_API_KEY=

# Neo4j 图数据库配置 (已启用)
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=mem0graph

# 向量存储使用 Milvus Standalone 独立服务模式，端口: 19530
# collection名称
POSTGRES_COLLECTION_NAME=memories

# Ollama 配置 (本地服务)
OLLAMA_BASE_URL=http://localhost:11434

# 历史记录数据库路径
HISTORY_DB_PATH=./history/history.db
```

#### ③ 前端环境变量

文件路径: `openmemory/ui/.env`

```env
NEXT_PUBLIC_API_URL=http://localhost:8765
NEXT_PUBLIC_USER_ID=default_user
```

---

## 四、启动服务（按顺序）

> ⚠️ **必须按以下顺序启动**，后启动的服务依赖于先启动的服务。

### 步骤 1：启动 Milvus 向量数据库

```bash
cd /data/workspace/anydev-mem0

# 后台启动 Milvus 服务（端口 19530）
nohup python3 start_milvus.py > /tmp/milvus.log 2>&1 &

# 等待几秒后验证
sleep 5
ss -tlnp | grep 19530
# 预期: 看到 19530 端口监听
```

### 步骤 2：启动 Ollama 服务

```bash
# 检查 Ollama 是否已运行
curl -s http://localhost:11434/api/tags | head -20

# 如果未运行，启动 Ollama
ollama serve &

# 验证模型可用
ollama list
# 预期输出:
# NAME                  ID              SIZE      MODIFIED
# qwen3.5:4b            ...             3.4 GB    ...
# qwen3-embedding:4b    ...             2.5 GB    ...
```

### 步骤 3：启动 Neo4j 图数据库

```bash
# 启动 Neo4j
/opt/neo4j/bin/neo4j start

# 验证 Neo4j 已启动（等待几秒钟）
/opt/neo4j/bin/neo4j status

# 或通过端口验证
ss -tlnp | grep 7687
# 预期: 看到 7687 端口监听
```

### 步骤 4：启动 OpenMemory API 后端

```bash
cd /data/workspace/anydev-mem0/openmemory/api

# 启动后端 API 服务（端口 8765）
python -m uvicorn main:app --host 0.0.0.0 --port 8765

# 后台运行方式（推荐）:
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8765 > /tmp/openmemory-api.log 2>&1 &

# 验证启动成功
curl -s http://localhost:8765/docs | head -5
```

### 步骤 5：启动前端 UI

```bash
cd /data/workspace/anydev-mem0/openmemory/ui

# 开发模式启动（支持热更新）
pnpm dev

# 或生产模式启动（需先执行 pnpm build）
pnpm start

# 后台运行方式（推荐）:
nohup pnpm start > /tmp/openmemory-ui.log 2>&1 &
```

---

## 五、访问地址汇总

| 服务 | 地址 | 说明 |
|------|------|------|
| **前端 Dashboard** | `http://<服务器IP>:3000` | OpenMemory 可视化管理界面 |
| **Swagger API 文档** | `http://<服务器IP>:8765/docs` | OpenMemory API 交互式文档 |
| **ReDoc API 文档** | `http://<服务器IP>:8765/redoc` | OpenMemory API 阅读式文档 |
| **Neo4j Browser** | `http://<服务器IP>:7474` | Neo4j 图数据库管理界面 |
| **Ollama API** | `http://localhost:11434` | Ollama 本地 API（仅本机访问） |

> 💡 如果在本机访问，将 `<服务器IP>` 替换为 `localhost`。

---

## 六、一键启动/停止脚本

### 6.1 一键启动（推荐保存为 `start_all.sh`）

```bash
#!/bin/bash
echo "========== OpenMemory 项目启动 =========="

PROJECT_DIR="/data/workspace/anydev-mem0"

# 1. 检查并启动 Milvus
echo "[1/5] 检查 Milvus..."
if ss -tlnp | grep -q ':19530 '; then
    echo "  ✅ Milvus 已运行"
else
    echo "  ⏳ 启动 Milvus..."
    cd "$PROJECT_DIR"
    nohup python3 start_milvus.py > /tmp/milvus.log 2>&1 &
    sleep 5
    echo "  ✅ Milvus 已启动 (端口 19530)"
fi

# 2. 检查并启动 Ollama
echo "[2/5] 检查 Ollama..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "  ✅ Ollama 已运行"
else
    echo "  ⏳ 启动 Ollama..."
    ollama serve > /tmp/ollama.log 2>&1 &
    sleep 3
    echo "  ✅ Ollama 已启动"
fi

# 3. 检查并启动 Neo4j
echo "[3/5] 检查 Neo4j..."
if ss -tlnp | grep -q ':7687 '; then
    echo "  ✅ Neo4j 已运行"
else
    echo "  ⏳ 启动 Neo4j..."
    /opt/neo4j/bin/neo4j start
    sleep 5
    echo "  ✅ Neo4j 已启动"
fi

# 4. 启动 OpenMemory API
echo "[4/5] 启动 OpenMemory API..."
if ss -tlnp | grep -q ':8765 '; then
    echo "  ✅ OpenMemory API 已运行"
else
    cd "$PROJECT_DIR/openmemory/api"
    nohup python -m uvicorn main:app --host 0.0.0.0 --port 8765 > /tmp/openmemory-api.log 2>&1 &
    sleep 3
    echo "  ✅ OpenMemory API 已启动 (端口 8765)"
fi

# 5. 启动前端 UI
echo "[5/5] 启动前端 UI..."
if ss -tlnp | grep -q ':3000 '; then
    echo "  ✅ 前端 UI 已运行"
else
    cd "$PROJECT_DIR/openmemory/ui"
    nohup pnpm start > /tmp/openmemory-ui.log 2>&1 &
    sleep 3
    echo "  ✅ 前端 UI 已启动 (端口 3000)"
fi

echo ""
echo "========== 启动完成 =========="
echo "前端界面:       http://localhost:3000"
echo "API 文档:       http://localhost:8765/docs"
echo "Neo4j Browser:  http://localhost:7474"
echo "================================"
```

### 6.2 一键停止（推荐保存为 `stop_all.sh`）

```bash
#!/bin/bash
echo "========== OpenMemory 项目停止 =========="

# 1. 停止前端 UI
echo "[1/5] 停止前端 UI..."
pkill -f "next-server" 2>/dev/null && echo "  ✅ 已停止" || echo "  ⚠️ 未运行"

# 2. 停止 OpenMemory API
echo "[2/5] 停止 OpenMemory API..."
pkill -f "uvicorn main:app.*8765" 2>/dev/null && echo "  ✅ 已停止" || echo "  ⚠️ 未运行"

# 3. 停止 Neo4j
echo "[3/5] 停止 Neo4j..."
/opt/neo4j/bin/neo4j stop 2>/dev/null && echo "  ✅ 已停止" || echo "  ⚠️ 未运行"

# 4. 停止 Ollama（可选，通常保持运行）
echo "[4/5] 停止 Ollama..."
pkill -f "ollama serve" 2>/dev/null && echo "  ✅ 已停止" || echo "  ⚠️ 未运行"

# 5. 停止 Milvus
echo "[5/5] 停止 Milvus..."
pkill -f "start_milvus.py" 2>/dev/null && pkill -f "milvus" 2>/dev/null && echo "  ✅ 已停止" || echo "  ⚠️ 未运行"

echo ""
echo "========== 停止完成 =========="
```

---

## 七、常见问题排查

### 7.1 端口占用检查

```bash
# 查看所有相关端口状态（含 Milvus 19530）
ss -tlnp | grep -E ':(3000|7474|7687|8765|11434|19530) '
```

### 7.2 日志查看

```bash
# OpenMemory API 日志
tail -f /tmp/openmemory-api.log

# 前端 UI 日志
tail -f /tmp/openmemory-ui.log

# Ollama 日志
tail -f /tmp/ollama.log

# Milvus 日志
tail -f /tmp/milvus.log

# Neo4j 日志
tail -f /opt/neo4j/logs/neo4j.log
```

### 7.3 Ollama 模型不可用

```bash
# 检查 Ollama 服务状态
curl http://localhost:11434/api/tags

# 重新下载模型
ollama pull qwen3.5:4b
ollama pull qwen3-embedding:4b
```

### 7.4 Neo4j 连接失败

```bash
# 检查 Neo4j 状态
/opt/neo4j/bin/neo4j status

# 查看 Neo4j 日志
tail -50 /opt/neo4j/logs/neo4j.log

# 测试 Bolt 连接
cypher-shell -u neo4j -p mem0graph "RETURN 1"
```

### 7.5 前端无法连接 API

```bash
# 确认 API 服务正在运行
curl http://localhost:8765/docs

# 检查前端 .env 配置
cat /data/workspace/anydev-mem0/openmemory/ui/.env
# 确保 NEXT_PUBLIC_API_URL=http://localhost:8765
```

### 7.6 数据库迁移（首次或更新后）

```bash
cd /data/workspace/anydev-mem0/openmemory/api

# 执行数据库迁移
alembic upgrade head
```

---

## 八、项目目录结构

```
anydev-mem0/
├── mem0/                      # Mem0 核心库（Python，已 pip install -e . 安装）
│   ├── memory/                #   记忆管理模块
│   ├── llms/                  #   LLM 适配器（Ollama/OpenAI 等）
│   ├── embeddings/            #   Embedding 适配器
│   ├── vector_stores/         #   向量数据库适配器（Milvus/Qdrant 等）
│   └── graphs/                #   图数据库适配器（Neo4j）
├── openmemory/
│   ├── api/                   # OpenMemory 后端 API
│   │   ├── main.py            #   FastAPI 入口文件
│   │   ├── app/
│   │   │   ├── config.py      #   配置管理
│   │   │   ├── database.py    #   SQLite 数据库连接
│   │   │   ├── models.py      #   ORM 模型
│   │   │   ├── routers/       #   API 路由（memories/apps/config/stats/backup）
│   │   │   └── utils/
│   │   │       └── memory.py  #   Mem0 客户端初始化与配置
│   │   ├── config.json        #   模型配置（qwen3.5:4b + qwen3-embedding:4b）
│   │   ├── .env               #   环境变量
│   │   └── requirements.txt   #   Python 依赖
│   └── ui/                    # OpenMemory 前端 Dashboard
│       ├── package.json       #   前端依赖（Next.js 15 + React 19）
│       ├── .env               #   前端环境变量
│       └── ...
├── server/                    # 独立 Server API（备用，端口 8000）
│   ├── main.py                #   FastAPI 入口
│   ├── .env                   #   环境变量
│   └── requirements.txt       #   Python 依赖
└── pyproject.toml             # 根项目配置（mem0ai 核心库）
```

---

## 九、关键配置文件速查

| 文件 | 作用 |
|------|------|
| `openmemory/api/.env` | API 环境变量（数据库URL、Ollama地址、Milvus地址） |
| `openmemory/api/config.json` | LLM/Embedder 模型配置 |
| `openmemory/api/default_config.json` | 默认模型配置（回退用） |
| `openmemory/api/app/utils/memory.py` | Mem0 客户端核心配置逻辑 |
| `openmemory/ui/.env` | 前端环境变量（API地址、用户ID） |
| `server/.env` | Server 模块环境变量 |
| `start_milvus.py` | Milvus 向量数据库启动脚本 |
| `/opt/neo4j/conf/neo4j.conf` | Neo4j 数据库配置 |

---

## 十、安全提醒

1. **防火墙**: 确保服务器防火墙/安全组放行端口 `3000`、`7474`、`8765`、`19530`（Milvus）
2. **Neo4j 密码**: 默认密码为 `mem0graph`，生产环境请修改
3. **CORS**: OpenMemory API 当前允许所有来源（`allow_origins=["*"]`），生产环境请限制
4. **Ollama**: 默认仅监听 `127.0.0.1:11434`，外网无法直接访问（安全）
