/**
 * Lazy: a way to set an asyncIterator method
 */
class Lazy {
  // This class really does nothing for now
  // but it might in the future and is the
  // way we ensure we are dealing with the
  // right type during development and testing
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
