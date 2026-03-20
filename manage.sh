#!/bin/bash
# ============================================================
#  OpenMemory 统一服务管理脚本
#  用法:
#    ./manage.sh start   - 启动所有服务
#    ./manage.sh stop    - 关闭所有服务
#    ./manage.sh restart - 重启所有服务
#    ./manage.sh status  - 查看所有服务状态
#
#    ./manage.sh start   <服务名>  - 启动指定服务
#    ./manage.sh stop    <服务名>  - 关闭指定服务
#    ./manage.sh restart <服务名>  - 重启指定服务
#
#  可用服务名: ollama, neo4j, milvus, api, ui
# ============================================================

set -euo pipefail

# ======================== 配置区 ========================
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
API_DIR="${PROJECT_DIR}/openmemory/api"
UI_DIR="${PROJECT_DIR}/openmemory/ui"

# 日志目录
LOG_DIR="${PROJECT_DIR}/logs"
mkdir -p "$LOG_DIR"

# PID 文件目录
PID_DIR="${PROJECT_DIR}/pids"
mkdir -p "$PID_DIR"

# 服务端口
OLLAMA_PORT=11434
NEO4J_HTTP_PORT=7474
NEO4J_BOLT_PORT=7687
MILVUS_PORT=19530
API_PORT=8765
UI_PORT=3000

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ======================== 工具函数 ========================

log_info()  { echo -e "${GREEN}[INFO]${NC}  $*"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC}  $*"; }
log_error() { echo -e "${RED}[ERROR]${NC} $*"; }

# 检查端口是否被占用，返回占用该端口的 PID
get_pid_by_port() {
    local port=$1
    local pid
    # 优先用 ss 解析 PID
    pid=$(ss -tlnp 2>/dev/null | grep ":${port} " | grep -oP 'pid=\K[0-9]+' | head -1)
    # 后备: 用 fuser
    if [ -z "$pid" ]; then
        pid=$(fuser "${port}/tcp" 2>/dev/null | awk '{print $1}')
    fi
    # 最后备: 用 lsof
    if [ -z "$pid" ]; then
        pid=$(lsof -ti:"$port" 2>/dev/null | head -1)
    fi
    echo "$pid"
}

