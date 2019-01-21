const { Lazy, Producer, operators } = require("./");
const EE = require("events");

describe("Lazy", () => {
  it("creates an async iterable out of a generator function", async done => {
    const gen = function*() {
      yield 1;
      yield 2;
    };

    const lazy = new Lazy(gen);
    const values = [];

    for await (let v of lazy) {
      values.push(v);
    }

    expect(values).toEqual([1, 2]);
    return done();
  });
});

describe("Producer", () => {
  it("is a Lazy", () => {
    const producer = new Producer();

    expect(producer instanceof Lazy).toBe(true);
  });

  it("produces a new value to the iteration when next is called", done => {
    const producer = new Producer();
    const message = {};

    operators.forEach(value => {
      expect(value).toBe(message);
      return done();
    }, producer);

    producer.next(message);
  });

  it("does not produce values after complete is called", done => {
    const producer = new Producer();
    const message = {};

    operators.toArray(producer).then(values => {
      expect(values.length).toBe(1);
      return done();
    });

    producer.next(message);
    producer.complete();
    producer.next(message);
  });

  it("does not produce values after error is called", done => {
    const producer = new Producer();
    const message = {};

    operators.toArray(producer).then(values => {
      expect(values.length).toBe(1);
      return done();
    });

    producer.next(message);
    producer.error();
    producer.next(message);
  });

  it("produces an error when error is called", async done => {
    const producer = new Producer();
    const message = {};

    setTimeout(() => producer.error(message), 100);

    try {
      for await (let v of producer) {
        expect(v).not.toBeDefined();
      }
    } catch (e) {
      expect(e).toBe(message);
    } finally {
      done();
    }
  });
});

