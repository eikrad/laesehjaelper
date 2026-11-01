// Typen für das Paket „hyphen“ (bringt keine eigenen mit).
declare module "hyphen/*" {
  export function hyphenateSync(text: string, options?: { hyphenChar?: string; minWordLength?: number; exceptions?: string[] }): string;
}
