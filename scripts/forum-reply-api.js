const fs = require('fs');
const https = require('https');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('用法: node scripts/forum-reply-api.js <topicId> <contentFile>');
  process.exit(1);
}

const topicId = args[0];
const contentFile = args[1];

(async () => {
  let replyContent, cookieStr;

  try {
    replyContent = fs.readFileSync(contentFile, 'utf-8').trim();
    console.log(`[0] 评论内容已读取 (${replyContent.length} 字符)`);
  } catch (e) {
    console.error(`❌ 无法读取评论文件: ${e.message}`);
    process.exit(1);
  }

  try {
    cookieStr = fs.readFileSync('/workspace/cookie.md', 'utf-8').trim();
  } catch (e) {
    console.error(`❌ 无法读取 cookie.md: ${e.message}`);
    process.exit(1);
  }

  const baseUrl = 'https://forum.trae.cn';

  function apiRequest(path, method, body) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, baseUrl);
      const options = {
        hostname: url.hostname,
        path: url.pathname + url.search,
        method: method || 'GET',
        headers: {
          'Cookie': cookieStr,
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/javascript, */*; q=0.01',
          'X-Requested-With': 'XMLHttpRequest'
        }
      };

      if (body && method !== 'GET') {
        options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
        const postData = new URLSearchParams(body).toString();
        options.headers['Content-Length'] = Buffer.byteLength(postData);

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({ status: res.statusCode, headers: res.headers, data });
          });
        });
        req.on('error', reject);
        req.write(postData);
        req.end();
      } else {
        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            resolve({ status: res.statusCode, headers: res.headers, data });
          });
        });
        req.on('error', reject);
        req.end();
      }
    });
  }

  try {
    console.log('[1] 获取帖子信息和 CSRF token...');

    const topicRes = await apiRequest(`/t/topic/${topicId}.json`, 'GET');
    
    if (topicRes.status !== 200) {
      console.log(`❌ 获取帖子失败: HTTP ${topicRes.status}`);
      console.log(topicRes.data.substring(0, 500));
      process.exit(1);
    }

    const topicData = JSON.parse(topicRes.data);
    console.log(`[1] 帖子标题: "${topicData.title}"`);
    console.log(`[1] 帖子ID: ${topicData.id}, 回复数: ${topicData.posts_count}`);

    const csrfToken = topicData.csrf_token;
    console.log(`[2] CSRF Token: ${csrfToken ? '已获取' : '未找到'}`);

    console.log('[3] 发布评论...');
    
    const postRes = await apiRequest('/posts.json', 'POST', {
      'topic_id': topicId,
      'raw': replyContent
    });

    if (postRes.status !== 200) {
      console.log(`\n❌ 发布失败: HTTP ${postRes.status}`);
      console.log(`响应数据: ${postRes.data.substring(0, 1000)}`);
      process.exit(1);
    }

    const postData = JSON.parse(postRes.data);
    const postId = postData.id;
    const postNumber = postData.post_number;
    const topicSlug = topicData.slug;

    console.log('\n========================================');
    console.log('✅ 评论发布成功！');
    console.log(`📎 帖子: ${baseUrl}/t/topic/${topicId}`);
    console.log(`📎 评论位置: #${postId} (第 ${postNumber} 楼)`);
    console.log(`🔗 评论URL: ${baseUrl}/t/${topicSlug}/${topicId}/${postNumber}`);
    console.log('========================================');

  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}`);
    process.exit(1);
  }
})();
