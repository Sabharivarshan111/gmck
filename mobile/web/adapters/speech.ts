let active: any;
const recognitionClass = () => (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
export default {
  isAvailable: () => !!recognitionClass(),
  start(locale = 'en-IN'): Promise<string> {
    const Recognition = recognitionClass();
    if (!Recognition) return Promise.reject(new Error('Speech recognition is unavailable in this browser.'));
    return new Promise((resolve, reject) => {
      const recognition = new Recognition(); active = recognition;
      recognition.lang = locale; recognition.interimResults = false;
      let transcript = ''; let failed = false;
      recognition.onresult = (event: any) => { transcript = event.results?.[0]?.[0]?.transcript ?? ''; };
      recognition.onerror = (event: any) => { failed = true; reject(new Error(event.error === 'not-allowed' ? 'permission' : event.error)); };
      recognition.onend = () => { active = null; if (!failed) transcript ? resolve(transcript) : reject(new Error('no-speech')); };
      recognition.start();
    });
  },
  stop: () => active?.stop(), cancel: () => active?.abort(),
};