# 检查进程是否存活
is_pid_alive() {
    local pid=$1
    [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null
}

# 等待端口就绪
wait_for_port() {
    local port=$1
    local timeout=${2:-30}
    local service_name=${3:-"service"}
    for i in $(seq 1 "$timeout"); do
        if ss -tlnp 2>/dev/null | grep -q ":${port} "; then
            return 0
        fi
        sleep 1
    done
    log_warn "${service_name} 在 ${timeout}s 内未就绪 (端口 ${port})"
    return 1
}

# 等待端口释放
wait_for_port_free() {
    local port=$1
    local timeout=${2:-15}
    for i in $(seq 1 "$timeout"); do
        if ! ss -tlnp 2>/dev/null | grep -q ":${port} "; then
            return 0
        fi
        sleep 1
    done
    return 1
}

# 保存 PID
save_pid() {
    local name=$1
    local pid=$2
    echo "$pid" > "${PID_DIR}/${name}.pid"
}

# 读取 PID
read_pid() {
    local name=$1
    local pid_file="${PID_DIR}/${name}.pid"
    if [ -f "$pid_file" ]; then
        cat "$pid_file"
    fi
}

# 停止进程（先 SIGTERM，超时后 SIGKILL）
stop_process() {
    local pid=$1
    local name=$2
    local timeout=${3:-10}

    if ! is_pid_alive "$pid"; then
        return 0
    fi

    kill "$pid" 2>/dev/null
    for i in $(seq 1 "$timeout"); do
        if ! is_pid_alive "$pid"; then
            return 0
        fi
        sleep 1
    done

    # 超时，强制杀掉
    log_warn "${name} (PID: ${pid}) 未能优雅退出，强制终止..."
    kill -9 "$pid" 2>/dev/null
    sleep 1
    if is_pid_alive "$pid"; then
        log_error "无法终止 ${name} (PID: ${pid})"
        return 1
    fi
    return 0
}

# ======================== Ollama ========================

start_ollama() {
    local pid
    pid=$(get_pid_by_port "$OLLAMA_PORT")
    if [ -n "$pid" ]; then
        log_info "Ollama 已在运行 (PID: ${pid}, 端口: ${OLLAMA_PORT})"
        save_pid "ollama" "$pid"
        return 0
    fi

    log_info "正在启动 Ollama..."
    OLLAMA_HOST="0.0.0.0:${OLLAMA_PORT}" nohup ollama serve \
        > "${LOG_DIR}/ollama.log" 2>&1 &
    local new_pid=$!
    save_pid "ollama" "$new_pid"

    if wait_for_port "$OLLAMA_PORT" 15 "Ollama"; then
        log_info "✅ Ollama 启动成功 (PID: ${new_pid}, 端口: ${OLLAMA_PORT})"
    else
        log_error "❌ Ollama 启动失败，请检查日志: ${LOG_DIR}/ollama.log"
        return 1
    fi
}

stop_ollama() {
    local pid
    pid=$(get_pid_by_port "$OLLAMA_PORT")
    if [ -z "$pid" ]; then
        pid=$(read_pid "ollama")
    fi

    if [ -z "$pid" ] || ! is_pid_alive "$pid"; then
        log_info "Ollama 未在运行"
        rm -f "${PID_DIR}/ollama.pid"
        return 0
    fi

    log_info "正在停止 Ollama (PID: ${pid})..."
    if stop_process "$pid" "Ollama"; then
        log_info "✅ Ollama 已停止"
        rm -f "${PID_DIR}/ollama.pid"
    fi
}

# ======================== Neo4j ========================

start_neo4j() {
    local pid
    pid=$(get_pid_by_port "$NEO4J_HTTP_PORT")
    if [ -n "$pid" ]; then
        log_info "Neo4j 已在运行 (PID: ${pid}, 端口: ${NEO4J_HTTP_PORT}/${NEO4J_BOLT_PORT})"
        save_pid "neo4j" "$pid"
        return 0
    fi

    log_info "正在启动 Neo4j..."
    nohup /opt/neo4j/bin/neo4j console \
        > "${LOG_DIR}/neo4j.log" 2>&1 &
    local new_pid=$!
    save_pid "neo4j" "$new_pid"

    if wait_for_port "$NEO4J_HTTP_PORT" 30 "Neo4j"; then
        # 获取实际的 Java 进程 PID
        local java_pid
        java_pid=$(get_pid_by_port "$NEO4J_HTTP_PORT")
        [ -n "$java_pid" ] && save_pid "neo4j" "$java_pid"
        log_info "✅ Neo4j 启动成功 (端口: ${NEO4J_HTTP_PORT}/${NEO4J_BOLT_PORT})"
    else
        log_error "❌ Neo4j 启动失败，请检查日志: ${LOG_DIR}/neo4j.log"
        return 1
    fi
}

stop_neo4j() {
    local pid
    pid=$(get_pid_by_port "$NEO4J_HTTP_PORT")
    if [ -z "$pid" ]; then
        pid=$(read_pid "neo4j")
    fi

    if [ -z "$pid" ] || ! is_pid_alive "$pid"; then
        log_info "Neo4j 未在运行"
        rm -f "${PID_DIR}/neo4j.pid"
        return 0
    fi

    log_info "正在停止 Neo4j (PID: ${pid})..."
    # Neo4j 也可以通过 neo4j stop 命令关闭
    /opt/neo4j/bin/neo4j stop 2>/dev/null || true
    sleep 2

    # 如果还在运行，强制 kill
    pid=$(get_pid_by_port "$NEO4J_HTTP_PORT")
    if [ -n "$pid" ] && is_pid_alive "$pid"; then
        stop_process "$pid" "Neo4j" 15
    fi

    if wait_for_port_free "$NEO4J_HTTP_PORT" 10; then
        log_info "✅ Neo4j 已停止"
    else
        log_warn "Neo4j 可能未完全停止"
    fi
    rm -f "${PID_DIR}/neo4j.pid"
}

# ======================== Milvus ========================

start_milvus() {
    local pid
    pid=$(get_pid_by_port "$MILVUS_PORT")
    if [ -n "$pid" ]; then
        log_info "Milvus 已在运行 (PID: ${pid}, 端口: ${MILVUS_PORT})"
        save_pid "milvus" "$pid"
        return 0
    fi

    log_info "正在启动 Milvus..."
    nohup python3 "${PROJECT_DIR}/start_milvus.py" \
        > "${LOG_DIR}/milvus.log" 2>&1 &
    local new_pid=$!
    save_pid "milvus" "$new_pid"

    if wait_for_port "$MILVUS_PORT" 30 "Milvus"; then
        log_info "✅ Milvus 启动成功 (PID: ${new_pid}, 端口: ${MILVUS_PORT})"
    else
        log_error "❌ Milvus 启动失败，请检查日志: ${LOG_DIR}/milvus.log"
        return 1
    fi
}

stop_milvus() {
    # 先找 Python 启动脚本的进程
    local python_pid
    python_pid=$(pgrep -f "start_milvus.py" 2>/dev/null | head -1)

    # 再找端口对应的进程
    local port_pid
    port_pid=$(get_pid_by_port "$MILVUS_PORT")

    if [ -z "$python_pid" ] && [ -z "$port_pid" ]; then
        log_info "Milvus 未在运行"
        rm -f "${PID_DIR}/milvus.pid"
        return 0
    fi

    log_info "正在停止 Milvus..."

    # 先停 Python 启动脚本（它会通过信号处理器优雅停止 Milvus）
    if [ -n "$python_pid" ] && is_pid_alive "$python_pid"; then
        stop_process "$python_pid" "Milvus (Python)" 10
    fi

    # 再停端口占用的进程（milvus 原生进程）
    if [ -n "$port_pid" ] && is_pid_alive "$port_pid"; then
        stop_process "$port_pid" "Milvus (Native)" 10
    fi

    if wait_for_port_free "$MILVUS_PORT" 10; then
        log_info "✅ Milvus 已停止"
    else
        log_warn "Milvus 可能未完全停止"
    fi
    rm -f "${PID_DIR}/milvus.pid"
}

# ======================== API 后端 ========================

start_api() {
    local pid
    pid=$(get_pid_by_port "$API_PORT")
    if [ -n "$pid" ]; then
        log_info "API 后端已在运行 (PID: ${pid}, 端口: ${API_PORT})"
        save_pid "api" "$pid"
        return 0
    fi

    log_info "正在启动 API 后端..."
    cd "$API_DIR"
    nohup python3 -m uvicorn main:app --host 0.0.0.0 --port "$API_PORT" \
        > "${LOG_DIR}/api.log" 2>&1 &
    local new_pid=$!
    save_pid "api" "$new_pid"
    cd "$PROJECT_DIR"

    if wait_for_port "$API_PORT" 30 "API后端"; then
        log_info "✅ API 后端启动成功 (PID: ${new_pid}, 端口: ${API_PORT})"
    else
        log_error "❌ API 后端启动失败，请检查日志: ${LOG_DIR}/api.log"
        return 1
    fi
}

stop_api() {
    local pid
    pid=$(get_pid_by_port "$API_PORT")
    if [ -z "$pid" ]; then
        pid=$(read_pid "api")
    fi

    if [ -z "$pid" ] || ! is_pid_alive "$pid"; then
        log_info "API 后端未在运行"
        rm -f "${PID_DIR}/api.pid"
        return 0
    fi

    log_info "正在停止 API 后端 (PID: ${pid})..."
    if stop_process "$pid" "API后端"; then
        log_info "✅ API 后端已停止"
        rm -f "${PID_DIR}/api.pid"
    fi
}

# ======================== 前端 UI ========================

start_ui() {
    local pid
    pid=$(get_pid_by_port "$UI_PORT")
    if [ -n "$pid" ]; then
        log_info "前端 UI 已在运行 (PID: ${pid}, 端口: ${UI_PORT})"
        save_pid "ui" "$pid"
        return 0
    fi

    log_info "正在启动前端 UI..."
    cd "$UI_DIR"
    nohup npm exec next start -- -p "$UI_PORT" -H 0.0.0.0 \
        > "${LOG_DIR}/ui.log" 2>&1 &
    local new_pid=$!
    save_pid "ui" "$new_pid"
    cd "$PROJECT_DIR"

    if wait_for_port "$UI_PORT" 30 "前端UI"; then
        log_info "✅ 前端 UI 启动成功 (PID: ${new_pid}, 端口: ${UI_PORT})"
    else
        log_error "❌ 前端 UI 启动失败，请检查日志: ${LOG_DIR}/ui.log"
        return 1
    fi
}

stop_ui() {
    # 找端口占用进程
    local pid
    pid=$(get_pid_by_port "$UI_PORT")

    # 也查找 next 相关进程
    local next_pids
    next_pids=$(pgrep -f "next start.*${UI_PORT}" 2>/dev/null || true)
    local next_server_pids
    next_server_pids=$(pgrep -f "next-server" 2>/dev/null || true)

    if [ -z "$pid" ] && [ -z "$next_pids" ] && [ -z "$next_server_pids" ]; then
        log_info "前端 UI 未在运行"
        rm -f "${PID_DIR}/ui.pid"
        return 0
    fi

    log_info "正在停止前端 UI..."

    # 停止端口占用进程
    if [ -n "$pid" ] && is_pid_alive "$pid"; then
        stop_process "$pid" "前端UI" 10
    fi

    # 停止 next 相关进程
    for p in $next_pids $next_server_pids; do
        if is_pid_alive "$p"; then
            stop_process "$p" "Next.js" 5
        fi
    done

    if wait_for_port_free "$UI_PORT" 10; then
        log_info "✅ 前端 UI 已停止"
    else
        log_warn "前端 UI 可能未完全停止"
    fi
    rm -f "${PID_DIR}/ui.pid"
}

# ======================== 状态查看 ========================

show_status() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}        OpenMemory 服务状态${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo ""

    local services=("ollama:${OLLAMA_PORT}:Ollama" "neo4j:${NEO4J_HTTP_PORT}:Neo4j" "milvus:${MILVUS_PORT}:Milvus" "api:${API_PORT}:API后端" "ui:${UI_PORT}:前端UI")

    for service in "${services[@]}"; do
        IFS=':' read -r name port label <<< "$service"
        local pid
        pid=$(get_pid_by_port "$port")
        if [ -n "$pid" ] && is_pid_alive "$pid"; then
            echo -e "  ${GREEN}✅ ${label}${NC}\t端口: ${port}\tPID: ${pid}\t${GREEN}运行中${NC}"
        else
            echo -e "  ${RED}❌ ${label}${NC}\t端口: ${port}\t\t\t${RED}未运行${NC}"
        fi
    done

    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo -e "  日志目录: ${LOG_DIR}"
    echo -e "  PID 目录: ${PID_DIR}"
    echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
    echo ""
}

