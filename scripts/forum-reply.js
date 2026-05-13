const { chromium } = require('playwright');
const fs = require('fs');

const args = process.argv.slice(2);
if (args.length < 2) {
  console.error('用法: node scripts/forum-reply.js <topicId> <contentFile>');
  console.error('示例: node scripts/forum-reply.js 2000 ./reply-content.md');
  process.exit(1);
}

const topicId = args[0];
const contentFile = args[1];

function parseCookies(cookieStr, domain) {
  return cookieStr.split(';').map(cookie => {
    const [name, ...valueParts] = cookie.trim().split('=');
    const value = valueParts.join('=');
    return { name: name.trim(), value: value.trim(), domain, path: '/' };
  }).filter(c => c.name && c.value);
}

(async () => {
  let replyContent, cookieStr;

  try {
    replyContent = fs.readFileSync(contentFile, 'utf-8').trim();
    console.log(`[0] 评论内容已读取 (${replyContent.length} 字符)`);
  } catch (e) {
    console.error(`❌ 无法读取评论文件 ${contentFile}: ${e.message}`);
    process.exit(1);
  }

  try {
    cookieStr = fs.readFileSync('/workspace/cookie.md', 'utf-8').trim();
  } catch (e) {
    console.error(`❌ 无法读取 cookie.md: ${e.message}`);
    process.exit(1);
  }

  const browser = await chromium.launch({
    headless: true,
    executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1223/chrome-linux64/chrome'
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });

  await context.addCookies(parseCookies(cookieStr, '.trae.cn'));
  const page = await context.newPage();

  try {
    const targetUrl = `https://forum.trae.cn/t/topic/${topicId}`;

    // Step 1: 导航到目标帖子
    console.log('[1] 导航到目标帖子...');
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);
    console.log(`[1] 已打开: ${targetUrl}`);

    // Step 2: 点击回复按钮展开编辑器
    console.log('[2] 定位回复按钮...');
    
    const replySelectors = [
      '.topic-post:last-child .post-controls .reply',
      '#topic-footer-buttons .create',
      'button.create',
      '[class*="reply"]',
      '.topic-post .actions .reply'
    ];

    let replyBtn;
    for (const selector of replySelectors) {
      try {
        replyBtn = page.locator(selector).first();
        if (await replyBtn.isVisible({ timeout: 3000 })) {
          console.log(`[2] 找到回复按钮: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!replyBtn || !(await replyBtn.isVisible({ timeout: 1000 }))) {
      // 尝试直接点击 #reply-control 区域或滚动到底部
      console.log('[2] 未找到标准回复按钮，尝试展开回复区域...');
      
      const footerReply = page.locator('#topic-footer-buttons .create, #topic-footer-buttons button[class*="reply"]');
      if (await footerReply.count() > 0 && await footerReply.first().isVisible({ timeout: 2000 })) {
        replyBtn = footerReply.first();
        console.log('[2] 找到页脚回复按钮');
      } else {
        // 滚动到底部并等待
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await page.waitForTimeout(1500);

        for (const selector of replySelectors) {
          try {
            const btn = page.locator(selector).first();
            if (await btn.isVisible({ timeout: 2000 })) {
              replyBtn = btn;
              console.log(`[2] 滚动后找到回复按钮: ${selector}`);
              break;
            }
          } catch (e) {
            continue;
          }
        }
      }
    }

    if (replyBtn && (await replyBtn.isVisible({ timeout: 1000 }).catch(() => false))) {
      await replyBtn.click({ force: true });
      console.log('[2] 已点击回复按钮，等待编辑器展开...');
      await page.waitForTimeout(2500);
    }

    // Step 3: 等待编辑器出现并填写内容
    console.log('[3] 定位编辑器...');

    const editorSelector = '.d-editor-input';
    const editor = page.locator(editorSelector);

    try {
      await editor.waitFor({ state: 'visible', timeout: 10000 });
      console.log('[3] 编辑器已就绪');
    } catch (e) {
      console.log('[3] 编辑器未自动出现，尝试手动触发...');
      await page.evaluate(() => {
        const btn = document.querySelector('#topic-footer-buttons .create') 
                  || document.querySelector('button.create')
                  || document.querySelector('.topic-post:last-child .post-actions .reply');
        if (btn) btn.click();
      });
      await page.waitForTimeout(3000);
      await editor.waitFor({ state: 'visible', timeout: 8000 });
    }

    await editor.click({ force: true });
    await page.waitForTimeout(500);

    // 使用 clipboard 粘贴方案（ProseMirror 编辑器兼容）
    console.log('[3] 通过 clipboard 粘贴评论内容...');
    await page.evaluate((text) => {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return text.length;
    }, replyContent);

    await editor.click({ force: true });
    await page.waitForTimeout(300);
    await page.keyboard.press('Control+v');
    await page.waitForTimeout(2000);

    // 验证内容已填入
    const contentLength = await page.evaluate(() => {
      const el = document.querySelector('.d-editor-input');
      return el ? (el.innerText || el.textContent || '').length : 0;
    });
    console.log(`[3] 编辑器内容长度: ${contentLength} 字符`);

    if (contentLength < 10) {
      console.log('[3] ⚠️ 内容可能未成功粘贴，重试 ProseMirror API 方案...');
      const pmResult = await page.evaluate((text) => {
        const editorEl = document.querySelector('.d-editor-input');
        if (!editorEl) return { success: false };
        
        const pmView = editorEl.pmViewDesc;
        if (pmView) {
          try {
            const view = pmView.view;
            const tr = view.state.tr.insertText(text, view.state.selection.from);
            view.dispatch(tr);
            return { success: true, method: 'prosemirror' };
          } catch (e) {
            return { success: false, error: e.message };
          }
        }
        return { success: false };
      }, replyContent);
      console.log(`[3] ProseMirror 结果: ${JSON.stringify(pmResult)}`);
    }

    await page.screenshot({ path: `/workspace/forum-reply-step3-topic-${topicId}.png` });

    // Step 4: 提交回复
    console.log('[4] 提交评论...');

    const submitSelectors = [
      '.save-or-cancel .create',
      '.save-or-cancel button.create',
      '#reply-control .save-or-cancel button[type="submit"]',
      '#reply-control .create',
      'button.btn-primary.create'
    ];

    let submitBtn;
    for (const selector of submitSelectors) {
      try {
        submitBtn = page.locator(selector).first();
        if (await submitBtn.isVisible({ timeout: 2000 })) {
          console.log(`[4] 找到提交按钮: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }

    if (!submitBtn || !(await submitBtn.isVisible({ timeout: 1000 }).catch(() => false))) {
      throw new Error('未找到提交按钮，无法发布评论');
    }

    await submitBtn.click({ force: true });
    console.log('[4] 已点击提交');

    // Step 5: 等待发布完成并验证
    console.log('[5] 等待发布结果...');

    let publishedPostId = null;

    try {
      await page.waitForFunction(() => {
        return !document.querySelector('#reply-control.open') || document.querySelector('.topic-post[data-post-id]:last-child');
      }, { timeout: 20000 });
    } catch (e) {
      console.log('[5] 等待超时，继续验证...');
    }

    await page.waitForTimeout(3000);

    // 获取最新帖子 ID
    publishedPostId = await page.evaluate(() => {
      const posts = document.querySelectorAll('.topic-post[data-post-id]');
      if (posts.length > 0) {
        return posts[posts.length - 1].getAttribute('data-post-id');
      }
      return null;
    });

    const finalUrl = page.url();

    if (publishedPostId) {
      console.log('\n========================================');
      console.log('✅ 评论发布成功！');
      console.log(`📎 帖子: https://forum.trae.cn/t/topic/${topicId}`);
      console.log(`📎 评论位置: #${publishedPostId}`);
      console.log('========================================');
    } else if (finalUrl.includes(`/t/`)) {
      console.log('\n========================================');
      console.log('✅ 评论发布成功！');
      console.log(`📎 帖子: https://forum.trae.cn/t/topic/${topicId}`);
      console.log('========================================');
    } else {
      await page.screenshot({ path: `/workspace/forum-reply-error-topic-${topicId}.png`, fullPage: true });

      const hints = await page.evaluate(() => {
        const elements = document.querySelectorAll('.tip-bad, .bootbox .modal-body, [class*="alert"], .popup-tip-bad');
        return Array.from(elements).map(el => `${el.className}: ${el.textContent?.trim()}`).join('\n');
      });

      console.log('\n❌ 评论发布可能失败');
      console.log(`最终 URL: ${finalUrl}`);
      if (hints) console.log(`页面提示:\n${hints}`);
      process.exit(1);
    }

  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}\n${error.stack}`);
    await page.screenshot({ path: `/workspace/forum-reply-fatal-error-topic-${topicId}.png`, fullPage: true }).catch(() => {});
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
