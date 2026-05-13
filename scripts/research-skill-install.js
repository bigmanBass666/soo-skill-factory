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
  const ctx = await browser.newContext({ userAgent: 'Mozilla/5.0' });
  await ctx.addCookies(parseCookies(cookieStr, '.trae.cn'));
  const page = await ctx.newPage();

  async function getTopicJson(topicId) {
    const resp = await page.goto(`https://forum.trae.cn/t/topic/${topicId}.json`, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const text = await resp.text();
    try { return JSON.parse(text); }
    catch(e) { return { error: text.substring(0, 300) }; }
  }

  // Check several competitor posts to see how they handle distribution
  const topics = [
    { id: 17227, title: 'EvoSkills - 马佳彬 (直接竞品!)' },
    { id: 16860, title: '官方公告 - 创作赛规则' },
    { id: 15661, title: '投稿指南 - 官方' },
  ];

  for (const t of topics) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`${t.title} (#${t.id})`);
    console.log(`${'═'.repeat(60)}\n`);
    
    const data = await getTopicJson(t.id);
    if (data.error || data.errors) {
      console.log(`⚠️ ${data.error || JSON.stringify(data.errors)?.substring(0,200)}`);
      continue;
    }

    // Search for install/download/distribution related content
    const fullText = (data.post_stream?.posts || []).map(p => 
      (p.cooked || p.raw || '').replace(/<[^>]+>/g, '')
    ).join('\n');
    
    // Find relevant sections
    const lines = fullText.split('\n');
    const relevantLines = lines.filter(l => 
      l.match(/\.skill|安装|下载|download|install|导入|使用方法|怎么用|如何获得|分享|分发|附件|attachment|链接|link|github|gitee|获取|get/i)
    );
    
    if (relevantLines.length > 0) {
      console.log('🔍 找到安装/分发相关内容:\n');
      relevantLines.forEach(l => console.log(`  ${l.substring(0, 200)}`));
    } else {
      console.log('❌ 未找到安装/分发相关内容');
    }
    
    // Also check if they mention any URL patterns
    const urls = fullText.match(/https?:\/\/[^\s\)]+\.(skill|zip|tar|gz|json|md)/gi) || [];
    if (urls.length > 0) {
      console.log('\n🔗 发现文件链接:');
      urls.forEach(u => console.log(`  ${u}`));
    }

    // Show first post's key excerpts about usage
    const firstPost = data.post_stream?.posts?.[0];
    if (firstPost) {
      const cooked = (firstPost.cooked || '').replace(/<[^>]+>/g, '');
      console.log(`\n📝 帖子片段（前2000字符）:\n`);
      console.log(cooked.substring(0, 2000));
    }

    await page.waitForTimeout(300);
  }

  // Now search the forum for HOW to install skills
  console.log(`\n\n${'═'.repeat(60)}`);
  console.log('🔎 搜索论坛中关于 Skill 安装的讨论');
  console.log(`${'═'.repeat(60)}\n`);
  
  const searchResp = await page.goto('https://forum.trae.cn/search.json?q=skill%20%E5%AE%89%E8%A3%85%20OR%20skill%20%E5%AF%BC%E5%85%A5%20OR%20.skill%20%E4%B8%8B%E8%BD%BD&order=latest', { waitUntil: 'domcontentloaded', timeout: 15000 });
  const searchText = await searchResp.text();
  let searchData;
  try { searchData = JSON.parse(searchText); } catch(e) {}
  
  if (searchData?.posts) {
    console.log(`找到 ${searchData.posts.length} 条相关结果:\n`);
    for (const p of searchData.posts.slice(0, 5)) {
      console.log(`  [${p.topic_id}] ${(p.blurb||'').substring(0, 120)}...`);
    }
  } else if (searchData?.topics) {
    console.log(`找到 ${searchData.topics.length} 个话题:\n`);
    for (const t of searchData.topics.slice(0, 5)) {
      console.log(`  [${t.id}] ${t.title?.substring(0, 80)}`);
    }
  }

  await browser.close();
})();
