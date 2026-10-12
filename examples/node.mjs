import { createGenerator, analyzeSpace, recommendLength } from "../dist/index.js";

const next = createGenerator({ preset: "link" });
console.log("Candidates:", next.batch(5));
console.log("Space:", analyzeSpace({ length: 8, generatedCount: 100_000 }));
console.log("Recommendation:", recommendLength({ generatedCount: 100_000, maxCollisionProbability: 1e-6 }));