describe("Operators", () => {
  describe("map", () => {
    it("returns a new Lazy", async done => {
      const gen = function*() {
        yield 1;
        yield 2;
      };

      const lazy = new Lazy(gen);
      const mapped = operators.map(n => n * 2, lazy);

      expect(mapped instanceof Lazy).toBe(true);

      return done();
    });

    it("transform each iteration by the given function", async done => {
      const gen = function*() {
        yield 1;
        yield 2;
      };

      const lazy = new Lazy(gen);
      const mapped = operators.map(n => n * 2, lazy);

      const values = [];
      for await (let v of mapped) {
        values.push(v);
      }

      expect(values).toEqual([2, 4]);

      return done();
    });
  });

  describe("filter", () => {
    it("returns a new Lazy", async done => {
      const gen = function*() {
        yield 1;
        yield 2;
      };

      const lazy = new Lazy(gen);
      const filtered = operators.filter(n => n > 1, lazy);

      expect(filtered instanceof Lazy).toBe(true);

      return done();
    });

    it("returns an iterator of only values that pass the predicate", async done => {
      const gen = function*() {
        yield 1;
        yield 2;
      };

      const lazy = new Lazy(gen);
      const filtered = operators.filter(n => n > 1, lazy);

      const values = [];
      for await (let v of filtered) {
        values.push(v);
      }

      expect(values).toEqual([2]);

      return done();
    });
  });

  describe("tap", () => {
    it("returns a new Lazy", async done => {
      const gen = function*() {
        yield 1;
        yield 2;
      };

      const lazy = new Lazy(gen);
      const tapped = operators.tap(n => n > 1, lazy);

      expect(tapped instanceof Lazy).toBe(true);

      return done();
    });

    it("calls the function for each iteration", async done => {
      const gen = function*() {
        yield 1;
        yield 2;
      };

      const fn = jest.fn();

      const lazy = new Lazy(gen);
      const tapped = operators.tap(fn, lazy);

      for await (let _ of tapped) {
      }

      expect(fn).toHaveBeenCalledTimes(2);

      return done();
    });
  });

  describe("take", () => {
    it("returns a Lazy", () => {
      const gen = function*() {};
      const lazy = new Lazy(gen);
      const took = operators.take(2, lazy);

      expect(took instanceof Lazy).toBe(true);
    });

    it("returns an iterable that only takes the first n values of the passed in iterable", async done => {
      const gen = function*() {
        yield 1;
        yield 2;
        yield 3;
        yield 4;
      };

      const lazy = new Lazy(gen);
      const took = operators.take(2, lazy);

      const values = [];
      for await (let v of took) {
        values.push(v);
      }

      expect(values).toEqual([1, 2]);

      return done();
    });

    it("stops if n is larger than the given iterable", async done => {
      const gen = function*() {
        yield 1;
        yield 2;
      };

      const lazy = new Lazy(gen);
      const took = operators.take(4, lazy);

      const values = [];
      for await (let v of took) {
        values.push(v);
      }

      expect(values).toEqual([1, 2]);

      return done();
    });
  });

  describe("range", () => {
    it("returns a Lazy", () => {
      const lazy = operators.range(1);

      expect(lazy instanceof Lazy).toBe(true);
    });

    it("defaults to an interable of start -> Infinity", async done => {
      const lazy = operators.range(1);

      const took = operators.take(1000, lazy);
      const values = [];

      for await (let v of took) {
        values.push(v);
      }

      expect(values.length).toBe(1000);

      return done();
    });

    it("creates an iterable from start to end inclusive", async done => {
      const lazy = operators.range(1, 5);

      const values = [];

      for await (let v of lazy) {
        values.push(v);
      }

      expect(values).toEqual([1, 2, 3, 4, 5]);

      return done();
    });

    it("maps each item given the transformer", async done => {
      const lazy = operators.range(1, 5, n => n * 2);

      const values = [];

      for await (let v of lazy) {
        values.push(v);
      }

      expect(values).toEqual([2, 4, 6, 8, 10]);

      return done();
    });
  });

  describe("reduce", () => {
    it("returns a promise", () => {
      const lazy = operators.empty();
      const reduced = operators.reduce(a => a, {}, lazy);

      expect(reduced.then).toBeDefined();
    });

    it("reduces the async iterator into a single value", async done => {
      const lazy = operators.range(1, 5);
      const reduced = operators.reduce((a, c) => a + c, 0, lazy);

      return reduced.then(value => expect(value).toBe(15)).then(done);
    });
  });

  describe("flatMap", () => {
    it("returns a Lazy", () => {
      const lazy = operators.range(1, 5);
      const flattened = operators.flatMap(num => range(0, num), lazy);

      expect(flattened instanceof Lazy).toBe(true);
    });

    it("maps over an iterator, flattening the return value", async done => {
      const lazy = operators.range(1, 5);
      const flattened = operators.flatMap(num => operators.range(0, num), lazy);

      const values = [];
      for await (let v of flattened) {
        values.push(v);
      }

      expect(values).toEqual([
        0,
        1,
        0,
        1,
        2,
        0,
        1,
        2,
        3,
        0,
        1,
        2,
        3,
        4,
        0,
        1,
        2,
        3,
        4,
        5
      ]);

      return done();
    });
  });

  describe("skip", () => {
    it("returns a Lazy", () => {
      const lazy = operators.range(1);
      const skipped = operators.skip(5, lazy);

      expect(skipped instanceof Lazy).toBe(true);
    });

    it("skips the first n numbers of items", async done => {
      const lazy = operators.range(1, 5);
      const skipped = operators.skip(1, lazy);

      const values = [];
      for await (let v of skipped) {
        values.push(v);
      }

      expect(values).toEqual([2, 3, 4, 5]);

      return done();
    });

    it("returns an empty Lazy if skipped too many", async done => {
      const lazy = operators.range(1, 2);
      const skipped = operators.skip(4, lazy);

      const values = [];
      for await (let v of skipped) {
        values.push(v);
      }

      expect(values).toEqual([]);

      return done();
    });
  });

  describe("fromArray", () => {
    it("returns a Lazy", () => {
      const lazy = operators.fromArray([]);
      expect(lazy instanceof Lazy).toBe(true);
    });

    it("creates a Lazy from the given array values", async done => {
      const arr = [1, 2, 3];
      const lazy = operators.fromArray(arr);

      const values = [];
      for await (let v of lazy) {
        values.push(v);
      }

      expect(values).toEqual(arr);

      return done();
    });

    it("creates a Lazy from a given iterable", async done => {
      const arr = new Set([1, 2, 3]);
      const lazy = operators.fromArray(arr);

      const values = [];
      for await (let v of lazy) {
        values.push(v);
      }

      expect(values).toEqual([...arr]);

      return done();
    });
  });

  describe("fromPromise", () => {
    it("returns a Lazy", () => {
      const lazy = operators.fromPromise(Promise.resolve({}));

      expect(lazy instanceof Lazy).toBe(true);
    });

    it("returns a Lazy of the promise", async done => {
      const value = {};
      const lazy = operators.fromPromise(Promise.resolve(value));

      const values = [];
      for await (let v of lazy) {
        values.push(v);
      }

      expect(values).toEqual([value]);

      return done();
    });
  });

  describe("forEach", () => {
    it("returns a Promise", () => {
      const lazy = operators.range(1, 5);
      const eached = operators.forEach(() => {}, lazy);

      expect(eached.then).toBeDefined();
    });

    it("calls a function for each Lazy item", async done => {
      const lazy = operators.range(1, 5);
      const fn = jest.fn();

      return operators
        .forEach(fn, lazy)
        .then(() => expect(fn).toHaveBeenCalledTimes(5))
        .then(done);
    });
  });

  describe("toArray", () => {
    it("returns an array of the Lazy values", async done => {
      const range = operators.range(1, 5);

      return operators
        .toArray(range)
        .then(list => expect(list).toEqual([1, 2, 3, 4, 5]))
        .then(done);
    });
  });

  describe("empty", () => {
    it("returns a Lazy", () => {
      const empty = operators.empty();

      expect(empty instanceof Lazy).toBe(true);
    });

    it("returns an empty iterable", done => {
      const empty = operators.empty();

      operators
        .toArray(empty)
        .then(list => expect(list).toEqual([]))
        .then(done);
    });
  });

  describe("merge", () => {
    it("returns a Lazy", () => {
      const merged = operators.merge(
        (a, b) => a,
        operators.range(1, 2),
        operators.range(1, 2)
      );

      expect(merged instanceof Lazy).toBe(true);
    });

    it("merges the two iterators together by the given function", done => {
      const itera = operators.range(1, 2);
      const iterb = operators.range(1, 2);
      const merged = operators.merge((a, b) => a + b, itera, iterb);

      return operators
        .toArray(merged)
        .then(list => expect(list).toEqual([2, 4]))
        .then(done);
    });

    it("will stop merging once a is done", done => {
      const itera = operators.range(1, 2);
      const iterb = operators.range(1);
      const merged = operators.merge((a, b) => a + b, itera, iterb);

      return operators
        .toArray(merged)
        .then(list => expect(list).toEqual([2, 4]))
        .then(done);
    });
  });

  describe("fromEvent", () => {
    it("returns a Lazy", () => {
      const lazy = operators.fromEvent("event", {});

      expect(lazy instanceof Lazy).toBe(true);
    });

    it("returns an iterator of the events of the given emitter", async done => {
      const event = new EE();

      const iter = operators.fromEvent("event", event);
      const message = {};

      operators.forEach(value => {
        expect(value).toBe(message);
        done();
      }, iter);

      event.emit("event", message);
    });
  });

  describe("takeUntil", () => {
    it("returns a Lazy", () => {
      const iter = operators.takeUntil(a => true, operators.empty());

      expect(iter instanceof Lazy).toBe(true);
    });

    it('takes values from the iterator until the predicate returns true', done => {
      const pred = (num) => num ? true : false
      const base = operators.range(0)
      const iter = operators.takeUntil(pred, base)

      return operators.toArray(iter)
        .then(list => {
          expect(list.length).toBe(1)
        }).then(done)
    })
  });

  describe("takeWhile", () => {
    it("returns a Lazy", () => {
      const iter = operators.takeWhile(a => true, operators.empty());

      expect(iter instanceof Lazy).toBe(true);
    });

    it('takes values from the iterator while the predicate returns true', done => {
      const pred = (num) => num === 0 ? true : false
      const base = operators.range(0)
      const iter = operators.takeWhile(pred, base)

      return operators.toArray(iter)
        .then(list => {
          expect(list.length).toBe(1)
        }).then(done)
    })
  });

  describe("skipUntil", () => {
    it("returns a Lazy", () => {
      const iter = operators.skipUntil(a => true, operators.empty());

      expect(iter instanceof Lazy).toBe(true);
    });

    it('skips values until the predicate returns true', done => {
      const pred = (num) => num === 0 ? false : true
      const base = operators.range(0, 1)
      const iter = operators.skipUntil(pred, base)

      return operators.toArray(iter)
        .then(list => {
          expect(list.length).toBe(1)
        }).then(done)
    })
  });

  describe("skipWhile", () => {
    it("returns a Lazy", () => {
      const iter = operators.skipWhile(a => true, operators.empty());

      expect(iter instanceof Lazy).toBe(true);
    });

    it('skips values until the predicate returns false', done => {
      const pred = (num) => num === 0 ? true : false
      const base = operators.range(0, 1)
      const iter = operators.skipWhile(pred, base)

      return operators.toArray(iter)
        .then(list => {
          expect(list.length).toBe(1)
        }).then(done)
    })
  });
});
