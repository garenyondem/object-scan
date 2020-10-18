const expect = require('chai').expect;
const { describe } = require('node-tdd');
const { defineProperty, escape, parseWildcard } = require('../../src/util/helper');

describe('Testing Helper', () => {
  describe('Testing defineProperty', () => {
    let target;
    let key;
    let value;
    beforeEach(() => {
      target = {};
      key = Symbol('key');
      value = 1;
    });

    it('Testing can overwrite with identical value', async ({ capture }) => {
      defineProperty(target, key, value);
      defineProperty(target, key, value);
      expect(target[key]).to.equal(value);
      expect(target).to.deep.equal({});
    });

    it('Testing error with different value', async ({ capture }) => {
      defineProperty(target, key, value);
      const err = await capture(() => defineProperty(target, key, value + 1));
      expect(err.message).to.equal('Cannot redefine property: Symbol(key)');
      expect(target[key]).to.equal(value);
      expect(target).to.deep.equal({});
    });

    it('Testing read-only false can overwrite with different value', async ({ capture }) => {
      defineProperty(target, key, value, false);
      defineProperty(target, key, value + 1, false);
      expect(target[key]).to.equal(value + 1);
      expect(target).to.deep.equal({});
    });
  });

  describe('Testing escape', () => {
    it('Testing basic escaping', () => {
      expect(escape('a[]')).to.equal('a\\[\\]');
    });
  });

  describe('Testing parseWildcard', () => {
    it('Testing empty', () => {
      expect(parseWildcard('')).to.deep.equal(/^$/);
    });

    it('Testing star', () => {
      expect(parseWildcard('*')).to.deep.equal(/^.*$/);
    });

    it('Testing question mark', () => {
      expect(parseWildcard('?')).to.deep.equal(/^.$/);
    });

    it('Testing escaped star', () => {
      const result = parseWildcard('pa\\*nt\\*');
      expect(result).to.deep.equal(/^pa\*nt\*$/);
      expect(result.test('pa*nt*')).to.equal(true);
    });

    it('Testing special=false, regex=true', () => {
      const result = parseWildcard('pa^');
      expect(result).to.deep.equal(/^pa\^$/);
      expect(result.test('pa^')).to.equal(true);
    });

    it('Testing special=true, regex=true', () => {
      const result = parseWildcard('pa\\[');
      expect(result).to.deep.equal(/^pa\[$/);
      expect(result.test('pa[')).to.equal(true);
    });

    it('Testing special=true, regex=false', () => {
      const result = parseWildcard('pa\\!');
      expect(result).to.deep.equal(/^pa!$/);
      expect(result.test('pa!')).to.equal(true);
    });

    it('Testing simple regex', () => {
      const result = parseWildcard('(a)');
      expect(result).to.deep.equal(/a/);
      expect(result.test('xax')).to.equal(true);
    });

    it('Testing invalid regex', () => {
      expect(() => parseWildcard('(()')).to.throw('Invalid Regex: "("');
    });
  });
});
