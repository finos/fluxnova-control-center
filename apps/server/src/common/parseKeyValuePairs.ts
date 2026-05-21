export function parseKeyValuePairs(keyVals?: string): Record<string, string> {
  const result: Record<string, string> = {};
  if (!keyVals) {
    return result;
  }
  for (const pair of keyVals.split(',')) {
    const [key, value] = pair.split('=');
    if (key && value) {
      result[key] = value;
    }
  }
  return result;
}
