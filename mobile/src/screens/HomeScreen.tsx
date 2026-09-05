import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Sheet } from '@/components/Sheet';
import { HoloCard } from '@/components/HoloCard';
import { Reorderable } from '@/components/Reorderable';
import { ReorderLockContext } from '@/components/ReorderLock';
import {
  COMPACT_BELOW,
  HOME_HEIGHT_MAX,
  HOME_HEIGHT_MIN,
  HOME_SCALE_MAX,
  HOME_SCALE_MIN,
  HOME_SECTION_LABEL,
  useHomeOrder,
} from '@/hooks/useHomeOrder';
import { SortableGrid } from '@/components/SortableGrid';
import { useSubjectOrder } from '@/hooks/useSubjectOrder';
import { SettingsSheet } from '@/components/SettingsSheet';
import { ThemeMenu, type Anchor } from '@/components/ThemeMenu';
import { HomeMenuSheet } from '@/components/HomeMenuSheet';
import { premiumExpiresAt } from '@/lib/premium';
import { presetByKey } from '@/theme/presets';
import { ThemeEditor } from '@/components/ThemeEditor';
import { GlassSurface } from '@/components/GlassSurface';
import { WallpaperBackground, useWallpaperText } from '@/components/WallpaperBackground';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Dialog } from '@/components/Dialog';
import { subjectMediaUri, useSubjectBackgrounds } from '@/hooks/useSubjectBackgrounds';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ArrowRight,
  Check,
  ChevronRight,
  Flag,
  Flame,
  ImagePlus,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Sparkles,
  Sun,
  Timer as TimerIcon,
  TrendingUp,
  Trophy,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { useTheme, withAlpha } from '@/theme';
import { DEFAULT_GRADIENT, SUBJECT_GRADIENT, themedGradient } from '@/theme/subjectCards';
import { DURATION, EASE, useReducedMotion } from '@/theme/motion';
import { radius, space } from '@/theme/tokens';
import { typeScale } from '@/theme/typography';
import { GradientFill } from '@/components/Gradient';
import {
  collectAllQuestions,
  getSubjects,
  SUBJECT_ICON,
  YEAR_KEYS,
  YEAR_LABEL,
  type YearKey,
} from '@/lib/questionBank';
import { useCountDone } from '@/hooks/useProgress';
import { useProfile } from '@/hooks/useProfile';
import { KEY_TO_YEAR } from '@/lib/profile';
import {
  groupUrl,
  groupsForYear,
  YEAR_LABEL as WHATSAPP_YEAR_LABEL,
  type WhatsAppGroup,
} from '@shared/whatsappGroups';
import { readFocusMinutes, formatFocusTime } from '@/lib/focusStats';
import type { HomeStackParamList, RootTabParamList } from '@/navigation/types';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';

type Nav = NativeStackNavigationProp<HomeStackParamList, 'HomeMain'>;

/**
 * How faint the hero's text is allowed to get mid-swap.
 *
 * Not zero. See the cross-fade effect below for what zero cost us.
 */
const HERO_FADE_FLOOR = 0.35;

const HERO_SLIDES = [
  {
    title: 'Welcome to Orbit!',
    body: "Every great journey begins with a single step. Stay consistent, stay curious, and you'll achieve greatness.",
  },
  {
    title: 'AI-Powered Learning',
    body: 'Triple-tap any question to instantly ask AI. Double-tap to generate MCQs from any topic.',
  },
  {
    title: 'Track Your Journey',
    body: 'Handwritten notes, spaced revision, and progress rings — everything you need in one orbit.',
  },
];

/** One card's height, and its width as a fraction of the grid. */
const SUBJECT_CARD_HEIGHT = 160;
/**
 * The compact card keeps the emoji, the name and the percentage — everything
 * that identifies the subject and says how far along it is. What goes is the
 * progress bar, which is the same number drawn a second way.
 */
const SUBJECT_CARD_COMPACT = 108;
const SUBJECT_CARD_RATIO = 0.485;

/**
 * Hoisted, because `Reorderable` builds one PanResponder per block and only
 * rebuilds them when this changes — an object literal in the JSX would be a
 * new one every render, which is a rebuild mid-drag.
 */
const HOME_SCALE_RANGE = { min: HOME_SCALE_MIN, max: HOME_SCALE_MAX };
const HOME_HEIGHT_RANGE = { min: HOME_HEIGHT_MIN, max: HOME_HEIGHT_MAX };

