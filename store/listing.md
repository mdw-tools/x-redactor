# Chrome Web Store listing

Everything the developer dashboard asks for, ready to paste.
Build the upload with `scripts/package.sh` and the images with `node scripts/store-images.js`.

## Package

Upload `dist/x-redactor-<version>.zip`. Bump `version` in `manifest.json` for every new upload.

## Store listing tab

**Name** (from the manifest): Redactor for X

**Summary** (from the manifest): Censors profanity on x.com, or hides posts that contain it.

**Description:**

```
Read x.com without the swearing.

Redactor for X finds profanity in posts and handles it the way you choose:

• Censor the words in place
• Collapse the post behind a "click to show" bar
• Remove the post from your timeline

FEATURES
• Three censor styles: f***, ****, or #$@&
• Catches common workarounds: look-alike characters, spelled-out words, and fancy or disguised Unicode letters
• Leaves innocent words alone, like "class", "hello" and "Scunthorpe"
• Editable word list with wildcards and a live preview
• Never changes what you type

PRIVACY
Redactor for X runs entirely in your browser. It makes no network requests and collects no data. Your settings are stored with Chrome sync so they follow you between your own browsers.

Open source: https://github.com/mdw-tools/x-redactor

Redactor for X is an independent project and is not affiliated with or endorsed by X Corp.
```

**Category:** Social Networking (or Well-being)

**Language:** English

**Store icon:** `icons/icon128.png`

**Screenshots** (1280x800, from `store/images/`):
1. `screenshot-0-timeline-1280x800.png`
2. `screenshot-1-settings-1280x800.png`
3. `screenshot-2-word-list-1280x800.png`

**Small promo tile:** `store/images/promo-small-440x280.png`

**Homepage URL:** https://github.com/mdw-tools/x-redactor

**Support URL:** https://github.com/mdw-tools/x-redactor/issues

### The timeline screenshot

`screenshot-0-timeline` is cropped from real x.com screenshots in `store/source/`, which is git-ignored
because they show other people's posts. The crops and the blurred avatar and name are set in
`store/templates/screenshot-timeline.html`. To use new source screenshots, replace the files there
and adjust the crop offsets.

## Privacy practices tab

**Single purpose:**

```
Hides or censors profanity in posts on x.com.
```

**Permission justifications:**

- `storage`:
  ```
  Saves the user's settings: on/off, mode, censor style and word list.
  ```
- Host permissions (the content script's x.com and twitter.com matches):
  ```
  The content script reads the text of x.com pages in the browser to find and censor profanity. No page content leaves the browser.
  ```

**Remote code:** No, I am not using remote code.

**Data usage:** leave every data type unchecked, and tick all three certifications
(not sold to third parties, not used for unrelated purposes, not used for creditworthiness or lending).

**Privacy policy URL:** https://github.com/mdw-tools/x-redactor/blob/main/PRIVACY.md

## Distribution tab

**Visibility:** Public (or Unlisted to try it out first). **Regions:** All.
