import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootTabParamList } from './types';

/**
 * A handle on the navigator from outside React.
 *
 * Only the walkthrough uses it, and only for its Next button: a step declares
 * which tab it belongs to, and Next has to be able to get there for a reader
 * who would rather read than tap the spotlighted control. Everything else in
 * this app navigates through the `navigation` prop, which is the right way and
 * should stay the only other way.
 */
export const navigationRef = createNavigationContainerRef<RootTabParamList>();

/** Which tab is showing, or null if the navigator is not up yet. */
export function currentTab(): keyof RootTabParamList | null {
  if (!navigationRef.isReady()) {
    return null;
  }
  /*
   * The **root** state, not `getCurrentRoute()`. That returns the innermost
   * route, which inside the Home tab is `HomeMain` or `BrowseNode` — never
   * `Home` — so a guard written against it would think it was never on the
   * Home tab and re-navigate every time.
   */
  const state = navigationRef.getRootState();
  const route = state?.routes?.[state.index ?? 0];
  return (route?.name as keyof RootTabParamList | undefined) ?? null;
}

/** Switch tabs, if the navigator is up and is not already there. */
export function goToTab(tab: keyof RootTabParamList): void {
  if (!navigationRef.isReady() || currentTab() === tab) {
    // Re-navigating to the tab already showing would pop the Home stack back
    // to its root under a reader who had drilled into a subject.
    return;
  }
  navigationRef.navigate(tab);
}
