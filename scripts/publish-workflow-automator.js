const { chromium } = require('playwright');
const fs = require('fs');

const postContent = fs.readFileSync('/workspace/trae-workflow-automator-competition-post.md', 'utf-8');
const title = '【技能创作赛】trae-workflow-automator — 造 Skill 的 Skill，从构思到发布一站搞定';
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
    executablePath: undefined
  });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  await context.addCookies(parseCookies(cookieStr, '.trae.cn'));
  const page = await context.newPage();

  try {
    console.log('[1] 导航到 SOLO 技能创作赛板块...');
    await page.goto('https://forum.trae.cn/c/37-category/37', { 
      waitUntil: 'domcontentloaded', timeout: 60000 
    });
    await page.waitForTimeout(3000);
    
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: '/workspace/workflow-automator-debug.png', fullPage: true });
    
    const loginCheck = await page.evaluate(() => {
      const userMenu = document.querySelector('.header-dropdown-toggle.current-user');
      const loginBtn = document.querySelector('.login-button');
      const createTopic = document.querySelector('#create-topic');
      return {
        hasUserMenu: !!userMenu,
        hasLoginBtn: !!loginBtn,
        hasCreateTopic: !!createTopic,
        title: document.title,
        url: window.location.href
      };
    });
    console.log('[DEBUG] 页面状态:', JSON.stringify(loginCheck, null, 2));
    
    if (!loginCheck.hasCreateTopic) {
      console.log('❌ 未找到 #create-topic 按钮，可能 Cookie 已过期或未登录');
      if (loginCheck.hasLoginBtn) {
        console.log('❌ 页面显示登录按钮，确认未登录');
      }
      await browser.close();
      process.exit(1);
    }
    
    console.log('[1] 点击新建话题...');
    await page.locator('#create-topic').click();
    await page.waitForTimeout(2000);

    console.log('[2] 填写标题...');
    await page.locator('#reply-title').click();
    await page.locator('#reply-title').fill(title);
    console.log(`[2] 标题已填: ${title}`);
    await page.waitForTimeout(1000);

    console.log('[3] 填写正文（clipboard 粘贴方案）...');
    
    const editor = page.locator('.d-editor-input');
    await editor.click({ force: true });
    await page.waitForTimeout(500);

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
    await page.waitForTimeout(3000);
    
    const bodyLength = await page.evaluate(() => {
      const el = document.querySelector('.d-editor-input');
      return el ? (el.innerText || el.textContent || '').length : 0;
    });
    console.log(`[3] 正文长度: ${bodyLength} 字符`);
    await page.screenshot({ path: '/workspace/workflow-automator-step3.png' });

    if (bodyLength < 100) {
      console.log('[3] ⚠️ 正文内容过少，尝试 ProseMirror API...');
      const fillResult = await page.evaluate((text) => {
        const editorEl = document.querySelector('.d-editor-input');
        if (!editorEl) return { success: false, reason: 'editor not found' };
        try {
          editorEl.focus();
          document.execCommand('selectAll', false, null);
          document.execCommand('insertText', false, text);
          const content = editorEl.innerText || editorEl.textContent || '';
          return { success: content.length > 0, method: 'execcommand', length: content.length };
        } catch (e) {
          return { success: false, reason: e.message };
        }
      }, postContent);
      console.log(`[3] ProseMirror 结果: ${JSON.stringify(fillResult)}`);
    }

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
        console.log('[4] 标签已添加');
      }
    } catch (e) {
      console.log(`[4] 标签操作跳过: ${e.message}`);
    }

    await page.waitForTimeout(1000);

    console.log('[5] 点击发布...');
    const createBtn = page.locator('.save-or-cancel .create');
    await createBtn.click();
    console.log('[5] 已点击发布');

    console.log('[6] 等待发布结果...');
    try {
      await page.waitForURL(/\/t\//, { timeout: 20000 });
      const finalUrl = page.url();
      await page.screenshot({ path: '/workspace/workflow-automator-success.png', fullPage: false });
      console.log(`\n========================================`);
      console.log('✅ trae-workflow-automator 参赛帖发布成功！');
      console.log(`📎 URL: ${finalUrl}`);
      console.log('========================================');
    } catch (e) {
      await page.waitForTimeout(3000);
      const finalUrl = page.url();
      await page.screenshot({ path: '/workspace/workflow-automator-result.png', fullPage: false });
      console.log(`\n最终 URL: ${finalUrl}`);
      
      if (finalUrl.match(/\/t\//)) {
        console.log('\n✅ 发布成功！');
        console.log(`📎 URL: ${finalUrl}`);
      } else {
        console.log('\n⚠️ 请检查截图确认状态');
      }
    }

  } catch (error) {
    console.error(`❌ 错误: ${error.message}\n${error.stack}`);
    await page.screenshot({ path: '/workspace/workflow-automator-error.png', fullPage: true }).catch(() => {});
  } finally {
    await browser.close();
  }
})();
