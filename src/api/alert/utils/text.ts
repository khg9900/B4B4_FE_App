// 📁 src/alert/utils/text.ts
export const hasText = (s: string | null | undefined): s is string =>
  typeof s === 'string' && s.trim().length > 0;

export const joinSpace = (...parts: (string | null | undefined)[]) =>
  parts
    .filter(p => p && p.trim() && p.toLowerCase() !== 'null') // null, 빈칸, "null" 제거
    .join(' ');
