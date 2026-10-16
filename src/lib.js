// Shared matching logic, used by the content script, the options page and the tests.
(function (root) {
  // One entry per line. '#' starts a comment.
  // An entry matches as a whole word, case-insensitively. '*' matches any run of letters,
  // so 'damn*' matches 'damned' and '*shit*' matches 'bullshit'.
  // Repeated letters are tolerated, so 'shit' also matches 'shiiit'.
  const DEFAULT_WORDS = `# strong
*fuck*
fck*
*shit*
*bitch*
cunt*
twat*
motherf*
cocksuck*
cock
cocks
dick
dicks
dickhead*
prick
pricks
pussy
pussies
bastard*
slut*
whore*
wank
wanker*
wanking
jizz*
tits
titties

# ass and friends (explicit, so 'class' and 'grass' stay clean)
ass
asses
asshole*
asshat*
asswipe*
jackass*
dumbass*
smartass*
fatass*
badass*
kickass*
arse
arses
arsehole*

# mild
damn*
goddam*
hell
crap
crappy
crapped
piss*
douche*
bollock*
bugger*

# abbreviations
wtf
stfu
gtfo

# slurs
nigger*
nigga*
faggot*
fag
fags
retard
retards
retarded
`;

  const DEFAULT_SETTINGS = {
    enabled: true,
    mode: 'censor', // 'censor' | 'collapse' | 'remove'
    style: 'first', // 'first' | 'stars' | 'grawlix'
    words: null, // null means DEFAULT_WORDS
  };


  // --- Normalization: undo disguises before matching -----------------------------------------

  // Letters from other alphabets (and small caps) that look like Latin ones.
  const HOMOGLYPHS = {
    // Cyrillic
    а: 'a', в: 'b', с: 'c', ԁ: 'd', е: 'e', һ: 'h', н: 'h', і: 'i', ј: 'j', к: 'k', ӏ: 'l', м: 'm',
    о: 'o', р: 'p', ѕ: 's', т: 't', у: 'y', х: 'x',
    // Greek
    α: 'a', β: 'b', ε: 'e', η: 'n', ι: 'i', κ: 'k', ν: 'v', ο: 'o', ρ: 'p', τ: 't', υ: 'u', χ: 'x',
    // Small caps
    ᴀ: 'a', ʙ: 'b', ᴄ: 'c', ᴅ: 'd', ᴇ: 'e', ꜰ: 'f', ɢ: 'g', ʜ: 'h', ɪ: 'i', ᴊ: 'j', ᴋ: 'k', ʟ: 'l',
    ᴍ: 'm', ɴ: 'n', ᴏ: 'o', ᴘ: 'p', ʀ: 'r', ꜱ: 's', ᴛ: 't', ᴜ: 'u', ᴠ: 'v', ᴡ: 'w', ʏ: 'y', ᴢ: 'z',
    // Latin letters with strokes, which Unicode doesn't decompose
    ø: 'o', ł: 'l', đ: 'd', ı: 'i',
  };

  const normalized = new Map();

  // Maps one character to its plain form: '𝐟', 'ｆ', 'ⓕ' and 'ꜰ' become 'f', 'ü' becomes 'u',
  // and combining marks and invisible characters (zero-width space, etc.) become ''.
  function normalizeChar(ch) {
    if (ch < '\x80') return ch;
    let plain = normalized.get(ch);
    if (plain === undefined) {
      plain = ch.toLowerCase().normalize('NFKD').replace(/[\p{M}\p{Cf}]/gu, '');
      plain = Array.from(plain, (c) => HOMOGLYPHS[c] ?? c).join('');
      normalized.set(ch, plain);
    }
    return plain;
  }

  // Returns the normalized text, plus enough bookkeeping to map matches back to the original.
  function normalize(text) {
    const chars = Array.from(text);
    const plain = chars.map(normalizeChar);
    const origin = []; // origin[i] is the index in chars of normalized code unit i
    plain.forEach((p, i) => {
      for (let k = 0; k < p.length; k++) origin.push(i);
    });
    return { chars, plain, text: plain.join(''), origin };
  }

  // --- Matching ---------------------------------------------------------------------------------

  // Look-alike characters accepted in place of a letter: 'sh1t', '$hit', 'a$$', 'b!tch'.
  const LEET = { a: 'a4@', b: 'b8', e: 'e3', g: 'g9', i: 'i1!|', l: 'l1|', o: 'o0', s: 's5$', t: 't7' };

  const WORD_CHAR = '[\\p{L}\\p{M}\\p{N}]';
  const WILDCARD = '[\\p{L}\\p{N}]*';
  const LETTERISH = '[\\p{L}\\p{N}@$!|]';
  const SEPARATOR = '[.\\-_ *~]';

  // Three or more single characters split by the same separator: 'f.u.c.k', 's h i t'.
  const SPELLED_OUT = new RegExp(
    `(?<!${LETTERISH})${LETTERISH}(${SEPARATOR})${LETTERISH}(?:\\1${LETTERISH})+(?!${LETTERISH})`,
    'gu',
  );

  function parseWords(text) {
    return text
      .split('\n')
      .map((line) => Array.from(line.replace(/#.*/, '').trim(), normalizeChar).join('').toLowerCase())
      .filter((entry) => /[\p{L}\p{N}]/u.test(entry));
  }

  function entryToPattern(entry) {
    let pattern = '';
    for (const ch of entry) {
      if (ch === '*') pattern += WILDCARD;
      else if (LEET[ch]) pattern += `[${LEET[ch]}]+`;
      else if (/[\p{L}\p{N}]/u.test(ch)) pattern += ch + '+';
      else pattern += ch.replace(/[.*+?^${}()|[\]\\\/-]/g, '\\$&');
    }
    return pattern;
  }

  function buildMatcher(words) {
    const entries = parseWords(words);
    if (!entries.length) return null;
    const alternatives = entries.map(entryToPattern).join('|');
    return {
      word: new RegExp(`(?<!${WORD_CHAR})(?:${alternatives})(?!${WORD_CHAR})`, 'giu'),
      exact: new RegExp(`^(?:${alternatives})$`, 'iu'),
    };
  }

  // A match must contain a real letter, so numbers like '455' or '$5' are never censored.
  const hasLetter = (text) => /\p{L}/u.test(text);

  // Returns [start, end) ranges in the normalized text.
  function findMatches(text, matcher) {
    const ranges = [];
    for (const m of text.matchAll(matcher.word)) {
      if (hasLetter(m[0])) ranges.push([m.index, m.index + m[0].length]);
    }
    for (const m of text.matchAll(SPELLED_OUT)) {
      const joined = m[0].split(m[1]).join('');
      if (hasLetter(joined) && matcher.exact.test(joined)) ranges.push([m.index, m.index + m[0].length]);
    }
    return ranges.sort((a, b) => a[0] - b[0]);
  }

  // --- Censoring --------------------------------------------------------------------------------

  const GRAWLIX = '#$@&%!';
  const IS_SEPARATOR = new RegExp(`^${SEPARATOR}$`, 'u');

  // Masks the original characters of one match. Separators are kept ('f.*.*.*') and
  // invisible characters and combining marks are dropped.
  function mask(chars, plain, style) {
    let n = 0;
    return chars
      .map((ch, i) => {
        if (plain[i] === '') return '';
        if (IS_SEPARATOR.test(plain[i])) return ch;
        const k = n++;
        if (style === 'stars') return '*';
        if (style === 'grawlix') return GRAWLIX[k % GRAWLIX.length];
        return k === 0 ? ch : '*';
      })
      .join('');
  }

  // Returns the censored text, or null when nothing matched.
  function censor(text, matcher, style) {
    const n = normalize(text);
    const ranges = findMatches(n.text, matcher);
    if (!ranges.length) return null;

    let result = '';
    let done = 0; // index in n.chars up to which the result is written
    for (const [start, end] of ranges) {
      const from = n.origin[start];
      if (from < done) continue; // overlaps the previous match
      let to = n.origin[end - 1] + 1;
      while (to < n.chars.length && n.plain[to] === '') to++; // trailing marks, e.g. glitch text
      result += n.chars.slice(done, from).join('') + mask(n.chars.slice(from, to), n.plain.slice(from, to), style);
      done = to;
    }
    return result + n.chars.slice(done).join('');
  }

  const XR = { DEFAULT_WORDS, DEFAULT_SETTINGS, parseWords, buildMatcher, censor };
  root.XR = XR;
  if (typeof module === 'object') module.exports = XR;
})(globalThis);