# ======================== 批量操作 ========================

# 启动顺序: Ollama -> Neo4j -> Milvus -> API -> UI
start_all() {
    echo ""
    echo -e "${BLUE}🚀 启动所有 OpenMemory 服务...${NC}"
    echo ""

    start_ollama
    start_neo4j
    start_milvus
    start_api
    start_ui

    echo ""
    show_status
}

# 关闭顺序: UI -> API -> Milvus -> Neo4j -> Ollama (反序)
stop_all() {
    echo ""
    echo -e "${BLUE}🛑 停止所有 OpenMemory 服务...${NC}"
    echo ""

    stop_ui
    stop_api
    stop_milvus
    stop_neo4j
    stop_ollama

    echo ""
    show_status
}

restart_all() {
    stop_all
    echo ""
    echo -e "${YELLOW}⏳ 等待 3 秒后重启...${NC}"
    sleep 3
    start_all
}

# ======================== 单服务操作 ========================

start_single() {
    local service=$1
    case "$service" in
        ollama)  start_ollama ;;
        neo4j)   start_neo4j ;;
        milvus)  start_milvus ;;
        api)     start_api ;;
        ui)      start_ui ;;
        *)
            log_error "未知服务: $service"
            echo "可用服务: ollama, neo4j, milvus, api, ui"
            exit 1
            ;;
    esac
}

