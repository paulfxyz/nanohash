import nano = require("@paulfxyz/nanohash");
import sizing = require("@paulfxyz/nanohash/analysis");
import allocation = require("@paulfxyz/nanohash/allocation");

const code: string = nano.nanohash();
const space: string = sizing.analyzeSpace().space;
const attempts: number = new allocation.AllocationExhaustedError(5).attempts;
void [code, space, attempts];
