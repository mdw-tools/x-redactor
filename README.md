# X Redactor

A Chrome extension that cleans up profanity on x.com. Choose one of three modes:

- **Censor** (the default): replaces the words in place, e.g. `f***`, `****` or `#$@&`.
- **Collapse**: hides posts that contain profanity behind a "click to show" bar.
- **Remove**: drops those posts from the timeline entirely.

Text across the whole page is censored in every mode, including names, trends and the tab title. Text you are typing is never changed.

## Install

1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick this folder.
3. Pin the extension and click its icon to choose a mode. Open x.com tabs reload when settings change.

Use **Edit word list…** in the popup to change which words are filtered. Patterns support `*` wildcards and include a live preview.

## Test

```sh
node --test test/
```
