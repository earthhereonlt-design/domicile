/**
 * Helper to combine CSS class names cleanly.
 */
export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generates a collision-resistant application identifier.
 * Format: APP-YYYY-XXXXXX where XXXXXX is 6 random digits.
 */
export function generateApplicationId(): string {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000); // 6-digit number
  return `APP-${year}-${rand}`;
}

/**
 * Generates a unique certificate identifier with a 4-digit suffix.
 * Format: CERT-YYYY-XXXX-ZZZZ where ZZZZ is the public suffix.
 */
export function generateCertificateId(): { full: string; publicSuffix: string } {
  const year = new Date().getFullYear();
  const part1 = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  const suffix = Math.floor(1000 + Math.random() * 9000); // 4-digit random suffix
  return {
    full: `CERT-${year}-${part1}-${suffix}`,
    publicSuffix: String(suffix),
  };
}

/**
 * Format date string to DD/MM/YYYY
 */
export function formatDate(dateString: string | Date): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}
