/**
 * Formats an event date string according to specification:
 * - Readable date (e.g. "Fri, Oct 23, 2026")
 * - Start time only (e.g. "5:30 PM")
 * - Never fabricate an end time or range.
 */
export function formatEventDateTime(dateString) {
  if (!dateString) return { date: '', time: '', fullFormatted: '' };

  const d = new Date(dateString);
  if (isNaN(d.getTime())) {
    return { date: dateString, time: '', fullFormatted: dateString };
  }

  const dateOptions = {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  };

  const timeOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  };

  const date = d.toLocaleDateString('en-US', dateOptions);
  const time = d.toLocaleTimeString('en-US', timeOptions);

  return {
    date,
    time,
    fullFormatted: `${date} · ${time}`,
  };
}

export function formatTimestamp(timestamp) {
  if (!timestamp) return 'Just now';
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return String(timestamp);

  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}
