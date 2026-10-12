import { createGenerator, analyzeSpace, recommendLength, PRESETS } from "../src/index.js";

const $ = id => document.getElementById(id);
const elements = Object.fromEntries([
  "preset", "length", "length-value", "alphabet", "characters", "custom-field", "batch-size",
  "allow-tiny", "tiny-warning", "generate", "code-output", "code-caption", "bits", "space", "risk",
  "risk-context", "batch-output", "status", "generated-count", "risk-budget", "recommendation-text",
  "use-recommendation", "length-chart"
].map(id => [id, $(id)]));
let currentBatch = [];
let recommendation = null;
let currentTheme = matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
const number = new Intl.NumberFormat("en-US");

function theme() {
  document.documentElement.dataset.theme = currentTheme;
  $("theme").textContent = currentTheme === "light" ? "Dark" : "Light";
  $("theme").setAttribute("aria-label", `Switch to ${currentTheme === "light" ? "dark" : "light"} theme`);
}
$("theme").addEventListener("click", () => { currentTheme = currentTheme === "light" ? "dark" : "light"; theme(); });
theme();

function status(message, error = false) {
  elements.status.textContent = message;
  elements.status.classList.toggle("error", error);
}

function alphabetOptions() {
  return elements.alphabet.value === "custom"
    ? { characters: elements.characters.value }
    : { alphabet: elements.alphabet.value };
}

function inputCount() {
  const value = elements["generated-count"].value;
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(Number(value))) {
    throw new Error("Expected draws must be a non-negative safe integer.");
  }
  return Number(value);
}

function percent(value) {
  const p = value * 100;
  if (p === 0) return "0%";
  if (p >= 99.995) return "≈100%";
  if (p < 0.001) return `${p.toExponential(1)}%`;
  if (p < 1) return `${p.toFixed(3)}%`;
  return `${p.toFixed(2)}%`;
}

function compact(value) {
  const n = Number(value);
  if (n >= 1e18) return [n.toExponential(2), "strings"];
  for (const [threshold, unit] of [[1e15, "quadrillion"], [1e12, "trillion"], [1e9, "billion"], [1e6, "million"], [1e3, "thousand"]]) {
    if (n >= threshold) return [(n / threshold).toFixed(2), unit];
  }
  return [String(n), "strings"];
}

function stat(node, value, unit = "") {
  node.replaceChildren(document.createTextNode(value));
  if (unit) {
    const suffix = document.createElement("span");
    suffix.textContent = unit;
    node.append(suffix);
  }
}

function updateRecommendation() {
  try {
    recommendation = recommendLength({
      ...alphabetOptions(),
      generatedCount: inputCount(),
      maxCollisionProbability: Number(elements["risk-budget"].value)
    });
    elements["recommendation-text"].textContent = recommendation.feasible
      ? `${recommendation.length} characters meet this collision budget.`
      : "No length from 4 to 15 meets this budget. Use a larger namespace or revise your assumptions.";
    elements["use-recommendation"].hidden = !recommendation.feasible;
    if (recommendation.feasible) {
      elements["use-recommendation"].textContent = `Use ${recommendation.length} characters ↗`;
    }
  } catch (error) {
    recommendation = null;
    elements["recommendation-text"].textContent = error.message;
    elements["use-recommendation"].hidden = true;
  }
}

function updateMath() {
  const length = Number(elements.length.value);
  const generatedCount = inputCount();
  const analysis = analyzeSpace({ ...alphabetOptions(), length, generatedCount });
  stat(elements.bits, analysis.entropyBits.toFixed(1), "bits");
  stat(elements.space, ...compact(analysis.space));
  elements.space.title = `${number.format(BigInt(analysis.space))} possible strings`;
  const probability = percent(analysis.collisionProbability);
  stat(elements.risk, probability.slice(0, -1), "%");
  elements["risk-context"].textContent = `Chance of any duplicate among ${number.format(generatedCount)} independent draws, before database retries.`;
  elements["length-chart"].replaceChildren();
  for (let size = 4; size <= 15; size++) {
    const a = analyzeSpace({ ...alphabetOptions(), length: size, generatedCount });
    const row = document.createElement("div");
    row.className = `chart-row${size === length ? " active" : ""}`;
    row.setAttribute("role", "listitem");
    const label = document.createElement("span");
    label.className = "chart-length";
    label.textContent = `${String(size).padStart(2, "0")}${size === length ? " ←" : ""}`;
    const barWithLabel = document.createElement("div");
    barWithLabel.className = "bar-with-label";
    const track = document.createElement("div");
    track.className = "bar-track";
    track.setAttribute("aria-hidden", "true");
    const fill = document.createElement("div");
    fill.className = "bar-fill";
    fill.style.setProperty("--bar-width", `${a.entropyBits / 90 * 100}%`);
    track.append(fill);
    const bits = document.createElement("span");
    bits.className = "bar-label";
    bits.textContent = a.entropyBits.toFixed(1);
    barWithLabel.append(track, bits);
    const risk = document.createElement("span");
    risk.className = "chart-risk";
    risk.textContent = percent(a.collisionProbability);
    row.setAttribute("aria-label", `${size} characters, ${a.entropyBits.toFixed(1)} bits, ${percent(a.collisionProbability)} collision probability`);
    row.append(label, barWithLabel, risk);
    elements["length-chart"].append(row);
  }
  updateRecommendation();
}

