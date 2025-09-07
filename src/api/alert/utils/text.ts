// 📁 src/alert/utils/text.ts
export const hasText = (s: string | null | undefined): s is string =>
  typeof s === 'string' && s.length > 0;
export const joinSpace = (...parts: Array<string | null | undefined>) =>
  parts.filter(hasText).join(' ');
