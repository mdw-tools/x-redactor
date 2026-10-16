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

  const WORD_CHAR = '[\\p{L}\\p{M}\\p{N}]';

  function parseWords(text) {
    return text
      .split('\n')
      .map((line) => line.replace(/#.*/, '').trim().toLowerCase())
      .filter((entry) => /[\p{L}\p{N}]/u.test(entry));
  }

  function entryToPattern(entry) {
    let pattern = '';
    for (const ch of entry) {
      if (ch === '*') pattern += '\\p{L}*';
      else if (/[\p{L}\p{N}]/u.test(ch)) pattern += ch + '+';
      else pattern += ch.replace(/[.*+?^${}()|[\]\\\/-]/g, '\\$&');
    }
    return pattern;
  }

  function buildMatcher(words) {
    const entries = parseWords(words);
    if (!entries.length) return null;
    const alternatives = entries.map(entryToPattern).join('|');
    return new RegExp(`(?<!${WORD_CHAR})(?:${alternatives})(?!${WORD_CHAR})`, 'giu');
  }

  const GRAWLIX = '#$@&%!';

  function mask(word, style) {
    const chars = Array.from(word);
    if (style === 'stars') return '*'.repeat(chars.length);
    if (style === 'grawlix') return chars.map((_, i) => GRAWLIX[i % GRAWLIX.length]).join('');
    return chars[0] + '*'.repeat(chars.length - 1);
  }

  // Returns the censored text, or null when nothing matched.
  function censor(text, matcher, style) {
    let matched = false;
    const result = text.replace(matcher, (word) => {
      matched = true;
      return mask(word, style);
    });
    return matched ? result : null;
  }

  const XR = { DEFAULT_WORDS, DEFAULT_SETTINGS, parseWords, buildMatcher, censor };
  root.XR = XR;
  if (typeof module === 'object') module.exports = XR;
})(globalThis);
