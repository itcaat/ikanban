/** Strip HTML tags, control chars, emoji, and special symbols. Keep letters, digits, spaces, hyphens, underscores */
export function sanitize(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')           // HTML tags
    .replace(/[^\p{L}\p{N}\s\-_]/gu, '') // keep only letters, digits, spaces, hyphens, underscores
    .replace(/\s+/g, ' ')             // collapse whitespace
    .trim();
}

/** Validate nickname: 2-30 chars after sanitize */
export function validateNickname(raw: string): { valid: boolean; error?: string; value: string } {
  const value = sanitize(raw);
  if (value.length < 2) return { valid: false, error: 'Минимум 2 символа', value };
  if (value.length > 30) return { valid: false, error: 'Максимум 30 символов', value };
  if (containsProfanity(value)) return { valid: false, error: 'Недопустимое слово', value };
  return { valid: true, value };
}

/** Validate company: empty OK, otherwise 2-50 chars after sanitize */
export function validateCompany(raw: string): { valid: boolean; error?: string; value: string } {
  const value = sanitize(raw);
  if (value.length === 0) return { valid: true, value };
  if (value.length < 2) return { valid: false, error: 'Минимум 2 символа', value };
  if (value.length > 50) return { valid: false, error: 'Максимум 50 символов', value };
  if (containsProfanity(value)) return { valid: false, error: 'Недопустимое слово', value };
  return { valid: true, value };
}

const PROFANITY_PATTERNS = [
  /\bху[йяеёи]/i,
  /\bбл[яь]/i,
  /\bп[иі]зд/i,
  /\bеб[аоу|лтн]/i,
  /\bёб/i,
  /\bсук[аи]/i,
  /\bмуд[аоиіеёл]/i,
  /\bгандон/i,
  /\bдерьм/i,
  /\bпидор/i,
  /\bпидар/i,
  /\bшлюх/i,
  /\bблядь/i,
  /\bнахуй/i,
  /\bзалуп/i,
  /\bдрочи/i,
  /\bfuck/i,
  /\bshit/i,
  /\bass\b/i,
  /\bbitch/i,
  /\bdick\b/i,
  /\bcunt/i,
  /\bnigger/i,
];

function containsProfanity(text: string): boolean {
  return PROFANITY_PATTERNS.some((pattern) => pattern.test(text));
}
