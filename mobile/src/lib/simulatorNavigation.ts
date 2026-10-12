/** Restrict the embedded browser to the simulator, returning native Vault on exit. */
export function simulatorNavigation(url: string): 'allow' | 'vault' | 'external' | 'block' {
  if (url === 'about:blank') return 'allow';
  try {
    const target = new URL(url);
    if (!['https:', 'http:'].includes(target.protocol)) return 'block';
    if (target.origin === 'https://orbitmbbs.vercel.app') {
      if (target.pathname === '/notes' || target.pathname === '/') return 'vault';
      if (target.pathname === '/simulator' || target.pathname.startsWith('/simulator/')) return 'allow';
      return 'block';
    }
    return target.protocol === 'https:' ? 'external' : 'block';
  } catch { return 'block'; }
}
