const { chromium } = require('playwright');
const fs = require('fs');
const cookieStr = fs.readFileSync('/workspace/cookie.md', 'utf-8').trim();

function parseCookies(cookieStr, domain) {
  return cookieStr.split(';').map(c => {
    const [name, ...vp] = c.trim().split('=');
    return { name: name.trim(), value: vp.join('='), domain, path: '/' };
  }).filter(c => c.name && c.value);
}

(async () => {
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/chrome'
  });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36' });
  await ctx.addCookies(parseCookies(cookieStr, '.trae.cn'));
  const page = await ctx.newPage();

  try {
    console.log('╔════════════════════════════════════════════════════════════╗');
    console.log('║           🏟️  来了！开始逛 TRAE 论坛！                    ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

    // === 第1站：首页 ===
    console.log('📍 第1站：论坛首页\n');
    await page.goto('https://forum.trae.cn/', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const homeText = await page.evaluate(() => document.body.innerText.substring(0, 4000));
    const homeLines = homeText.split('\n').filter(l => l.trim()).slice(0, 40);
    homeLines.forEach(l => console.log(`  ${l.substring(0, 120)}`));
    
    await page.screenshot({ path: '/workspace/screenshots/01-homepage.png', fullPage: false });

    // === 第2站：热门话题 ===
    console.log('\n\n🔥 第2站：全站热门话题\n');
    await page.goto('https://forum.trae.cn/hot', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const hotText = await page.evaluate(() => document.body.innerText.substring(0, 5000));
    const hotLines = hotText.split('\n').filter(l => l.trim()).slice(0, 50);
    hotLines.forEach(l => console.log(`  ${l.substring(0, 130)}`));
    
    await page.screenshot({ path: '/workspace/screenshots/02-hot-topics.png', fullPage: false });

    // === 第3站：SOLO创作赛板块 ===
    console.log('\n\n🏆 第3站：SOLO 技能创作赛板块（重点！）\n');
    await page.goto('https://forum.trae.cn/c/37-category/37', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const contestText = await page.evaluate(() => document.body.innerText.substring(0, 6000));
    const contestLines = contestText.split('\n').filter(l => l.trim()).slice(0, 60);
    contestLines.forEach(l => console.log(`  ${l.substring(0, 130)}`));
    
    await page.screenshot({ path: '/workspace/screenshots/03-contest.png', fullPage: false });

    // === 第4站：最新帖子（看看大家在发什么）===
    console.log('\n\n📰 第4站：最新帖子（latest）\n');
    await page.goto('https://forum.trae.cn/latest', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    
    const latestText = await page.evaluate(() => document.body.innerText.substring(0, 4000));
    const latestLines = latestText.split('\n').filter(l => l.trim() && l.length > 5).slice(0, 35);
    latestLines.forEach(l => console.log(`  ${l.substring(0, 120)}`));
    
    await page.screenshot({ path: '/workspace/screenshots/04-latest.png', fullPage: false });

    // === 第5站：Bug反馈板块 ===
    console.log('\n\n🐛 第5站：Bug 反馈板块（看看大家都在抱怨什么）\n');
    await page.goto('https://forum.trae.cn/c/6-category/6/l/latest', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    
    const bugText = await page.evaluate(() => document.body.innerText.substring(0, 3500));
    const bugLines = bugText.split('\n').filter(l => l.trim() && l.length > 5).slice(0, 30);
    bugLines.forEach(l => console.log(`  ${l.substring(0, 120)}`));

    // === 第6站：产品建议板块 ===
    console.log('\n\n💡 第6站：产品建议板块\n');
    await page.goto('https://forum.trae.cn/c/8-category/8/l/latest', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(1500);
    
    const suggestText = await page.evaluate(() => document.body.innerText.substring(0, 3500));
    const suggestLines = suggestText.split('\n').filter(l => l.trim() && l.length > 5).slice(0, 30);
    suggestLines.forEach(l => console.log(`  ${l.substring(0, 120)}`));

    // === 第7站：搜一下我们自己的帖子 ===
    console.log('\n\n🔍 第7站：搜索我们的参赛帖\n');
    await page.goto('https://forum.trae.cn/search?q=bigmanBass666%20skill&order=latest', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    
    const searchResults = await page.evaluate(() => {
      const items = document.querySelectorAll('.fps-result .topic-title a, .search-result-topic a, .topic-list-item a.title');
      return Array.from(items).map(a => ({ title: a.textContent.trim(), href: a.href }));
    });
    if (searchResults.length > 0) {
      searchResults.forEach(r => console.log(`  ✅ ${r.title}`));
      console.log(`\n  共找到 ${searchResults.length} 条结果`);
    } else {
      console.log('  (搜索结果为空)');
    }

    // === 第8站：看看有没有有趣的讨论可以参与 ===
    console.log('\n\n💬 第8站：找找高回复的热门讨论\n');
    await page.goto('https://forum.trae.cn/top?period=weekly', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    
    const topText = await page.evaluate(() => document.body.innerText.substring(0, 4000));
    const topLines = topText.split('\n').filter(l => l.trim() && l.length > 5).slice(0, 30);
    topLines.forEach(l => console.log(`  ${l.substring(0, 120)}`));
    
    await page.screenshot({ path: '/workspace/screenshots/05-weekly-top.png', fullPage: false });

    // === 最终截图 ===
    await page.screenshot({ path: '/workspace/screenshots/06-final-browse.png', fullPage: false });

    console.log('\n\n╔════════════════════════════════════════════════════════════╗');
    console.log('║          🏁 逛完了！截图已保存到 /workspace/screenshots/     ║');
    console.log('╚════════════════════════════════════════════════════════════╝\n');

  } catch(e) {
    console.error('❌ 出错了:', e.message);
  } finally {
    await browser.close();
  }
})();
