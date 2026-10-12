/*! nanohash | MIT | Bundles Nano ID where applicable; see THIRD_PARTY_NOTICES.md */

// node_modules/nanoid/index.browser.js
var random = (bytes) => crypto.getRandomValues(new Uint8Array(bytes));
var customRandom = (alphabet, defaultSize, getRandom) => {
  let safeByteCutoff = 256 - 256 % alphabet.length;
  if (safeByteCutoff === 256) {
    let mask = alphabet.length - 1;
    return (size = defaultSize) => {
      if (!size) return "";
      let id = "";
      while (true) {
        let bytes = getRandom(size);
        let j = size |= 0;
        while (j--) {
          id += alphabet[bytes[j] & mask];
          if (id.length >= size) return id;
        }
      }
    };
  }
  return (size = defaultSize) => {
    if (!size) return "";
    let id = "";
    let step = Math.ceil(1.6 * 256 * size / safeByteCutoff);
    while (true) {
      let bytes = getRandom(step);
      let j = step;
      while (j--) {
        if (bytes[j] < safeByteCutoff) {
          id += alphabet[bytes[j] % alphabet.length];
          if (id.length >= size) return id;
        }
      }
    }
  };
};
var customAlphabet = (alphabet, size = 21) => customRandom(alphabet, size | 0, random);

// src/lite.js
var next = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);
function nanohash(length = 8, options = {}) {
  if (!options || typeof options !== "object" || Array.isArray(options) || Object.keys(options).some((key) => key !== "allowTiny") || options.allowTiny !== void 0 && typeof options.allowTiny !== "boolean") {
    throw new TypeError("Only { allowTiny?: boolean } is supported.");
  }
  if (!Number.isInteger(length) || length < 4 || length > 15 || length < 6 && options.allowTiny !== true) {
    throw new RangeError("Use 6-15 characters; 4-5 require allowTiny: true.");
  }
  if (typeof globalThis.crypto?.getRandomValues !== "function") {
    throw new Error("Secure Web Crypto is required.");
  }
  return next(length);
}
export {
  nanohash
};
//# sourceMappingURL=lite.js.map
