import json
import logging
import os
import re
from typing import List

from app.utils.prompts import MEMORY_CATEGORIZATION_PROMPT
from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel
from tenacity import retry, stop_after_attempt, wait_exponential

load_dotenv()

# 使用 Ollama 的 OpenAI 兼容接口替代 OpenAI
ollama_base_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
ollama_client = OpenAI(
    base_url=f"{ollama_base_url}/v1",
    api_key="ollama",  # Ollama 不需要真实的 API Key，但 OpenAI 客户端要求非空
)

# 从环境变量获取模型名称，默认使用 qwen3:0.6b
CATEGORIZATION_MODEL = os.getenv("CATEGORIZATION_MODEL", "qwen3:0.6b")


class MemoryCategories(BaseModel):
    categories: List[str]


@retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=15))
def get_categories_for_memory(memory: str) -> List[str]:
    try:
        # 在 system prompt 中追加 JSON 格式要求
        system_prompt = MEMORY_CATEGORIZATION_PROMPT + "\n\nYou must respond with valid JSON only, like: {\"categories\": [\"category1\", \"category2\"]}"
        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": memory}
        ]

        # 使用 Ollama 的 OpenAI 兼容接口（不支持 beta.chat.completions.parse）
        completion = ollama_client.chat.completions.create(
            model=CATEGORIZATION_MODEL,
            messages=messages,
            temperature=0,
            response_format={"type": "json_object"},
        )

        raw_content = completion.choices[0].message.content
        parsed = MemoryCategories(**json.loads(raw_content))
        # 过滤无效分类：去除空字符串、纯符号（如 ——、--、…）等
        valid_categories = []
        for cat in parsed.categories:
            # 先按逗号、&、and 等分隔符拆分复合分类（如 "ai, ml & technology" → ["ai", "ml", "technology"]）
            sub_cats = re.split(r'\s*[,，]\s*|\s*&\s*|\s+and\s+', cat)
            for sub in sub_cats:
                cleaned = sub.strip().lower()
                # 跳过空字符串或仅由非字母数字字符组成的值（如 ——、--、...、null、none）
                if not cleaned:
                    continue
                if cleaned in ('null', 'none', 'n/a', 'unknown', 'undefined', '无', '未知'):
                    continue
                if re.match(r'^[^\w]+$', cleaned):
                    continue
                valid_categories.append(cleaned)
        # 去重但保持顺序
        seen = set()
        unique_categories = []
        for cat in valid_categories:
            if cat not in seen:
                seen.add(cat)
                unique_categories.append(cat)
        return unique_categories

    except Exception as e:
        logging.error(f"[ERROR] Failed to get categories: {e}")
        try:
            logging.debug(f"[DEBUG] Raw response: {completion.choices[0].message.content}")
        except Exception as debug_e:
            logging.debug(f"[DEBUG] Could not extract raw response: {debug_e}")
        # 分类失败时返回空列表，而不是抛出异常触发重试
        return []
