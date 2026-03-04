#!/usr/bin/env python3
"""Generate an AI-focused morning brief by scraping configured feeds and resources."""

from __future__ import annotations

import argparse
import datetime
import html
import json
import re
import textwrap
from pathlib import Path

import feedparser
import requests

CONFIG_PATH = Path(__file__).resolve().parent.parent / "config" / "ai_brief_sources.json"
DEFAULT_OUTPUT_DIR = Path(__file__).resolve().parent.parent / "briefs"
LOG = Path(__file__).resolve().parent.parent / "logs" / "ai_brief.log"
USER_AGENT = "LobsterBoard/AI-Morning-Brief (+https://github.com/Curbob/LobsterBoard)"


def load_config() -> dict:
    defaults = {
        "summary_count": 6,
        "max_age_days": 3,
        "impact_keywords": [
            "openai",
            "anthropic",
            "google",
            "microsoft",
            "meta",
            "invest",
            "fund",
            "acquire",
            "policy",
            "safety",
            "regulation",
            "release",
            "launch",
            "deploy",
            "llm",
            "model",
            "foundation model",
            "ai",
            "multimodal",
            "robot",
            "automation",
            "ethic",
        ],
        "sources": [],
        "output_dir": str(DEFAULT_OUTPUT_DIR),
        "summary_label": "AI Morning Brief",
        "summary_header": "Latest curated AI headlines and resources",
    }

    if CONFIG_PATH.exists():
        try:
            raw = json.loads(CONFIG_PATH.read_text())
            defaults.update(raw)
        except json.JSONDecodeError as exc:  # pragma: no cover - defensive
            raise SystemExit(f"Unable to read {CONFIG_PATH}: {exc}")
    return defaults


def clean_text(raw: str) -> str:
    if not raw:
        return ""
    text = html.unescape(raw)
    text = re.sub(r"<[^>]+>", "", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def summarize_text(text: str, max_sentences: int = 2) -> str:
    cleaned = clean_text(text)
    if not cleaned:
        return ""
    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    trimmed = " ".join(sentences[:max_sentences])
    summary = trimmed.strip()
    if not summary:
        summary = cleaned[:200].strip()
    return summary


def fetch_feed(source: dict) -> list[dict]:
    url = source.get("url")
    if not url:
        return []
    headers = {"User-Agent": USER_AGENT}
    try:
        response = requests.get(url, timeout=20, headers=headers)
        response.raise_for_status()
    except requests.RequestException as exc:
        print(f"Failed to reach {source.get('name')} ({url}): {exc}")
        return []

    parsed = feedparser.parse(response.content)
    entries: list[dict] = []
    for entry in parsed.entries[:40]:
        title = entry.get("title") or entry.get("id") or "untitled"
        link = entry.get("link") or entry.get("id")
        if not link:
            continue
        summary = entry.get("summary") or entry.get("description") or ""
        published_tuple = entry.get("published_parsed") or entry.get("updated_parsed")
        published = None
        if published_tuple:
            published = datetime.datetime(
                *published_tuple[:6], tzinfo=datetime.timezone.utc
            )
        else:
            published = datetime.datetime.now(datetime.timezone.utc)
        cleaned_summary = summarize_text(summary or title)
        entries.append(
            {
                "title": clean_text(title),
                "link": link,
                "summary": cleaned_summary,
                "full_text": cleaned_summary or clean_text(summary),
                "source": source.get("name", "unknown"),
                "type": source.get("type", "news"),
                "published": published,
            }
        )
    return entries


def score_entries(entries: list[dict], config: dict) -> list[dict]:
    now = datetime.datetime.now(datetime.timezone.utc)
    max_age = int(config.get("max_age_days", 3))
    keywords = [k.lower() for k in config.get("impact_keywords", []) if k]

    scored = []
    seen_links: set[str] = set()
    for entry in entries:
        normalized_link = entry["link"].split("#")[0]
        if normalized_link in seen_links:
            continue
        seen_links.add(normalized_link)

        age_days = (now - entry["published"]).total_seconds() / 86400
        if max_age and age_days > max_age:
            continue

        freshness = max(0.0, 1.0 - min(age_days / max_age, 1.0)) if max_age else 1.0
        target_text = f"{entry['title']} {entry['full_text']}".lower()
        impact_hits = sum(1 for keyword in keywords if keyword in target_text)
        impact = min(impact_hits / max(len(keywords), 1), 1.0)
        score = freshness * 0.7 + impact * 0.3
        entry["score"] = score
        entry["impact_hits"] = impact_hits
        entry["age_days"] = round(age_days, 1)
        scored.append(entry)
    return sorted(scored, key=lambda obj: (obj["score"], obj["published"]), reverse=True)


def render_brief(top_entries: list[dict], config: dict, final_path: Path) -> None:
    header = [
        f"# {config.get('summary_label', 'AI Morning Brief')} — {datetime.datetime.now(datetime.timezone.utc).date()}",
        f"Generated: {datetime.datetime.now(datetime.timezone.utc).isoformat()} UTC",
        "",
        config.get("summary_header", "Curated AI news and resources."),
        "",
        f"Sources polled: {', '.join(sorted({entry['source'] for entry in top_entries})) or 'none'}",
        "",
    ]

    body = []
    for idx, entry in enumerate(top_entries, start=1):
        summary = entry.get("summary") or entry.get("full_text") or entry.get("title")
        summary = summary.replace("\n", " ").strip()
        if not summary:
            summary = entry["title"]
        summary = textwrap.shorten(summary, width=320, placeholder="...")
        when = entry["published"].strftime("%Y-%m-%d %H:%M UTC")
        body.append(
            f"{idx}. [{entry['title']}]({entry['link']}) — {summary} ({entry['source']} · {when})"
        )
    if not body:
        body = ["No stories matched the configured sources right now."]

    final_path.write_text("\n".join(header + body) + "\n")
    print(f"Wrote {len(body)} line(s) to {final_path}")


def ensure_directories(config: dict) -> Path:
    output_dir = Path(config.get("output_dir", DEFAULT_OUTPUT_DIR))
    output_dir.mkdir(parents=True, exist_ok=True)
    LOG.parent.mkdir(parents=True, exist_ok=True)
    return output_dir


def main() -> None:
    parser = argparse.ArgumentParser(description="Build a daily AI morning brief.")
    parser.add_argument(
        "--items",
        type=int,
        help="Override the number of summary items to keep",
    )
    args = parser.parse_args()

    config = load_config()
    if args.items:
        config["summary_count"] = args.items

    output_dir = ensure_directories(config)
    all_entries: list[dict] = []
    now = datetime.datetime.now(datetime.timezone.utc)

    for source in config.get("sources", []):
        entries = fetch_feed(source)
        all_entries.extend(entries)

    scored = score_entries(all_entries, config)
    top = scored[: config.get("summary_count", 6)]

    final_path = output_dir / f"ai_morning_brief_{now.strftime('%Y-%m-%d')}.md"
    render_brief(top, config, final_path)


if __name__ == "__main__":
    main()
