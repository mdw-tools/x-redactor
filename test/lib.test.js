const test = require('node:test');
const assert = require('node:assert');
const XR = require('../src/lib.js');

const matcher = XR.buildMatcher(XR.DEFAULT_WORDS);
const censor = (text, style = 'first') => XR.censor(text, matcher, style);

test('censors whole words, keeping the first letter', () => {
  assert.strictEqual(censor('well shit, that is crap'), 'well s***, that is c***');
});

test('is case-insensitive and keeps original case of the first letter', () => {
  assert.strictEqual(censor('FUCK this'), 'F*** this');
});

test('wildcards match prefixes and suffixes', () => {
  assert.strictEqual(censor('total bullshit'), 'total b*******');
  assert.strictEqual(censor('motherfucking'), 'm************');
  assert.strictEqual(censor('he damned it'), 'he d***** it');
});

test('tolerates stretched letters', () => {
  assert.strictEqual(censor('shiiiit'), 's******');
});

test('leaves innocent words alone', () => {
  for (const text of ['class', 'grass', 'assume', 'hello', 'shell', 'Scunthorpe', 'cocktail', 'Dickens', 'arsenal', 'Fukushima', 'cumulative']) {
    assert.strictEqual(censor(text), null, text);
  }
});

test('handles punctuation and emoji boundaries', () => {
  assert.strictEqual(censor('"shit!" 🙃 #fuck'), '"s***!" 🙃 #f***');
});

test('other mask styles', () => {
  assert.strictEqual(censor('shit', 'stars'), '****');
  assert.strictEqual(censor('shit', 'grawlix'), '#$@&');
});

test('censored output does not match again', () => {
  for (const style of ['first', 'stars', 'grawlix']) {
    assert.strictEqual(censor(censor('fuck shit damn', style), style), null, style);
  }
});

test('word list parsing ignores comments, blanks and bare wildcards', () => {
  assert.deepStrictEqual(XR.parseWords('# heading\nFoo  \n\n*\nbar* # note'), ['foo', 'bar*']);
  assert.strictEqual(XR.buildMatcher('# nothing here\n*'), null);
});

test('look-alike characters', () => {
  assert.strictEqual(censor('sh1t'), 's***');
  assert.strictEqual(censor('$hit happens'), '$*** happens');
  assert.strictEqual(censor('what an a$$'), 'what an a**');
  assert.strictEqual(censor('b!tch'), 'b****');
  assert.strictEqual(censor('h3ll no'), 'h*** no');
  assert.strictEqual(censor('fuck1ng'), 'f******');
});

test('look-alike characters leave numbers and prices alone', () => {
  for (const text of ['455', 'room 455', 'only $5', '5417', 'he11o', 'cl@ss', '(rap music)', 'email me@home']) {
    assert.strictEqual(censor(text), null, text);
  }
});

test('spelled-out words', () => {
  assert.strictEqual(censor('f.u.c.k'), 'f.*.*.*');
  assert.strictEqual(censor('this is s h i t ok'), 'this is s * * * ok');
  assert.strictEqual(censor('f-u-c-k-i-n-g'), 'f-*-*-*-*-*-*');
  assert.strictEqual(censor('F_U_C_K'), 'F_*_*_*');
});

test('spelled-out text that is not a match is left alone', () => {
  for (const text of ["it's hit or miss", 'I a m here', 'a.b.c', 'U.S.A.', 'f.u.c', 'f*ck']) {
    assert.strictEqual(censor(text), null, text);
  }
});

test('disguised Unicode', () => {
  assert.strictEqual(censor('𝐟𝐮𝐜𝐤'), '𝐟***', 'math bold');
  assert.strictEqual(censor('𝓈𝒽𝒾𝓉'), '𝓈***', 'math script');
  assert.strictEqual(censor('ｓｈｉｔ'), 'ｓ***', 'fullwidth');
  assert.strictEqual(censor('ⓕⓤⓒⓚ'), 'ⓕ***', 'circled');
  assert.strictEqual(censor('ꜰᴜᴄᴋ'), 'ꜰ***', 'small caps');
  assert.strictEqual(censor('fück'), 'f***', 'accent');
  assert.strictEqual(censor('fück'), 'f***', 'combining accent');
  assert.strictEqual(censor('s̶h̶i̶t̶'), 's***', 'strikethrough marks');
  assert.strictEqual(censor('fu​ck'), 'f***', 'zero-width space');
  assert.strictEqual(censor('fuсk'), 'f***', 'Cyrillic с');
  assert.strictEqual(censor('dаmn'), 'd***', 'Cyrillic а');
});

test('disguised Unicode keeps surrounding text intact', () => {
  assert.strictEqual(censor('oh 𝐬𝐡𝐢𝐭 🙃 ok'), 'oh 𝐬*** 🙃 ok');
  assert.strictEqual(censor('café shit'), 'café s***');
});

test('other languages are left alone', () => {
  for (const text of ['Привет, как дела? Хорошо.', 'Καλημέρα κόσμε', 'こんにちは世界', 'Straße', 'Fußball ist toll']) {
    assert.strictEqual(censor(text), null, text);
  }
});

test('censored workarounds do not match again', () => {
  for (const style of ['first', 'stars', 'grawlix']) {
    for (const text of ['a$$ sh1t', 'f.u.c.k.i.n.g', 's h i t', '𝐟𝐮𝐜𝐤', 'fu​ck']) {
      const once = censor(text, style);
      assert.notStrictEqual(once, null, `${style}: ${text}`);
      assert.strictEqual(censor(once, style), null, `${style}: ${text} -> ${once}`);
    }
  }
});
