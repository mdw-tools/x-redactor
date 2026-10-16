# Redactor for X

A Chrome extension that cleans up profanity on x.com. Choose one of three modes:

- **Censor** (the default): replaces the words in place, e.g. `f***`, `****` or `#$@&`.
- **Collapse**: hides posts that contain profanity behind a "click to show" bar.
- **Remove**: drops those posts from the timeline entirely.

Common workarounds are caught too: look-alike characters (`sh1t`, `a$$`), spelled-out words (`f.u.c.k`, `s h i t`), and styled or disguised Unicode letters (`𝐟𝐮𝐜𝐤`, `ｓｈｉｔ`, `fück`, zero-width characters, Cyrillic look-alikes).

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

## Publish to the Chrome Web Store

```sh
scripts/package.sh              # runs the tests, then builds dist/x-redactor-<version>.zip
node scripts/store-images.js    # renders the promo tile and screenshots into store/images/
```

The listing text, permission justifications and privacy answers are in [store/listing.md](store/listing.md). The privacy policy is [PRIVACY.md](PRIVACY.md).
