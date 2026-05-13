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
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36' });
  await ctx.addCookies(parseCookies(cookieStr, '.trae.cn'));
  const page = await ctx.newPage();

  async function apiGet(url) {
    const resp = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const text = await resp.text();
    try { return JSON.parse(text); }
    catch(e) { return { raw: text.substring(0, 1000), status: resp.status() }; }
  }

  try {
    console.log('=== 📬 通知 Notifications ===\n');
    let data = await apiGet('https://forum.trae.cn/notifications.json?recent=true&limit=20');
    if (data.notifications) {
      console.log(`共 ${data.notifications.length} 条通知:\n`);
      for (const n of data.notifications.slice(0, 15)) {
        const date = n.created_at ? new Date(n.created_at).toLocaleString('zh-CN') : '?';
        console.log(`[${date}] ${n.notification_type || '?'} | ${n.fancy_title || n.data?.topic_title || '(无标题)'}`);
        if (n.data && Object.keys(n.data).length > 0 && Object.keys(n.data).some(k => n.data[k])) {
          const d = JSON.stringify(n.data).substring(0, 200);
          if (d !== '{}') console.log(`   ${d}`);
        }
      }
    } else {
      console.log(`返回: ${JSON.stringify(data).substring(0, 500)}`);
    }

    console.log('\n=== 💬 私信 Topics ===\n');
    data = await apiGet('https://forum.trae.cn/topics/private-messages/DM.json');
    if (data.topic_list && data.topic_list.topics) {
      const topics = data.topic_list.topics;
      console.log(`共 ${topics.length} 个私信对话:\n`);
      for (const t of topics.slice(0, 10)) {
        console.log(`  📨 "${t.title}" | 最后:${t.last_poster_username} | ${t.posts_count}条`);
      }
    } else {
      console.log(`返回: ${JSON.stringify(data).substring(0, 500)}`);
    }

    console.log('\n=== 👤 个人信息 ===\n');
    data = await apiGet('https://forum.trae.cn/u/157977cf60964130f3ab09543a932a5e.json');
    if (data.user) {
      const u = data.user;
      console.log(`  用户名: ${u.username} (${u.name || ''})`);
      console.log(`  信任等级: Lv${u.trust_level}`);
      console.log(`  帖子/话题: ${u.post_count}/${u.topic_count}`);
      console.log(`  日读时间: ${u.time_read ? Math.round(u.time_read/60) + '分钟' : '?'}`);
      console.log(`  创建: ${u.created_at?.substring(0,10)} | 活跃: ${u.last_seen_at?.substring(0,10)}`);
      console.log(`  徽章: ${JSON.stringify(u.badge_count)}`);
    } else {
      console.log(`返回: ${JSON.stringify(data).substring(0, 500)}`);
    }

    console.log('\n=== 🔔 Session 状态 ===\n');
    data = await apiGet('https://forum.trae.cn/session/current.json');
    if (data.current_user) {
      console.log(`  已登录: ${data.current_user.username}`);
      console.log(`  未读通知: ${data.notification_count ?? 0}`);
      console.log(`  未读私信: ${data.unread_private_messages ?? 0}`);
      console.log(`  未读频道: ${data.unread_channel_messages ?? 0}`);
      console.log(`  Admin: ${data.current_user.admin ?? false} | Staff: ${data.current_user.staff ?? false}`);
    } else {
      console.log(`返回: ${JSON.stringify(data).substring(0, 500)}`);
    }

    console.log('\n=== 📊 最近活动 ===\n');
    data = await apiGet('https://forum.trae.cn/u/157977cf60964130f3ab09543a932a5e/summary.json');
    if (data.user_summary) {
      const s = data.user_summary;
      console.log(`  话题/帖子/回复: ${s.topic_count ?? 0}/${s.post_count ?? 0}/${s.reply_count ?? 0}`);
      console.log(`  访问天数: ${s.days_visited ?? 0} | 阅读: ${s.time_read ? Math.round(s.time_read/60)+'分钟' : '?'}`);
      console.log(`  点赞: 给出${s.likes_given ?? 0}/收到${s.likes_received ?? 0}`);
      
      if (s.topics && s.topics.length > 0) {
        console.log(`\n  我最近的话题:`);
        for (const t of s.topics.slice(0, 8)) {
          console.log(`    [${t.id}] ${t.title} (${t.posts_count}帖/${t.views ?? '?'}浏览)`);
        }
      }
      if (s.replies && s.replies.length > 0) {
        console.log(`\n  我最近的回复:`);
        for (const r of s.replies.slice(0, 5)) {
          console.log(`    → [${r.topic_id}] ${(r.title||'').substring(0, 70)}`);
        }
      }
      if (s.links && s.links.length > 0) {
        console.log(`\n  收到的链接:`);
        for (const l of s.links.slice(0, 5)) {
          console.log(`    🔗 ${l.title?.substring(0, 70)}`);
        }
      }
      if (s.actions && s.actions.length > 0) {
        console.log(`\n  最近操作:`);
        for (const a of s.actions.slice(0, 5)) {
          console.log(`    ⚡ ${a.title?.substring(0, 70)}`);
        }
      }
    }

    console.log('\n=== 🏷️ 我的帖子状态 ===\n');
    data = await apiGet('https://forum.trae.cn/search.json?q=%E5%A4%A7%E7%8B%97%E5%8F%AB%40%E5%A4%A7%E7%8B%97%E5%8F%AB%20order%3Alatest');
    if (data.posts) {
      console.log(`  找到 ${data.posts.length} 条相关帖子:\n`);
      for (const p of data.posts.slice(0, 10)) {
        console.log(`  [${p.topic_id}] ${p.blurb?.substring(0, 80)}... (${p.like_count ?? 0}赞)`);
      }
    } else if (data.topics) {
      console.log(`  找到 ${data.topics.length} 个话题`);
    } else {
      console.log(`  返回: ${JSON.stringify(data).substring(0, 300)}`);
    }

    await page.screenshot({ path: '/workspace/messages-api-result.png' });

  } catch(e) {
    console.error('Error:', e.message);
    await page.screenshot({ path: '/workspace/messages-error2.png' }).catch(()=>{});
  } finally {
    await browser.close();
  }
})();
