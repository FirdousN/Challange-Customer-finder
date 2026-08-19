/**
 * Formats a given Date object or string into an Asia/Kolkata 12-hour format string.
 * Example: "19 Aug 2026, 5:15 PM"
 */
export function formatIST(dateInput?: string | Date | null): string {
  if (!dateInput) return 'N/A';
  
  try {
    const d = new Date(dateInput);
    
    // Check for invalid date
    if (isNaN(d.getTime())) return 'Invalid Date';

    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return 'Invalid Date';
  }
}
