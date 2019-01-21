const Lazy = require("./");

/**
 * Producer is a way to produce values
 * in an Async Iterator _outside_ of the
 * generator function
 *
 */
class Producer extends Lazy {
  constructor() {
    let resolve;
    let reject;
    let prom = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    let iterating = true;

    // Create Async Iterator
    // from Lazy
    super(async function*() {
      while (iterating) {
        yield prom;
      }
    });

    /**
     * Emits a value into the iterator
     * @memberof Producer
     * @param {*} v - The value to emit into the iterator
     * @returns {void}
     */
    this.next = v => {
      resolve(v);
      prom = new Promise((res, rej) => {
        resolve = res;
      });
    };

    /**
     * Completes the iterator
     * @memberof Producer
     * @returns {void}
     */
    this.complete = () => (iterating = false);
    
    /**
     * Emits an error into the iterator
     * 
     * @memberof Producer
     * @param {*} err - The value to emit into the iterator
     * @returns {void}
     */
    this.error = err => {
      reject(err);
      iterating = false;
    };
  }
}

module.exports = Producer;
