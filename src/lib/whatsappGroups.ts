/**
 * The WhatsApp community groups, one list per year.
 *
 * Shared by both apps — the web app imports it directly, the native app
 * through `@shared/whatsappGroups` — because a link that only one of them has
 * is a link the other quietly sends nowhere. That is not hypothetical: the
 * native app opened `https://chat.whatsapp.com/` with **no invite code at all**
 * for every year, so tapping "Join our WhatsApp community" landed on WhatsApp's
 * generic page and joined nothing. The web app had two real codes and labelled
 * them wrongly — the 3rd-year group was shown to second years and the final-year
 * group to third years.
 *
 * ## An invite link is the code, and nothing else
 *
 * WhatsApp's share sheet appends its own tracking parameters —
 * `?s=cl&p=a&mlu=4&ilr=4` — and they are not part of the invite. They vary by
 * where the link was copied from, they are meaningless to anyone else, and
 * carrying them makes two copies of one group look like two groups. Only the
 * 22-character code is stored here; `groupUrl` builds the link.
 *
 * ## Why this opens the app rather than a browser
 *
 * `chat.whatsapp.com` is a verified Android App Link, so Android hands
 * `https://chat.whatsapp.com/<code>` straight to WhatsApp when it is installed
 * and to the browser when it is not — which is the correct behaviour in both
 * cases. There is no `whatsapp://` scheme for an invite, so a custom scheme
 * would be a guess that fails silently on the phones that matter.
 */

/** The year codes both apps store in `orbit-profile-v1`. */
export type GroupYear = 'first' | 'second' | 'third' | 'final';

export interface WhatsAppGroup {
  /** The group's own name, as WhatsApp shows it. */
  name: string;
  /**
   * The 22-character invite code — the part after `chat.whatsapp.com/`.
   *
   * Stored without the URL so nobody pastes a share link complete with its
   * tracking parameters and creates a second entry for a group that is already
   * here.
   */
  code: string;
  /** One line saying who the group is for, shown when a year has more than one. */
  blurb: string;
}

/**
 * Final year has two groups and that is deliberate, not a duplicate.
 *
 * One is for the batch currently sitting the exam and one is the question-bank
 * group for the 2023 batch. A reader in final year is plausibly in either, so
 * the app asks instead of guessing — every other year has exactly one and opens
 * it directly.
 */
export const WHATSAPP_GROUPS: Record<GroupYear, WhatsAppGroup[]> = {
  first: [
    {
      name: 'Orbit 1st year',
      code: 'EYVAyjmirwpCTFtEaTyKv3',
      blurb: 'First year materials, notes & updates',
    },
  ],
  second: [
    {
      name: 'Orbit 2nd year',
      code: 'CJAYzjxvAsT4egkxAPuhXE',
      blurb: 'Second year materials, notes & updates',
    },
  ],
  third: [
    {
      name: 'Orbit mbbs 3rd year 2024batch',
      code: 'I0nFZ5jAZRbIakJSzDPyyt',
      blurb: 'Third year materials, notes & updates',
    },
  ],
  final: [
    {
      name: 'Orbit mbbs final year exam going',
      code: 'EbbwefPo2oC2hXDkqu58qa',
      blurb: 'For the batch sitting the exam now',
    },
    {
      name: 'Orbit final yr MBBS QB with AI 2023batch',
      code: 'KSyFrEnyxf65Q3GOlIMKNQ',
      blurb: 'Question bank group, 2023 batch',
    },
  ],
};

/** The link to open for a group. */
export function groupUrl(group: WhatsAppGroup): string {
  return `https://chat.whatsapp.com/${group.code}`;
}

/** Every group for a year, in the order they should be offered. */
export function groupsForYear(year: GroupYear): WhatsAppGroup[] {
  return WHATSAPP_GROUPS[year] ?? WHATSAPP_GROUPS.third;
}

/**
 * The short label a year's banner uses ("2nd year materials, notes & updates").
 *
 * Taken from the single group where there is one, so the banner never claims a
 * year the link does not go to.
 */
export const YEAR_LABEL: Record<GroupYear, string> = {
  first: '1st year',
  second: '2nd year',
  third: '3rd year',
  final: 'Final year',
};
