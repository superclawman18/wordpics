import { spawnAgent } from 'openclaw/agent';
import { message } from 'openclaw/message';

async function main() {
  const task = `
    Search GitHub Trending (via web_search and direct GitHub exploration) for projects that have recently gone viral or gained significant attention, particularly in the AI, LLM, or developer tools space.
    
    1. Identify top 3-5 breakout projects.
    2. For each, provide: name, link, why it's trending, and its potential impact.
    3. Format this as a concise "GitHub Trending & Hot Projects" summary in Chinese.
  `;

  try {
    const result = await spawnAgent({
      task,
      label: 'github-trending-scanner',
      runtime: 'subagent'
    });

    await message.send({
      target: 'telegram:8515064424', // 老大的 Telegram ID
      message: `🌻 **中午好，老大！这是为您准备的 GitHub 爆火项目扫描报告：**\n\n${result.output}`
    });
  } catch (error) {
    console.error('Failed to run GitHub Trending scan:', error);
  }
}

main();
