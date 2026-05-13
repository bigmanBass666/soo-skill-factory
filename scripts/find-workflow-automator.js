const { chromium } = require('playwright');
const fs = require('fs');

const cookieStr = fs.readFileSync('/workspace/cookie.md', 'utf-8').trim();

function parseCookies(cookieStr, domain) {
  return cookieStr.split(';').map(cookie => {
    const [name, ...valueParts] = cookie.trim().split('=');
    const value = valueParts.join('=');
    return { name: name.trim(), value: value.trim(), domain, path: '/' };
  }).filter(c => c.name && c.value);
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  
  await context.addCookies(parseCookies(cookieStr, '.trae.cn'));
  const page = await context.newPage();

  try {
    console.log('[1] 查找最新帖子...');
    await page.goto('https://forum.trae.cn/my/summary', { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    
    const topicLinks = await page.evaluate(() => {
      const links = document.querySelectorAll('a[href*="/t/topic/"]');
      return Array.from(links).map(a => ({ text: a.textContent.trim(), href: a.href })).slice(0, 10);
    });
    
    console.log('\n最近帖子:');
    topicLinks.forEach((l, i) => console.log(`  ${i+1}. ${l.text} → ${l.href}`));
    
    await page.screenshot({ path: '/workspace/workflow-automator-summary.png' });

    console.log('\n[2] 检查草稿/待审核...');
    await page.goto('https://forum.trae.cn/my/drafts', { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/workspace/workflow-automator-drafts.png', fullPage: true });
    
    const draftText = await page.evaluate(() => document.body.innerText.substring(0, 500));
    console.log(`\n草稿页面内容:\n${draftText}`);

  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
  } finally {
    await browser.close();
  }
})();
