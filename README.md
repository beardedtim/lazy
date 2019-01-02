# lazy

> handle things, lazily

## Usage

```javascript
const { Lazy } = require("@beardedtim/lazy");
const infinite = new Lazy(async function*() {
  let i = 0;
  while (true) {
    yield Promise.resolve(i++);
  }
});

// NOTE: This will never end
//
// ;(async () =>{
//   for await (let v of infinite) {
//     console.log(v)
//   }
// })()

/**
 * EXAMPLES
 */

const doubleOnlyOdd = compose(
  map(n => console.log("calling map with %s", n) || n * 2),
  filter(n => console.log("calling filter with %s", n) || n % 2 !== 0)
);

toArray(doubleOnlyOdd(range(1, 5))).then(console.log);
// calling filter with 1
// calling map with 1
// calling filter with 2
// calling filter with 3
// calling map with 3
// calling filter with 4
// calling filter with 5
// calling map with 5
// [ 2, 6, 10 ]

const infiniteIterator = range(1);

const first5 = take(5, infiniteIterator);
const fiveButFromMiddle = take(5, skip(1245, infiniteIterator));

forEach(console.log, first5); // 1, 2, 3, 4, 5
forEach(console.log, fiveButFromMiddle); // 1246, 1247, 1248, 1249, 1250

const fromAPromise = fromPromise(Promise.resolve({ hello: "world" }));

toArray(fromAPromise).then(console.log); // [{ hello: 'world' }]

const doubled = map(n => n * 2, range(1, 5));
toArray(doubled).then(console.log); // [2, 4, 6, 8, 10]

const doubleTapped = map(n => n * 2, tap(console.log, range(1, 5)));

forEach(n => {
  console.log(n);
  console.log("\n");
}, doubleTapped);
// 1 -> this is due to tap
// 2 -> this is due to forEach
//
// 2
// 4
//
// 3
// 6
//
// 4
// 8
//
// 5
// 10
//

const baseIterator = range(1, 5);

const mergedIterators = merge((a, b) => [a, b], baseIterator, baseIterator);

toArray(mergedIterators).then(console.log); // [[1, 1], [2, 2], [3, 3], [4, 4], [5, 5]]

// If a is longer than b, it still keeps iterating
const longerA = merge((a, b) => [a, b], range(1, 3), range(1, 2));

toArray(longerA).then(console.log); // [[1, 1], [2, 2], [3, undefined]]

const longerAWithDefaults = merge(
  (a, b = null) => [a, b],
  range(1, 3),
  range(1, 2)
);

toArray(longerAWithDefaults).then(console.log); // [[1, 1], [2, 2], [3, null]]

toArray(empty()).then(console.log); // []

const startingIter = range(1, 5);
const mappedToDeep = map(n => range(0, n), startingIter);

toArray(mappedToDeep).then(console.log);

const mappedJustRight = flatMap(n => range(0, n), startingIter);

toArray(mappedJustRight).then(console.log);

const doubled = range(1, 5, n => n * 2);

(async () => {
  for await (let v of doubled) {
    console.log(v);
  }
})();
```

## API

- `Lazy`: A way to wrap an async generator function into an async iterable

  - Arguments:
    - `generator`: The generator function to wrap

- `Producer`: A way to create an Async Iterator out of an Observable-like
  interface.

  - Methods:
    - `next`: Emits that value into the Async Iteration
    - `complete`: Completes the iteration
    - `error`: Throws an error to the consumer and ends the iteration

- `operators`: The higher order functions that we use to manipulate or get values from the Lazy iterators

  - _You can find examples of usage inside of the `index.test.js` file._

  - Types:
    - `map: (a -> b) -> Lazy a -> Lazy b`
    - `filter: (a -> Bool) -> Lazy a -> Lazy a`
    - `reduce: (b, a -> b) -> b -> Lazy a -> Promise b`
    - `take: number -> Lazy a -> Lazy a`
    - `skip: number -> Lazy a -> Lazy a`
    - `fromArray: Array a -> Lazy a`
    - `fromPromise: Promise a -> Lazy a`
    - `forEach: (a -> void) -> Lazy a -> Promise void`
    - `empty: () -> Lazy void`
    - `merge: (a,b -> c) -> Lazy a -> Lazy b -> Lazy c`
    - `tap: (a -> void) -> Lazy a -> Lazy a`
    - `flatMap: (a -> Lazy b) -> Lazy a -> Lazy b`
    - `range: number -> number? -> (number -> a)? -> Lazy a`
    - `toArray: Lazy a -> Promise Array a`
    - `fromEvent: string -> EventEmitter a -> Lazy a`
