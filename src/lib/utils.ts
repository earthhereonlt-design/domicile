/**
 * Helper to combine CSS class names cleanly.
 */
export function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Generates a collision-resistant application identifier.
 * Format: 26153002010XXXX where XXXX is 4 random digits.
 */
export function generateApplicationId(): string {
  const rand = Math.floor(1000 + Math.random() * 9000); // 4-digit random number
  return `26153002010${rand}`;
}

/**
 * Generates a unique certificate identifier with a 4-digit suffix.
 * Format: 23626201XXXX where XXXX is 4 random digits.
 */
export function generateCertificateId(): { full: string; publicSuffix: string } {
  const rand = Math.floor(1000 + Math.random() * 9000); // 4-digit random suffix
  return {
    full: `23626201${rand}`,
    publicSuffix: String(rand),
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
