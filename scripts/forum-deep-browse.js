const { chromium } = require('playwright');
const fs = require('fs');
const cookieStr = fs.readFileSync('/workspace/cookie.md', 'utf-8').trim();

function parseCookies(cookieStr, domain) {
  return cookieStr.split(';').map(c => {
    const [name, ...vp] = c.trim().split('=');
    return { name: name.trim(), value: vp.join('='), domain, path: '/' };
  }).filter(c => c.name && c.value);
}

async function getText(page, selector) {
  return page.evaluate((sel) => {
    const el = document.querySelector(sel);
    return el ? el.textContent.trim() : '';
  }, selector);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' });
  await ctx.addCookies(parseCookies(cookieStr, '.trae.cn'));
  const page = await ctx.newPage();

  try {
    console.log('=== 1. 全站热门话题 ===\n');
    await page.goto('https://forum.trae.cn/hot', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(2000);
    const hotText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
    const hotLines = hotText.split('\n').filter(l => l.includes('/t/topic/') || l.match(/\d+\s*(回复|views|浏览)/i)).slice(0, 20);
    hotLines.forEach(l => console.log(`  ${l}`));

    console.log('\n=== 2. SOLO创作赛参赛作品 ===\n');
    await page.goto('https://forum.trae.cn/c/37-category/37/l/latest', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    const contestText = await page.evaluate(() => document.body.innerText.substring(0, 3000));
    const contestLines = contestText.split('\n').filter(l => l.length > 10 && (l.includes('[skill') || l.includes('【Skill') || l.includes('skill'))).slice(0, 15);
    console.log(`  发现参赛作品:`);
    contestLines.forEach(l => console.log(`  ${l.substring(0, 100)}`));

    console.log('\n=== 3. 我的个人页面 & 消息通知 ===\n');
    await page.goto('https://forum.trae.cn/my/summary', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    const summaryText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    const summaryLines = summaryText.split('\n').filter(l => l.trim()).slice(0, 20);
    summaryLines.forEach(l => console.log(`  ${l}`));
    await page.screenshot({ path: '/workspace/forum-browse-summary.png' });

    console.log('\n=== 4. 产品建议板块（月榜） ===\n');
    await page.goto('https://forum.trae.cn/c/8-category/8/l/top?period=monthly', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    const productText = await page.evaluate(() => document.body.innerText.substring(0, 2500));
    const productLines = productText.split('\n').filter(l => l.trim().length > 5 && !l.includes('产品建议')).slice(0, 12);
    productLines.forEach(l => console.log(`  ${l}`));

    console.log('\n=== 5. 技巧分享板块热门 ===\n');
    await page.goto('https://forum.trae.cn/c/9-category/9/l/hot', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(1500);
    const tipsText = await page.evaluate(() => document.body.innerText.substring(0, 2500));
    const tipsLines = tipsText.split('\n').filter(l => l.trim().length > 6 && !l.includes('技巧分享')).slice(0, 12);
    tipsLines.forEach(l => console.log(`  ${l}`));

    console.log('\n=== 6. 搜索我们的帖子 ===');
    await page.goto('https://forum.trae.cn/search?q=trae-device-security%20OR%20trae-forum-pro%20OR%20workflow-automator&order=latest', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    const searchResults = await page.evaluate(() => {
      const items = document.querySelectorAll('.fps-result .topic-title a, .search-result-topic a');
      return Array.from(items).map(a => ({ title: a.textContent.trim(), href: a.href }));
    });
    if (searchResults.length > 0) {
      searchResults.forEach(r => console.log(`  ✅ ${r.title} → ${r.href}`));
    } else {
      console.log('  (搜索无结果，可能workflow-automator还在审核)');
    }

    await page.screenshot({ path: '/workspace/forum-browse-final.png', fullPage: false });

  } catch(e) {
    console.error('Error:', e.message);
  } finally {
    await browser.close();
  }
})();
