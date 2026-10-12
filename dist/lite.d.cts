export interface LiteOptions {
  allowTiny?: boolean;
}

/**
 * Generate one lowercase Base36 candidate using secure randomness.
 * Length defaults to 8; lengths 4–5 require { allowTiny: true }.
 * Candidates are public identifiers, not guaranteed unique or access secrets.
 */
export declare function nanohash(length?: number, options?: LiteOptions): string;
