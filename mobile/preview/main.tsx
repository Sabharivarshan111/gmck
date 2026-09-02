// Android renders the app in Roboto (React Native's default face, and the same
// font the web app inherits from Tailwind's stack). Desktop Linux has no
// Roboto, so the preview would otherwise fall back to Liberation Sans and
// misrepresent the typography. react-native-web's default font stack already
// names Roboto, so loading it here is enough.
import '@fontsource-variable/roboto';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { navigationRef } from '@/navigation/ref';
import type { InitialState } from '@react-navigation/native';
import { ThemeProvider, useTheme } from '@/theme';
import { Bot } from '@/components/Bot';
import type { StateId } from '@/bot/states';
import RootNavigator from '@/navigation/RootNavigator';
import { hydrateProgress } from '@/lib/progress';
import { hydrateSettings } from '@/lib/settings';
import { hydrateProfile, hydrateStreak } from '@/hooks/useProfile';
import { DailyAdConsent } from '@/components/DailyAdConsent';
import { XpToast } from '@/components/XpToast';
import { TourOverlay } from '@/components/TourOverlay';
import { startTour } from '@/tour/store';
import type { ChapterId } from '@/tour/script';
import { hydratePremium } from '@/lib/premium';
import { hydrateWallpaper } from '@/hooks/useWallpaper';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ScrollView, Text, TextInput, View } from 'react-native';
import { NotesContentView } from '@/components/NotesContentView';
import { applyQuestionDiagrams, applyTopicDiagrams } from '@/lib/handwrittenNotes';
import { ChapterNotes } from '@/components/ChapterNotes';
import { NoteText } from '@/components/NoteText';
import { NoteToolbar } from '@/components/NoteToolbar';
import { Touchable } from '@/components/Touchable';
import { Pencil, Eye } from 'lucide-react-native';
import { withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { getSubjects, type YearKey } from '@/lib/questionBank';
import { flattenSubjectTopics, ensureSingleNoteDiagram, type NotesContent } from '@/lib/handwrittenNotes';
import { SAMPLE_NOTES } from './notesSample';
import { TCA_DIAGRAMS, TCA_NOTE, TCA_QUESTION } from './diagramSample';
import { NotesAiEditBox } from '@/components/NotesAiEditBox';
import { McqCard } from '@/components/McqCard';
import { WaveformRiver } from '@/components/WaveformRiver';
import FlashcardsScreen, { StudyView } from '@/screens/FlashcardsScreen';
import HomeScreen from '@/screens/HomeScreen';

/**
 * Three cards, shaped exactly as generate-flashcards returns them: two theory
 * and one diagram, which is the half-and-half the deck is built to be.
 */
const ANKI_FIXTURE = [
  {
    id: 'demo::0',
    kind: 'theory' as const,
    front: 'Incubation period of typhoid fever',
    back: '10–14 days (range 3–21).',
    tags: ['typhoid', 'incubation'],
  },
  {
    id: 'demo::1',
    kind: 'image' as const,
    front: 'Current strategy of filaria control',
    back: '',
    imageUrl:
      'https://pmtgeydtqypwrypshhsx.supabase.co/storage/v1/object/public/diagrams/demo.png',
    tags: ['flowchart'],
  },
  {
    id: 'demo::2',
    kind: 'theory' as const,
    front: 'DOTS — what does the acronym stand for?',
    back: 'Directly Observed Treatment, Short-course.',
    hint: 'Five components',
    tags: ['tb', 'ntep'],
  },
];
import { ThinkingDots } from '@/components/ThinkingDots';
import { MessageEntrance } from '@/components/MessageEntrance';
import { RevealText } from '@/components/RevealText';
import { AnswerActions, followUpsFor } from '@/components/AnswerActions';
import { parseMcqs } from '@/lib/askAi';
import { SAMPLE_MCQ_RESPONSE } from './mcqSample';
import { SingleQuestionNote } from '@/components/SingleQuestionNote';
import { FocusTree } from '@/components/FocusTree';
import { SPECIES } from '@/lib/trees';

/**
 * Preview entry point. Mirrors App.tsx, minus the cloud sync, and lets the
 * screenshot script pick which screen to open via the query string:
 *
 *   ?screen=timer            → opens the Timer tab
 *   ?screen=browse&node=…    → opens a topic inside the Browse stack
 */

const TAB_ORDER = ['Home', 'Notes', 'Timer', 'AskAI', 'Progress'] as const;
type TabName = (typeof TAB_ORDER)[number];

const params = new URLSearchParams(window.location.search);
const screen = (params.get('screen') ?? 'home').toLowerCase();
const nodePath = params.get('node');
const nodeYear = params.get('year') ?? 'second-year';
const nodeTitle = params.get('title') ?? 'Topic';
const themeParam = params.get('theme') === 'light' ? 'light' : 'dark';
/**
 * The walkthrough, started only when asked for.
 *
 * It must **never** start on its own here. `hydrateTour` is not called in the
 * preview, so nothing sets `seen` and nothing calls `startTour` — which is the
 * point: an overlay that appeared by default would cover the screen for all
 * sixty-one existing smoke steps and fail every one of them for a reason that
 * has nothing to do with what they test.
 */
const tourParam = params.get('tour');

const tabIndex = Math.max(
  0,
  TAB_ORDER.findIndex(name => name.toLowerCase() === screen),
);

function buildInitialState(): InitialState {
  const routes: { name: TabName; state?: unknown }[] = TAB_ORDER.map(name => ({ name }));
  // Deep-link into the question-bank stack that lives inside the Home tab.
  if (nodePath || screen === 'browse') {
    const stackRoutes: { name: string; params?: unknown }[] = [{ name: 'HomeMain' }];
    if (screen === 'browse' || nodePath) {
      stackRoutes.push({ name: 'BrowseHome', params: { year: nodeYear } });
    }
    if (nodePath) {
      stackRoutes.push({
        name: 'BrowseNode',
        params: { year: nodeYear, path: nodePath.split(','), title: nodeTitle },
      });
    }
    routes[0] = {
      name: 'Home',
      state: { index: stackRoutes.length - 1, routes: stackRoutes },
    };
  }
  return { index: Math.max(0, tabIndex), routes } as InitialState;
}

// Phone-shaped safe area so padding matches a real handset.
const METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 40, left: 0, right: 0, bottom: 16 },
  ...initialWindowMetrics,
};

