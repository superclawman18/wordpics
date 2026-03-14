#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const REPORT_DIR = path.join(ROOT, 'reports');
if (!fs.existsSync(REPORT_DIR)) {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
}

function runCommand(command, cwd = ROOT) {
  try {
    const output = execSync(command, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    return { success: true, output: output.trim() };
  } catch (error) {
    const nextOutput = [error.stdout, error.stderr]
      .filter(Boolean)
      .map((chunk) => chunk.toString())
      .join('\n')
      .trim();
    return {
      success: false,
      error: error.message,
      output: nextOutput
    };
  }
}

function summarizeLevels(levels) {
  if (!Array.isArray(levels)) {
    throw new Error('levels.json does not export an array of levels');
  }

  const summary = {
    totalLevels: levels.length,
    totalGold: 0,
    totalDifficulty: 0,
    tierCounts: {},
    noGoldLevels: [],
    noClimbLevels: [],
    noEnemyLevels: [],
    noHeroLevels: []
  };

  levels.forEach((level) => {
    const map = Array.isArray(level.map) ? level.map : [];
    const tier = level.tier || 'unknown';
    summary.tierCounts[tier] = (summary.tierCounts[tier] || 0) + 1;
    summary.totalDifficulty += Number(level.difficulty || 0);

    const levelInfo = {
      id: level.id ?? 'unknown',
      gold: 0,
      hasLadder: false,
      hasRope: false,
      hasHero: false,
      hasEnemy: false
    };

    map.forEach((row) => {
      if (typeof row !== 'string') return;
      [...row].forEach((char) => {
        if (char === '5') {
          levelInfo.gold += 1;
        }
        if (char === '3') {
          levelInfo.hasLadder = true;
        }
        if (char === '4') {
          levelInfo.hasRope = true;
        }
        if (char === '8') {
          levelInfo.hasHero = true;
        }
        if (char === '9') {
          levelInfo.hasEnemy = true;
        }
      });
    });

    summary.totalGold += levelInfo.gold;

    if (levelInfo.gold === 0) summary.noGoldLevels.push(levelInfo.id);
    if (!levelInfo.hasHero) summary.noHeroLevels.push(levelInfo.id);
    if (!levelInfo.hasEnemy) summary.noEnemyLevels.push(levelInfo.id);
    if (!levelInfo.hasLadder && !levelInfo.hasRope) summary.noClimbLevels.push(levelInfo.id);
  });

  summary.avgGoldPerLevel = summary.totalLevels ? summary.totalGold / summary.totalLevels : 0;
  summary.avgDifficulty = summary.totalLevels ? summary.totalDifficulty / summary.totalLevels : 0;
  summary.climbCoverage = summary.totalLevels
    ? 1 - summary.noClimbLevels.length / summary.totalLevels
    : 0;

  return summary;
}

function buildReport(backupResult, lintResult, generatorResult, levelSummary, parseError) {
  const now = new Date();
  const timestamp = now.toISOString().split('.')[0].replace(/:/g, '-');
  const lines = [];
  lines.push(`# Nightly Automation Report — ${timestamp}`);
  lines.push(`Generated on ${now.toISOString()}`);

  lines.push('## Command results');
  lines.push(`- ./scripts/daily-backup.sh: ${backupResult.success ? 'pass' : 'FAIL'}`);
  if (!backupResult.success) {
    lines.push(indentBlock(backupResult.output || backupResult.error || 'no output', 1));
  }
  lines.push(`- npm run lint (apps/next-loderunner): ${lintResult.success ? 'pass' : 'FAIL'}`);
  if (!lintResult.success) {
    lines.push(indentBlock(lintResult.output || lintResult.error || 'no output', 1));
  }
  lines.push(`- node scripts/generate-levels.js: ${generatorResult.success ? 'pass' : 'FAIL'}`);
  if (!generatorResult.success) {
    lines.push(indentBlock(generatorResult.output || generatorResult.error || 'no output', 1));
  }

  lines.push('## Level statistics');
  if (parseError) {
    lines.push(`Failed to parse levels.json: ${parseError.message}`);
  } else if (levelSummary.totalLevels === 0) {
    lines.push('levels.json contains 0 levels. Generator might have failed silently.');
  } else {
    lines.push(`- total levels: ${levelSummary.totalLevels}`);
    lines.push(`- average difficulty: ${levelSummary.avgDifficulty.toFixed(2)}`);
    lines.push(`- average gold per level: ${levelSummary.avgGoldPerLevel.toFixed(1)}`);
    lines.push(`- climb coverage: ${(levelSummary.climbCoverage * 100).toFixed(1)}%`);
    Object.keys(levelSummary.tierCounts)
      .sort()
      .forEach((tier) => {
        lines.push(`- tier ${tier}: ${levelSummary.tierCounts[tier]} levels`);
      });
  }

  lines.push('## Issues / improvement ideas');
  const issues = [];
  if (parseError) {
    issues.push('levels.json could not be parsed. Check generator output.');
  } else {
    if (levelSummary.noGoldLevels.length > 0) {
      issues.push(`Levels missing gold: ${levelSummary.noGoldLevels.slice(0, 3).join(', ')}${
        levelSummary.noGoldLevels.length > 3 ? ', ...' : ''
      }`);
    }
    if (levelSummary.noClimbLevels.length > 0) {
      issues.push(`Levels without ladder/rope: ${levelSummary.noClimbLevels.slice(0, 3).join(', ')}${
        levelSummary.noClimbLevels.length > 3 ? ', ...' : ''
      }`);
    }
    if (levelSummary.noEnemyLevels.length > 0) {
      issues.push(`Levels without enemy spawns: ${levelSummary.noEnemyLevels.slice(0, 3).join(', ')}${
        levelSummary.noEnemyLevels.length > 3 ? ', ...' : ''
      }`);
    }
    if (levelSummary.noHeroLevels.length > 0) {
      issues.push(`Levels without hero spawns: ${levelSummary.noHeroLevels.slice(0, 3).join(', ')}${
        levelSummary.noHeroLevels.length > 3 ? ', ...' : ''
      }`);
    }
    if (levelSummary.avgGoldPerLevel < 2) {
      issues.push('Average gold per level is low (< 2). Consider sprinkling more gold before banking.');
    }
    if (levelSummary.climbCoverage < 0.7) {
      issues.push('Climb coverage under 70% — add ropes or ladders so police and hero can cross floors.');
    }
  }
  if (issues.length === 0) {
    issues.push('No automated issues detected. Explore new polish areas (animations, UI hints, hero/enemy visuals).');
  }
  lines.push(issues.map((issue) => `- ${issue}`).join('\n'));

  lines.push('## Next steps');
  lines.push('- Double-check generator templates for ladders/ropes to keep climb coverage healthy.');
  lines.push('- Keep polishing the mobile UI to match the single-page prototype.');
  lines.push('- Update this report tomorrow with the remaining gaps you identify.');

  return { body: lines.join('\n\n'), timestamp };
}

function indentBlock(text, level) {
  const indent = '  '.repeat(level);
  return text
    .split('\n')
    .map((line) => `${indent}${line}`)
    .join('\n');
}

function main() {
  const backupResult = runCommand('./scripts/daily-backup.sh', ROOT);
  const lintResult = runCommand('npm run lint', path.join(ROOT, 'apps/next-loderunner'));
  const generatorResult = runCommand('node scripts/generate-levels.js', ROOT);

  const levelsPath = path.join(ROOT, 'apps/next-loderunner/data/levels.json');
  let levelSummary = null;
  let parseError = null;
  try {
    const raw = fs.readFileSync(levelsPath, 'utf8');
    const levels = JSON.parse(raw);
    levelSummary = summarizeLevels(levels);
  } catch (error) {
    parseError = error;
    levelSummary = {
      totalLevels: 0,
      tierCounts: {},
      noGoldLevels: [],
      noClimbLevels: [],
      noEnemyLevels: [],
      noHeroLevels: [],
      avgGoldPerLevel: 0,
      avgDifficulty: 0,
      climbCoverage: 0
    };
  }

  const report = buildReport(backupResult, lintResult, generatorResult, levelSummary, parseError);
  const filename = `nightly-report-${report.timestamp}.md`;
  const reportPath = path.join(REPORT_DIR, filename);
  fs.writeFileSync(reportPath, report.body);
  console.log(`Nightly automation completed. Report saved to ${reportPath}`);
}

if (require.main === module) {
  main();
}
