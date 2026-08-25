/**
 * Browser preview shim for NativeOrbitSpeech.
 *
 * Uses the Web Speech API (webkitSpeechRecognition) when available in the
 * browser (Chrome/Edge/Safari), or a simulated voice input prompt so the
 * microphone audio button is fully visible, testable, and reviewed in the preview.
 */

let activeRecognition: any = null;
let stopFn: (() => void) | null = null;

export default {
  isAvailable(): boolean {
    return true;
  },

  async start(locale: string = 'en-IN'): Promise<string> {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      return new Promise<string>((resolve, reject) => {
        try {
          const recognition = new SpeechRecognition();
          activeRecognition = recognition;
          recognition.lang = locale;
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;

          let transcript = '';

          recognition.onresult = (event: any) => {
            if (event.results?.[0]?.[0]?.transcript) {
              transcript = event.results[0][0].transcript;
            }
          };

          recognition.onerror = (event: any) => {
            if (event.error === 'no-speech') {
              reject(new Error('no-speech'));
            } else if (event.error === 'not-allowed') {
              reject(new Error('permission'));
            } else {
              reject(new Error(event.error || 'unavailable'));
            }
          };

          recognition.onend = () => {
            activeRecognition = null;
            if (transcript) {
              resolve(transcript);
            } else {
              reject(new Error('no-speech'));
            }
          };

          stopFn = () => {
            try {
              recognition.stop();
            } catch {
              // ignore
            }
          };

          recognition.start();
        } catch {
          reject(new Error('unavailable'));
        }
      });
    }

    // Fallback if browser does not support SpeechRecognition
    return new Promise<string>((resolve) => {
      const sample = 'Explain the pathophysiology and clinical features of Acute Glomerulonephritis';
      const timer = setTimeout(() => {
        resolve(sample);
      }, 1800);

      stopFn = () => {
        clearTimeout(timer);
        resolve(sample);
      };
    });
  },

  stop(): void {
    if (stopFn) {
      stopFn();
      stopFn = null;
    }
    if (activeRecognition) {
      try {
        activeRecognition.stop();
      } catch {
        // ignore
      }
      activeRecognition = null;
    }
  },

  cancel(): void {
    if (activeRecognition) {
      try {
        activeRecognition.abort();
      } catch {
        // ignore
      }
      activeRecognition = null;
    }
    stopFn = null;
  },
};
