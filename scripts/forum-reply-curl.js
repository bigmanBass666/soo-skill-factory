const fs = require('fs');
const { spawnSync } = require('child_process');
const path = require('path');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('用法: node scripts/forum-reply-curl.js <topicId> <contentFile>');
  process.exit(1);
}

const topicId = args[0];
const contentFile = args[1];

(function () {
  let replyContent, cookieStr;

  try { replyContent = fs.readFileSync(contentFile, 'utf-8').trim(); console.log(`[0] 评论内容已读取 (${replyContent.length} 字符)`); }
  catch (e) { console.error(`❌ 无法读取评论文件`); process.exit(1); }

  try { cookieStr = fs.readFileSync('/workspace/cookie.md', 'utf-8').trim(); }
  catch (e) { console.error(`❌ 无法读取 cookie.md`); process.exit(1); }

  const baseUrl = 'https://forum.trae.cn';
  const tmpDir = '/tmp/forum-reply';
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // 将cookie字符串转换为Netscape格式写入jar文件
  function writeNetscapeJar(jarPath, cookieString) {
    const lines = ['# Netscape HTTP Cookie File', ''];
    cookieString.split(';').forEach(pair => {
      const eqIdx = pair.indexOf('=');
      if (eqIdx > 0) {
        const name = pair.substring(0, eqIdx).trim();
        const value = pair.substring(eqIdx + 1).trim();
        lines.push(`.forum.trae.cn\tTRUE\t/\tTRUE\t0\t${name}\t${value}`);
      }
    });
    fs.writeFileSync(jarPath, lines.join('\n'));
  }

  const jarFile = path.join(tmpDir, 'jar.txt');
  const postDataFile = path.join(tmpDir, 'postdata.txt');
  
  // 初始化jar：将原始cookie写入
  writeNetscapeJar(jarFile, cookieStr);

  function curl(args) {
    const result = spawnSync('curl', args, {
      encoding: 'utf-8', maxBuffer: 2 * 1024 * 1024, shell: false
    });
    if (result.error) throw new Error(`curl 执行失败: ${result.error.message}`);
    if (result.status !== 0) throw new Error(`curl 返回码 ${result.status}: ${(result.stderr || '').substring(200)}`);
    return result.stdout;
  }

  // 所有请求共享同一个jar，让curl自动管理cookies
  function req(args) { return curl(['-s', '-L', '-b', jarFile, '-c', jarFile, ...args]); }

  try {
    // Step 1: 获取CSRF - curl会自动更新jar中的session
    console.log('[1] 获取 CSRF Token...');
    const csrfResp = req([
      '-H', 'User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      '-H', 'Accept: application/json, */*',
      '-H', 'X-Requested-With: XMLHttpRequest',
      `${baseUrl}/session/csrf`
    ]);

    let csrfToken;
    try { csrfToken = JSON.parse(csrfResp).csrf; } catch (e) {
      console.log(`❌ CSRF解析失败`); process.exit(1);
    }
    console.log(`[1] CSRF: ${csrfToken.substring(0, 20)}...`);

    // Step 2: 用同一个jar发帖 - curl自动发送更新后的session+原始认证cookie
    console.log('[2] 发布评论...');
    const bodyStr = new URLSearchParams({ topic_id: String(topicId), raw: replyContent }).toString();
    fs.writeFileSync(postDataFile, bodyStr);

    const postDataRaw = req([
      '-X', 'POST',
      '-H', 'Content-Type: application/x-www-form-urlencoded; charset=UTF-8',
      `-H`, `X-CSRF-Token: ${csrfToken}`,
      `-H`, `Referer: ${baseUrl}/t/topic/${topicId}`,
      `-H`, `Origin: ${baseUrl}`,
      '-H', 'Accept: application/json, */*',
      '-H', 'X-Requested-With: XMLHttpRequest',
      '--data-binary', '@' + postDataFile,
      `${baseUrl}/posts.json`
    ]);

    console.log('[2] API响应:', postDataRaw.substring(0, 500));

    let postData;
    try { postData = JSON.parse(postDataRaw); } catch(e) { postData = { raw: postDataRaw }; }

    if (Array.isArray(postData) && postData[0] === 'BAD CSRF') {
      // 输出当前jar内容用于调试
      try { console.log('\\n当前Cookie Jar:\\n' + fs.readFileSync(jarFile,'utf-8')); } catch(_) {}
      console.log('\\n❌ CSRF验证失败！'); process.exit(1);
    }
    if (postData.errors) { console.log('\\n❌ 失败:', JSON.stringify(postData.errors)); process.exit(1); }
    if (postData.error) { console.log(`\\n❌ 失败: ${postData.error}`); process.exit(1); }

    const topicDataRaw = req(['-H', 'Accept: application/json', `${baseUrl}/t/topic/${topicId}.json`]);
    let topicData;
    try { topicData = JSON.parse(topicDataRaw); } catch(_) { topicData = { slug: 'topic' }; }

    console.log('\\n========================================');
    console.log('✅ 评论发布成功！');
    console.log(`📎 帖子: ${baseUrl}/t/topic/${topicId}`);
    console.log(`📎 评论ID: #${postData.id || '(未知)'} (第 ${postData.post_number || '?'} 楼)`);
    console.log(`🔗 URL: ${baseUrl}/${topicData.slug || 'topic'}/${topicId}/${postData.post_number || ''}`);
    console.log('========================================');

  } catch (error) {
    console.error(`\\n❌ 错误: ${error.message}`);
    process.exit(1);
  } finally {
    try { fs.unlinkSync(jarFile); } catch (_) {}
    try { fs.unlinkSync(postDataFile); } catch (_) {}
  }
})();
