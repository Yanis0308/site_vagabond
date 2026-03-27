const WORDS_PER_MINUTE = 200;

function countWords(content: unknown): number {
  if (content === null || content === undefined) return 0;
  const text = JSON.stringify(content);
  const words = text.replace(/<[^>]*>/g, "").split(/\s+/);
  return words.length;
}

export function estimateReadingTime(content: unknown): number {
  const words = countWords(content);
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
