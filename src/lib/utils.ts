import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'TRY'
  }).format(price);
}

const TR_LOCALE = "tr-TR";
const SMALL_WORDS = new Set([
  "ve",
  "ile",
  "ya",
  "veya",
  "de",
  "da",
  "ki",
  "mı",
  "mi",
  "mu",
  "mü",
]);

export function formatDisplayName(value: string | null | undefined): string {
  if (!value) return "";
  const cleaned = value.replace(/\s+/g, " ").trim();
  if (!cleaned) return "";

  return cleaned
    .toLocaleLowerCase(TR_LOCALE)
    .split(" ")
    .map((word, index) => capitalizeWord(word, index === 0))
    .join(" ");
}

function capitalizeWord(word: string, isFirst: boolean): string {
  if (!word) return word;
  if (!isFirst && SMALL_WORDS.has(word)) return word;

  // Hyphenated / slash-separated words: capitalize each segment.
  if (/[-/]/.test(word)) {
    return word
      .split(/([-/])/)
      .map((segment) => (segment === "-" || segment === "/" ? segment : capitalizeWord(segment, true)))
      .join("");
  }

  const first = word.charAt(0).toLocaleUpperCase(TR_LOCALE);
  return first + word.slice(1);
}
