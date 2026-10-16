// Renders the Chrome Web Store images into store/images with headless Chrome (or Brave).
// Usage: node scripts/store-images.js   (set CHROME=/path/to/browser to pick a browser)
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const root = path.join(__dirname, '..');
const src = path.join(root, 'src');
const store = path.join(root, 'store');
const preview = path.join(store, '.preview');
const images = path.join(store, 'images');

const BROWSERS = [
  process.env.CHROME,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
];
const browser = BROWSERS.find((b) => b && fs.existsSync(b));
if (!browser) throw new Error('No Chrome-like browser found. Set CHROME=/path/to/browser.');

// The extension pages expect the chrome.* APIs, so give them just enough to render.
const STUB = `<base href="${src}/">
<script>
  window.chrome = {
    storage: { sync: { get: (defaults, callback) => callback(defaults), set() {}, remove() {} } },
    runtime: { openOptionsPage() {} },
  };
</script>`;

// The options page is shown with the mild part of the list and a sample of workarounds being caught.
const OPTIONS_DEMO = `<script>
  document.getElementById('words').value = '# mild\\ndamn*\\ngoddam*\\nhell\\ncrap\\ncrappy\\ncrapped\\npiss*';
  document.getElementById('sample').value = 'Well d4mn, what the h.e.l.l is this 𝐜𝐫𝐚𝐩?';
  document.getElementById('sample').dispatchEvent(new Event('input'));
</script>`;

function writePreview(name, extra = '') {
  const html = fs
    .readFileSync(path.join(src, name), 'utf8')
    .replace('<head>', `<head>\n${STUB}`)
    .replace('</body>', `${extra}\n</body>`);
  fs.writeFileSync(path.join(preview, name), html);
}

function render(template, out, width, height) {
  execFileSync(browser, [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--allow-file-access-from-files',
    `--window-size=${width},${height}`,
    `--screenshot=${path.join(images, out)}`,
    'file://' + path.join(store, 'templates', template),
  ], { stdio: 'ignore' });
  console.log(`store/images/${out}`);
}

fs.mkdirSync(preview, { recursive: true });
fs.mkdirSync(images, { recursive: true });
writePreview('popup.html');
writePreview('options.html', OPTIONS_DEMO);

render('promo-small.html', 'promo-small-440x280.png', 440, 280);
// Built from real x.com screenshots, which are kept out of git because they show other people's posts.
if (fs.existsSync(path.join(store, 'source', 'timeline-censored.png'))) {
  render('screenshot-timeline.html', 'screenshot-0-timeline-1280x800.png', 1280, 800);
}
render('screenshot-settings.html', 'screenshot-1-settings-1280x800.png', 1280, 800);
render('screenshot-word-list.html', 'screenshot-2-word-list-1280x800.png', 1280, 800);
