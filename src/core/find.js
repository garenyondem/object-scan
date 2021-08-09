const assert = require('assert');
const compiler = require('./compiler');
const Result = require('./find-result');
const { toPath } = require('../generic/helper');
const { getOrder } = require('./compiler');

const formatPath = (input, ctx) => (ctx.joined ? toPath(input) : [...input]);

module.exports = (haystack_, searches_, ctx) => {
  const state = {
    haystack: haystack_,
    context: ctx.context
  };
  if (ctx.beforeFn !== undefined) {
    const r = ctx.beforeFn(state);
    assert(r === undefined, 'beforeFn must not return');
  }
  const stack = [false, searches_, null, 0];
  const path = [];
  const parents = [];

  let depth;
  let segment;
  let searches;
  let isMatch;
  let haystack = state.haystack;

  const kwargs = {
    getKey: () => formatPath(path, ctx),
    get key() {
      return kwargs.getKey();
    },
    getValue: () => haystack,
    get value() {
      return kwargs.getValue();
    },
    getEntry: () => [formatPath(path, ctx), haystack],
    get entry() {
      return kwargs.getEntry();
    },
    getIsMatch: () => isMatch,
    get isMatch() {
      return kwargs.getIsMatch();
    },
    getMatchedBy: () => compiler.matchedBy(searches),
    get matchedBy() {
      return kwargs.getMatchedBy();
    },
    getExcludedBy: () => compiler.excludedBy(searches),
    get excludedBy() {
      return kwargs.getExcludedBy();
    },
    getTraversedBy: () => compiler.traversedBy(searches),
    get traversedBy() {
      return kwargs.getTraversedBy();
    },
    getGproperty: () => path[path.length - 2],
    get gproperty() {
      return kwargs.getGproperty();
    },
    getProperty: () => path[path.length - 1],
    get property() {
      return kwargs.getProperty();
    },
    getGparent: () => parents[parents.length - 2],
    get gparent() {
      return kwargs.getGparent();
    },
    getParent: () => parents[parents.length - 1],
    get parent() {
      return kwargs.getParent();
    },
    getParents: () => [...parents].reverse(),
    get parents() {
      return kwargs.getParents();
    },
    getIsCircular: () => parents.includes(haystack),
    get isCircular() {
      return kwargs.getIsCircular();
    },
    getIsLeaf: () => !(haystack instanceof Object),
    get isLeaf() {
      return kwargs.getIsLeaf();
    },
    getDepth: () => path.length,
    get depth() {
      return kwargs.getDepth();
    },
    /* getResult: <defined-below> */
    get result() {
      return kwargs.getResult();
    },
    context: state.context
  };

  const result = Result(kwargs, ctx);
  kwargs.getResult = () => result.get();

  if ('' in searches_[0] && (ctx.useArraySelector || !Array.isArray(state.haystack))) {
    stack[1] = [...stack[1], searches_[0]['']];
  }

  do {
    depth = stack.pop();
    segment = stack.pop();
    searches = stack.pop();
    isMatch = stack.pop();

    const diff = path.length - depth;
    for (let idx = 0; idx < diff; idx += 1) {
      parents.pop();
      path.pop();
    }
    if (diff === -1) {
      parents.push(haystack);
      path.push(segment);
      haystack = haystack[segment];
    } else if (segment !== null) {
      path[path.length - 1] = segment;
      haystack = parents[parents.length - 1][segment];
    } else {
      haystack = state.haystack;
    }

    if (isMatch) {
      if (ctx.filterFn === undefined || ctx.filterFn(kwargs) !== false) {
        result.onMatch();
        if (ctx.abort) {
          stack.length = 0;
        }
      }
      // eslint-disable-next-line no-continue
      continue;
    }

    if (!searches.some((s) => compiler.hasMatches(s))) {
      // eslint-disable-next-line no-continue
      continue;
    }

    const autoTraverseArray = ctx.useArraySelector === false && Array.isArray(haystack);

    if (!autoTraverseArray && compiler.isLastLeafMatch(searches)) {
      stack.push(true, searches, segment, depth);
      isMatch = true;
    }

    if (
      (ctx.breakFn === undefined || ctx.breakFn(kwargs) !== true)
      && haystack instanceof Object
    ) {
      const isArray = Array.isArray(haystack);
      const keys = Object.keys(haystack);
      if (!isArray && ctx.compareFn) {
        keys.sort(ctx.compareFn);
      }
      if (!ctx.reverse) {
        keys.reverse();
      }
      for (let kIdx = 0, kLen = keys.length; kIdx < kLen; kIdx += 1) {
        const key = keys[kIdx];
        const searchesOut = [];
        if (autoTraverseArray) {
          searchesOut.push(...searches);
          if (path.length === 0) {
            if ('' in searches[0]) {
              searchesOut.push(searches[0]['']);
            }
            searchesOut.push(...compiler
              .getValues(searches[0])
              .filter((v) => compiler.getWildcard(v).isStarRec));
          }
        } else {
          for (let sIdx = 0, sLen = searches.length; sIdx !== sLen; sIdx += 1) {
            const search = searches[sIdx];
            if (compiler.getWildcard(search).anyMatch(key)) {
              searchesOut.push(search);
            }
            const values = compiler.getValues(search);
            let eIdx = values.length;
            // eslint-disable-next-line no-plusplus
            while (eIdx--) {
              const value = values[eIdx];
              if (compiler.getWildcard(value).typeMatch(key, isArray)) {
                searchesOut.push(value);
              }
            }
          }
        }
        if (ctx.orderByNeedles) {
          searchesOut.index = Buffer.from(searchesOut.map((e) => getOrder(e)).sort());
          let checkIdx = stack.length - 3;
          const checkIdxMin = checkIdx - kIdx * 4;
          while (checkIdx !== checkIdxMin && Buffer.compare(searchesOut.index, stack[checkIdx].index) === 1) {
            checkIdx -= 4;
          }
          stack.splice(checkIdx + 3, 0, false, searchesOut, isArray ? Number(key) : key, depth + 1);
        } else {
          stack.push(false, searchesOut, isArray ? Number(key) : key, depth + 1);
        }
      }
    }
  } while (stack.length !== 0);

  state.result = result.get();
  if (ctx.afterFn !== undefined) {
    const r = ctx.afterFn(state);
    assert(r === undefined, 'afterFn must not return');
  }
  return state.result;
};
