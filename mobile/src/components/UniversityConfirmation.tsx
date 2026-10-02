import React, { useState } from 'react';
import { Dialog } from '@/components/Dialog';
import { UniversityChoice } from '@/components/UniversityChoice';
import { useProfile } from '@/hooks/useProfile';
import { KUHS_BANK_AVAILABLE } from '@/lib/kuhsAvailability';

/** Older profiles have no university; ask once, then remember on-device. */
export function UniversityConfirmation() {
  const { hydrated, local, university, setUniversity } = useProfile();
  const [dismissed, setDismissed] = useState(false);
  return (
    <Dialog
      visible={KUHS_BANK_AVAILABLE && hydrated && !!local && !university && !dismissed}
      onDismiss={() => setDismissed(true)}
      title="Which university do you study under?"
      message="Choose your question bank. Your choice is saved on this phone and you can change it in Settings."
      actions={[{ label: 'Later', onPress: () => setDismissed(true), tone: 'secondary' }]}
      footer={<UniversityChoice value={university} onChange={option => { void setUniversity(option); }} />}
    />
  );
}
