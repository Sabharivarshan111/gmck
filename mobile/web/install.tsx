import React, { useEffect, useRef, useState } from 'react';
import './install.css';

interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
let pendingPrompt: InstallPrompt | null = null;
// Capture before React/storage boot finishes; prompt() must run from a tap.
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  pendingPrompt = event as InstallPrompt;
  window.dispatchEvent(new Event('orbit-install-ready'));
});
export function openInstallHelp() { window.dispatchEvent(new Event('orbit-install-open')); }
function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}
function dismissed() {
  try { return Date.now() - Number(localStorage.getItem('orbit-install-dismissed') ?? 0) < 7 * 86400000; }
  catch { return false; }
}

export function InstallApp() {
  const [installed, setInstalled] = useState(isStandalone);
  const [hidden, setHidden] = useState(dismissed);
  const [ready, setReady] = useState(!!pendingPrompt);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const dialog = useRef<HTMLDialogElement>(null);
  const isiOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const android = /Android/.test(navigator.userAgent);
  useEffect(() => {
    const open = () => { setMessage(''); dialog.current?.showModal(); };
    const available = () => setReady(true);
    const done = () => { pendingPrompt = null; setInstalled(true); dialog.current?.close(); };
    const mode = window.matchMedia('(display-mode: standalone)');
    const changed = () => setInstalled(isStandalone());
    window.addEventListener('orbit-install-open', open);
    window.addEventListener('orbit-install-ready', available);
    window.addEventListener('appinstalled', done);
    mode.addEventListener('change', changed);
    return () => {
      window.removeEventListener('orbit-install-open', open);
      window.removeEventListener('orbit-install-ready', available);
      window.removeEventListener('appinstalled', done);
      mode.removeEventListener('change', changed);
    };
  }, []);
  async function install() {
    const prompt = pendingPrompt;
    if (!prompt) { openInstallHelp(); return; }
    setBusy(true);
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      if (choice.outcome === 'accepted') dialog.current?.close();
      else { setMessage('Installation cancelled. You can try again from your browser menu.'); dialog.current?.showModal(); }
    } catch {
      setMessage('Use your browser menu to install ORBIT.');
      if (!dialog.current?.open) dialog.current?.showModal();
    } finally { pendingPrompt = null; setReady(false); setBusy(false); }
  }
  return <>
    {!installed && !hidden && <aside className="orbit-install-banner" aria-label="Install ORBIT web app">
      <img src="/icon-192.png" alt="" width="32" height="32" />
      <div><strong>ORBIT on your Home Screen</strong><span>Open it like an app · iPhone & Android</span></div>
      <button className="orbit-install-primary" onClick={ready ? install : openInstallHelp} disabled={busy}>Install</button>
      <button className="orbit-install-dismiss" aria-label="Dismiss install suggestion" onClick={() => {
        setHidden(true); try { localStorage.setItem('orbit-install-dismissed', String(Date.now())); } catch { /* optional preference */ }
      }}>×</button>
    </aside>}
    <dialog ref={dialog} className="orbit-install-dialog" aria-labelledby="orbit-install-title">
      <header><img src="/icon-192.png" alt="" width="44" height="44" /><div><h2 id="orbit-install-title">{installed ? 'ORBIT is installed' : 'Install ORBIT'}</h2><p>Your studies, one tap away.</p></div></header>
      {installed ? <p>You are already using ORBIT as an app.</p> : <>
        {ready && <button className="orbit-install-primary" disabled={busy} onClick={install}>{busy ? 'Opening install prompt…' : 'Install on this device'}</button>}
        {(isiOS || !android) && <section><h3>iPhone & iPad</h3><ol><li>Open <strong>orbitmbbs.vercel.app</strong> in Safari.</li><li>Tap <strong>Share</strong> (the square with an up arrow).</li><li>Choose <strong>Add to Home Screen</strong>. Enable <strong>Open as Web App</strong> if shown, then tap <strong>Add</strong>.</li></ol></section>}
        {(!isiOS) && <section><h3>{android ? 'Android' : 'Android & desktop'}</h3><ol><li>Open ORBIT in Chrome or Edge.</li><li>Tap the browser menu <strong>⋮</strong>, then <strong>Install app</strong> or <strong>Add to Home screen → Install</strong>.</li><li>Confirm <strong>Install</strong> and open the ORBIT icon.</li></ol></section>}
        {!isiOS && <p className="orbit-install-note">If your browser only offers “Create shortcut”, try Chrome and reload this page. Some in-app browsers do not support installation.</p>}
        <p className="orbit-install-note">Installation is free. Offline study uses questions and files already saved on this device; AI and sync need internet.</p>
      </>}
      {message && <p role="status">{message}</p>}
      <button className="orbit-install-close" onClick={() => dialog.current?.close()}>Done</button>
    </dialog>
  </>;
}
