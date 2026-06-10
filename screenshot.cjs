const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const ctx  = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 20000 });
  await page.screenshot({ path: 'C:\\Users\\inbar\\AppData\\Local\\Temp\\ss_dashboard.png' });
  console.log('screenshot: dashboard done');

  await browser.close();
})();
