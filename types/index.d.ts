export type AlphabetName = "base36" | "base62" | "url64" | "human32";
export type PresetName = "link" | "tiny" | "dense" | "long" | "human";
export type Count = number | bigint;
export type AlphabetOptions =
  | { alphabet?: AlphabetName; characters?: never }
  | { alphabet?: never; characters: string };
export type GeneratorOptions = (
  | (AlphabetOptions & { preset?: never })
  | { preset: PresetName; alphabet?: never; characters?: never }
) & { length?: number; allowTiny?: boolean };
export interface GeneratorConfig {
  readonly alphabet: AlphabetName | null;
  readonly characters: string;
  readonly alphabetSize: number;
  readonly length: number;
  readonly entropyBits: number;
  readonly tiny: boolean;
}
export interface Generator {
  (): string;
  readonly config: Readonly<GeneratorConfig>;
  batch(count?: number): string[];
}
export declare const ALPHABETS: Readonly<Record<AlphabetName, string>>;
export declare const PRESETS: Readonly<Record<PresetName, Readonly<{ alphabet: AlphabetName; length: number }>>>;
export declare function createGenerator(options?: GeneratorOptions): Generator;
export declare function nanohash(length?: number): string;
export declare function validateCode(value: unknown, options?: GeneratorOptions): boolean;
export type AnalysisOptions = AlphabetOptions & {
  length?: number;
  generatedCount?: Count;
  activeCodes?: Count;
  guesses?: Count;
};
export interface Analysis {
  readonly alphabet: AlphabetName | null;
  readonly alphabetSize: number;
  readonly length: number;
  readonly space: string;
  readonly entropyBits: number;
  readonly generatedCount: string;
  readonly activeCodes: string;
  readonly guesses: string;
  readonly collisionProbability: number;
  readonly anyHitProbability: number;
  readonly assumptions: readonly string[];
}
export type RecommendationOptions = AlphabetOptions & {
  generatedCount?: Count;
  maxCollisionProbability?: number;
  minLength?: number;
  maxLength?: number;
};
export type Recommendation =
  | { readonly feasible: true; readonly length: number; readonly maxCollisionProbability: number; readonly analysis: Analysis }
  | { readonly feasible: false; readonly length: null; readonly maxCollisionProbability: number; readonly analysis: Analysis; readonly reason: string };
export declare function analyzeSpace(options?: AnalysisOptions): Readonly<Analysis>;
export declare function recommendLength(options?: RecommendationOptions): Readonly<Recommendation>;
export type ClaimResult<T> = { status: "claimed"; value: T } | { status: "conflict" };
export interface AllocationOptions<T> {
  generate: () => string;
  claim: (code: string) => ClaimResult<T> | Promise<ClaimResult<T>>;
  isReserved?: (code: string) => boolean | Promise<boolean>;
  maxAttempts?: number;
  signal?: AbortSignal;
}
export declare function claimUnique<T>(options: AllocationOptions<T>): Promise<Readonly<{ code: string; value: T; attempts: number }>>;
export declare class AllocationExhaustedError extends Error {
  readonly attempts: number;
  constructor(attempts: number);
}
