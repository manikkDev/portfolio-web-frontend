/** "3 days ago", "2 mo ago", "1 yr ago" for a date or ISO string. */
export function timeAgo(date) {
  const days = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000)
  if (!Number.isFinite(days)) return ''
  if (days < 1) return 'Today'
  if (days < 30) return `${days} day${days > 1 ? 's' : ''} ago`
  if (days < 365) return `${Math.floor(days / 30)} mo ago`
  return `${Math.floor(days / 365)} yr ago`
}
