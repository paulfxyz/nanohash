import { customAlphabet } from "nanoid";

const next = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 8);

export function nanohash(length = 8, options = {}) {
  if (
    !options || typeof options !== "object" || Array.isArray(options) ||
    Object.keys(options).some(key => key !== "allowTiny") ||
    (options.allowTiny !== undefined && typeof options.allowTiny !== "boolean")
  ) {
    throw new TypeError("Only { allowTiny?: boolean } is supported.");
  }
  if (
    !Number.isInteger(length) || length < 4 || length > 15 ||
    (length < 6 && options.allowTiny !== true)
  ) {
    throw new RangeError("Use 6-15 characters; 4-5 require allowTiny: true.");
  }
  if (typeof globalThis.crypto?.getRandomValues !== "function") {
    throw new Error("Secure Web Crypto is required.");
  }
  return next(length);
}
