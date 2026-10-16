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