export default function HomeScreen({ initialEditing = false }: { initialEditing?: boolean } = {}) {
  const { colors, theme, textSize, setTextSize, custom, setCustom, preference, setPreference } =
    useTheme();
  const {
    order,
    rendered,
    scales,
    heights,
    aligns,
    save,
    removeSection,
    setScale,
    setHeightScale,
    setAlign,
    reset,
  } = useHomeOrder();
  /**
   * Shrunk far enough that the block should shed its secondary detail rather
   * than keep rendering it at a size nobody can read. Zooming out is the
   * answer to "less of this", and past a point the honest response is fewer
   * things rather than smaller ones.
   */
  const compact = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(scales).map(([key, value]) => [key, value < COMPACT_BELOW]),
      ),
    [scales],
  );
  const [editing, setEditing] = useState(initialEditing);
  /**
   * Whether the settings sheet is open. Text size used to have its own circle
   * in the header; a header that grows a button per preference is a toolbar
   * waiting to happen, so it lives in Settings now with everything else.
   */
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  /**
   * Content drawn straight onto the background reads this rather than
   * colors.text, because over a wallpaper the palette's guarantee no longer
   * holds. Anything inside a card is on the card and keeps the palette.
   */
  const onWall = useWallpaperText();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const countDone = useCountDone();
  const { getBackground, pickBackground, removeSubjectBackground } = useSubjectBackgrounds();
  const [cardUploadError, setCardUploadError] = useState<string | null>(null);

  const [slide, setSlide] = useState(0);
  /**
   * Which WhatsApp groups to offer, when a year has more than one.
   *
   * Final year has two — the batch sitting the exam, and the 2023 question-bank
   * group — and a reader is plausibly in either, so the app asks. Every other
   * year has exactly one and opens it without a detour: a sheet listing a
   * single choice is a tap nobody asked for.
   */
  const [groupChoice, setGroupChoice] = useState<WhatsAppGroup[] | null>(null);
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [yearPickerOpen, setYearPickerOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  /**
   * Where the menu hangs from.
   *
   * Measured on press rather than on layout: the header moves with the safe
   * area and the scroll position, and a stale frame would leave the menu
   * floating away from the button it belongs to.
   */
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const themeButton = useRef<React.ComponentRef<typeof View>>(null);

  useEffect(() => {
    readFocusMinutes().then(setFocusMinutes);
  }, []);

  const reduceMotion = useReducedMotion();
  const heroFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // A 6-second loop is a ~0.17 Hz oscillation, which is exactly the kind of
    // slow repeating motion reduced-motion users ask to be spared (SKILL §14).
    // The dots stay tappable, so nothing becomes unreachable — the carousel
    // simply stops driving itself.
    if (reduceMotion) {
      return;
    }
    const id = setInterval(() => setSlide(s => (s + 1) % HERO_SLIDES.length), 6000);
    return () => clearInterval(id);
  }, [reduceMotion]);

  /**
   * Cross-fade between slides. A hard cut mid-sentence reads as a glitch; the
   * fade is what tells you the text was replaced deliberately.
   *
   * **It starts at `HERO_FADE_FLOOR`, not at 0**, and that is the same rule as
   * "nothing scales from 0" applied to opacity. Only the headline and the
   * sentence are inside this fade — the CREATED BY chip and the dots are not,
   * because they do not change between slides. So at opacity 0 the hero is a
   * large empty card with a credit chip floating in it, which every reader saw
   * for the length of the fade, every six seconds. It is also what a
   * screenshot catches if it lands in that window: the committed
   * `glass-home.png` used by the ads is exactly that frame, and it shipped in
   * a finished cut with no headline and no quote.
   *
   * A floor means the incoming text is always legible and simply rises to
   * full. It still reads as a deliberate swap; it can no longer read as a
   * broken card.
   */
  useEffect(() => {
    if (reduceMotion) {
      heroFade.setValue(1);
      return;
    }
    heroFade.setValue(HERO_FADE_FLOOR);
    Animated.timing(heroFade, {
      toValue: 1,
      duration: DURATION.base,
      easing: EASE.out,
      useNativeDriver: true,
    }).start();
  }, [slide, heroFade, reduceMotion]);

  const { yearKey: year, streak, setYear } = useProfile();
  /*
   * The profile's short year code is what the shared group list is keyed by —
   * the same code `orbit-profile-v1` stores, so the phone and the web app agree
   * on which groups a reader is offered.
   */
  const shortYear = KEY_TO_YEAR[year];
  const groups = useMemo(() => groupsForYear(shortYear), [shortYear]);

  /**
   * Open the year's group, or ask which one when the year has several.
   *
   * `openURL` is given the plain invite link. `chat.whatsapp.com` is a verified
   * Android App Link, so WhatsApp takes it directly when installed and the
   * browser takes it when not — both correct. The old code opened
   * `https://chat.whatsapp.com/` with no code on it at all, which is why this
   * never joined anything.
   */
  const openCommunity = useCallback(() => {
    if (groups.length > 1) {
      setGroupChoice(groups);
      return;
    }
    Linking.openURL(groupUrl(groups[0])).catch(() => {});
  }, [groups]);

  const subjects = useMemo(
    () =>
      getSubjects(year).map(subject => {
        const all = collectAllQuestions(subject.node);
        const done = countDone(all);
        return {
          ...subject,
          pct: all.length ? Math.round((done / all.length) * 100) : 0,
          icon: SUBJECT_ICON[subject.key] ?? '📘',
          gradient: SUBJECT_GRADIENT[subject.key] ?? DEFAULT_GRADIENT,
        };
      }),
    [year, countDone],
  );

  const subjectKeys = useMemo(() => subjects.map(subject => subject.key), [subjects]);
  const subjectByKey = useMemo(
    () => new Map(subjects.map(subject => [subject.key, subject])),
    [subjects],
  );
  /**
   * A custom theme colours its own cards; the named presets keep the
   * gradients the published app shipped with.
   */
  const cardGradient = useCallback(
    (subject: { key: string; gradient: [string, string] }): [string, string] =>
      preference === 'custom'
        ? themedGradient(colors, subjects.findIndex(item => item.key === subject.key))
        : subject.gradient,
    [preference, colors, subjects],
  );
  const {
    order: subjectOrder,
    rendered: subjectRender,
    save: saveSubjectOrder,
  } = useSubjectOrder(year, subjectKeys);

  const goToTab = useCallback(
    (tab: keyof RootTabParamList) => {
      navigation.getParent<BottomTabNavigationProp<RootTabParamList>>()?.navigate(tab);
    },
    [navigation],
  );

  const openSubject = useCallback(
    (key: string, name: string) => {
      navigation.navigate('BrowseNode', { year, path: [key], title: name });
    },
    [navigation, year],
  );

  const pickYear = useCallback(
    (next: YearKey) => {
      setYear(KEY_TO_YEAR[next]);
      setYearPickerOpen(false);
    },
    [setYear],
  );

  const hero = HERO_SLIDES[slide];

  return (
    /**
     * The wallpaper sits behind the scroll view, not inside it, so it stays
     * put while the content moves over it — a background that scrolls with the
     * page is a very tall image, not a wallpaper. The ScrollView goes
     * transparent so the media shows through; the scrim inside
     * WallpaperBackground is what keeps the text readable.
     */
    <WallpaperBackground>
      <ScrollView
        style={styles.transparent}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        // A block being dragged must not also be scrolling the page under
        // itself; the drag owns the vertical axis while it lasts.
        scrollEnabled={!dragging}
        showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* The hamburger was a plain View: it looked pressable and did
              nothing, which is the same bug the FONT SIZE control had.
              Rearranging is normally entered by holding a block, but a hold
              is not something a screen reader can offer, so this is the other
              way in — and the way back out. */}
          {/* While rearranging it stays the way OUT of that mode — a menu
              behind a mode you cannot leave is worse than no menu. Otherwise
              it opens everything the app can do. */}
          <Touchable
            onPress={() => (editing ? setEditing(false) : setMenuOpen(true))}
            label={editing ? 'Finish rearranging' : 'Menu'}
            hint={editing ? undefined : 'Everything the app can do'}
            state={{ expanded: editing || menuOpen }}
            scaleTo={0.9}
            style={styles.iconButton}>
            {editing ? (
              <Check size={20} color={colors.accent} />
            ) : (
              <Menu size={20} color={colors.text} />
            )}
          </Touchable>
          <View>
            <Text style={[styles.brand, { color: onWall }]}>ORBIT</Text>
            <Text style={[styles.tagline, { color: colors.textMuted }]}>
              Learn. Retain. Master.
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Touchable
            onPress={() => setSettingsOpen(true)}
            label="Settings"
            hint="Text size, haptics and sounds"
            scaleTo={0.9}>
            <RoundButton label="SETTINGS">
              <SlidersHorizontal size={16} color={colors.text} />
            </RoundButton>
          </Touchable>
          <View ref={themeButton} collapsable={false}>
          <Touchable
            onPress={() => {
              themeButton.current?.measureInWindow((x, y, width, height) => {
                setAnchor({ top: y + height + 8, right: 16 });
                setThemeOpen(true);
              });
            }}
            label="Themes"
            hint="Pick a theme or build your own"
            scaleTo={0.9}>
            <RoundButton label="THEME">
              {theme === 'dark' ? (
                <Moon size={16} color={colors.text} />
              ) : (
                <Sun size={16} color={colors.text} />
              )}
            </RoundButton>
          </Touchable>
          </View>
        </View>
      </View>

        {editing ? (
          <View
            style={[
              styles.editBanner,
              { backgroundColor: withAlpha(colors.accent, 0.14), borderColor: colors.accent },
            ]}>
            <Text style={[styles.editBannerText, { color: colors.text }]}>
              Drag the side bar (↔) for width, the bottom bar (↕) for height, or
              the corner for both. Hold and drag a block to move it — up and down
              to reorder, sideways to place it anywhere across the page. 🗑️ hides
              one; Reset brings everything back.
            </Text>
            <Touchable onPress={reset} label="Reset home layout" scaleTo={0.94}>
              <Text style={[styles.editReset, { color: colors.textMuted }]}>Reset</Text>
            </Touchable>
            <Touchable onPress={() => setEditing(false)} label="Finish rearranging" scaleTo={0.94}>
              <Text style={[styles.editReset, { color: colors.accent }]}>Done</Text>
            </Touchable>
          </View>
        ) : null}

        <Reorderable
          rendered={rendered}
          order={order}
          onOrderChange={save}
          editing={editing}
          onRequestEdit={() => setEditing(true)}
          scales={scales}
          onScale={setScale}
          scaleRange={HOME_SCALE_RANGE}
          heightScales={heights}
          onHeightScale={setHeightScale}
          heightRange={HOME_HEIGHT_RANGE}
          aligns={aligns}
          onAlign={setAlign}
          onDragChange={setDragging}
          onRemove={removeSection}
          labels={HOME_SECTION_LABEL}
          sections={{
            hero: (
              <>
            {/* Hero card */}
            {/*
              No `borderRadius` prop: `styles.hero` carries it, and that is the
              one the fill is clipped to. It used to say 20 here while the style
              said 24, so the bevel and the shader drew a different curve from
              the card — the corner people saw as cut.
            */}
            {/*
              `heights.hero > 1 && styles.grow` is what makes dragging the
              height bar do anything visible.

              `Reorderable` gives the block a taller SLOT — that part always
              worked — but a card only fills a slot if it says so. Without this
              the hero kept its natural height and the dragged space came out
              as a band of empty background beneath it, which is what the owner
              reported as the block not resizing, and what `check:smoke`
              measured as "grew the hero by only 0px".

              Conditional, not unconditional: `flex: 1` at rest would make the
              card fight its own content for height on a screen where nothing
              has been resized.
            */}
            <GlassSurface
              style={[
                styles.hero,
                scales.hero < 0.75 && { padding: 12 },
                heights.hero > 1 && styles.grow,
              ]}>
              <View
                style={[styles.heroGlow, { backgroundColor: withAlpha(colors.fuchsia, 0.12) }]}
                pointerEvents="none"
              />
              <Animated.View style={{ opacity: heroFade }}>
                <Text
                  accessibilityRole="header"
                  style={[
                    styles.heroTitle,
                    { color: colors.fuchsia },
                    scales.hero < 0.75 && { fontSize: 18, lineHeight: 22 },
                  ]}>
                  {hero.title}
                </Text>
                {/* The sentence is the first thing to go: the headline is
                    what carries the block, and three lines of encouragement is
                    exactly the sort of thing someone shrinking their home
                    screen wants back. */}
                {scales.hero < 0.85 ? null : (
                  <Text style={[styles.heroBody, { color: colors.textMuted }]}>{hero.body}</Text>
                )}
              </Animated.View>

              {scales.hero < 0.85 ? null : (
              <View style={[styles.credit, { borderColor: colors.border }]}>
                <View>
                  <Text style={[styles.creditLabel, { color: colors.textMuted }]}>CREATED BY</Text>
                  <Text style={[styles.creditName, { color: colors.text }]}>Sabharivarshan S</Text>
                </View>
                <Flag size={16} color={colors.textMuted} />
              </View>
              )}

              {/* Tappable, so the carousel is something the reader controls rather
                  than something that happens to them (SKILL §16 Agency). */}
              <View style={[styles.dots, scales.hero < 0.75 && { marginTop: 8 }]}>
                {HERO_SLIDES.map((item, index) => (
                  <Touchable
                    key={item.title}
                    onPress={() => setSlide(index)}
                    label={item.title}
                    role="tab"
                    state={{ selected: index === slide }}
                    hitSlop={12}
                    scale={false}>
                    <View
                      style={[
                        styles.dot,
                        index === slide
                          ? { width: 20, backgroundColor: colors.primary }
                          : { width: 6, backgroundColor: colors.cardElevated },
                      ]}
                    />
                  </Touchable>
                ))}
              </View>
            </GlassSurface>
              </>
            ),
            quick: (
              <>
            {/* Quick actions */}
            <View
              style={[
                styles.quickRow,
                heights.quick > 1 && styles.grow,
                scales.quick < 0.75 && {
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  gap: 8,
                },
              ]}>
              <QuickAction
                icon={<TrendingUp size={18} color={colors.primary} />}
                label="Progress"
                sub="Track your learning"
                color={colors.primary}
                compact={scales.quick < 0.85}
                style={scales.quick < 0.75 ? { width: '48%', flex: 0, flexBasis: '48%' } : undefined}
                onPress={() => goToTab('Progress')}
              />
              <QuickAction
                icon={<Search size={18} color={colors.cyan} />}
                label="Search"
                sub="Find topics instantly"
                color={colors.cyan}
                compact={scales.quick < 0.85}
                style={scales.quick < 0.75 ? { width: '48%', flex: 0, flexBasis: '48%' } : undefined}
                onPress={() => navigation.navigate('BrowseHome', { focusSearch: true })}
              />
              <QuickAction
                icon={<TimerIcon size={18} color={colors.emerald} />}
                label="Timer"
                sub="Focus with Pomodoro"
                color={colors.emerald}
                compact={scales.quick < 0.85}
                style={scales.quick < 0.75 ? { width: '48%', flex: 0, flexBasis: '48%' } : undefined}
                onPress={() => goToTab('Timer')}
              />
              <QuickAction
                icon={<Sparkles size={18} color={colors.fuchsia} />}
                label="Ask AI"
                sub="Get instant help"
                color={colors.fuchsia}
                compact={scales.quick < 0.85}
                style={scales.quick < 0.75 ? { width: '48%', flex: 0, flexBasis: '48%' } : undefined}
                onPress={() => goToTab('AskAI')}
              />
            </View>
              </>
            ),
            whatsapp: (
              <>
            {/* WhatsApp community */}
            <Touchable
              onPress={openCommunity}
              label="Join our WhatsApp community"
              hint="Opens WhatsApp"
              scaleTo={0.985}
              style={[
                styles.whatsapp,
                heights.whatsapp > 1 && styles.grow,
                {
                  borderColor: withAlpha(colors.green, 0.3),
                  backgroundColor: withAlpha(colors.green, 0.05),
                  paddingHorizontal: scales.whatsapp < 0.75 ? 12 : 16,
                  paddingVertical: scales.whatsapp < 0.75 ? 8 : 12,
                },
              ]}>
              <View
                style={[
                  styles.whatsappIcon,
                  { backgroundColor: withAlpha(colors.green, 0.15) },
                  scales.whatsapp < 0.75 && { width: 26, height: 26, borderRadius: 13 },
                ]}>
                <MessageCircle size={scales.whatsapp < 0.75 ? 14 : 16} color={colors.green} />
              </View>
              <View style={styles.whatsappBody}>
                <Text
                  style={[
                    styles.whatsappTitle,
                    { color: colors.text },
                    scales.whatsapp < 0.75 && { fontSize: 13 },
                  ]}
                  numberOfLines={1}>
                  Join our WhatsApp community
                </Text>
                {scales.whatsapp < 0.85 ? null : (
                  <Text style={[styles.whatsappSub, { color: colors.textMuted }]}>
                    {groups.length > 1
                      ? `${groups.length} ${WHATSAPP_YEAR_LABEL[shortYear]} groups — pick one`
                      : groups[0].blurb}
                  </Text>
                )}
              </View>
              <Text style={[styles.whatsappJoin, { color: colors.green }]}>Join</Text>
            </Touchable>
              </>
            ),
            subjects: (
              <>
            {/* Your Subjects */}
            <View style={styles.sectionHeader}>
              <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
                Your Subjects
              </Text>
              <Touchable
                onPress={() => setYearPickerOpen(open => !open)}
                label="View all years"
                hint="Opens the year picker"
                state={{ expanded: yearPickerOpen }}
                style={styles.viewAll}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>View all</Text>
                <ChevronRight size={16} color={colors.primary} />
              </Touchable>
            </View>
            {/* The cards sort among themselves as well as travelling with
                the block they are in — hold one and it lifts out of the grid.
                Rendered until the stored order has been read, so the grid
                does not appear in the default order and then rearrange
                itself a frame later. */}
            <SortableGrid
              key={year}
              rendered={subjectRender ?? subjects.map(subject => subject.key)}
              order={subjectOrder}
              onOrderChange={saveSubjectOrder}
              editing={editing}
              columns={2}
              itemHeight={compact.subjects ? SUBJECT_CARD_COMPACT : SUBJECT_CARD_HEIGHT}
              rowGap={12}
              widthRatio={SUBJECT_CARD_RATIO}
              style={styles.subjectGrid}
              renderItem={key => {
                const subject = subjectByKey.get(key);
                if (!subject) {
                  return null;
                }
                const customBg = getBackground(subject.key);
                return (
                  <HoloCard
                    index={subjects.indexOf(subject)}
                    onPress={() => openSubject(subject.key, subject.name)}
                    // One spoken sentence beats four fragments; TalkBack reads
                    // the card as a whole, not as name / bar / percent / arrow.
                    label={`${subject.name}, ${subject.pct}% complete`}
                    from={cardGradient(subject)[0]}
                    to={cardGradient(subject)[1]}
                    bgImageUri={subjectMediaUri(customBg)}
                    disabled={editing}
                    borderColor={colors.border}
                    borderRadius={16}
                    style={styles.subjectTile}
                    innerStyle={styles.subjectCard}>
                    <View style={styles.subjectHeaderRow}>
                      <Text style={styles.subjectEmoji}>{subject.icon}</Text>
                      {editing ? (
                        /*
                         * These two buttons only exist in edit mode, and edit
                         * mode is exactly when `ReorderLockContext` turns every
                         * Touchable inside a block into a no-op — so the picture
                         * button could never have been pressed. The lock is
                         * there so that *holding* a subject card to rearrange
                         * does not also open that subject on release; it was
                         * never meant to cover the controls that edit mode adds.
                         * They opt out, the way the reorder arrows do by
                         * living outside the block entirely.
                         */
                        <ReorderLockContext.Provider value={false}>
                        <View style={styles.cardCustomActions}>
                          <Touchable
                            onPress={async () => {
                              const res = await pickBackground(subject.key);
                              if (!res.success && res.error) {
                                setCardUploadError(res.error);
                              }
                            }}
                            label={`Upload picture for ${subject.name}`}
                            hitSlop={6}
                            scaleTo={0.88}
                            style={[
                              styles.cardPicBtn,
                              { backgroundColor: customBg ? colors.accent : withAlpha('#000000', 0.65) },
                            ]}>
                            <ImagePlus size={14} color="#FFFFFF" />
                          </Touchable>
                          {customBg ? (
                            <Touchable
                              onPress={() => removeSubjectBackground(subject.key)}
                              label={`Remove picture for ${subject.name}`}
                              hitSlop={6}
                              scaleTo={0.88}
                              style={[styles.cardPicBtn, { backgroundColor: withAlpha(colors.danger, 0.85) }]}>
                              <X size={14} color="#FFFFFF" />
                            </Touchable>
                          ) : null}
                        </View>
                        </ReorderLockContext.Provider>
                      ) : null}
                    </View>
                    <View style={styles.subjectFooter}>
                      <Text style={[styles.subjectName, { color: colors.text }]}>
                        {subject.name.toUpperCase()}
                      </Text>
                      {compact.subjects ? null : (
                        <View
                          style={[
                            styles.subjectTrack,
                            { backgroundColor: withAlpha('#000000', 0.4) },
                          ]}>
                          <SubjectFill pct={subject.pct} color={colors.primary} />
                        </View>
                      )}
                      <View style={styles.subjectMeta}>
                        <Text style={[styles.subjectPct, { color: colors.primary }]}>
                          {subject.pct}% Complete
                        </Text>
                        <View
                          style={[styles.subjectArrow, { backgroundColor: withAlpha('#000000', 0.4) }]}>
                          <ArrowRight size={12} color={colors.text} />
                        </View>
                      </View>
                    </View>
                  </HoloCard>
                );
              }}
            />
              </>
            ),
            stats: (
              <>
            {/* Stats */}
            <View
              style={[
                styles.stats,
                heights.stats > 1 && styles.grow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <View style={styles.stat}>
                <View style={[styles.statIcon, { backgroundColor: withAlpha(colors.primary, 0.15) }]}>
                  <Flame size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Study Streak</Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {streak}
                    <Text style={[styles.statUnit, { color: colors.textMuted }]}> days 🔥</Text>
                  </Text>
                </View>
              </View>
              <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
              <View style={styles.stat}>
                <View style={[styles.statIcon, { backgroundColor: withAlpha(colors.primary, 0.15) }]}>
                  <Trophy size={20} color={colors.primary} />
                </View>
                <View>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Study Time</Text>
                  <Text style={[styles.statValueSmall, { color: colors.text }]}>
                    {formatFocusTime(focusMinutes)}
                  </Text>
                  {compact.stats ? null : (
                    <Text style={[styles.statHint, { color: colors.primary }]}>Keep going!</Text>
                  )}
                </View>
              </View>
            </View>
              </>
            ),
          }}
        />

        {/* Overlays. They render into their own layer, so their place in the
            tree is arbitrary — what matters is that they are not inside a
            block that can be dragged. */}
      <HomeMenuSheet
        visible={menuOpen}
        onClose={() => setMenuOpen(false)}
        onGoToTab={goToTab}
        onBrowse={() => navigation.navigate('BrowseHome', {})}
        onSearch={() => navigation.navigate('BrowseHome', { focusSearch: true })}
        onRearrange={() => setEditing(true)}
        onSettings={() => setSettingsOpen(true)}
        onThemes={() => setThemeOpen(true)}
        onCommunity={openCommunity}
        adFreeUntil={premiumExpiresAt()?.slice(0, 10) ?? null}
        onRemoveAds={() => setSettingsOpen(true)}
      />

      <ThemeMenu
        visible={themeOpen}
        anchor={anchor}
        onClose={() => setThemeOpen(false)}
        onCreate={() => setEditorOpen(true)}
      />

      <ThemeEditor
        visible={editorOpen}
        initial={custom ?? presetByKey('dark')!.palette!}
        onClose={() => setEditorOpen(false)}
        onApply={(next, glass) => {
          setCustom(next, glass);
          setPreference('custom');
          setEditorOpen(false);
        }}
      />

      {/*
        Which community group, when the year has more than one.

        Only final year does, and only because it genuinely has two — the batch
        sitting the exam and the 2023 question-bank group. Naming both and
        saying who each is for is the whole point: picking one for the reader
        would send half of them to the wrong room.
      */}
      <Sheet
        visible={groupChoice !== null}
        onClose={() => setGroupChoice(null)}
        title="Join the community">
        <View style={{ gap: space.sm, paddingBottom: space.md }}>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: space.xs }}>
            {WHATSAPP_YEAR_LABEL[shortYear]} has two groups. Open whichever is yours — you can
            join both.
          </Text>
          {(groupChoice ?? []).map(group => (
            <Touchable
              key={group.code}
              label={`Open ${group.name} on WhatsApp`}
              hint={group.blurb}
              onPress={() => {
                setGroupChoice(null);
                Linking.openURL(groupUrl(group)).catch(() => {});
              }}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: space.sm,
                borderWidth: 1,
                borderColor: withAlpha(colors.green, 0.3),
                backgroundColor: withAlpha(colors.green, 0.05),
                borderRadius: radius.lg,
                paddingHorizontal: space.md,
                paddingVertical: space.sm,
              }}>
              <View
                style={[styles.whatsappIcon, { backgroundColor: withAlpha(colors.green, 0.15) }]}>
                <MessageCircle size={16} color={colors.green} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
                  {group.name}
                </Text>
                <Text style={{ color: colors.textMuted, fontSize: 12 }}>{group.blurb}</Text>
              </View>
              <Text style={{ color: colors.green, fontWeight: '800', fontSize: 13 }}>Join</Text>
            </Touchable>
          ))}
        </View>
      </Sheet>

      <SettingsSheet
        visible={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        textSize={textSize}
        onTextSizeChange={setTextSize}
      />

      <YearPickerSheet
        visible={yearPickerOpen}
        currentYear={year}
        onClose={() => setYearPickerOpen(false)}
        onBrowse={(key, makeDefault) => {
          if (makeDefault) {
            pickYear(key);
          }
          setYearPickerOpen(false);
          navigation.navigate('BrowseHome', { year: key });
        }}
      />

      <Dialog
        visible={!!cardUploadError}
        onDismiss={() => setCardUploadError(null)}
        title="File Size Limit"
        message={cardUploadError || ''}
        actions={[{ label: 'OK', onPress: () => setCardUploadError(null), tone: 'primary' }]}
      />
      </ScrollView>
    </WallpaperBackground>
  );
}

