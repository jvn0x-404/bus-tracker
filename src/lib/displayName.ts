export function formatDisplayName(value: string | null | undefined) {
  const cleaned = value?.trim().replace(/\s+/g, ' ');
  if (!cleaned) return 'User';
  return cleaned
    .split(' ')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function getInitials(value: string) {
  return value
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0))
    .join('')
    .toUpperCase();
}
