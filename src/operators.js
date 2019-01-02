const Lazy = require("./");
const Producer = require("./producer");
/**
 * Operators
 *
 *    This is where we house all of the functions
 *    that can operator on our Lazy iterables or
 *    just helper functions like compos and curry
 */

/**
 * @param  {...function(*): *} methods
 */
const compose = (...methods) => iter =>
  methods.reduceRight((i, method) => method(i), iter);

const curry = fn => (...args) =>
  args.length >= fn.length
    ? fn(...args)
    : (...other) => curry(fn)(...args, ...other);

/**
 * @param {number} start
 * @param {number} end
 * @param {function(numbrer): any} mapper
 * @returns {Lazy}
 */
const range = (start, end = Infinity, mapper = a => a) =>
  new Lazy(function*() {
    let i = start;
    while (i <= end) {
      yield mapper(i++);
    }
  });

/**
 * @type {function(number, Lazy): Lazy}
 * @curriable
 * @param {number} num
 * @param {Iterable} iter
 * @returns {Lazy}
 */
const take = curry(
  (num, iter) =>
    new Lazy(async function*() {
      let remaining = num;
      for await (let v of iter) {
        if (!remaining) {
          break;
        }

        yield v;
        remaining--;
      }
    })
);

/**
 * @param {Iterable} arr
 * @return {Lazy}
 */
const fromArray = arr =>
  new Lazy(function*() {
    for (let v of arr) {
      yield v;
    }
  });

/**
 * @type {function(function(*):*, Lazy): Lazy}
 * @curriable
 * @param {function} fn
 * @param {Iterable} iter
 * @returns {Lazy}
 */
const map = curry(
  (fn, iter) =>
    new Lazy(async function*() {
      for await (let v of iter) {
        yield fn(v);
      }
    })
);

/**
 * @type {function(function(*, *):*, *, Lazy): Promise<*>}
 * @curriable
 * @param {function} fn
 * @param {*} start
 * @param {Iterable} iter
 * @returns {Promise<*>}
 */
const reduce = curry(async (fn, start, iter) => {
  let state = start;
  for await (let v of iter) {
    state = fn(state, v);
  }

  return state;
});

/**
 * @type {function(function(*): Lazy, Lazy): Lazy}
 * @curriable
 * @param {function} fn
 * @param {Iterable} iter
 * @returns {Lazy}
 */
const flatMap = curry(
  (fn, iter) =>
    new Lazy(async function*() {
      for await (let v of iter) {
        yield* fn(v);
      }
    })
);

/**
 * @type {function(function(*): Boolean, Lazy): Lazy}
 * @curriable
 * @param {function} pred
 * @param {Iterable} iter
 * @returns {Lazy}
 */
const filter = curry(
  (pred, iter) =>
    new Lazy(async function*() {
      for await (let v of iter) {
        if (pred(v)) {
          yield v;
        }
      }
    })
);

/**
 * @type {function(number, Lazy): Lazy}
 * @curriable
 * @param {number} num
 * @param {Iterable} iter
 * @returns {Lazy}
 */
const skip = curry(
  (num, iter) =>
    new Lazy(async function*() {
      let remaning = num;
      for await (let v of iter) {
        if (remaning) {
          remaning--;
          continue;
        }

        yield v;
      }
    })
);

const tap = curry(
  (fn, iter) =>
    new Lazy(async function*() {
      for await (let v of iter) {
        fn(v);
        yield v;
      }
    })
);

const merge = curry(
  (fn, iterA, iterB) =>
    new Lazy(async function*() {
      // We need generator functions instead of
      // iterators because we need to run them
      // both at the same time and keep pace
      // with the iterations
      const genA = iterA[Symbol.asyncIterator]();
      const genB = iterB[Symbol.asyncIterator]();
      let nodeA = genA.next();
      let nodeB = genB.next();

      while (!nodeA.done) {
        const { value: aValue } = await nodeA;
        const { value: bValue } = await nodeB;

        yield fn(aValue, bValue);

        nodeA = genA.next();
        nodeB = genB.next();
      }
    })
);

const empty = () =>
  new Lazy(function*() {
    return;
  });

/**
 *
 * @param {Promise<*>} prom
 * @returns {Lazy}
 */
const fromPromise = prom =>
  new Lazy(async function*() {
    yield prom;
  });
/**
 * @type {function(function(*): void, Lazy): void}
 * @curriable
 * @param {function} fn
 * @param {Iterable} iter
 * @returns {Lazy}
 */
const forEach = curry(async (fn, iter) => {
  for await (let v of iter) {
    fn(v);
  }
});

/**
 *
 * @param {Lazy} iter
 * @returns {Promise<Array>}
 */
const toArray = async iter => {
  const list = [];
  for await (let v of iter) {
    list.push(v);
  }

  return list;
};

/**
 * Creates a Lazy out of an event and target
 *
 * @type {function(string, EventEmitter): Lazy}
 * @curriable
 * @param {string} event - The event
 * @param {EventEmitter} target - The target that emits the event
 * @returns {Lazy}
 */
const fromEvent = curry(
  (event, target) =>
    new Lazy(async function*() {
      const producer = new Producer();

      target.on(event, producer.next);

      yield* producer;
    })
);

module.exports = {
  empty,
  merge,
  tap,
  toArray,
  forEach,
  fromPromise,
  fromArray,
  skip,
  filter,
  flatMap,
  reduce,
  map,
  take,
  range,
  compose,
  curry,
  fromEvent
};