/** "Select Year" bottom sheet, opened from "View all". */
function YearPickerSheet({
  visible,
  currentYear,
  onClose,
  onBrowse,
}: {
  visible: boolean;
  currentYear: YearKey;
  onClose: () => void;
  onBrowse: (year: YearKey, makeDefault: boolean) => void;
}) {
  const { colors } = useTheme();
  const [picked, setPicked] = useState<YearKey>(currentYear);
  const [makeDefault, setMakeDefault] = useState(false);

  // Reopening always starts from the user's current year.
  useEffect(() => {
    if (visible) {
      setPicked(currentYear);
      setMakeDefault(false);
    }
  }, [visible, currentYear]);

  return (
    <Sheet visible={visible} onClose={onClose} title="Select Year">
      <Text style={[styles.sheetSub, { color: colors.textMuted }]}>
        Choose the year you want to browse
      </Text>

      <View style={styles.sheetGrid}>
        {YEAR_KEYS.map(key => {
          const active = key === picked;
          const isDefault = key === currentYear;
          return (
            <Touchable
              key={key}
              onPress={() => setPicked(key)}
              role="radio"
              label={isDefault ? `${YEAR_LABEL[key]}, current default` : YEAR_LABEL[key]}
              state={{ checked: active }}
              scaleTo={0.97}
              style={[
                styles.sheetYear,
                {
                  backgroundColor: colors.cardElevated,
                  borderColor: active ? colors.text : colors.border,
                  borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
                },
              ]}>
              <Text style={[styles.sheetYearName, { color: colors.text }]}>
                {YEAR_LABEL[key]}
              </Text>
              {isDefault ? (
                <Text style={[styles.sheetYearHint, { color: colors.textMuted }]}>
                  Current default
                </Text>
              ) : null}
            </Touchable>
          );
        })}
      </View>

      <Touchable
        style={styles.checkRow}
        onPress={() => setMakeDefault(v => !v)}
        role="checkbox"
        label="Set as my default year"
        state={{ checked: makeDefault }}
        scale={false}>
        <View
          style={[
            styles.checkbox,
            {
              borderColor: makeDefault ? colors.primary : colors.border,
              backgroundColor: makeDefault ? colors.primary : 'transparent',
            },
          ]}>
          {makeDefault ? <Check size={14} color={colors.primaryText} strokeWidth={3} /> : null}
        </View>
        <Text style={[styles.checkLabel, { color: colors.text }]}>Set as my default year</Text>
      </Touchable>

      <Touchable
        onPress={() => onBrowse(picked, makeDefault)}
        label={`Browse ${YEAR_LABEL[picked]}`}
        style={styles.browseButton}>
        <GradientFill from="#FFFFFF" to={colors.fuchsia} borderRadius={14} />
        <Text style={styles.browseText}>Browse {YEAR_LABEL[picked]}</Text>
      </Touchable>
    </Sheet>
  );
}

