const enabled = document.getElementById('enabled');
const options = document.getElementById('options');
const style = document.getElementById('style');
const modes = document.querySelectorAll('input[name="mode"]');

chrome.storage.sync.get(XR.DEFAULT_SETTINGS, (settings) => {
  enabled.checked = settings.enabled;
  options.disabled = !settings.enabled;
  style.value = settings.style;
  modes.forEach((radio) => (radio.checked = radio.value === settings.mode));
});

enabled.addEventListener('change', () => {
  options.disabled = !enabled.checked;
  chrome.storage.sync.set({ enabled: enabled.checked });
});
style.addEventListener('change', () => chrome.storage.sync.set({ style: style.value }));
modes.forEach((radio) => radio.addEventListener('change', () => chrome.storage.sync.set({ mode: radio.value })));

document.getElementById('edit-words').addEventListener('click', (event) => {
  event.preventDefault();
  chrome.runtime.openOptionsPage();
});
