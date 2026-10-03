import { Alert } from 'react-native';
// RNW's Alert is a no-op. Preserve callback-based confirmation flows with a
// real keyboard-accessible browser dialog, including destructive choices.
Alert.alert = (title, message, buttons = [{ text: 'OK' }]) => {
  const dialog = document.createElement('dialog');
  dialog.style.cssText = 'background:#171626;color:#fafafa;border:1px solid #555;border-radius:20px;padding:24px;max-width:min(90vw,420px);font:16px Roboto,sans-serif';
  const heading = document.createElement('h2'); heading.textContent = title ?? 'Orbit'; dialog.append(heading);
  const paragraph = document.createElement('p'); paragraph.textContent = message ?? ''; dialog.append(paragraph);
  const row = document.createElement('div'); row.style.cssText = 'display:flex;justify-content:flex-end;gap:12px';
  for (const button of buttons) {
    const control = document.createElement('button'); control.textContent = button.text ?? 'OK';
    control.style.cssText = 'padding:12px;border-radius:12px;border:1px solid #777;background:#292638;color:white;cursor:pointer';
    control.onclick = () => { dialog.close(); dialog.remove(); button.onPress?.(); }; row.append(control);
  }
  dialog.append(row); document.body.append(dialog); dialog.addEventListener('cancel', () => { dialog.remove(); buttons.find(button => button.style === 'cancel')?.onPress?.(); }); dialog.showModal();
};
