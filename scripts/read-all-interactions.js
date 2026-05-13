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
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)' });
  await ctx.addCookies(parseCookies(cookieStr, '.trae.cn'));
  const page = await ctx.newPage();

  async function getTopicJson(topicId) {
    const resp = await page.goto(`https://forum.trae.cn/t/topic/${topicId}.json`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const text = await resp.text();
    try { return JSON.parse(text); }
    catch(e) { return { error: text.substring(0, 500), status: resp.status() }; }
  }

  const interactions = [
    { id: 17174, desc: '🔥 真快被气死了 - 汤圆等人回复了你的吐槽帖' },
    { id: 13463, desc: '📌 今天先也不错 - 原始帖 (用户18回复)' },
    { id: 16852, desc: '📌 今天先也不错 - 异常打断 (20楼新回复)' },
    { id: 16252, desc: '📌 提示：今天先也不错 (17楼新回复)' },
    { id: 17079, desc: '🎯 【Skill创作】TRAE账号安全管家 (文和戟剑引用/回复)' },
    { id: 17166, desc: '🎯 【Skill分享】trae-forum-pro (发布通知)' },
    { id: 17043, desc: '🎯 【产品建议】账号设备管理 (原始产品建议帖)' },
    { id: 17157, desc: '❓ 搜索结果中出现的帖子' },
  ];

  for (const item of interactions) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`${item.desc}`);
    console.log(`# ${item.id} | https://forum.trae.cn/t/topic/${item.id}`);
    console.log(`${'═'.repeat(60)}\n`);
    
    const data = await getTopicJson(item.id);
    
    if (data.error || data.errors) {
      console.log(`⚠️ ${data.error || JSON.stringify(data.errors)?.substring(0,200)}`);
      continue;
    }

    const title = data.title || '(无标题)';
    const posts = data.post_stream?.posts || [];
    const totalPosts = data.posts_count || 0;
    
    console.log(`📝 标题: ${title}`);
    console.log(`👤 作者: ${data.details?.created_by?.username || '?'}`);
    console.log(`💬 总帖数: ${totalPosts} | 回复数: ${data.reply_count || 0} | 浏览: ${data.views || '?'} | 赞: ${data.like_count || 0}`);
    console.log(`🏷️ 标签: ${(data.tags || []).join(', ')}`);
    console.log(`📅 创建: ${data.created_at?.substring(0,16)} | 最后活动: ${data.last_posted_at?.substring(0,16)}`);

    // 显示最近3条帖子（或全部如果不多）
    const showPosts = posts.slice(-Math.min(posts.length, 5));
    for (const p of showPosts) {
      const username = p.username || '?';
      const content = (p.cooked || p.raw || '').replace(/<[^>]+>/g, '').substring(0, 400);
      const likes = p.actions_summary?.find(a => a.id === 2)?.count || 0;
      const replyTo = p.reply_to_post_number ? `→#${p.reply_to_post_number}` : '';
      console.log(`\n--- #${p.post_number} by ${username} ${replyTo} ❤️${likes} ---`);
      console.log(content);
      if ((p.cooked || '').length > 500) {
        console.log(`... [共${(p.cooked||'').length}字符]`);
      }
    }

    // 如果有更多帖子没显示
    if (posts.length > 5) {
      console.log(`\n... 还有 ${posts.length - 5} 条更早的帖子`);
    }

    await page.waitForTimeout(300);
  }

  await browser.close();
})();
