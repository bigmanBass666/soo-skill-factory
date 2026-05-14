const fs = require('fs');
const { execSync } = require('child_process');

const TOPIC_ID = '17234';
const REPLY_FILE = '/workspace/posts/reply-17234-packaging-fix.md';
const baseUrl = 'https://forum.trae.cn';

let replyContent;
try {
  replyContent = fs.readFileSync(REPLY_FILE, 'utf-8').trim();
  console.log(`[0] 评论内容已读取 (${replyContent.length} 字符)`);
} catch (e) {
  console.error(`❌ 无法读取评论文件: ${e.message}`);
  process.exit(1);
}

// 获取 cookie
let cookieStr = null;
try { cookieStr = fs.readFileSync('/workspace/cookie.md', 'utf-8').trim(); } catch (_) {}
if (!cookieStr && process.env.__MISE_SESSION) {
  cookieStr = `_trae_session=${process.env.__MISE_SESSION}`;
}
if (!cookieStr) {
  console.error('❌ 无法获取认证信息');
  process.exit(1);
}

function esc(s) { return "'" + s.replace(/'/g, "'\\''") + "'"; }

function run(cmd) {
  try {
    return { ok: true, data: execSync(cmd, { encoding: 'utf-8', timeout: 60000, maxBuffer: 5 * 1024 * 1024 }) };
  } catch (e) {
    return { ok: false, error: e.message, stderr: e.stderr, code: e.status };
  }
}

const tmpDir = '/tmp/forum-reply-17234';
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

try {
  // Step 1: 获取 CSRF Token
  console.log('[1] 获取 CSRF Token...');
  
  const csrfResult = run(
    `curl -sL --connect-timeout 30 --max-time 60 ` +
    `-b ${esc(cookieStr)} ` +
    `-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" ` +
    `-H "Accept: application/json" ` +
    `-H "X-Requested-With: XMLHttpRequest" ` +
    `"${baseUrl}/session/csrf"`
  );

  if (!csrfResult.ok) throw new Error(`CSRF请求失败: ${csrfResult.error}`);
  
  let csrfToken;
  try {
    csrfToken = JSON.parse(csrfResult.data).csrf;
  } catch (e) {
    throw new Error(`CSRF解析失败: ${csrfResult.data.substring(0, 300)}`);
  }
  console.log(`[1] ✅ CSRF Token: ${csrfToken.substring(0, 20)}...`);

  // Step 2: 获取帖子信息（确认帖子存在）
  console.log('[2] 验证目标帖子...');
  
  const topicResult = run(
    `curl -sL --connect-timeout 30 --max-time 60 ` +
    `-b ${esc(cookieStr)} ` +
    `-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" ` +
    `-H "Accept: application/json" ` +
    `"${baseUrl}/t/topic/${TOPIC_ID}.json"`
  );

  if (!topicResult.ok) throw new Error(`获取帖子失败: ${topicResult.error}`);
  
  let topicData;
  try {
    topicData = JSON.parse(topicResult.data);
  } catch (e) {
    throw new Error(`帖子JSON解析失败: ${topicResult.data.substring(0, 300)}`);
  }
  console.log(`[2] ✅ 帖子: "${topicData.title}" (ID: ${topicData.id}, 回复数: ${topicData.posts_count})`);

  // Step 3: 发布评论
  console.log('[3] 发布评论...');
  
  const postBody = new URLSearchParams({
    topic_id: String(TOPIC_ID),
    raw: replyContent
  }).toString();
  
  const postBodyFile = `${tmpDir}/postbody.txt`;
  fs.writeFileSync(postBodyFile, postBody);

  const postResult = run(
    `curl -sL --connect-timeout 30 --max-time 120 ` +
    `-b ${esc(cookieStr)} ` +
    `-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" ` +
    `-H "Content-Type: application/x-www-form-urlencoded; charset=UTF-8" ` +
    `-H "X-CSRF-Token: ${csrfToken}" ` +
    `-H "Referer: ${baseUrl}/t/topic/${TOPIC_ID}" ` +
    `-H "Origin: ${baseUrl}" ` +
    `-H "Accept: application/json" ` +
    `-H "X-Requested-With: XMLHttpRequest" ` +
    `-X POST ` +
    `-d @${postBodyFile} ` +
    `"${baseUrl}/posts.json"`
  );

  if (!postResult.ok) throw new Error(`发布请求失败: ${postResult.error}`);
  
  console.log(`[3] API原始响应: ${postResult.data.substring(0, 500)}`);

  let postData;
  try {
    postData = JSON.parse(postResult.data);
  } catch (e) {
    throw new Error(`响应JSON解析失败: ${postResult.data.substring(0, 500)}`);
  }

  // 错误检查
  if (Array.isArray(postData) && postData[0] === 'BAD CSRF') {
    throw new Error('CSRF验证失败');
  }
  if (postData.errors) {
    throw new Error(`API错误: ${JSON.stringify(postData.errors)}`);
  }
  if (postData.error) {
    throw new Error(`API错误: ${postData.error}`);
  }

  const postId = postData.id;
  const postNumber = postData.post_number;
  const topicSlug = topicData.slug || 'topic';

  console.log('\n========================================');
  console.log('✅✅✅ 评论发布成功！✅✅✅');
  console.log(`├── 目标帖子: #${TOPIC_ID} - "${topicData.title}"`);
  console.log(`├── 评论ID: #${postId}`);
  console.log(`├── 楼层: 第 ${postNumber} 楼`);
  console.log(`└── 🔗 评论URL: ${baseUrl}/t/${topicSlug}/${TOPIC_ID}/${postNumber}`);
  console.log('========================================');

  // 清理临时文件
  try { fs.unlinkSync(postBodyFile); } catch (_) {}

} catch (error) {
  console.error(`\n❌ 错误: ${error.message}`);
  process.exit(1);
}