/**
/**
 * ?screen=treegallery — every focus tree, at 5 key stages of 24-frame growth.
 */
function TreeGallery() {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View style={{ marginBottom: 8 }}>
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>
          🌿 24-Frame Cinematic Botanical Growth Engine
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>
          Dual-layer optical cross-dissolve across all 24 sliced keyframes
        </Text>
      </View>
      {SPECIES.map(species => (
        <View key={species.key} style={{ gap: 6, backgroundColor: colors.card, padding: 12, borderRadius: 16, borderWidth: 1, borderColor: colors.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
              {species.name}
            </Text>
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 12 }}>
              Unlock: {species.unlockAt}m
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'flex-end', justifyContent: 'space-between' }}>
            {[0.05, 0.25, 0.50, 0.75, 1.0].map(growth => (
              <View key={growth} style={{ alignItems: 'center', gap: 2 }}>
                <FocusTree
                  species={species.key}
                  growth={growth}
                  size={64}
                  sway={false}
                />
                <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '600' }}>
                  {Math.round(growth * 100)}%
                </Text>
              </View>
            ))}
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

/**
 * ?screen=growthshowcase — Interactive 24-frame growth interpolation showcase.
 */
function GrowthShowcase() {
  const { colors } = useTheme();
  const [progress, setProgress] = React.useState(0.5);
  const [activeSpecies, setActiveSpecies] = React.useState('oak');

  React.useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => (p >= 1.0 ? 0.0 : +(p + 0.04).toFixed(2)));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 16 }}>
      <View>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>
          Real-Time Procedural Interpolation
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 4 }}>
          Continuous dual-layer cross-dissolve & sub-pixel scale morphing
        </Text>
      </View>

      {/* Interactive Live Timer Ring Simulation */}
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          backgroundColor: colors.card,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: colors.border,
        }}>
        <View
          style={{
            width: 220,
            height: 220,
            borderRadius: 110,
            borderWidth: 4,
            borderColor: colors.primary,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.background,
          }}>
          <FocusTree species={activeSpecies} growth={progress} size={160} sway={true} />
        </View>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700', marginTop: 12 }}>
          {Math.round(progress * 100)}% Grown · Stage {Math.min(24, Math.floor(progress * 23) + 1)}/24
        </Text>
      </View>

      {/* Species Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {SPECIES.map(sp => (
          <View
            key={sp.key}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 12,
              backgroundColor: sp.key === activeSpecies ? colors.primary : colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}>
            <Text
              onPress={() => setActiveSpecies(sp.key)}
              style={{
                color: sp.key === activeSpecies ? '#FFFFFF' : colors.text,
                fontWeight: '600',
                fontSize: 12,
              }}>
              {sp.name}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* 24-Frame Full Filmstrip */}
      <View style={{ gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 15, fontWeight: '700' }}>
          24 Discrete Transparent Slices ({activeSpecies})
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
          {Array.from({ length: 24 }, (_, i) => i + 1).map(stageNum => (
            <View
              key={stageNum}
              style={{
                width: 54,
                height: 60,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.card,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 2,
              }}>
              <FocusTree species={activeSpecies} growth={(stageNum - 1) / 23} size={42} sway={false} />
              <Text style={{ color: colors.textSecondary, fontSize: 9, fontWeight: '700' }}>
                F{stageNum}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

/**
 * ?screen=treeglide — the focus tree driven at the rate a real session moves.
 *
 * `GrowthShowcase` advances growth by 0.04 every 400ms, which is about sixty
 * times faster than a 25-minute session, and at that speed a broken
 * interpolator looks fine: the old one snapped, but it snapped so often that
 * the tree still appeared to be moving. This drives it the way `TimerScreen`
 * does — one tick a second, `1 / (25 * 60)` of the way — which is the only
 * rate at which "does it glide between frames" is a real question.
 */
function TreeGlide() {
  const { colors } = useTheme();
  /*
   * A one-minute session, which is the case the stepping was reported from and
   * the hardest one to get right: growth covers 1/60 per tick, about 38% of a
   * whole frame interval, so every second has to carry a third of a frame's
   * worth of fade. A 25-minute session moves 25 times slower and hides the
   * difference behind rounding.
   */
  const SESSION_SECONDS = 60;
  // Start part-way in, so a frame boundary is crossed during the sample.
  const [elapsed, setElapsed] = React.useState(4);
  React.useEffect(() => {
    const id = setInterval(() => setElapsed(value => value + 1), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.background,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <FocusTree species="oak" growth={elapsed / SESSION_SECONDS} size={180} />
    </View>
  );
}

/**
 * ?screen=diagramdemo — the top of a single-question note, where the bug was.
 *
 * "TCA cycle – definition, sequence of reaction, energetics, regulation" used
 * to open with three diagram cards: (1/3) Glycolysis, (2/3) Gluconeogenesis,
 * and only then its own. This renders the same question through the app's own
 * `applyQuestionDiagrams`, so the card count and the caption on screen are the
 * ones the phone would draw.
 *
 * The picture itself cannot load here — the sandbox is firewalled from the
 * storage bucket — so what this screen proves is the *choice*: one card, named
 * for this question. Which file that URL points at is proved separately, and
 * against production rows, by `npm run check:diagrams`.
 */
function DiagramDemo() {
  const { colors } = useTheme();
  const content = applyQuestionDiagrams(TCA_NOTE, TCA_DIAGRAMS, TCA_QUESTION);
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text
        style={{
          color: colors.fuchsia,
          fontSize: 12,
          letterSpacing: 1.4,
          marginBottom: 4,
        }}>
        HANDWRITTEN NOTE
      </Text>
      <Text style={{ color: colors.text, fontSize: 20, marginBottom: 16 }}>
        TCA cycle – definition, sequence of reaction, energetics, regulation
      </Text>
      <NotesContentView content={content} />
    </ScrollView>
  );
}

/**
 * ?screen=notesdemo — the handwritten-notes renderer with a fixture.
 *
 * The real notes come from an edge function that costs AI quota and takes
 * minutes; this shows the same component with fixed content so layout work can
 * be reviewed instantly. Preview only — see notesSample.ts.
 */
function NotesRendererDemo() {
  const { colors } = useTheme();
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <NotesContentView content={SAMPLE_NOTES} />
      {/* The AI edit box, so its layout and its failure path can be reviewed.
          Sending from here reaches a Supabase function the sandbox cannot
          call, which is the point of including it: the box has to fail into a
          message rather than take the screen with it. */}
      <NotesAiEditBox
        request={{
          question: 'Gustafson\u2019s method / Gustafson\u2019s changes in teeth.',
          subjectKey: 'forensic-medicine',
          subjectName: 'Forensic Medicine',
          yearLabel: '3rd Year',
        }}
        content={SAMPLE_NOTES}
        onApply={() => undefined}
      />
    </ScrollView>
  );
}

/*
 * Stand-in plates.
 *
 * The real ones are `question_diagrams.public_url`s in the Supabase storage
 * bucket, which no sandbox can reach — the egress gateway refuses it. What
 * this screen is for is the part that does not depend on the bytes: that a
 * chapter's diagrams become sections at all, that each is captioned with the
 * question it answers, and that they sit above the note body rather than
 * inside it. Drawn rather than downloaded, for the same reason the focus
 * trees' fixtures are.
 */
const PLATE_SYNOVIAL =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NDAiIGhlaWdodD0iNDIwIj48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQyMCIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjI0IiB5PSIyNCIgd2lkdGg9IjU5MiIgaGVpZ2h0PSIzNzIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFmMjkzNyIgc3Ryb2tlLXdpZHRoPSIzIi8+PHRleHQgeD0iMzIwIiB5PSIxODAiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLHNlcmlmIiBmb250LXNpemU9IjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMTExODI3Ij5UeXBlcyBvZiBzeW5vdmlhbCBqb2ludDwvdGV4dD48dGV4dCB4PSIzMjAiIHk9IjIyOCIgZm9udC1mYW1pbHk9Ikdlb3JnaWEsc2VyaWYiIGZvbnQtc2l6ZT0iMTciIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2YjcyODAiPnBsYW5lIC0gaGluZ2UgLSBwaXZvdCAtIHNhZGRsZSAtIGJhbGwgYW5kIHNvY2tldDwvdGV4dD48bGluZSB4MT0iMTIwIiB5MT0iMjc4IiB4Mj0iNTIwIiB5Mj0iMjc4IiBzdHJva2U9IiMwZWE1ZTkiIHN0cm9rZS13aWR0aD0iMyIvPjxjaXJjbGUgY3g9IjEyMCIgY3k9IjI3OCIgcj0iOCIgZmlsbD0iIzBlYTVlOSIvPjxjaXJjbGUgY3g9IjUyMCIgY3k9IjI3OCIgcj0iOCIgZmlsbD0iIzBlYTVlOSIvPjwvc3ZnPg==';
const PLATE_PLEXUS =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NDAiIGhlaWdodD0iNDIwIj48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQyMCIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjI0IiB5PSIyNCIgd2lkdGg9IjU5MiIgaGVpZ2h0PSIzNzIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFmMjkzNyIgc3Ryb2tlLXdpZHRoPSIzIi8+PHRleHQgeD0iMzIwIiB5PSIxODAiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLHNlcmlmIiBmb250LXNpemU9IjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMTExODI3Ij5CcmFjaGlhbCBwbGV4dXM8L3RleHQ+PHRleHQgeD0iMzIwIiB5PSIyMjgiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLHNlcmlmIiBmb250LXNpemU9IjE3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNmI3MjgwIj5yb290cyAtIHRydW5rcyAtIGRpdmlzaW9ucyAtIGNvcmRzIC0gYnJhbmNoZXM8L3RleHQ+PGxpbmUgeDE9IjEyMCIgeTE9IjI3OCIgeDI9IjUyMCIgeTI9IjI3OCIgc3Ryb2tlPSIjMGVhNWU5IiBzdHJva2Utd2lkdGg9IjMiLz48Y2lyY2xlIGN4PSIxMjAiIGN5PSIyNzgiIHI9IjgiIGZpbGw9IiMwZWE1ZTkiLz48Y2lyY2xlIGN4PSI1MjAiIGN5PSIyNzgiIHI9IjgiIGZpbGw9IiMwZWE1ZTkiLz48L3N2Zz4=';
const PLATE_AXILLA =
  'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI2NDAiIGhlaWdodD0iNDIwIj48cmVjdCB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQyMCIgZmlsbD0iI2ZmZmZmZiIvPjxyZWN0IHg9IjI0IiB5PSIyNCIgd2lkdGg9IjU5MiIgaGVpZ2h0PSIzNzIiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzFmMjkzNyIgc3Ryb2tlLXdpZHRoPSIzIi8+PHRleHQgeD0iMzIwIiB5PSIxODAiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLHNlcmlmIiBmb250LXNpemU9IjMwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjMTExODI3Ij5BeGlsbGE8L3RleHQ+PHRleHQgeD0iMzIwIiB5PSIyMjgiIGZvbnQtZmFtaWx5PSJHZW9yZ2lhLHNlcmlmIiBmb250LXNpemU9IjE3IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNmI3MjgwIj5ib3VuZGFyaWVzIGFuZCBjb250ZW50czwvdGV4dD48bGluZSB4MT0iMTIwIiB5MT0iMjc4IiB4Mj0iNTIwIiB5Mj0iMjc4IiBzdHJva2U9IiMwZWE1ZTkiIHN0cm9rZS13aWR0aD0iMyIvPjxjaXJjbGUgY3g9IjEyMCIgY3k9IjI3OCIgcj0iOCIgZmlsbD0iIzBlYTVlOSIvPjxjaXJjbGUgY3g9IjUyMCIgY3k9IjI3OCIgcj0iOCIgZmlsbD0iIzBlYTVlOSIvPjwvc3ZnPg==';

/**
 * ?screen=chapterdiagrams — a chapter note with its chapter's diagrams on it.
 *
 * The Notes tab renders a whole chapter, and it showed no pictures at all
 * while triple-tapping one of that chapter's own questions showed them: the
 * chapter path never asked for a diagram. `findDiagramsForTopic` is the
 * lookup, `check:diagrams` proves it returns a chapter's own plates and
 * nobody else's, and this is the other half — what those plates look like once
 * `applyTopicDiagrams` has put them on the page.
 *
 * The diagrams are a fixture rather than a live lookup because
 * `question_diagrams` is behind Supabase, which no sandbox can reach. What is
 * real here is the renderer and the section shape it is given.
 */
function ChapterDiagramsDemo() {
  const { colors } = useTheme();
  const withDiagrams = React.useMemo(
    () =>
      applyTopicDiagrams(SAMPLE_NOTES, [
        {
          url: PLATE_SYNOVIAL,
          question: 'Types of synovial joint',
          title: 'Types of synovial joint',
        },
        {
          url: PLATE_PLEXUS,
          question:
            'Describe the formation, relations and branches of the brachial plexus***',
          title: 'Brachial plexus — formation, relations and branches',
        },
        {
          url: PLATE_AXILLA,
          question: 'Axilla: boundaries and contents**',
          title: 'Axilla — boundaries and contents',
        },
      ]),
    [],
  );
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <NotesContentView content={withDiagrams} />
    </ScrollView>
  );
}

/**
 * ?screen=tcanote — Live preview of TCA cycle handwritten notes with authentic diagram matching.
 */
function TcaNoteDemo() {
  const { colors } = useTheme();
  const [content, setContent] = React.useState<NotesContent | null>(null);

  React.useEffect(() => {
    async function load() {
      const request = {
        question: 'TCA cycle – definition, sequence of reaction, energetics, regulation***',
        subjectKey: 'biochemistry',
        subjectName: 'Biochemistry',
        yearLabel: '1st Year',
      };
      const raw: NotesContent = {
        highYieldTip: "Remember the '3-3-1' rule: 3 NADH, 1 FADH2, and 1 GTP (ATP) are produced per cycle. The cycle is 'amphibolic' because it serves both catabolic and anabolic roles.",
        pyqYears: ['2023', '2021', '2019'],
        sections: [
          {
            type: 'definition',
            title: 'Definition of TCA Cycle',
            icon: '📌',
            payload: { text: 'The Citric Acid Cycle (TCA cycle or Krebs cycle) is a series of enzymatic reactions occurring in the mitochondrial matrix.' },
          },
          {
            type: 'definition',
            title: 'Sequence of Reactions',
            icon: '🔁',
            payload: { text: '1. Citrate Synthase (Acetyl-CoA + OAA -> Citrate)\n2. Aconitase (Citrate -> Isocitrate)\n3. Isocitrate Dehydrogenase (Rate-limiting)\n4. Alpha-Ketoglutarate Dehydrogenase' },
          },
          {
            type: 'definition',
            title: 'Energetics of TCA Cycle',
            icon: '⚡',
            payload: { text: 'Total yield per Acetyl-CoA oxidized: 10 ATP (3 NADH = 7.5 ATP, 1 FADH2 = 1.5 ATP, 1 GTP = 1 ATP).' },
          },
        ],
      };
      const enriched = await ensureSingleNoteDiagram(raw, request);
      setContent(enriched);
    }
    void load();
  }, []);

  if (!content) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: colors.textSecondary }}>Loading TCA Cycle Notes…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <NotesContentView content={content} />
      <NotesAiEditBox
        request={{
          question: 'TCA cycle – definition, sequence of reaction, energetics, regulation***',
          subjectKey: 'biochemistry',
          subjectName: 'Biochemistry',
          yearLabel: '1st Year',
        }}
        content={content}
        onApply={setContent}
      />
    </ScrollView>
  );
}

