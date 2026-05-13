const { execSync } = require('child_process');
const fs = require('fs');

const POST_ID = '80287';
const TOPIC_URL = 'https://forum.trae.cn/t/topic/17166';
const UPDATE_CONTENT = fs.readFileSync('/workspace/posts/forum-pro-competition-post-updated.md', 'utf-8');
const cookieStr = fs.readFileSync('/workspace/cookie.md', 'utf-8').trim();

function runCmd(cmd) {
  try {
    const result = execSync(cmd, { encoding: 'utf-8', timeout: 60000, maxBuffer: 10 * 1024 * 1024 });
    return { ok: true, data: result };
  } catch (e) {
    return { ok: false, error: e.message, stderr: e.stderr, code: e.status };
  }
}

function escapeShellArg(arg) {
  return "'" + arg.replace(/'/g, "'\\''") + "'";
}

(async () => {
  console.log(`========================================`);
  console.log(`论坛帖子更新脚本 (纯 curl 版)`);
  console.log(`目标帖子: #17166 (Post ID: ${POST_ID})`);
  console.log(`更新内容长度: ${UPDATE_CONTENT.length} 字符`);
  console.log(`========================================\n`);

  try {
    console.log('[1] 获取页面 HTML 并提取 CSRF Token...');
    
    const pageResult = runCmd(
      `curl -sL --connect-timeout 30 --max-time 60 ` +
      `-b ${escapeShellArg(cookieStr)} ` +
      `-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" ` +
      `"${TOPIC_URL}"`
    );

    if (!pageResult.ok) {
      throw new Error(`获取页面失败: ${pageResult.error}`);
    }

    const csrfMatch = pageResult.data.match(/<meta\s+name="csrf-token"\s+content="([^"]+)"/);
    if (!csrfMatch) {
      throw new Error('无法从页面中提取 CSRF Token');
    }
    const csrfToken = csrfMatch[1];
    console.log(`[1] ✅ CSRF Token 获取成功: ${csrfToken.substring(0, 20)}...`);

    console.log('\n[2] 执行 PUT 更新帖子...');

    const putBody = JSON.stringify({ post: { raw: UPDATE_CONTENT } });
    const tmpFile = '/tmp/update-post-body.json';
    fs.writeFileSync(tmpFile, putBody);

    const putResult = runCmd(
      `curl -sL --connect-timeout 30 --max-time 120 ` +
      `-b ${escapeShellArg(cookieStr)} ` +
      `-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" ` +
      `-H "Content-Type: application/json" ` +
      `-H "X-CSRF-Token: ${csrfToken}" ` +
      `-H "X-Requested-With: XMLHttpRequest" ` +
      `-X PUT ` +
      `-d @${tmpFile} ` +
      `"https://forum.trae.cn/posts/${POST_ID}.json"`
    );

    if (!putResult.ok) {
      throw new Error(`PUT 请求失败: ${putResult.error}`);
    }

    let responseData;
    try {
      responseData = JSON.parse(putResult.data);
    } catch (e) {
      throw new Error(`无法解析 PUT 响应: ${putResult.data.substring(0, 300)}`);
    }

    if (responseData.error || responseData.errors) {
      console.log(`\n❌ API 返回错误:`);
      console.log(JSON.stringify(responseData, null, 2).substring(0, 800));
      throw new Error('API 返回错误');
    }

    const postRaw = responseData.post?.raw || '';
    console.log(`\n✅✅✅ 帖子更新成功！✅✅✅`);
    console.log(`├── HTTP 状态码: 200 (OK)`);
    console.log(`├── 返回的 post.raw 长度: ${postRaw.length} 字符`);
    console.log(`└── Post ID: ${POST_ID}\n`);

    if (postRaw.length < 500) {
      console.log('⚠️ 警告：返回的正文长度异常短！');
      console.log(`预览: ${JSON.stringify(postRaw).substring(0, 200)}...`);
    }

    console.log('[3] 验证更新结果...');

    const verifyResult = runCmd(
      `curl -sL --connect-timeout 30 --max-time 60 ` +
      `-b ${escapeShellArg(cookieStr)} ` +
      `-H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" ` +
      `"${TOPIC_URL}"`
    );

    if (!verifyResult.ok) {
      console.log(`⚠️ 验证请求失败: ${verifyResult.error}`);
    } else {
      const html = verifyResult.data;
      const checks = {
        '实战案例': html.includes('实战案例'),
        '社区痛点': html.includes('社区痛点'),
        '协同组合': html.includes('协同组合'),
        '下载链接': html.includes('trae-forum-pro.skill')
      };

      console.log(`\n📊 页面验证结果:`);
      for (const [key, val] of Object.entries(checks)) {
        console.log(`├── 包含"${key}": ${val ? '✅' : '❌'}`);
      }

      const allPassed = Object.values(checks).every(v => v);
      if (allPassed) {
        console.log('\n🎉 所有验证通过！帖子 #17166 已成功更新为增补版本。');
      } else {
        console.log('\n⚠️ 部分关键词未找到，可能需要等待页面缓存刷新。');
      }
    }

    fs.unlinkSync(tmpFile);

  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}`);
    process.exit(1);
  }
})();
