const fs = require('fs');
const path = require('path');

const ROWS = 18;
const COLS = 28;

const templates = [
  [
    '2222222222222222222222222222',
    '2000000000002220000000000002',
    '2000000000002220000000000002',
    '2000011111102220111110000002',
    '2000000000000000000000000002',
    '2000002222000000222200000002',
    '2000000000000000000000000002',
    '2000022222222222222200000002',
    '2000000000000000000000000002',
    '2000001111100000111110000002',
    '2000000000000000000000000002',
    '2111111111113331111111111112',
    '2000000000003330000000000002',
    '2000000000003330000000000002',
    '2333333333333333333333333332',
    '2000000000000000000000000002',
    '2000000000000000000000000002',
    '2222222222222222222222222222'
  ],
  [
    '2222222222222222222222222222',
    '2000000000333333300000000002',
    '2000000000333333300000000002',
    '2000022222333333322222000002',
    '2000022222333333322222000002',
    '2000022222333333322222000002',
    '2000000000000000000000000002',
    '2111111111111111111111111112',
    '2000001111000000111100000002',
    '2000001111000000111100000002',
    '2000000000000000000000000002',
    '2333333333333333333333333332',
    '2000000000001110000000000002',
    '2000000000001110000000000002',
    '2222222222222222222222222222',
    '2000000002222220000000000002',
    '2000000000000000000000000002',
    '2222222222222222222222222222'
  ],
  [
    '2222222222222222222222222222',
    '2000000000000000000000000002',
    '2000022222222222222222200002',
    '2000020000000000002200200002',
    '2000020111111111102200200002',
    '2000020100000000102200200002',
    '2000020109999000102200200002',
    '2000020100000000102200200002',
    '2000020111111111102200200002',
    '2000020000000000002200200002',
    '2000022222222222222222200002',
    '2000000000000000000000000002',
    '2111111111111111111111111112',
    '2000000000000000000000000002',
    '2333333333333333333333333332',
    '2000000000000000000000000002',
    '2000000000000000000000000002',
    '2222222222222222222222222222'
  ],
  [
    '2222222222222222222222222222',
    '2000000000000000000000000002',
    '2000000000111111100000000002',
    '2000000000100000100000000002',
    '2000000000100000100000000002',
    '2000002222100000122220000002',
    '2000002000100000100200000002',
    '2000002000111110100200000002',
    '2000002000000000100200000002',
    '2000002222222222122220000002',
    '2000000000000000000000000002',
    '2000001111111111111110000002',
    '2333332222222222223333333332',
    '2000000000000000000000000002',
    '2000000000001110000000000002',
    '2000000000001110000000000002',
    '2000000000000000000000000002',
    '2222222222222222222222222222'
  ]
];

const levels = [];
for (let i = 0; i < 100; i++) {
  const tier = Math.min(4, Math.floor(i / 25) + 1);
  const difficulty = 1 + Math.floor(i / 5);
  const template = templates[i % templates.length];
  // Higher tiers still need some empty space for movement + gold placement.
  // Keep frequency >= 3 so not every empty cell becomes brick/ladder.
  const frequency = Math.max(3, 7 - tier);

  const rotated = template.map((row, rowIndex) => {
    return row
      .split('')
      .map((char, col) => {
        if (char !== '0') return char;
        const seed = (col + rowIndex + i) % frequency;
        if (seed === 0) return '1';
        if (seed === 1) return '3';
        return '0';
      })
      .join('');
  });

  const heroRow = Math.min(ROWS - 4, 2 + tier * 2);
  const enemyRow = Math.max(3, ROWS - 3 - tier);
  const heroCol = 2;
  const enemyCol = COLS - 3;

  const map = [...rotated];
  const heroRowArr = map[heroRow].split('');
  heroRowArr[heroCol] = '8';
  map[heroRow] = heroRowArr.join('');

  const enemyRowArr = map[enemyRow].split('');
  enemyRowArr[enemyCol] = '9';
  map[enemyRow] = enemyRowArr.join('');

  // Sprinkle gold (tile '5') onto supported empty cells.
  // Heuristic: place gold on empty space '0' that has solid/diggable support beneath.
  const goldTarget = Math.max(4, 4 + tier * 2);
  const candidates = [];
  for (let r = 1; r < ROWS - 1; r++) {
    const row = map[r];
    const below = map[r + 1] || '';
    for (let c = 1; c < COLS - 1; c++) {
      const cell = row[c];
      if (cell !== '0') continue;
      const under = below[c];
      if (under === '1' || under === '2') {
        candidates.push([r, c]);
      }
    }
  }

  let placedGold = 0;
  for (let g = 0; g < goldTarget && candidates.length > 0; g++) {
    const pickIndex = (i * 31 + g * 17) % candidates.length;
    const [r, c] = candidates.splice(pickIndex, 1)[0];
    const rowArr = map[r].split('');
    rowArr[c] = '5';
    map[r] = rowArr.join('');
    placedGold += 1;
  }

  // Guarantee at least 1 gold so the level is completable.
  if (placedGold === 0) {
    const any = [];
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (map[r][c] === '0') any.push([r, c]);
      }
    }
    if (any.length > 0) {
      const [r, c] = any[(i * 13) % any.length];
      const rowArr = map[r].split('');
      rowArr[c] = '5';
      map[r] = rowArr.join('');
    }
  }

  levels.push({
    id: i + 1,
    title: `Level ${i + 1}`,
    tier,
    difficulty,
    map,
    description:
      tier === 1
        ? '训练营：掌握基本移动与破洞'
        : tier === 2
        ? '挑战：加入更多陷阱和金块'
        : tier === 3
        ? '精英：警察数量上升，节奏加快'
        : 'Boss：一次性通过全部防线'
  });
}

const targetDir = path.join(__dirname, '..', 'apps', 'next-loderunner', 'data');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}
fs.writeFileSync(path.join(targetDir, 'levels.json'), JSON.stringify(levels, null, 2));
console.log('Generated 100 levels at data/levels.json');
