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
  const browser = await chromium.launch({ 
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/chrome'
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
  });
  
  await context.addCookies(parseCookies(cookieStr, '.trae.cn'));
  const page = await context.newPage();

  try {
    // 方法1：检查用户最新话题
    console.log('[1] 查找用户最新话题...');
    await page.goto('https://forum.trae.cn/my/activity/topics', { 
      waitUntil: 'domcontentloaded', timeout: 30000 
    });
    await page.waitForTimeout(5000);
    
    const myTopics = await page.evaluate(() => {
      const rows = document.querySelectorAll('table.topic-list tbody tr, .topic-list-item, [data-topic-id]');
      return Array.from(rows).slice(0, 10).map(row => ({
        id: row.getAttribute('data-topic-id') || row.querySelector('[data-topic-id]')?.getAttribute('data-topic-id'),
        title: row.querySelector('.title, .link-top-line a, a.title')?.textContent?.trim(),
        url: row.querySelector('.title, .link-top-line a, a.title')?.href,
        category: row.querySelector('.category-name, .badge-category')?.textContent?.trim()
      })).filter(t => t.id || t.title);
    });

    console.log(`[1] 用户话题 (${myTopics.length} 条):`);
    myTopics.forEach((t, i) => console.log(`  ${i+1}. [#${t.id}] ${t.title?.substring(0, 60)} | ${t.category}`));

    // 方法2：从最新 ID 往后找
    console.log('\n[2] 扫描最新帖子 ID...');
    
    let foundPost = null;
    
    for (let id = 17120; id <= 17140; id++) {
      try {
        const resp = await page.evaluate(async (tid) => {
          try {
            const r = await fetch(`/t/${tid}.json`);
            if (r.status === 200) {
              const data = await r.json();
              return { 
                id: tid, 
                title: data.title, 
                exists: true,
                category_id: data.category_id
              };
            }
            return { id: tid, exists: false, status: r.status };
          } catch (e) {
            return { id: tid, exists: false, error: e.message };
          }
        }, id);

        if (resp.exists) {
          const isTarget = resp.title.includes('forum-pro') || 
              resp.title.includes('论坛社区全能助手') ||
              resp.title.includes('论坛社区');
          console.log(`  [#${id}] ${resp.title}${isTarget ? ' 🎯' : ''} (cat: ${resp.category_id})`);
          
          if (isTarget) {
            foundPost = { ...resp, url: `https://forum.trae.cn/t/topic/${id}` };
          }
        }
        
        // 连续3个不存在就停止
        if (!resp.exists && id > 17125) break;
        
      } catch (e) { /* continue */ }
      await page.waitForTimeout(150);
    }

    // 最终结果
    console.log('\n' + '='.repeat(55));
    if (foundPost) {
      console.log('✅ 找到帖子！');
      console.log(`📎 标题: ${foundPost.title}`);
      console.log(`📎 URL:  ${foundPost.url}`);
      console.log(`📎 ID:   ${foundPost.id}`);
      
      // 访问确认并截图
      await page.goto(foundPost.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/workspace/forum-pro-published.png', fullPage: false });
      console.log('📸 截图已保存: forum-pro-published.png');
    } else {
      console.log('ℹ️ 帖子可能正在等待审核中（与上次 #17079 行为一致）');
      console.log('   审核通过后将出现在: https://forum.trae.cn/c/37-category/37');
    }
    console.log('='.repeat(55));

  } catch (error) {
    console.error(`❌ 错误: ${error.message}`);
  } finally {
    await browser.close();
  }
})();
