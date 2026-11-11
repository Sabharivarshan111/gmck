import { Alert, Linking } from 'react-native';

// Opening this public request page never deletes an account. Support verifies
// ownership and fulfills the email request separately from this navigation.
export const ACCOUNT_DELETION_URL = 'https://orbitmbbs.site/delete-account';

export function openAccountDeletion(): void {
  Linking.openURL(ACCOUNT_DELETION_URL).catch(() => {
    Alert.alert(
      'Account deletion',
      'Open orbitmbbs.site/delete-account in your browser to request deletion.',
    );
  });
}
