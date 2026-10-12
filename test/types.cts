import nano = require("@paulfxyz/nanohash");
import sizing = require("@paulfxyz/nanohash/analysis");
import allocation = require("@paulfxyz/nanohash/allocation");
import lite = require("@paulfxyz/nanohash/lite");

const code: string = nano.nanohash();
const space: string = sizing.analyzeSpace().space;
const attempts: number = new allocation.AllocationExhaustedError(5).attempts;
const liteCode: string = lite.nanohash(12);
const tinyCode: string = lite.nanohash(4, { allowTiny: true });
void [code, space, attempts, liteCode, tinyCode];