/**
 * ?screen=mcqdemo — the MCQ cards a double tap produces.
 *
 * Same reason as notesdemo: the real ones come from ask-gemini, which costs
 * quota and needs a key. This renders the parser's output for a fixed response,
 * so the card layout and the answered/unanswered states can be reviewed.
 */
function McqDemo() {
  const { colors } = useTheme();
  const items = parseMcqs(SAMPLE_MCQ_RESPONSE) ?? [];
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 10 }}>
      {items.map((item, i) => (
        <McqCard key={i} item={item} index={i} />
      ))}
    </ScrollView>
  );
}

/** ?screen=chatdemo — the chat's motion pieces, isolated for review. */
function ChatMotionDemo() {
  const { colors } = useTheme();
  const [answered, setAnswered] = React.useState(false);
  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, gap: 14 }}>
      {/* The dictation visualiser. It lives here because the composer's own
          copy is unreachable from a browser: listen() rejects at once without a
          recogniser, so `listening` never holds long enough to see. A component
          nothing can render is a component nothing can check. */}
      <WaveformRiver active color={colors.cyan ?? '#22d3ee'} />
      <ThinkingDots label="Thinking…" />
      <MessageEntrance>
        <View
          style={{
            maxWidth: '88%',
            alignSelf: 'flex-end',
            backgroundColor: colors.cardElevated,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}>
          <Text style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}>
            Discuss the aetiology of jaundice
          </Text>
        </View>
      </MessageEntrance>
      <MessageEntrance>
        <View
          style={{
            maxWidth: '88%',
            alignSelf: 'flex-start',
            backgroundColor: colors.background,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 14,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}>
          <RevealText
            text={
              'Jaundice is yellowish discolouration of skin and sclera caused by hyperbilirubinaemia, classified as pre-hepatic, hepatic and post-hepatic by the level at which bilirubin handling fails. Pre-hepatic causes are haemolytic; hepatic causes include viral hepatitis and cirrhosis; post-hepatic causes are obstructive, most often gallstones or carcinoma of the head of pancreas.'
            }
            onDone={() => setAnswered(true)}
            style={{ color: colors.text, fontSize: 14, lineHeight: 20 }}
          />
        </View>
        {answered ? (
          <AnswerActions
            followUps={followUpsFor('Discuss the aetiology of jaundice')}
            onPick={() => {}}
            onRetry={() => {}}
          />
        ) : null}
      </MessageEntrance>
    </ScrollView>
  );
}

