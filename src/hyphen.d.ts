// Types for the "hyphen" package, which does not include its own.
declare module "hyphen/*" {
  export function hyphenateSync(text: string, options?: { hyphenChar?: string; minWordLength?: number; exceptions?: string[] }): string;
}
