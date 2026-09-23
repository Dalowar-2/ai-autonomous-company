"""
Deliberately simple retriever: bag-of-words overlap scoring (a lightweight
stand-in for a vector search). No embedding API or extra dependency is
required, so this works out of the box with zero extra setup.

Swap this for real embeddings (e.g. Voyage AI, which Anthropic recommends
for use with Claude) + a vector store (pgvector, Chroma, etc.) once you
need semantic search over a large knowledge base. For a few dozen to a
few hundred short documents, keyword overlap is a perfectly reasonable
starting point and has zero moving parts to break.
"""
import re
from collections import Counter

from sqlalchemy.orm import Session

from app.models.knowledge import KnowledgeDocument

_WORD_RE = re.compile(r"[a-zA-Z0-9]+")

_STOPWORDS = {
    "a", "an", "the", "to", "of", "and", "or", "in", "on", "for", "with", "is", "are",
    "be", "must", "all", "that", "this", "it", "as", "by", "at", "from", "will", "should",
    "write", "produce", "create", "make", "please", "using", "use",
}


def _tokenize(text: str) -> Counter:
    return Counter(w.lower() for w in _WORD_RE.findall(text) if w.lower() not in _STOPWORDS and len(w) > 1)


def _cosine_similarity(a: Counter, b: Counter) -> float:
    if not a or not b:
        return 0.0
    shared = set(a) & set(b)
    dot = sum(a[w] * b[w] for w in shared)
    norm_a = sum(v * v for v in a.values()) ** 0.5
    norm_b = sum(v * v for v in b.values()) ** 0.5
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return dot / (norm_a * norm_b)


def retrieve_relevant_documents(db: Session, query: str, top_k: int = 2, min_score: float = 0.05) -> list[KnowledgeDocument]:
    """Returns up to top_k documents whose content most overlaps with the query,
    or an empty list if nothing clears min_score (better to give an agent no
    context than irrelevant/misleading context)."""
    documents = db.query(KnowledgeDocument).all()
    if not documents:
        return []

    query_tokens = _tokenize(query)
    scored = [
        (doc, _cosine_similarity(query_tokens, _tokenize(f"{doc.title} {doc.content}")))
        for doc in documents
    ]
    scored = [(doc, score) for doc, score in scored if score >= min_score]
    scored.sort(key=lambda pair: pair[1], reverse=True)
    return [doc for doc, _ in scored[:top_k]]


def format_context_block(documents: list[KnowledgeDocument]) -> str:
    if not documents:
        return ""
    parts = [f"[{doc.category}] {doc.title}:\n{doc.content}" for doc in documents]
    return "Relevant company knowledge:\n" + "\n\n".join(parts) + "\n\n"