stop_single() {
    local service=$1
    case "$service" in
        ollama)  stop_ollama ;;
        neo4j)   stop_neo4j ;;
        milvus)  stop_milvus ;;
        api)     stop_api ;;
        ui)      stop_ui ;;
        *)
            log_error "未知服务: $service"
            echo "可用服务: ollama, neo4j, milvus, api, ui"
            exit 1
            ;;
    esac
}

restart_single() {
    local service=$1
    stop_single "$service"
    sleep 2
    start_single "$service"
}

# ======================== 主入口 ========================

usage() {
    echo ""
    echo "用法: $0 {start|stop|restart|status} [服务名]"
    echo ""
    echo "命令:"
    echo "  start   [服务名]  启动服务（不指定服务名则启动全部）"
    echo "  stop    [服务名]  停止服务（不指定服务名则停止全部）"
    echo "  restart [服务名]  重启服务（不指定服务名则重启全部）"
    echo "  status            查看所有服务状态"
    echo ""
    echo "可用服务名:"
    echo "  ollama   - Ollama LLM 服务 (端口 ${OLLAMA_PORT})"
    echo "  neo4j    - Neo4j 图数据库   (端口 ${NEO4J_HTTP_PORT}/${NEO4J_BOLT_PORT})"
    echo "  milvus   - Milvus 向量数据库 (端口 ${MILVUS_PORT})"
    echo "  api      - API 后端服务     (端口 ${API_PORT})"
    echo "  ui       - 前端 UI 界面     (端口 ${UI_PORT})"
    echo ""
    echo "示例:"
    echo "  $0 start          # 启动所有服务"
    echo "  $0 stop           # 停止所有服务"
    echo "  $0 restart api    # 仅重启 API 后端"
    echo "  $0 status         # 查看状态"
    echo ""
}

main() {
    local action="${1:-}"
    local service="${2:-}"

    case "$action" in
        start)
            if [ -n "$service" ]; then
                start_single "$service"
            else
                start_all
            fi
            ;;
        stop)
            if [ -n "$service" ]; then
                stop_single "$service"
            else
                stop_all
            fi
            ;;
        restart)
            if [ -n "$service" ]; then
                restart_single "$service"
            else
                restart_all
            fi
            ;;
        status)
            show_status
            ;;
        *)
            usage
            exit 1
            ;;
    esac
}

main "$@"
