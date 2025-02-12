import { describe } from 'node-tdd';
import { expect } from 'chai';
import simplifyNeedleParsed from '../helper/simplify-needle-parsed.js';

describe('Testing simplify-needle-parsed.js', () => {
  it('Testing nested set', () => {
    const needle = new Set([new Set([new Set([1])])]);
    expect(simplifyNeedleParsed(needle)).to.deep.equal(1);
  });

  it('Testing nested array', () => {
    const needle = [[[1]]];
    expect(simplifyNeedleParsed(needle)).to.deep.equal(1);
  });

  it('Testing nested multi set', () => {
    const needle = new Set([new Set([new Set([1, 2])])]);
    expect(simplifyNeedleParsed(needle)).to.deep.equal(new Set([1, 2]));
  });

  it('Testing nested multi array', () => {
    const needle = [[[1, 2]]];
    expect(simplifyNeedleParsed(needle)).to.deep.equal([1, 2]);
  });

  it('Testing array simplification', () => {
    const needle = [[[1, 2], [1]]];
    expect(simplifyNeedleParsed(needle)).to.deep.equal([1, 2, 1]);
  });

  it('Testing set simplification', () => {
    const needle = new Set([new Set([new Set([1, 2]), new Set([1])])]);
    expect(simplifyNeedleParsed(needle)).to.deep.equal(new Set([1, 2]));
  });

  it('Testing empty array in set is not merged', () => {
    const needle = new Set([[]]);
    expect(simplifyNeedleParsed(needle)).to.deep.equal(new Set([[]]));
  });

  it('Testing correct merge order', () => {
    const needle = new Set([[1], [2], [1]]);
    const r = simplifyNeedleParsed(needle);
    expect([...r]).to.deep.equal([2, 1]);
  });
});
