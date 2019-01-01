/**
 * Lazy: a way to set an asyncIterator method
 */
class Lazy {
  constructor(generator) {
    if (!generator) {
      throw new Error("You must give Lazy a generator function");
    }

    this._gen = generator;
  }

  [Symbol.asyncIterator]() {
    return this._gen();
  }
}

module.exports = Lazy;
