const { chromium } = require('playwright');
const fs = require('fs');

const postContent = fs.readFileSync('/workspace/forum-pro-competition-post.md', 'utf-8');
const title = '【Skill 分享】trae-forum-pro — TRAE 论坛社区全能助手（搜答案/写好帖/看趋势）';
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
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  await context.addCookies(parseCookies(cookieStr, '.trae.cn'));
  const page = await context.newPage();

  try {
    // Step 1: 导航到发帖页面
    console.log('[1] 导航到 SOLO 技能创作赛板块...');
    await page.goto('https://forum.trae.cn/c/37-category/37', { 
      waitUntil: 'domcontentloaded', timeout: 60000 
    });
    await page.waitForTimeout(3000);
    
    // 点击新话题按钮
    console.log('[1] 点击新建话题...');
    await page.locator('#create-topic').click();
    await page.waitForTimeout(2000);

    // Step 2: 填写标题
    console.log('[2] 填写标题...');
    await page.locator('#reply-title').click();
    await page.locator('#reply-title').fill(title);
    console.log(`[2] 标题已填: ${title}`);
    await page.waitForTimeout(1000);

    // Step 3: 填写正文
    console.log('[3] 填写正文（ProseMirror 编辑器）...');
    
    const editor = page.locator('.d-editor-input');
    await editor.click({ force: true });
    await page.waitForTimeout(500);

    // 方案A：ProseMirror API
    const fillResult = await page.evaluate((text) => {
      const editorEl = document.querySelector('.d-editor-input');
      if (!editorEl) return { success: false, reason: 'editor not found' };
      
      const pmView = editorEl.pmViewDesc;
      if (pmView) {
        try {
          const view = pmView.view;
          const state = view.state;
          const tr = state.tr.insertText(text, state.selection.from);
          view.dispatch(tr);
          return { success: true, method: 'prosemirror-api', length: text.length };
        } catch (e) {
          return { success: false, reason: `prosemirror error: ${e.message}` };
        }
      }
      
      try {
        editorEl.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
        const content = editorEl.innerText || editorEl.textContent || '';
        return { 
          success: content.length > 0, 
          method: 'execcommand', 
          length: content.length,
          preview: content.substring(0, 50)
        };
      } catch (e) {
        return { success: false, reason: `execCommand error: ${e.message}` };
      }
    }, postContent);
    
    console.log(`[3] 填写结果: ${JSON.stringify(fillResult)}`);

    if (!fillResult.success || fillResult.length === 0) {
      // 方案B：clipboard 粘贴
      console.log('[3] 尝试 clipboard 粘贴方案...');
      await page.evaluate((text) => {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return text.length;
      }, postContent);
      
      await editor.click({ force: true });
      await page.waitForTimeout(300);
      await page.keyboard.press('Control+v');
      await page.waitForTimeout(2000);
      
      const pasteLength = await page.evaluate(() => {
        const el = document.querySelector('.d-editor-input');
        return el ? (el.innerText || el.textContent || '').length : 0;
      });
      console.log(`[3] 粘贴后内容长度: ${pasteLength}`);
    }

    // 最终验证
    const finalBodyLength = await page.evaluate(() => {
      const el = document.querySelector('.d-editor-input');
      if (!el) return 0;
      return (el.innerText || el.textContent || '').length;
    });
    console.log(`[3] 最终正文长度: ${finalBodyLength} 字符`);
    await page.screenshot({ path: '/workspace/forum-pro-step3.png' });

    if (finalBodyLength < 100) {
      console.log('[3] ⚠️ 正文内容过少，可能未成功填写！');
    }

    // Step 4: 添加标签
    console.log('[4] 添加标签...');
    try {
      const tagChooser = page.locator('.mini-tag-chooser');
      if (await tagChooser.isVisible({ timeout: 2000 })) {
        await tagChooser.click();
        await page.waitForTimeout(500);
        for (const tag of ['Skills', 'Skill创作', 'featured']) {
          await page.keyboard.type(tag);
          await page.waitForTimeout(400);
          await page.keyboard.press('ArrowDown');
          await page.waitForTimeout(200);
          await page.keyboard.press('Enter');
          await page.waitForTimeout(400);
        }
        console.log('[4] 标签已添加: Skills / Skill创作 / featured');
      }
    } catch (e) {
      console.log(`[4] 标签操作跳过: ${e.message}`);
    }

    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/workspace/forum-pro-step4.png' });

    // Step 5: 发布
    console.log('[5] 点击发布...');
    await page.screenshot({ path: '/workspace/forum-pro-step5.png' });
    
    const createBtn = page.locator('.save-or-cancel .create');
    await createBtn.click();
    console.log('[5] 已点击发布');

    // Step 6: 等待结果
    console.log('[6] 等待发布结果...');
    
    try {
      await page.waitForURL(/\/t\//, { timeout: 20000 });
      const finalUrl = page.url();
      await page.screenshot({ path: '/workspace/forum-pro-step6-success.png', fullPage: false });
      console.log(`\n========================================`);
      console.log('✅✅✅ trae-forum-pro 参赛帖发布成功！✅✅✅');
      console.log(`📎 URL: ${finalUrl}`);
      console.log('========================================');
    } catch (e) {
      await page.waitForTimeout(3000);
      const finalUrl = page.url();
      await page.screenshot({ path: '/workspace/forum-pro-step6-result.png', fullPage: false });
      console.log(`\n最终 URL: ${finalUrl}`);
      
      if (finalUrl.match(/\/t\//)) {
        console.log('\n✅ 发布成功！');
        console.log(`📎 URL: ${finalUrl}`);
      } else {
        console.log('\n⚠️ 请检查截图确认状态');
        const hints = await page.evaluate(() => {
          const elements = document.querySelectorAll('.tip-good, .tip-bad, .bootbox .modal-body, [class*="alert"]');
          return Array.from(elements).map(el => `${el.className}: ${el.textContent?.trim()}`).join('\n');
        });
        if (hints) console.log(`页面提示:\n${hints}`);
      }
    }

  } catch (error) {
    console.error(`❌ 错误: ${error.message}\n${error.stack}`);
    await page.screenshot({ path: '/workspace/forum-pro-error.png', fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
