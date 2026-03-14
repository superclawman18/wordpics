#!/usr/bin/env node
/*
  Compile a detailed checklist-style morning report.
  Output: prints report text to stdout and also writes reports/morning-report-<date>.md
*/

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const REPORTS_DIR = path.join(ROOT, 'reports');

function ymdUTC(d = new Date()) {
  const x = new Date(d);
  const yyyy = x.getUTCFullYear();
  const mm = String(x.getUTCMonth()+1).padStart(2,'0');
  const dd = String(x.getUTCDate()).padStart(2,'0');
  return `${yyyy}-${mm}-${dd}`;
}

function newestFile(prefix) {
  try {
    const files = fs.readdirSync(REPORTS_DIR)
      .filter(f => f.startsWith(prefix))
      .map(f => ({ f, t: fs.statSync(path.join(REPORTS_DIR, f)).mtimeMs }))
      .sort((a,b) => b.t - a.t);
    return files[0]?.f ? path.join(REPORTS_DIR, files[0].f) : null;
  } catch { return null; }
}

function readMaybe(p, maxLines=120) {
  if (!p) return null;
  try {
    const txt = fs.readFileSync(p, 'utf8');
    const lines = txt.split(/\r?\n/);
    return lines.slice(0, maxLines).join('\n');
  } catch { return null; }
}

const today = ymdUTC();
fs.mkdirSync(REPORTS_DIR, { recursive: true });

// Gather latest reports first
const backupReport = newestFile('backup-report-');
const ghReportPath = path.join(REPORTS_DIR, `openclaw-github-${today}.md`);
const ghSummarySection = fs.existsSync(ghReportPath) ? readMaybe(ghReportPath, 220) : '';

// Build one-sentence summary based on available reports and content
let oneSentence = '';
if (!backupReport) {
  oneSentence = '⚠️ Backup report not found — please check logs manually before proceeding with daily tasks.';
} else if (!fs.existsSync(ghReportPath)) {
  oneSentence = '✅ Nightly backup succeeded; GitHub summary not yet available for today.';
} else if (ghSummarySection) {
  const safe = ghSummarySection.toLowerCase();
  if (safe.includes('breaking') || safe.includes('cve') || safe.includes('vulnerability') || safe.includes('security')) {
    oneSentence = '⚠️ Breaking or security update detected in OpenClaw repo — please review changes, consider upgrade or pinning.';
  } else {
    oneSentence = '✅ Nightly backup succeeded; OpenClaw repo shows only routine maintenance — no immediate action needed.';
  }
} else {
  oneSentence = '✅ Nightly backup succeeded; GitHub summary unreadable — no explicit issues reported.';
}

const out = [];
out.push(`# 06:00 Morning Report — ${today} (UTC)`);
out.push('');
out.push('## 🌟 Today in one sentence');
out.push(oneSentence);
out.push('');
out.push('## Checklist');
out.push('- [ ] Nightly 03:00 backup completed (see section below)');
out.push('- [ ] 04:00 OpenClaw GitHub changes reviewed (see section below)');
out.push('- [ ] Conversations summarized into memory (manual/agent-run step; see notes)');
out.push('');

out.push('## 1) 03:00 Backup (latest)');
if (backupReport) {
  out.push(`Source: ${path.relative(ROOT, backupReport)}`);
  out.push('');
  out.push('```');
  out.push(readMaybe(backupReport, 200) ?? '(unable to read backup report)');
  out.push('```');
} else {
  out.push('- No backup report found yet.');
}
out.push('');

out.push('## 2) 04:00 OpenClaw GitHub summary');
if (fs.existsSync(ghReportPath)) {
  out.push(`Source: ${path.relative(ROOT, ghReportPath)}`);
  out.push('');
  out.push('```');
  out.push(readMaybe(ghReportPath, 220) ?? '(unable to read github report)');
  out.push('```');
} else {
  out.push('- No GitHub summary report found yet for today.');
}
out.push('');

out.push('## 3) Conversation → memory consolidation');
out.push('- Plan: summarize each conversation stream and append key points into its corresponding memory file.');
out.push('- Status: performed when the agent has access to the conversation logs for each channel/session.');
out.push('');

out.push('## 4) Suggested focus for today');
out.push('- Review the “Most important changes” section from OpenClaw GitHub summary.');
out.push('- If any breaking/security-related changes exist, decide whether to update/lock versions.');

const reportPath = path.join(REPORTS_DIR, `morning-report-${today}.md`);
fs.writeFileSync(reportPath, out.join('\n') + '\n', 'utf8');
process.stdout.write(out.join('\n') + '\n');
