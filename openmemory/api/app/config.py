import os

# 优先使用 MEM0_USER_ID，避免与系统 USER 环境变量冲突
USER_ID = os.getenv("MEM0_USER_ID", "default_user")
DEFAULT_APP_ID = "openmemory"
