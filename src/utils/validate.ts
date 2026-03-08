const VALID = {
  mode: ['generate', 'condense', 'preserve'],
  type: ['presentation', 'document', 'webpage', 'social'],
  amount: ['brief', 'medium', 'detailed', 'extensive'],
  imageSource: [
    'aiGenerated', 'pictographic', 'pexels', 'giphy',
    'webAllImages', 'webFreeToUse', 'webFreeToUseCommercially',
    'placeholder', 'noImages',
  ],
  exportFormat: ['pdf', 'pptx'],
  cardSplit: ['auto', 'inputTextBreaks'],
  workspaceAccess: ['noAccess', 'view', 'comment', 'edit', 'fullAccess'],
  externalAccess: ['noAccess', 'view', 'comment', 'edit'],
  // presentation dimensions
  presentationDimensions: ['fluid', '16x9', '4x3'],
  documentDimensions: ['fluid', 'pageless', 'letter', 'a4'],
  socialDimensions: ['1x1', '4x5', '9x16'],
} as const;

export type ValidField = keyof typeof VALID;

export function validate(field: ValidField, value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const allowed = VALID[field] as readonly string[];
  if (!allowed.includes(value)) {
    console.error(JSON.stringify({
      error: `Invalid value for ${field}: "${value}"`,
      allowed,
      suggestion: `Use one of: ${allowed.join(', ')}`,
    }));
    process.exit(1);
  }
  return value;
}

export function validateNumCards(n: number | undefined): number | undefined {
  if (n === undefined) return undefined;
  if (n < 1 || n > 75 || !Number.isInteger(n)) {
    console.error(JSON.stringify({
      error: `Invalid num-cards: ${n}`,
      allowed: '1-75 (integer)',
    }));
    process.exit(1);
  }
  return n;
}
