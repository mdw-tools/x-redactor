const words = document.getElementById('words');
const status = document.getElementById('status');
const sample = document.getElementById('sample');
const preview = document.getElementById('preview');

let style = XR.DEFAULT_SETTINGS.style;

function updatePreview() {
  const matcher = XR.buildMatcher(words.value);
  preview.textContent = matcher ? XR.censor(sample.value, matcher, style) ?? sample.value : sample.value;
}

function flash(message) {
  status.textContent = message;
  setTimeout(() => (status.textContent = ''), 2000);
}

chrome.storage.sync.get(XR.DEFAULT_SETTINGS, (settings) => {
  style = settings.style;
  words.value = settings.words == null ? XR.DEFAULT_WORDS : settings.words;
});

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.sync.set({ words: words.value }, () => flash('Saved. Open x.com tabs will reload.'));
});

document.getElementById('reset').addEventListener('click', () => {
  words.value = XR.DEFAULT_WORDS;
  chrome.storage.sync.remove('words', () => flash('Restored the default list.'));
  updatePreview();
});

words.addEventListener('input', updatePreview);
sample.addEventListener('input', updatePreview);
