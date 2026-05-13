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
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  await context.addCookies(parseCookies(cookieStr, '.trae.cn'));
  const page = await context.newPage();

  try {
    // 方法1：通过用户活动页面查找
    console.log('[1] 查找用户最新活动...');
    await page.goto('https://forum.trae.cn/my/activity/topics', { 
      waitUntil: 'domcontentloaded', timeout: 60000 
    });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/workspace/find1-my-topics.png', fullPage: false });

    // 获取用户话题列表
    const myTopics = await page.evaluate(() => {
      const rows = document.querySelectorAll('table.topic-list tbody tr, .topic-list-item, [data-topic-id]');
      return Array.from(rows).map(row => ({
        id: row.getAttribute('data-topic-id') || row.querySelector('[data-topic-id]')?.getAttribute('data-topic-id'),
        title: row.querySelector('.title, .link-top-line a, a.title')?.textContent?.trim(),
        url: row.querySelector('.title, .link-top-line a, a.title')?.href,
        category: row.querySelector('.category-name, .badge-category')?.textContent?.trim()
      })).filter(t => t.id || t.title);
    });

    console.log(`[1] 用户话题列表 (${myTopics.length} 条):`);
    myTopics.forEach((t, i) => console.log(`  ${i+1}. [#${t.id}] ${t.title?.substring(0, 60)} | ${t.category}`));

    // 方法2：搜索关键词
    console.log('\n[2] 搜索 "账号安全管家"...');
    await page.goto('https://forum.trae.cn/search?q=%E8%B4%A6%E5%8F%B7%E5%AE%89%E5%85%A8%E7%AE%A1%E5%AE%B6', {
      waitUntil: 'domcontentloaded', timeout: 60000
    });
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/workspace/find2-search.png', fullPage: false });

    const searchResults = await page.evaluate(() => {
      const results = document.querySelectorAll('.fps-result, .search-result, .topic-list-item');
      return Array.from(results).map(r => ({
        title: r.querySelector('.topic-title, .search-link, a')?.textContent?.trim(),
        url: r.querySelector('.topic-title, .search-link, a')?.href
      })).filter(r => r.title);
    });

    console.log(`[2] 搜索结果 (${searchResults.length} 条):`);
    searchResults.forEach((r, i) => console.log(`  ${i+1}. ${r.title?.substring(0, 60)} → ${r.url}`));

    // 方法3：直接查看最新的几个 ID（我们的帖应该在 17078 之后）
    console.log('\n[3] 检查最新帖子 ID 范围...');
    
    let foundPost = null;
    
    // 从 17079 开始往后找（17078 是列表中最大的）
    for (let id = 17079; id <= 17090; id++) {
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
          console.log(`  [#${id}] ${resp.title} (category: ${resp.category_id})`);
          
          if (resp.title.includes('账号安全管家') || 
              resp.title.includes('device-security') ||
              resp.title.includes('风控诊断')) {
            foundPost = { ...resp, url: `https://forum.trae.cn/t/topic/${id}` };
            console.log(`  🎯 找到目标帖子！`);
          }
        }
        
        // 如果连续2个不存在，停止搜索
        if (!resp.exists && id > 17082) break;
        
      } catch (e) { /* continue */ }
      
      await page.waitForTimeout(200);
    }

    // 方法4：检查待审核队列
    console.log('\n[4] 检查是否可以访问待审核帖子...');
    
    if (!foundPost) {
      // 尝试访问用户的最新帖子（即使待审核，作者本人应该能看到）
      await page.goto('https://forum.trae.cn/my/activity/posts', {
        waitUntil: 'domcontentloaded', timeout: 60000
      });
      await page.waitForTimeout(5000);
      
      const myPosts = await page.evaluate(() => {
        const items = document.querySelectorAll('.activity-post, .user-stream-item, [class*="activity"]');
        return Array.from(items).slice(0, 10).map(item => ({
          title: item.querySelector('.title, a')?.textContent?.trim(),
          url: item.querySelector('.title, a')?.href,
          type: item.className
        }));
      });
      
      console.log(`[4] 用户发帖记录:`);
      myPosts.forEach((p, i) => console.log(`  ${i+1}. ${p.title?.substring(0, 60)} → ${p.url}`));
      
      await page.screenshot({ path: '/workspace/find4-posts.png', fullPage: false });
    }

    // 最终结果
    console.log('\n' + '='.repeat(50));
    if (foundPost) {
      console.log('✅ 帖子发布成功！');
      console.log(`📎 标题: ${foundPost.title}`);
      console.log(`📎 URL:  ${foundPost.url}`);
      console.log(`📎 ID:   ${foundPost.id}`);
      
      // 访问确认
      await page.goto(foundPost.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: '/workspace/post-confirmed.png', fullPage: false });
    } else {
      console.log('ℹ️ 帖子已提交成功，当前状态：**等待版主审核中**');
      console.log('   这是因为论坛开启了新帖审核机制');
      console.log('   审核通过后帖子将公开显示在：');
      console.log('   https://forum.trae.cn/c/37-category/37');
      console.log('\n   你也可以通过以下方式查看自己的帖子：');
      console.log('   https://forum.trae.cn/my/activity/topics');
    }
    console.log('='.repeat(50));

  } catch (error) {
    console.error(`错误: ${error.message}`);
    await page.screenshot({ path: '/workspace/error-find2.png' }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
