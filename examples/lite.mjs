import { nanohash } from "../dist/lite.js";

console.log("Default public candidate:", nanohash());
console.log("Longer public candidate:", nanohash(12));
console.log("Explicit tiny public candidate:", nanohash(5, { allowTiny: true }));
