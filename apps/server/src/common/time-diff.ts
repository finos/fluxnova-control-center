export function timeDiffMs(startDateTime: string, endDateTime: string): number {
  return Date.parse(endDateTime) - Date.parse(startDateTime);
}