function RoundButton({ children, label }: { children: React.ReactNode; label: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.roundButtonWrap}>
      <Text style={[styles.roundButtonLabel, { color: colors.textMuted }]}>{label}</Text>
      <View
        style={[
          styles.roundButton,
          { backgroundColor: colors.cardElevated, borderColor: colors.border },
        ]}>
        {children}
      </View>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  sub,
  color,
  compact,
  style,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  sub: string;
  color: string;
  compact?: boolean;
  style?: any;
  onPress: () => void;
}) {
  return (
    <Touchable
      onPress={onPress}
      label={label}
      // The description survives here rather than on screen: TalkBack has room
      // for it, a quarter of a 390dp row does not.
      hint={sub}
      style={[styles.quickActionTarget, style]}>
      {/* The surface is a child rather than the Touchable's own style, so the
          specular rim can sit above the fill without wrapping the press
          target in an extra layout box. */}
      <GlassSurface
        style={compact ? styles.quickActionCompact : styles.quickAction}
        borderRadius={16}>
      {/* The icon goes, not the label. An unlabelled icon is a guess; a
          label with no icon is still the thing you were looking for. */}
      {compact ? null : icon}
      {/* No arrow. Four identical chevrons on four obviously-tappable cards is
          decoration that costs the label its width — "Progress" was rendering
          as "Prog…" to make room for it. */}
      <Text style={[styles.quickLabel, { color }]} numberOfLines={1}>
        {label}
      </Text>
      </GlassSurface>
    </Touchable>
  );
}

