#!/usr/bin/env python3
"""
Milvus 向量数据库独立服务启动脚本

使用 milvus-lite 的 Server 模式启动一个独立的 Milvus gRPC 服务，
监听在指定端口（默认 19530），供 OpenMemory API 远程连接。

用法:
    python3 start_milvus.py                    # 前台启动
    nohup python3 start_milvus.py > /tmp/milvus.log 2>&1 &  # 后台启动

环境变量:
    MILVUS_DATA_DIR  - 数据目录（默认: ./milvus_data）
    MILVUS_PORT      - 监听端口（默认: 19530）
    MILVUS_HOST      - 监听地址（默认: 0.0.0.0）
"""

import os
import signal
import sys
import time

# 数据目录和端口配置
DATA_DIR = os.environ.get('MILVUS_DATA_DIR', os.path.join(os.path.dirname(os.path.abspath(__file__)), 'milvus_data'))
HOST = os.environ.get('MILVUS_HOST', '0.0.0.0')
PORT = int(os.environ.get('MILVUS_PORT', '19530'))
DB_FILE = os.path.join(DATA_DIR, 'milvus.db')

# 确保数据目录存在
os.makedirs(DATA_DIR, exist_ok=True)

# 全局变量
server = None


def signal_handler(signum, frame):
    """优雅停止服务"""
    global server
    print(f"\n收到信号 {signum}，正在停止 Milvus 服务...")
    if server:
        try:
            server.stop()
            print("Milvus 服务已停止")
        except Exception as e:
            print(f"停止服务时出错: {e}")
    sys.exit(0)


def main():
    global server

    # 注册信号处理器
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print("=" * 50)
    print("  Milvus 向量数据库服务")
    print("=" * 50)
    print(f"  数据目录: {DATA_DIR}")
    print(f"  数据文件: {DB_FILE}")
    print(f"  监听地址: {HOST}:{PORT}")
    print("=" * 50)
    print()

    try:
        from milvus_lite.server import Server

        address = f"{HOST}:{PORT}"
        server = Server(db_file=DB_FILE, address=address)
        server.start()

        print(f"✅ Milvus 服务已启动，监听: {address}")
        print(f"   连接 URL: http://localhost:{PORT}")
        print()
        print("按 Ctrl+C 停止服务...")
        print()

        # 保持进程运行
        while True:
            time.sleep(1)

    except ImportError:
        print("❌ 错误: 未安装 milvus-lite")
        print("   请执行: pip install milvus-lite")
        sys.exit(1)
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