/**
 * ?screen=botdemo — every one of the avatar's states, side by side.
 *
 * The engine can be checked in Node, which covers what it *computes*; this
 * covers what it *looks like*, which no assertion can. Six at once rather than
 * one at a time, because the thing worth seeing is whether they read as
 * different expressions of one face — a state that is indistinguishable from
 * idle is a state that is not earning its place.
 */
function BotDemo() {
  const { colors } = useTheme();
  const states: StateId[] = ['idle', 'thinking', 'wide', 'wink', 'exclaim', 'sleep'];
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 24 }}>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 20 }}>
        Bot states
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 24 }}>
        {states.map(state => (
          <View key={state} style={{ alignItems: 'center', width: 96 }} testID={`bot-${state}`}>
            <View
              style={{
                backgroundColor: withAlpha(colors.accent, 0.16),
                borderRadius: 20,
                padding: 8,
              }}>
              <Bot state={state} size={72} />
            </View>
            <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: 12 }}>{state}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/**
 * ?screen=usernotesdemo — Interactive user study notes live preview & editor testing.
 */
function UserNotesDemo() {
  const { colors } = useTheme();
  const [mode, setMode] = React.useState<'edit' | 'preview'>(
    params.get('mode') === 'edit' ? 'edit' : 'preview',
  );
  const [content, setContent] = React.useState(
    `# Blood Supply of a Long Bone\n## Arterial Supply & Microcirculation\nThe arterial supply of a growing long bone is derived from **four primary arterial sources**:\n\n- **Nutrient Artery**: Enters obliquely via the nutrient canal in the diaphysis, dividing into ascending and descending medullary branches.\n- **Epiphyseal Arteries**: Arise from periarticular anastomoses, supplying the non-articular epiphysis.\n- **Metaphyseal Arteries**: Form hairpin vascular loops beneath the epiphyseal growth plate.\n- **Periosteal Arteries**: Supply the outer 1/3rd of the compact bone cortex.\n\n1. High clinical importance in ==y:acute hematogenous osteomyelitis==.\n2. Metaphyseal hairpin loops are the ==p:most common site for bacterial emboli== in pediatric patients!\n3. Haversian canals run longitudinally containing central ==b:neurovascular bundles==.`,
  );
  const [selection, setSelection] = React.useState({ start: 0, end: 0 });
  const [forcedSelection, setForcedSelection] = React.useState<{
    start: number;
    end: number;
  } | null>(null);
  /*
   * `onFont` is a required prop and this screen never passed it, so pressing
   * Typeface here called `undefined`. The real screen has always had it — the
   * same drift as the dropped selection above.
   */
  const [font, setFont] = React.useState<string | null>(null);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 14 }}>
      <View style={{ gap: 4 }}>
        <Text style={{ ...typeScale.title2, color: colors.text, fontWeight: '800' }}>
          Personal Study Notes
        </Text>
        <Text style={{ ...typeScale.footnote, color: colors.textMuted }}>
          Real-time markdown engine with live preview & formatting toolbar
        </Text>
      </View>

      {/* Segmented Mode Switcher */}
      <View
        style={{
          flexDirection: 'row',
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.card,
          padding: 4,
          gap: 4,
        }}>
        <Touchable
          onPress={() => setMode('edit')}
          label="Edit note mode"
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: mode === 'edit' ? colors.primary : 'transparent',
          }}>
          <Pencil size={15} color={mode === 'edit' ? colors.primaryText : colors.textMuted} />
          <Text
            style={{
              ...typeScale.callout,
              fontWeight: '700',
              color: mode === 'edit' ? colors.primaryText : colors.textMuted,
            }}>
            Edit Mode
          </Text>
        </Touchable>

        <Touchable
          onPress={() => setMode('preview')}
          label="Live preview mode"
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            paddingVertical: 8,
            borderRadius: 8,
            backgroundColor: mode === 'preview' ? colors.fuchsia : 'transparent',
          }}>
          <Eye size={15} color={mode === 'preview' ? '#FFFFFF' : colors.textMuted} />
          <Text
            style={{
              ...typeScale.callout,
              fontWeight: '700',
              color: mode === 'preview' ? '#FFFFFF' : colors.textMuted,
            }}>
            Live Preview
          </Text>
        </Touchable>
      </View>

      {mode === 'edit' ? (
        <View style={{ gap: 10 }}>
          <NoteToolbar
            value={content}
            selection={selection}
            font={font}
            onFont={setFont}
            isPreview={false}
            onTogglePreview={() => setMode('preview')}
            /*
             * The third argument is what keeps the words selected after a
             * format, and this screen used to drop it — so pressing Bold and
             * then Italic put `__` after the bolded word instead of around it,
             * and two styles on one word were unreachable *here* while working
             * perfectly in the app. `ProgressNotesTab` has always honoured it.
             *
             * That drift is the reason this demo exists at all: it is what the
             * toolbar is tested through, so a demo that is easier on the
             * toolbar than the real screen is a test that passes for a feature
             * nobody can use. Keep the two the same shape.
             */
            onChange={(text, cursor, select) => {
              setContent(text);
              const next = select ?? { start: cursor, end: cursor };
              setSelection(next);
              setForcedSelection(next);
            }}
          />
          <TextInput
            value={content}
            onChangeText={setContent}
            onSelectionChange={e => {
              setSelection(e.nativeEvent.selection);
              setForcedSelection(null);
            }}
            // Controlled only for the frame after a toolbar press, the same as
            // the real screen: pinning it would fight every tap in the text.
            selection={forcedSelection ?? undefined}
            multiline
            textAlignVertical="top"
            numberOfLines={12}
            style={{
              minHeight: 280,
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 14,
              padding: 14,
              color: colors.text,
              ...typeScale.body,
            }}
          />
        </View>
      ) : (
        <View
          style={{
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderRadius: 16,
            padding: 18,
            gap: 12,
          }}>
          <View style={{ gap: 6 }}>
            <View
              style={{
                alignSelf: 'flex-start',
                backgroundColor: withAlpha(colors.fuchsia, 0.15),
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: 6,
              }}>
              <Text style={{ ...typeScale.caption, fontWeight: '700', color: colors.fuchsia }}>
                Anatomy · Upper Limb & Osteology
              </Text>
            </View>
            <Text style={{ ...typeScale.title2, fontWeight: '700', color: colors.text }}>
              Blood Supply of Long Bones
            </Text>
          </View>
          <View style={{ height: 1, backgroundColor: colors.border, width: '100%' }} />
          <NoteText content={content} font={font} />
        </View>
      )}
    </ScrollView>
  );
}

