import { createGenerator, nanohash, analyzeSpace, recommendLength, claimUnique, type Analysis } from "../dist/index.js";
import { analyzeSpace as standaloneAnalysis } from "../dist/analysis.js";
import { AllocationExhaustedError } from "../dist/allocation.js";

const generate = createGenerator({ preset: "dense", length: 12 });
const code: string = generate();
const batch: string[] = generate.batch(5);
const analysis: Analysis = analyzeSpace({ alphabet: "base36", generatedCount: 100_000n });
const recommended = recommendLength({ generatedCount: 1000 });
if (recommended.feasible) {
  const length: number = recommended.length;
  void length;
} else {
  const reason: string = recommended.reason;
  void reason;
}
const record = await claimUnique({
  generate,
  claim: async value => ({ status: "claimed", value: { id: value, number: 1 } })
});
const id: string = record.value.id;
const attempts: number = new AllocationExhaustedError(5).attempts;
void [code, batch, analysis, id, attempts, nanohash(), standaloneAnalysis()];

// @ts-expect-error Alphabet names are explicit, not guessed.
createGenerator({ alphabet: "base37" });
// @ts-expect-error Choose a named alphabet or custom characters.
createGenerator({ alphabet: "base36", characters: "abcdef" });
// @ts-expect-error Preset and alphabet cannot conflict.
createGenerator({ preset: "link", alphabet: "base62" });
// @ts-expect-error Claim results are tagged, never booleans.
claimUnique({ generate, claim: async () => true });
