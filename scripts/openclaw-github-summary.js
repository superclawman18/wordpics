#!/usr/bin/env node
/*
  Fetch and summarize OpenClaw repo changes.
  - Writes reports/openclaw-github-<date>.md
  - Stores state in memory/openclaw-github-state.json
*/

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const STATE_PATH = path.join(ROOT, 'memory', 'openclaw-github-state.json');
const REPORTS_DIR = path.join(ROOT, 'reports');

function readJson(p, fallback) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return fallback; }
}
function writeJson(p, obj) {
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function isoNow() { return new Date().toISOString(); }
function ymdUTC(d = new Date()) {
  const x = new Date(d);
  const yyyy = x.getUTCFullYear();
  const mm = String(x.getUTCMonth()+1).padStart(2,'0');
  const dd = String(x.getUTCDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}

const state = readJson(STATE_PATH, { lastRunIso: null });

// Default: last 24h if first run.
const sinceIso = state.lastRunIso ?? new Date(Date.now() - 24*60*60*1000).toISOString();

const owner = 'openclaw';
const repo = 'openclaw';
const commitsUrl = `https://api.github.com/repos/${owner}/${repo}/commits?since=${encodeURIComponent(sinceIso)}&per_page=30`;

async function ghJson(url) {
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'openclaw-assistant-bot'
    }
  });
  if (!res.ok) throw new Error(`GitHub API ${res.status} for ${url}`);
  return res.json();
}

function pickMostImportant(commits) {
  // Heuristic: prefer commits with conventional prefixes / keywords.
  const score = (msg='') => {
    const m = msg.toLowerCase();
    let s = 0;
    if (m.includes('fix')) s += 4;
    if (m.includes('security') || m.includes('vuln') || m.includes('cve')) s += 8;
    if (m.includes('breaking')) s += 7;
    if (m.startsWith('feat')) s += 5;
    if (m.startsWith('perf')) s += 3;
    if (m.startsWith('refactor')) s += 2;
    if (m.includes('cron') || m.includes('gateway') || m.includes('message')) s += 2;
    return s;
  };
  return [...commits].sort((a,b)=> score(b?.commit?.message) - score(a?.commit?.message));
}

function shortSha(sha='') { return sha.slice(0,7); }

(async () => {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
  const nowIso = isoNow();

  let commits = [];
  let error = null;
  try {
    commits = await ghJson(commitsUrl);
  } catch (e) {
    error = String(e?.message ?? e);
  }

  const reportPath = path.join(REPORTS_DIR, `openclaw-github-${ymdUTC()}.md`);

  const lines = [];
  lines.push(`# OpenClaw GitHub Summary — ${ymdUTC()} (UTC)`);
  lines.push('');
  lines.push(`Window: since ${sinceIso}`);
  lines.push(`Generated: ${nowIso}`);
  lines.push('');

  if (error) {
    lines.push('## Status');
    lines.push(`- ERROR fetching commits: ${error}`);
  } else {
    lines.push('## Checklist');
    lines.push('- [x] Fetched recent commits from https://github.com/openclaw/openclaw');
    lines.push('');

    if (!Array.isArray(commits) || commits.length === 0) {
      lines.push('## Highlights');
      lines.push('- No commits found in this window.');
    } else {
      const sorted = pickMostImportant(commits);
      const top = sorted.slice(0, 8);

      lines.push('## Most important changes (heuristic)');
      for (const c of top) {
        const msg = (c?.commit?.message ?? '').split('\n')[0];
        const sha = shortSha(c?.sha ?? '');
        const url = c?.html_url ?? '';
        const author = c?.commit?.author?.name ?? (c?.author?.login ?? 'unknown');
        const date = c?.commit?.author?.date ?? '';
        lines.push(`- ${sha} — ${msg} (${author}, ${date})`);
        if (url) lines.push(`  - ${url}`);
      }

      lines.push('');
      lines.push('## All recent commits (up to 30)');
      for (const c of commits) {
        const msg = (c?.commit?.message ?? '').split('\n')[0];
        const sha = shortSha(c?.sha ?? '');
        const url = c?.html_url ?? '';
        lines.push(`- ${sha} — ${msg}${url ? ` — ${url}` : ''}`);
      }
    }
  }

  fs.writeFileSync(reportPath, lines.join('\n') + '\n', 'utf8');
  writeJson(STATE_PATH, { lastRunIso: nowIso, lastReport: path.relative(ROOT, reportPath) });

  process.stdout.write(reportPath + '\n');
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