function Shell() {
  const { theme, colors } = useTheme();
  React.useEffect(() => {
    hydrateProgress();
      hydrateSettings().catch(() => {});
    hydrateProfile().catch(() => {});
    // Separate from the profile: this half must land even when the cloud
    // half cannot. See hydrateStreak.
    hydrateStreak().catch(() => {});
    hydratePremium().catch(() => {});
    hydrateWallpaper().catch(() => {});
    // Only on request. `?tour=1` runs the whole thing; `?tour=focus` runs one
    // chapter. Never by default — see tourParam.
    if (tourParam) {
      startTour(tourParam === '1' ? undefined : (tourParam as ChapterId));
    }
  }, []);

  const base = theme === 'dark' ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      background: colors.background,
      card: colors.card,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  if (screen === 'treegallery') {
    return <TreeGallery />;
  }
  if (screen === 'treeglide') {
    return <TreeGlide />;
  }
  if (screen === 'growthshowcase') {
    return <GrowthShowcase />;
  }
  if (screen === 'diagramdemo') {
    return <DiagramDemo />;
  }
  if (screen === 'chapterdiagrams') {
    return <ChapterDiagramsDemo />;
  }
  if (screen === 'notesdemo') {
    return <NotesRendererDemo />;
  }
  /*
   * ?screen=singlenote — the real triple-tap note reader, on the real question.
   *
   * Nothing is faked inside the app: this mounts `SingleQuestionNote`, which
   * calls `fetchSingleQuestionNote` → `ensureSingleNoteDiagram` →
   * `findDiagramsForQuestion` → `applyQuestionDiagrams` exactly as it does on a
   * phone. Only the *network* is stubbed, by the test driving the page, so the
   * question this route names is the one whose row was verified in production.
   *
   * That is the difference between proving the renderer can draw a picture —
   * which `notesdemo` already did — and proving this screen puts one there.
   */
  if (screen === 'singlenote') {
    return (
      <SingleQuestionNote
        question={
          'Brachial plexus - Formation, variation (pre and post fixed), branches and applied anatomy. ***'
        }
        subjectKey="anatomy"
        subjectName="Anatomy"
        yearLabel="First Year"
        onClose={() => {}}
      />
    );
  }
  if (screen === 'tcanote') {
    return <TcaNoteDemo />;
  }
  if (screen === 'usernotesdemo') {
    return <UserNotesDemo />;
  }
  if (screen === 'botdemo') {
    return <BotDemo />;
  }
  if (screen === 'homeedit') {
    return (
      <NavigationContainer theme={navTheme}>
        <HomeScreen initialEditing={true} />
      </NavigationContainer>
    );
  }
  if (screen === 'homeresized') {
    return (
      <NavigationContainer theme={navTheme}>
        <HomeScreen initialEditing={false} />
      </NavigationContainer>
    );
  }

  if (screen === 'mcqdemo') {
    return <McqDemo />;
  }

  if (screen === 'chatdemo') {
    return <ChatMotionDemo />;
  }

  /*
   * ?screen=flashcards — the deck browser on its own.
   *
   * Reachable in the app only through Notes, which makes it three taps away
   * from a screenshot and from anyone reviewing it. `onExit` is a no-op here
   * because there is nothing to go back to.
   */
  if (screen === 'flashcards') {
    return <FlashcardsScreen onExit={() => {}} />;
  }

  /*
   * ?screen=chapternotes&subject=…&topic=… — the reader's own notes for one
   * chapter, on their own.
   *
   * The real home of this block is NotesScreen, which only exists once the
   * notes edge function has answered — a call the harness cannot make. Without
   * a route the *other* half of filing a note is unreachable, and the half
   * that shipped broken before was exactly this one.
   *
   * It takes the subject and chapter by **name** and resolves the key here,
   * through the same flattenSubjectTopics the real screen uses. That is what
   * makes it an assertion rather than a tautology: the filing sheet writes a
   * key from one walk of the bank and this reads it back from another, so the
   * two disagreeing is a failure rather than an invisible miss.
   */
  if (screen === 'chapternotes') {
    const wantSubject = (params.get('subject') ?? '').toLowerCase();
    const wantTopic = (params.get('topic') ?? '').toLowerCase();
    const subject = getSubjects(nodeYear as YearKey).find(s => s.name.toLowerCase() === wantSubject);
    const topic = subject
      ? flattenSubjectTopics(subject.key, subject.node).find(
          t => t.name.toLowerCase() === wantTopic,
        )
      : undefined;
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        {topic ? (
          <ChapterNotes chapterKey={topic.key} />
        ) : (
          <Text>no such chapter</Text>
        )}
      </ScrollView>
    );
  }

  /*
   * ?screen=ankidemo — one study session, driven by a fixture.
   *
   * The real one needs a deck from Supabase, which the harness cannot reach, so
   * without this every state past the error message is unreviewable: the card
   * face, Show Answer, the four buttons and the interval each would give. Those
   * are the parts worth looking at before they reach a phone.
   */
  if (screen === 'ankidemo') {
    return (
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <StudyView
          year="third"
          subjectName="Community Medicine"
          topic={{
            key: 'community-medicine::epidemiology-of-communicable-diseases',
            name: 'Epidemiology of Communicable Diseases',
            breadcrumb: 'Community Medicine › Epidemiology',
            questions: [],
          }}
          onBack={() => {}}
          fixture={ANKI_FIXTURE}
        />
      </ScrollView>
    );
  }

  return (
    <NavigationContainer theme={navTheme} ref={navigationRef} initialState={buildInitialState()}>
      <RootNavigator />
      <DailyAdConsent />
      <XpToast />
      <TourOverlay />
    </NavigationContainer>
  );
}

createRoot(document.getElementById('root')!).render(
  // Mirrors App.tsx, including the boundary sitting outside the providers.
  <ErrorBoundary>
    <SafeAreaProvider initialMetrics={METRICS}>
      <ThemeProvider initialPreference={themeParam}>
        <Shell />
      </ThemeProvider>
    </SafeAreaProvider>
  </ErrorBoundary>,
);
