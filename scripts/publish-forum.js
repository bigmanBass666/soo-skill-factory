const { chromium } = require('playwright');
const fs = require('fs');

const postContent = fs.readFileSync('/workspace/competition-post.md', 'utf-8');
const title = '【Skill 创作】TRAE 账号安全管家 —— 多设备登录风控诊断与一键反馈全流程 Skill';
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
    // Step 1: 打开发帖页面
    console.log('[1] 导航到发帖页面...');
    await page.goto('https://forum.trae.cn/c/37-category/37', { 
      waitUntil: 'domcontentloaded', timeout: 60000 
    });
    await page.waitForTimeout(3000);
    
    // 点击新话题按钮打开编辑器
    await page.locator('#create-topic').click();
    await page.waitForTimeout(2000);

    // Step 2: 填写标题
    console.log('[2] 填写标题...');
    await page.locator('#reply-title').click();
    await page.locator('#reply-title').fill(title);
    console.log(`[2] 标题已填`);
    await page.waitForTimeout(1000);

    // Step 3: 填写正文 — 使用 ProseMirror 兼容方式
    console.log('[3] 填写正文（ProseMirror 编辑器）...');
    
    // 聚焦编辑器
    const editor = page.locator('.d-editor-input');
    await editor.click({ force: true });
    await page.waitForTimeout(500);

    // 方法：通过 Discourse API / ProseMirror 命令插入文本
    // ProseMirror 编辑器需要特殊处理
    
    // 方案A：尝试使用 Discourse 的内部 API
    const fillResult = await page.evaluate((text) => {
      const editorEl = document.querySelector('.d-editor-input');
      if (!editorEl) return { success: false, reason: 'editor not found' };
      
      // 检查是否是 ProseMirror 编辑器
      const pmView = editorEl.pmViewDesc;
      if (pmView) {
        // 是 ProseMirror 编辑器，使用其 API
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
      
      // 备用：尝试 contenteditable 的 execCommand
      try {
        editorEl.focus();
        document.execCommand('selectAll', false, null);
        document.execCommand('insertText', false, text);
        
        // 验证
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
      // 方案B：使用 clipboard 粘贴
      console.log('[3] 尝试 clipboard 粘贴方案...');
      
      // 先复制内容到剪贴板
      await page.evaluate((text) => {
        // 创建一个临时的 textarea 来设置值并选中
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        return text.length;
      }, postContent);
      
      // 在编辑器中粘贴
      await editor.click({ force: true });
      await page.waitForTimeout(300);
      
      // 使用 Ctrl+V 粘贴
      await page.keyboard.press('Control+v');
      await page.waitForTimeout(2000);
      
      // 验证
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
      // ProseMirror 内容在 innerText 或 innerHTML 中
      return (el.innerText || el.textContent || '').length;
    });
    console.log(`[3] ✅ 最终正文长度: ${finalBodyLength} 字符`);

    await page.screenshot({ path: '/workspace/step3-body.png' });

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
    await page.screenshot({ path: '/workspace/step4-ready.png' });

    // Step 5: 发布
    console.log('[5] 点击发布...');
    await page.screenshot({ path: '/workspace/step5-before-publish.png' });
    
    const createBtn = page.locator('.save-or-cancel .create');
    await createBtn.click();
    console.log('[5] 已点击发布');

    // Step 6: 等待结果
    console.log('[6] 等待发布结果...');
    
    let published = false;
    
    // 监听导航事件
    page.on('framenavigated', () => {
      console.log(`[6] 导航到: ${page.url()}`);
    });

    try {
      // 等待 URL 变为话题页面
      await page.waitForURL(/\/t\//, { timeout: 20000 });
      published = true;
    } catch (e) {
      // 检查是否有弹窗或提示
      await page.waitForTimeout(3000);
    }

    const finalUrl = page.url();
    await page.screenshot({ path: '/workspace/step6-result.png', fullPage: false });

    console.log(`\n最终 URL: ${finalUrl}`);
    
    if (finalUrl.match(/\/t\//)) {
      console.log('\n========================================');
      console.log('✅✅✅ 发布成功！✅✅✅');
      console.log(`📎 帖子 URL: ${finalUrl}`);
      console.log('========================================');
    } else {
      console.log('\n⚠️ 请检查截图确认状态');
      // 尝试获取页面上的提示信息
      const hints = await page.evaluate(() => {
        const elements = document.querySelectorAll('.tip-good, .tip-bad, .bootbox .modal-body, .dialog-body, [class*="alert"], [class*="error"], [class*="notice"]');
        return Array.from(elements).map(el => `${el.className}: ${el.textContent?.trim()}`).join('\n');
      });
      if (hints) console.log(`\n页面提示:\n${hints}`);
    }

  } catch (error) {
    console.error(`\n❌ 错误: ${error.message}\n${error.stack}`);
    await page.screenshot({ path: '/workspace/error-final.png', fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
