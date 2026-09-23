
"""
Local Ollama LLM service.

Uses Ollama locally so the application can run
without an Anthropic API key.
"""

import httpx


OLLAMA_URL = "http://127.0.0.1:11434/api/generate"
OLLAMA_MODEL = "qwen2.5:3b"


def call_llm(
    system_prompt: str,
    user_message: str,
    max_tokens: int = 256,
) -> str:
    """
    Send a prompt to the local Ollama model
    and return its response.
    """

    prompt = f"""System instructions:
{system_prompt}

User request:
{user_message}
"""

    payload = {
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "keep_alive": "5m",
        "options": {
            "num_predict": max_tokens,
            "temperature": 0.2,
        },
    }

    try:
        response = httpx.post(
            OLLAMA_URL,
            json=payload,
            timeout=180.0,
        )

        response.raise_for_status()

        data = response.json()

        result = data.get("response", "").strip()

        if not result:
            raise RuntimeError(
                "Ollama returned an empty response."
            )

        return result

    except httpx.TimeoutException:
        raise RuntimeError(
            "Ollama request timed out after 180 seconds."
        )

    except httpx.HTTPError as exc:
        raise RuntimeError(
            f"Ollama API error: {exc}"
        )

    except Exception as exc:
        raise RuntimeError(
            f"LLM execution failed: {exc}"
        )

