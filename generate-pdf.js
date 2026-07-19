const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  const filePath = path.join(__dirname, 'index.html');
  
  console.log('Loading quest log page...');
  await page.goto('file://' + filePath, { waitUntil: 'networkidle0' });
  
  console.log('Generating A4 PDF...');
  const pdfPath = path.join(__dirname, 'wedding_quest_log.pdf');
  await page.pdf({
    path: pdfPath,
    format: 'A4',
    printBackground: true, // Forces background parchment texture to print
    margin: {
      top: '0px',
      bottom: '0px',
      left: '0px',
      right: '0px'
    }
  });

  console.log('PDF successfully generated at: ' + pdfPath);
  await browser.close();
})().catch(err => {
  console.error('Error generating PDF:', err);
  process.exit(1);
});
