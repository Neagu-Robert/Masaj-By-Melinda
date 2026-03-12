/**
 * Constant-time delay utility to help mitigate timing attacks.
 * Wraps setTimeout in a Promise for use with async/await.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