function clearOutput(message) {
  currentBatch = [];
  elements["code-output"].textContent = "········";
  elements["code-caption"].textContent = message;
  elements["batch-output"].replaceChildren();
  $("copy-code").disabled = true;
  $("copy-batch").disabled = true;
}

function clearMath(message) {
  for (const id of ["bits", "space", "risk"]) elements[id].textContent = "n/a";
  elements.space.removeAttribute("title");
  elements["risk-context"].textContent = message;
  elements["length-chart"].replaceChildren();
}

function generate() {
  try {
    const length = Number(elements.length.value);
    updateMath();
    const next = createGenerator({ ...alphabetOptions(), length, allowTiny: elements["allow-tiny"].checked });
    currentBatch = next.batch(Number(elements["batch-size"].value));
    elements["code-output"].textContent = currentBatch[0];
    elements["code-caption"].textContent = `${length} characters / ${next.config.alphabetSize} symbols / ${next.config.alphabet ?? "custom alphabet"}`;
    elements["batch-output"].replaceChildren(...currentBatch.map(code => {
      const span = document.createElement("span");
      span.className = "batch-code";
      span.textContent = code;
      return span;
    }));
    $("copy-code").disabled = false;
    $("copy-batch").disabled = false;
    status(`${currentBatch.length} ${currentBatch.length === 1 ? "candidate" : "candidates"} generated locally. Claim uniqueness in your database.`);
  } catch (error) {
    clearOutput("Check your settings to generate");
    clearMath(error.message);
    status(error.message, true);
  }
}

function sync({ regenerate = true } = {}) {
  const length = Number(elements.length.value);
  elements["length-value"].textContent = String(length).padStart(2, "0");
  elements["custom-field"].hidden = elements.alphabet.value !== "custom";
  elements["tiny-warning"].hidden = length >= 6;
  const needsConsent = length < 6 && !elements["allow-tiny"].checked;
  elements.generate.disabled = needsConsent;
  try {
    updateMath();
    if (needsConsent) {
      clearOutput("Enable tiny-code mode to generate");
      status("Lengths 4–5 require the public-namespace acknowledgement.");
    } else if (regenerate) generate();
  } catch (error) {
    clearOutput("Check your settings to generate");
    clearMath(error.message);
    status(error.message, true);
    updateRecommendation();
  }
}

$("generator-form").addEventListener("submit", event => { event.preventDefault(); generate(); });
elements.preset.addEventListener("change", () => {
  if (elements.preset.value !== "custom") {
    const preset = PRESETS[elements.preset.value];
    elements.length.value = preset.length;
    elements.alphabet.value = preset.alphabet;
    elements["allow-tiny"].checked = false;
  }
  sync();
});
for (const id of ["length", "alphabet", "characters"]) {
  elements[id].addEventListener(id === "length" || id === "characters" ? "input" : "change", () => {
    elements.preset.value = "custom";
    elements["allow-tiny"].checked = false;
    sync();
  });
}
elements["allow-tiny"].addEventListener("change", () => sync());
elements["batch-size"].addEventListener("change", () => sync());
elements["generated-count"].addEventListener("input", () => sync({ regenerate: false }));
elements["risk-budget"].addEventListener("change", updateRecommendation);
$("sizing-form").addEventListener("submit", event => { event.preventDefault(); updateRecommendation(); });
elements["use-recommendation"].addEventListener("click", () => {
  if (!recommendation?.feasible) return;
  elements.length.value = recommendation.length;
  elements.preset.value = "custom";
  elements["allow-tiny"].checked = false;
  sync();
  $("playground").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" });
});

async function copy(text, label) {
  try {
    if (!text || typeof navigator.clipboard?.writeText !== "function") throw new Error("Clipboard unavailable");
    await navigator.clipboard.writeText(text);
    status(`${label} copied.`);
  } catch {
    status("Clipboard access is unavailable here. Select and copy the visible text manually.");
  }
}
$("copy-code").addEventListener("click", () => copy(currentBatch[0], "Code"));
$("copy-batch").addEventListener("click", () => copy(currentBatch.join("\n"), "Batch"));
$("copy-install").addEventListener("click", async () => {
  await copy("npm install github:paulfxyz/nanohash#v0.1.0", "Install command");
  $("copy-install").textContent = elements.status.textContent.includes("copied.") ? "Copied" : "Select command";
});
sync();
