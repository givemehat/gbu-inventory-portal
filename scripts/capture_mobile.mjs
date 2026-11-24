import { spawn } from 'child_process';
import fs from 'fs';

const chromeProc = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless',
  '--disable-gpu',
  '--remote-debugging-port=9229',
  '--no-first-run',
  '--no-default-browser-check',
  'about:blank',
]);

const outDir = '/Users/rajnishsingh/.gemini/antigravity/brain/89967de0-7683-4a45-b32a-550ba43839c5/screenshots';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

setTimeout(async () => {
  try {
    const formData = new URLSearchParams();
    formData.append('username', 'store@gbu.demo');
    formData.append('password', 'demo123');

    const loginRes = await fetch('http://127.0.0.1:8000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: formData.toString(),
    });
    const loginData = await loginRes.json();
    const token = loginData.access_token;
    const user = loginData.user;

    const pageRes = await fetch('http://127.0.0.1:9229/json/new', { method: 'PUT' });
    const page = await pageRes.json();
    const ws = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((r) => (ws.onopen = r));

    let id = 1;
    function send(method, params = {}) {
      return new Promise((res) => {
        const msgId = id++;
        const handler = (evt) => {
          const m = JSON.parse(evt.data);
          if (m.id === msgId) {
            ws.removeEventListener('message', handler);
            res(m.result);
          }
        };
        ws.addEventListener('message', handler);
        ws.send(JSON.stringify({ id: msgId, method, params }));
      });
    }

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        localStorage.setItem("gbu_token", "${token}");
        localStorage.setItem("gbu_user", JSON.stringify(${JSON.stringify(user)}));
      `,
    });

    // Mobile Phone Resolution: iPhone 14 (390 x 844)
    await send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    await send('Page.navigate', { url: 'http://127.0.0.1:5173/dashboard' });
    await new Promise((r) => setTimeout(r, 2200));

    // 1. Mobile top view
    const snap1 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${outDir}/mobile_dashboard_top.png`, Buffer.from(snap1.data, 'base64'));
    console.log('Captured mobile_dashboard_top.png');

    // 2. Open Mobile Drawer Menu by clicking hamburger button
    await send('Runtime.evaluate', {
      expression: `document.querySelector('button[aria-label="Open menu"]').click()`,
    });
    await new Promise((r) => setTimeout(r, 500));
    const snap2 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${outDir}/mobile_sidebar_open.png`, Buffer.from(snap2.data, 'base64'));
    console.log('Captured mobile_sidebar_open.png');

    // Close drawer
    await send('Runtime.evaluate', {
      expression: `document.querySelector('button[aria-label="Close navigation"]').click()`,
    });
    await new Promise((r) => setTimeout(r, 500));

    // 3. Scroll to Plot 2 (8 Schools Spend Distribution)
    await send('Runtime.evaluate', {
      expression: `document.getElementById('plot-school-consumption').scrollIntoView({ behavior: 'instant', block: 'start' })`,
    });
    await new Promise((r) => setTimeout(r, 600));
    const snap3 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${outDir}/mobile_plot2.png`, Buffer.from(snap3.data, 'base64'));
    console.log('Captured mobile_plot2.png');

    // 4. Scroll to Plot 5 (DSM Matrix)
    await send('Runtime.evaluate', {
      expression: `document.getElementById('plot-dsm-matrix').scrollIntoView({ behavior: 'instant', block: 'start' })`,
    });
    await new Promise((r) => setTimeout(r, 600));
    const snap4 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${outDir}/mobile_dsm_matrix.png`, Buffer.from(snap4.data, 'base64'));
    console.log('Captured mobile_dsm_matrix.png');

    // 5. Navigate to Stock Register Catalog on mobile
    await send('Page.navigate', { url: 'http://127.0.0.1:5173/items' });
    await new Promise((r) => setTimeout(r, 1200));
    const snap5 = await send('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(`${outDir}/mobile_catalog_items.png`, Buffer.from(snap5.data, 'base64'));
    console.log('Captured mobile_catalog_items.png');

    chromeProc.kill();
    process.exit(0);
  } catch (err) {
    console.error('Error during screenshot capture:', err);
    chromeProc.kill();
    process.exit(1);
  }
}, 1200);
