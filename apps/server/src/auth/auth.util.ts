export function formatFullName(displayName?: string): string | undefined {
  return displayName && displayName.indexOf(',') > -1 ? displayName.split(', ').reverse().join(' ') : displayName;
}
