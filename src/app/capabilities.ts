/** Returns a safe capability result even when a browser blocks GPU access. */
export function getWebGL2Status(
  createContext: () => unknown,
): 'supported' | 'unsupported' {
  try {
    return createContext() ? 'supported' : 'unsupported';
  } catch {
    return 'unsupported';
  }
}

export function browserWebGL2Status(): 'supported' | 'unsupported' {
  return getWebGL2Status(() => document.createElement('canvas').getContext('webgl2'));
}