/**
 * The completion bar on a subject card. Split out so only this sliver
 * re-renders when a question is ticked, rather than the whole grid.
 *
 * Squeezed with scaleX from the left edge rather than having its width
 * animated: width is a layout property and would force layout+paint every
 * frame, for every card in the grid, on the JS thread. See ui.tsx ProgressBar.
 */
const SubjectFill = React.memo(function SubjectFillBar({
  pct,
  color,
}: {
  pct: number;
  color: string;
}) {
  const reduceMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(pct / 100)).current;
  const firstRun = useRef(true);

  useEffect(() => {
    if (firstRun.current || reduceMotion) {
      firstRun.current = false;
      scale.setValue(pct / 100);
      return;
    }
    Animated.timing(scale, {
      toValue: pct / 100,
      duration: DURATION.base,
      easing: EASE.out,
      useNativeDriver: true,
    }).start();
  }, [pct, reduceMotion, scale]);

  return (
    <Animated.View
      style={[
        styles.subjectFill,
        {
          backgroundColor: color,
          transformOrigin: 'left',
          transform: [{ scaleX: scale }],
        },
      ]}
    />
  );
});

const styles = StyleSheet.create({
  /** Fills the taller slot `Reorderable` gives a block that has been resized. */
  grow: { flex: 1 },
  transparent: {
    backgroundColor: 'transparent',
  },
  textSizePreview: {
    marginTop: space.lg,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    // Fixed, not min: at 115% the sample is taller, and a box that grows
    // while the slider is being dragged moves the slider.
    height: 92,
    justifyContent: 'center',
  },
  textSizeSample: {
    ...typeScale.body,
  },
  textSizeScale: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 30,
    marginTop: space.md,
  },
  textSizeSmallA: {
    fontSize: 12,
    fontWeight: '700',
  },
  textSizeLargeA: {
    fontSize: 20,
    fontWeight: '700',
  },
  textSizeValue: {
    fontSize: 15,
    fontWeight: '700',
  },
  textSizeSlider: {
    marginBottom: space.md,
  },
  content: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: space.xl,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconButton: {
    height: 36,
    width: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: {
    ...typeScale.title3,
    // The wordmark is the one place tighter-than-ramp tracking is right: it is
    // read as a shape, not as text.
    letterSpacing: -0.4,
  },
  tagline: {
    ...typeScale.overline,
    fontWeight: '500',
    letterSpacing: 0.4,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
  },
  roundButtonWrap: {
    alignItems: 'center',
    gap: 3,
  },
  roundButtonLabel: {
    // 7pt was below the legibility floor. 9 with generous tracking reads as a
    // label rather than as dirt on the screen.
    fontSize: 9,
    letterSpacing: 0.8,
    fontWeight: '700',
  },
  roundButton: {
    height: 40,
    width: 40,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 18,
    overflow: 'hidden',
    marginBottom: space.lg,
  },
  heroGlow: {
    // Pushed mostly off the card so what shows is the soft shoulder of the
    // circle, not a hard arc sliced by the corner radius.
    position: 'absolute',
    right: -70,
    top: -90,
    height: 210,
    width: 210,
    borderRadius: 105,
  },
  heroTitle: typeScale.title1,
  heroBody: {
    ...typeScale.callout,
    marginTop: space.md,
  },
  credit: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: space.md,
  },
  creditLabel: typeScale.overline,
  creditName: {
    ...typeScale.footnote,
    fontWeight: '700',
    marginTop: 2,
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 14,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  quickRow: {
    flexDirection: 'row',
    gap: space.sm,
    marginBottom: space.lg,
  },
  quickActionTarget: {
    flex: 1,
  },
  quickActionCompact: {
    flex: 1,
    minHeight: 52,
    borderRadius: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  quickAction: {
    flex: 1,
    // Icon at the top, label at the bottom, nothing between them.
    // Was a fixed 120 carrying a two-line description that truncated on every
    // card. The descriptions said nothing the label did not — "Search / Find
    // topics instantly" — so they moved to the accessibility hint and the card
    // shrank to what it actually holds. minHeight, not height: fixed heights
    // and growing text are the classic clipping pair.
    minHeight: 84,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: space.md,
    justifyContent: 'space-between',
  },
  quickLabel: {
    ...typeScale.footnote,
    fontWeight: '700',
  },
  quickArrow: {
    marginTop: 4,
  },
  whatsapp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  whatsappIcon: {
    height: 32,
    width: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  whatsappBody: {
    flex: 1,
  },
  whatsappTitle: {
    ...typeScale.callout,
    fontWeight: '600',
  },
  whatsappSub: {
    ...typeScale.caption,
    marginTop: 2,
  },
  whatsappJoin: {
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: typeScale.title3,
  viewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 22,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 24,
    fontWeight: '800',
  },
  sheetSub: {
    ...typeScale.callout,
    marginTop: 2,
  },
  sheetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  sheetYear: {
    width: '47%',
    flexGrow: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    minHeight: 72,
    justifyContent: 'center',
  },
  sheetYearName: {
    fontSize: 17,
    fontWeight: '700',
  },
  sheetYearHint: {
    fontSize: 13,
    marginTop: 2,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 18,
  },
  checkbox: {
    height: 24,
    width: 24,
    borderRadius: 5,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkLabel: {
    fontSize: 16,
  },
  browseButton: {
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginTop: 18,
  },
  browseText: {
    color: '#1A0A1F',
    fontSize: 17,
    fontWeight: '800',
  },
  subjectGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // `space-between` rather than a gap. With `gap: 12` and `width: '48%'` the
    // two columns came to 96% + 12dp, which on a 358dp content width left ~2dp
    // dangling on the right — the grid was very slightly off-centre against
    // every other block on the screen. `space-between` makes both outer edges
    // flush by construction, so the column gutter is whatever is left over and
    // the block is mirror-symmetric at any screen width.
    justifyContent: 'space-between',
    rowGap: 12,
    marginBottom: space.lg,
  },
  // The tile's own box comes from SortableGrid; the card fills it.
  subjectTile: {
    width: '100%',
    height: '100%',
  },
  subjectBox: {
    // 48.5% x 2 = 97%, leaving a 3% gutter between the columns and nothing at
    // the edges. Strict two columns; an odd last card stays half-width instead
    // of stretching across.
    //
    // The box carries the layout and the tilt; the card inside it carries the
    // surface. Splitting them keeps the 3D transform off the same view that
    // has to clip its children.
    width: '48.5%',
    height: 160,
  },
  subjectCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  subjectHeaderRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  cardCustomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardPicBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  subjectEmoji: {
    fontSize: 32,
    opacity: 0.9,
  },
  subjectFooter: {
    zIndex: 1,
  },
  subjectName: {
    ...typeScale.footnote,
    fontWeight: '700',
    // Set in caps, which is exactly where letters need to be pushed apart to
    // stay countable.
    letterSpacing: 0.6,
  },
  subjectTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
  },
  subjectFill: {
    height: '100%',
    // Full width in layout; scaleX does the work.
    width: '100%',
    borderRadius: 2,
  },
  subjectMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  subjectPct: {
    ...typeScale.caption,
    fontWeight: '600',
  },
  subjectArrow: {
    height: 24,
    width: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    marginTop: 20,
    // Every block owns the space that follows it, so the gaps travel with the
    // block when the order changes instead of being redistributed. This one
    // used to be last and needed none.
    marginBottom: space.lg,
  },
  editBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    marginBottom: space.lg,
  },
  editBannerText: {
    ...typeScale.caption,
    flex: 1,
  },
  editReset: {
    ...typeScale.footnote,
    fontWeight: '700',
  },
  stat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
    marginHorizontal: 12,
  },
  statIcon: {
    height: 44,
    width: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statLabel: typeScale.caption,
  statValue: {
    ...typeScale.title3,
    marginTop: 1,
  },
  statValueSmall: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  statUnit: {
    fontSize: 12,
    fontWeight: '400',
  },
  statHint: {
    fontSize: 10,
    marginTop: 1,
  },
});
