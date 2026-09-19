import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Modal,
  PanResponder,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  BookOpen,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ExternalLink,
  FilePlus,
  ImagePlus,
  LayoutGrid,
  Minus,
  PenLine,
  Plus,
  RotateCcw,
  Search,
  StickyNote,
  Trash2,
  X,
} from 'lucide-react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DrawCanvas, type Stroke } from '@/components/DrawCanvas';
import { InkedImage } from '@/components/InkedImage';
import { KeyboardSafe } from '@/components/KeyboardSafe';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import {
  loadNoteInk,
  saveNoteInk,
  type NoteInk,
} from '@/lib/noteImages';
import { NoteText } from '@/components/NoteText';
import { NoteToolbar, type Selection } from '@/components/NoteToolbar';
import {
  openFileExternal,
  renderNotePdf,
  type InsertedPdfPage,
  type NoteFile,
  type RenderedPdfPage,
} from '@/lib/noteFiles';
import { useTheme, withAlpha } from '@/theme';

export interface PdfViewerModalProps {
  file: NoteFile | null;
  visible: boolean;
  onClose: () => void;
}

export function PdfViewerModal({ file, visible, onClose }: PdfViewerModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<RenderedPdfPage[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // View mode: 'page' (reading one page) vs 'grid' (thumbnail gallery)
  const [viewMode, setViewMode] = useState<'page' | 'grid'>('page');
  const [gridTab, setGridTab] = useState<'all' | 'annotated'>('all');

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMatchIndex, setActiveMatchIndex] = useState(0);

  // Page jump input state
  const [jumpOpen, setJumpOpen] = useState(false);
  const [jumpInput, setJumpInput] = useState('');

  // Markup / drawing state
  const [markupOpen, setMarkupOpen] = useState(false);
  const [editBarOpen, setEditBarOpen] = useState(false);
  const [currentInk, setCurrentInk] = useState<NoteInk | null>(null);
  const [inkVersion, setInkVersion] = useState(0);
  const [annotatedPages, setAnnotatedPages] = useState<Set<number>>(new Set());

  /**
   * Which picture the stylus is about to write on.
   *
   * This exists because it did not, and the bug was reported from a phone: a
   * note page may carry several pictures, each with its own ink id, but the
   * markup canvas was opened with `images[0]` hardcoded. So the second and
   * third picture could be attached, shown and deleted — and never drawn on.
   * Every stylus press reopened the first one.
   *
   * `null` means the page itself (a PDF page, or a note page's blank sheet),
   * which is what the header's Stylus button and the side bar still ask for.
   */
  const [markupTarget, setMarkupTarget] = useState<{ imageId: string; uri: string } | null>(null);

  /** The caret and text of the note page's box, so the toolbar can edit them. */
  const [noteSelection, setNoteSelection] = useState<Selection>({ start: 0, end: 0 });
  const [notePreview, setNotePreview] = useState(false);

  // Inserted note pages between PDF pages
  const [insertedPages, setInsertedPages] = useState<InsertedPdfPage[]>([]);
  const [activeInsertedId, setActiveInsertedId] = useState<string | null>(null);

  const notesStorageKey = file ? `@orbit_pdf_inserted_notes:${file.id}` : '';

  // Load and render PDF pages when modal opens
  useEffect(() => {
    if (!visible || !file) {
      setPages([]);
      setPageCount(0);
      setCurrentPage(1);
      setError(null);
      setMarkupOpen(false);
      setEditBarOpen(false);
      setViewMode('page');
      setSearchOpen(false);
      setJumpOpen(false);
      setActiveInsertedId(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    // Load custom inserted notes
    if (notesStorageKey) {
      AsyncStorage.getItem(notesStorageKey)
        .then(raw => {
          if (!active || !raw) return;
          try {
            setInsertedPages(JSON.parse(raw));
          } catch {}
        })
        .catch(() => {});
    }

    renderNotePdf(file, 60)
      .then(result => {
        if (!active) return;
        if (!result || result.pages.length === 0) {
          setError('Could not render pages for this PDF.');
          setLoading(false);
          return;
        }
        setPages(result.pages);
        setPageCount(result.pageCount);
        setCurrentPage(1);
        setLoading(false);
      })
      .catch(err => {
        if (!active) return;
        setError(err?.message || 'Could not load PDF document.');
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [visible, file, notesStorageKey]);

  // Save inserted pages
  const persistInsertedPages = useCallback(
    async (newPages: InsertedPdfPage[]) => {
      setInsertedPages(newPages);
      if (notesStorageKey) {
        try {
          await AsyncStorage.setItem(notesStorageKey, JSON.stringify(newPages));
        } catch {}
      }
    },
    [notesStorageKey],
  );

  const currentPageObj = pages.find(p => p.page === currentPage) ?? pages[0];
  const currentImageId = file
    ? activeInsertedId
      ? `${file.id}_inserted_${activeInsertedId}`
      : `${file.id}_p${currentPage}`
    : '';

  const pageAspect =
    currentPageObj && currentPageObj.width > 0 && currentPageObj.height > 0
      ? currentPageObj.width / currentPageObj.height
      : 1 / 1.414;

  const maxContentWidth = Math.min(windowWidth - 24, 600);
  const maxContentHeight = Math.max(320, windowHeight - 180 - insets.top - insets.bottom);
  const displayWidth =
    maxContentWidth / pageAspect > maxContentHeight
      ? Math.round(maxContentHeight * pageAspect)
      : Math.round(maxContentWidth);
  const displayHeight = Math.round(displayWidth / pageAspect);

  // Check which pages have ink annotations
  useEffect(() => {
    if (!file || pages.length === 0) return;
    let active = true;
    const checked = new Set<number>();

    Promise.all(
      pages.map(async p => {
        const id = `${file.id}_p${p.page}`;
        const ink = await loadNoteInk(id);
        if (ink && ink.strokes && ink.strokes.length > 0) {
          checked.add(p.page);
        }
      }),
    ).then(() => {
      if (active) {
        setAnnotatedPages(checked);
      }
    });

    return () => {
      active = false;
    };
  }, [file, pages, inkVersion]);

  // Load existing ink for current page/target
  useEffect(() => {
    if (!currentImageId) return;
    loadNoteInk(currentImageId).then(ink => {
      setCurrentInk(ink);
    });
  }, [currentImageId, inkVersion]);

  const handleOpenExternal = useCallback(async () => {
    if (!file) return;
    await openFileExternal(file);
  }, [file]);

  /**
   * The ink id the stylus is writing to.
   *
   * A picture the reader picked owns its marks; with nothing picked the page
   * itself does. Keeping this in one expression is what stops the canvas, the
   * save and the undo from disagreeing about which of the three they meant —
   * which is exactly how drawing on the second picture came to save onto the
   * first.
   */
  const markupImageId = markupTarget?.imageId ?? currentImageId;

  const handleDoneDrawing = useCallback(
    async (strokes: Stroke[], size: { width: number; height: number }, paper: string) => {
      if (!markupImageId) return;
      await saveNoteInk(markupImageId, {
        strokes,
        width: size.width,
        height: size.height,
        paper,
      });
      setInkVersion(v => v + 1);
      setMarkupOpen(false);
      setMarkupTarget(null);
    },
    [markupImageId],
  );

  /**
   * Open the canvas on one particular picture.
   *
   * Its existing marks are loaded first and handed to `DrawCanvas` as
   * `initial`, because a canvas that opens empty over marks still visible on
   * the page behind it will write that emptiness back over them the moment
   * Keep is pressed. That is a bug this repo has already had once, on the note
   * pictures, and the fix there was the same: seed the canvas.
   */
  const openMarkupOn = useCallback(async (imageId: string, uri: string) => {
    const ink = await loadNoteInk(imageId);
    setCurrentInk(ink);
    setMarkupTarget({ imageId, uri });
    setMarkupOpen(true);
  }, []);

  // Jump to specific page
  const handleJumpToPage = useCallback(() => {
    const num = parseInt(jumpInput.trim(), 10);
    if (!isNaN(num) && num >= 1 && num <= pageCount) {
      setCurrentPage(num);
      setActiveInsertedId(null);
      setJumpOpen(false);
      setJumpInput('');
      setViewMode('page');
    }
  }, [jumpInput, pageCount]);

  // Add blank note page after current page
  const handleAddBlankNotePage = useCallback(() => {
    const newPage: InsertedPdfPage = {
      id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      afterPage: currentPage,
      noteText: '',
      created: Date.now(),
    };
    const next = [...insertedPages, newPage];
    persistInsertedPages(next);
    setActiveInsertedId(newPage.id);
    setViewMode('page');
  }, [currentPage, insertedPages, persistInsertedPages]);

  // Insert image into note page (supports attaching up to 3 images per blank page)
  const handleInsertImage = useCallback(async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.8,
        selectionLimit: 3,
      });
      const uris = result.assets?.map(a => a.uri).filter((u): u is string => !!u) ?? [];
      if (uris.length === 0) return;

      if (activeInsertedId) {
        // Add to currently active blank note page
        const next = insertedPages.map(p => {
          if (p.id === activeInsertedId) {
            const existing =
              p.images && p.images.length > 0 ? p.images : p.imageUrl ? [p.imageUrl] : [];
            const merged = Array.from(new Set([...existing, ...uris])).slice(0, 4);
            return {
              ...p,
              images: merged,
              imageUrl: merged[0],
            };
          }
          return p;
        });
        persistInsertedPages(next);
      } else {
        // Create new blank note page containing selected images
        const newPage: InsertedPdfPage = {
          id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
          afterPage: currentPage,
          imageUrl: uris[0],
          images: uris,
          noteText: '',
          created: Date.now(),
        };
        const next = [...insertedPages, newPage];
        persistInsertedPages(next);
        setActiveInsertedId(newPage.id);
      }
      setViewMode('page');
    } catch {}
  }, [activeInsertedId, currentPage, insertedPages, persistInsertedPages]);

  // Undo last stylus stroke on whichever picture or page was last drawn on
  const handleUndoInk = useCallback(async () => {
    if (!markupImageId) return;
    const ink = await loadNoteInk(markupImageId);
    if (ink && ink.strokes && ink.strokes.length > 0) {
      const nextStrokes = ink.strokes.slice(0, -1);
      await saveNoteInk(markupImageId, {
        ...ink,
        strokes: nextStrokes,
      });
      setInkVersion(v => v + 1);
    }
  }, [markupImageId]);

  // Active inserted note page object if open
  const currentInserted = activeInsertedId
    ? insertedPages.find(p => p.id === activeInsertedId)
    : null;

  // Unified page sequence: PDF pages and inserted notes in continuous sequence
  type PageSequenceItem =
    | { type: 'pdf'; page: number }
    | { type: 'inserted'; note: InsertedPdfPage };

  const pageSequence = useMemo<PageSequenceItem[]>(() => {
    const seq: PageSequenceItem[] = [];
    for (const p of pages) {
      seq.push({ type: 'pdf', page: p.page });
      const matchingNotes = insertedPages.filter(n => n.afterPage === p.page);
      for (const note of matchingNotes) {
        seq.push({ type: 'inserted', note });
      }
    }
    return seq;
  }, [pages, insertedPages]);

  const currentSeqIndex = useMemo(() => {
    if (activeInsertedId) {
      const idx = pageSequence.findIndex(
        item => item.type === 'inserted' && item.note.id === activeInsertedId,
      );
      if (idx >= 0) return idx;
    }
    const idx = pageSequence.findIndex(
      item => item.type === 'pdf' && item.page === currentPage,
    );
    return idx >= 0 ? idx : 0;
  }, [pageSequence, activeInsertedId, currentPage]);

  const goToIndex = useCallback(
    (index: number) => {
      if (index < 0 || index >= pageSequence.length) return;
      const target = pageSequence[index];
      if (target.type === 'pdf') {
        setCurrentPage(target.page);
        setActiveInsertedId(null);
      } else {
        setCurrentPage(target.note.afterPage);
        setActiveInsertedId(target.note.id);
      }
    },
    [pageSequence],
  );

  const goToPrev = useCallback(() => {
    if (currentSeqIndex > 0) {
      goToIndex(currentSeqIndex - 1);
    }
  }, [currentSeqIndex, goToIndex]);

  const goToNext = useCallback(() => {
    if (currentSeqIndex < pageSequence.length - 1) {
      goToIndex(currentSeqIndex + 1);
    }
  }, [currentSeqIndex, pageSequence.length, goToIndex]);

  // Horizontal pan responder for page swiping
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return (
            Math.abs(gestureState.dx) > 35 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.5
          );
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dx < -50) {
            goToNext();
          } else if (gestureState.dx > 50) {
            goToPrev();
          }
        },
      }),
    [goToNext, goToPrev],
  );

  /**
   * The floating Add / Insert / Stylus bar can be dragged out of the way.
   *
   * It is pinned to the right edge at 30% of the height, and the page under it
   * is the reader's, not ours — on a note page carrying two pictures it landed
   * on top of the second one. Moving the buttons that were underneath it is
   * one fix and was applied; letting the reader move the *bar* is the other,
   * and it is the one they asked for, because whatever is under it next time
   * will be something else.
   *
   * The offset is an `Animated.ValueXY` written by the gesture on the native
   * thread and read back through a ref at grant, which is the pattern the home
   * block resize needed for the same reason: a responder rebuilt mid-gesture
   * has never seen the grant that recorded where the finger started, and the
   * drag stops after one frame. It is deliberately not persisted — a toolbar
   * that reopens where it was last shoved, on a different page with different
   * content under it, is a setting nobody asked to keep.
   */
  const barOffset = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const barAt = useRef({ x: 0, y: 0 });
  const barPan = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
        onPanResponderGrant: () => {
          barOffset.setOffset({ x: barAt.current.x, y: barAt.current.y });
          barOffset.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event([null, { dx: barOffset.x, dy: barOffset.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, g) => {
          /*
           * Clamped so it cannot be thrown off the screen and lost. The bar is
           * the only way back to Add page and Insert image, so a drag that put
           * it behind the status bar or past the right edge would take those
           * with it and leave no way to get them back but closing the file.
           */
          const x = Math.max(-(windowWidth - 90), Math.min(12, barAt.current.x + g.dx));
          const y = Math.max(-windowHeight * 0.25, Math.min(windowHeight * 0.4, barAt.current.y + g.dy));
          barAt.current = { x, y };
          barOffset.flattenOffset();
          barOffset.setValue({ x, y });
        },
      }),
    [barOffset, windowWidth, windowHeight],
  );

  // Search matches across pages and inserted notes
  const searchMatches = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    const matches: { page: number; noteId?: string; desc: string }[] = [];

    // Number matching
    const num = parseInt(q, 10);
    if (!isNaN(num) && num >= 1 && num <= pageCount) {
      matches.push({ page: num, desc: `Page ${num}` });
    }

    // Inserted notes matching
    for (const note of insertedPages) {
      if (note.noteText?.toLowerCase().includes(q)) {
        matches.push({
          page: note.afterPage,
          noteId: note.id,
          desc: `Note after page ${note.afterPage}: "${note.noteText.slice(0, 30)}…"`,
        });
      }
    }

    // If query matches common clinical topics or page labels
    pages.forEach(p => {
      if (`page ${p.page}`.includes(q)) {
        if (!matches.some(m => m.page === p.page && !m.noteId)) {
          matches.push({ page: p.page, desc: `Page ${p.page}` });
        }
      }
    });

    return matches;
  }, [searchQuery, pageCount, insertedPages, pages]);

  const handleNextMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    const nextIdx = (activeMatchIndex + 1) % searchMatches.length;
    setActiveMatchIndex(nextIdx);
    const match = searchMatches[nextIdx];
    setCurrentPage(match.page);
    setActiveInsertedId(match.noteId ?? null);
    setViewMode('page');
  }, [activeMatchIndex, searchMatches]);

  const handlePrevMatch = useCallback(() => {
    if (searchMatches.length === 0) return;
    const prevIdx = (activeMatchIndex - 1 + searchMatches.length) % searchMatches.length;
    setActiveMatchIndex(prevIdx);
    const match = searchMatches[prevIdx];
    setCurrentPage(match.page);
    setActiveInsertedId(match.noteId ?? null);
    setViewMode('page');
  }, [activeMatchIndex, searchMatches]);

  // Filtered pages for Grid View
  const gridPages = useMemo(() => {
    if (gridTab === 'annotated') {
      return pages.filter(
        p => annotatedPages.has(p.page) || insertedPages.some(i => i.afterPage === p.page),
      );
    }
    return pages;
  }, [gridTab, pages, annotatedPages, insertedPages]);

  if (!visible || !file) return null;

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide">
      <KeyboardSafe style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Top Header */}
        <View
          style={[
            styles.header,
            {
              paddingTop: Math.max(insets.top, 12) + 6,
              borderBottomColor: colors.border,
              backgroundColor: colors.card,
            },
          ]}>
          <Touchable
            onPress={onClose}
            label="Close PDF reader"
            style={[styles.iconBtn, { borderColor: colors.border }]}>
            <X size={20} color={colors.text} />
          </Touchable>

          <View style={styles.headerInfo}>
            <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
              {file.name}
            </Text>
            {pageCount > 0 ? (
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
                {viewMode === 'grid'
                  ? `All Pages (${pageCount})`
                  : currentInserted
                  ? `Note Page (After P${currentInserted.afterPage})`
                  : `Page ${currentPage} of ${pageCount}`}
              </Text>
            ) : null}
          </View>

          <View style={styles.headerActions}>
            {/* Search toggle button */}
            <Touchable
              onPress={() => setSearchOpen(s => !s)}
              label="Search in PDF"
              style={[
                styles.iconBtn,
                {
                  borderColor: colors.border,
                  backgroundColor: searchOpen ? withAlpha(colors.primary, 0.15) : 'transparent',
                },
              ]}>
              <Search size={18} color={searchOpen ? colors.primary : colors.text} />
            </Touchable>

            {/* Grid vs Page View toggle button */}
            <Touchable
              onPress={() => setViewMode(v => (v === 'page' ? 'grid' : 'page'))}
              label={viewMode === 'page' ? 'Switch to All Pages Grid' : 'Switch to Page View'}
              style={[
                styles.iconBtn,
                {
                  borderColor: colors.border,
                  backgroundColor:
                    viewMode === 'grid' ? withAlpha(colors.primary, 0.15) : 'transparent',
                },
              ]}>
              {viewMode === 'page' ? (
                <LayoutGrid size={18} color={colors.text} />
              ) : (
                <BookOpen size={18} color={colors.primary} />
              )}
            </Touchable>

            {/* Edit / Side Toolbar Toggle (media_1789648202880.png) */}
            {(currentPageObj || currentInserted) && viewMode === 'page' ? (
              <Touchable
                onPress={() => setEditBarOpen(b => !b)}
                label="Toggle editing toolbar"
                hint="Opens floating side bar with Add page, Insert image, Stylus tools"
                style={[
                  styles.iconBtn,
                  {
                    borderColor: colors.border,
                    backgroundColor: editBarOpen
                      ? withAlpha(colors.accent, 0.25)
                      : withAlpha(colors.accent, 0.12),
                  },
                ]}>
                <PenLine size={18} color={colors.accent} />
              </Touchable>
            ) : null}

            {/* Hand off to system / Acrobat / Drive */}
            <Touchable
              onPress={handleOpenExternal}
              label="Open PDF in external app"
              hint="Hands off to Google Drive or Acrobat via FileProvider"
              style={[styles.iconBtn, { borderColor: colors.border }]}>
              <ExternalLink size={18} color={colors.textMuted} />
            </Touchable>
          </View>
        </View>

        {/* Content Area */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Rendering PDF pages…
            </Text>
            <Text style={[styles.loadingSub, { color: colors.textMuted }]}>
              Processed on this phone for instant reading, thumbnail grid & markup
            </Text>
          </View>
        ) : error ? (
          <View style={styles.centerBox}>
            <Text style={[styles.errorText, { color: colors.danger ?? '#ef4444' }]}>
              {error}
            </Text>
            <Touchable
              onPress={handleOpenExternal}
              label="Open in external PDF reader"
              style={[styles.fallbackBtn, { backgroundColor: colors.accent }]}>
              <ExternalLink size={16} color="#FFFFFF" />
              <Text style={styles.fallbackBtnText}>Open with PDF Viewer</Text>
            </Touchable>
          </View>
        ) : viewMode === 'grid' ? (
          /* ========================================================
           * ALL PAGES THUMBNAIL GRID VIEW (media_1789560909144.png)
           * ======================================================== */
          <View style={styles.gridContainer}>
            {/* Top Switcher Tab: All Pages | Annotated */}
            <View
              style={[
                styles.gridTabRow,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}>
              <Touchable
                onPress={() => setGridTab('all')}
                label="View all pages"
                style={[
                  styles.gridTabBtn,
                  gridTab === 'all' && {
                    backgroundColor: colors.primary,
                  },
                ]}>
                <Text
                  style={[
                    styles.gridTabText,
                    { color: gridTab === 'all' ? colors.primaryText : colors.text },
                  ]}>
                  All Pages ({pages.length})
                </Text>
              </Touchable>
              <Touchable
                onPress={() => setGridTab('annotated')}
                label="View annotated pages and notes only"
                style={[
                  styles.gridTabBtn,
                  gridTab === 'annotated' && {
                    backgroundColor: colors.primary,
                  },
                ]}>
                <Text
                  style={[
                    styles.gridTabText,
                    { color: gridTab === 'annotated' ? colors.primaryText : colors.text },
                  ]}>
                  Annotated ({annotatedPages.size + insertedPages.length})
                </Text>
              </Touchable>
            </View>

            {/* Thumbnail Gallery */}
            <FlatList
              data={gridPages}
              keyExtractor={item => `grid_p${item.page}`}
              numColumns={3}
              contentContainerStyle={[
                styles.gridList,
                { paddingBottom: Math.max(insets.bottom, 16) + 30 },
              ]}
              renderItem={({ item }) => {
                const isSelected = item.page === currentPage && !activeInsertedId;
                const hasInk = annotatedPages.has(item.page);
                const pageInserts = insertedPages.filter(i => i.afterPage === item.page);

                return (
                  <View style={styles.gridCell}>
                    <Touchable
                      onPress={() => {
                        setCurrentPage(item.page);
                        setActiveInsertedId(null);
                        setViewMode('page');
                      }}
                      label={`Page ${item.page}, tap to open`}
                      style={[
                        styles.thumbnailCard,
                        {
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderWidth: isSelected ? 2.5 : 1,
                        },
                      ]}>
                      <Image
                        source={{ uri: item.uri }}
                        style={styles.thumbnailImg}
                        resizeMode="cover"
                      />
                      {hasInk ? (
                        <View style={styles.inkBadge}>
                          <PenLine size={10} color="#FFFFFF" />
                        </View>
                      ) : null}
                    </Touchable>
                    <View
                      style={[
                        styles.pagePill,
                        isSelected
                          ? { backgroundColor: colors.primary }
                          : { backgroundColor: colors.card, borderColor: colors.border },
                      ]}>
                      <Text
                        style={[
                          styles.pagePillText,
                          { color: isSelected ? colors.primaryText : colors.text },
                        ]}>
                        {item.page}
                      </Text>
                    </View>

                    {/* If notes inserted after this page, show note chip */}
                    {pageInserts.length > 0 ? (
                      <View style={styles.insertChipRow}>
                        {pageInserts.map((ins, idx) => (
                          <Touchable
                            key={ins.id}
                            onPress={() => {
                              setCurrentPage(item.page);
                              setActiveInsertedId(ins.id);
                              setViewMode('page');
                            }}
                            label={`Open note ${idx + 1} after page ${item.page}`}
                            style={[
                              styles.insertChip,
                              {
                                backgroundColor:
                                  activeInsertedId === ins.id
                                    ? colors.accent
                                    : withAlpha(colors.accent, 0.15),
                              },
                            ]}>
                            <StickyNote
                              size={10}
                              color={activeInsertedId === ins.id ? '#FFFFFF' : colors.accent}
                            />
                            <Text
                              style={[
                                styles.insertChipText,
                                {
                                  color: activeInsertedId === ins.id ? '#FFFFFF' : colors.accent,
                                },
                              ]}>
                              Note {idx + 1}
                            </Text>
                          </Touchable>
                        ))}
                      </View>
                    ) : null}
                  </View>
                );
              }}
            />
          </View>
        ) : (
          /* ========================================================
           * SINGLE PAGE VIEW WITH SIDE TOOLBAR (media_1789560899723.png)
           * ======================================================== */
          <View style={styles.pageContainer} {...panResponder.panHandlers}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsVerticalScrollIndicator={false}>
              {currentInserted ? (
                /* Inserted Blank Note Page Canvas */
                <View
                  style={[
                    styles.insertedPageBox,
                    {
                      width: displayWidth,
                      minHeight: displayHeight,
                      backgroundColor: colors.card,
                      borderColor: colors.accent,
                    },
                  ]}>
                  {/* Note Page Header with Stylus & Undo Controls */}
                  <View style={styles.insertedHeader}>
                    <View style={styles.insertedTitleWrap}>
                      <StickyNote size={16} color={colors.accent} />
                      <Text style={[styles.insertedTitle, { color: colors.accent }]}>
                        Note Page (After P{currentInserted.afterPage})
                      </Text>
                    </View>

                    <View style={styles.insertedHeaderActions}>
                      {/* Stylus Handwriting Trigger */}
                      <Touchable
                        onPress={() => setMarkupOpen(true)}
                        label="Draw with stylus on this note page"
                        style={[
                          styles.noteActionBtn,
                          { backgroundColor: withAlpha(colors.primary, 0.15) },
                        ]}>
                        <PenLine size={13} color={colors.primary} />
                        <Text style={[styles.noteActionBtnText, { color: colors.primary }]}>
                          Stylus
                        </Text>
                      </Touchable>

                      {/* Undo Last Stroke */}
                      <Touchable
                        onPress={handleUndoInk}
                        label="Undo last stylus stroke"
                        style={[
                          styles.noteActionBtn,
                          { backgroundColor: withAlpha(colors.textMuted, 0.12) },
                        ]}>
                        <RotateCcw size={13} color={colors.text} />
                        <Text style={[styles.noteActionBtnText, { color: colors.text }]}>Undo</Text>
                      </Touchable>

                      {/* Delete Note Page */}
                      <Touchable
                        onPress={() => {
                          const next = insertedPages.filter(p => p.id !== currentInserted.id);
                          persistInsertedPages(next);
                          setActiveInsertedId(null);
                        }}
                        label="Delete this note page"
                        style={styles.deleteNoteBtn}>
                        <Trash2 size={16} color={colors.danger ?? '#ef4444'} />
                      </Touchable>
                    </View>
                  </View>

                  {/* Attached Images (Supports 2-3 images per blank page) */}
                  {(() => {
                    const noteImages =
                      currentInserted.images && currentInserted.images.length > 0
                        ? currentInserted.images
                        : currentInserted.imageUrl
                        ? [currentInserted.imageUrl]
                        : [];

                    if (noteImages.length > 0) {
                      const heights = currentInserted.imageHeights ?? [];
                      return (
                        <View style={styles.multiImgContainer}>
                          {noteImages.map((uri, idx) => {
                            /*
                             * The ink id, and why it is written out twice.
                             *
                             * The first picture is filed under the page's own
                             * id and the rest under `_sub_N`. That is not a
                             * shape anybody would choose, but it is the shape
                             * the marks already on people's phones are filed
                             * under, and changing it would orphan every one of
                             * them silently. So it is kept, and named once
                             * here rather than recomputed at each use.
                             */
                            const inkId =
                              idx === 0 ? currentImageId : `${currentImageId}_sub_${idx}`;
                            const imgHeight = heights[idx] ?? 220;
                            const writePage = (patch: Partial<InsertedPdfPage>) => {
                              persistInsertedPages(
                                insertedPages.map(p =>
                                  p.id === currentInserted.id ? { ...p, ...patch } : p,
                                ),
                              );
                            };
                            const reorder = (to: number) => {
                              if (to < 0 || to >= noteImages.length) return;
                              const imgs = [...noteImages];
                              const hs = noteImages.map((_, i) => heights[i] ?? 220);
                              [imgs[idx], imgs[to]] = [imgs[to], imgs[idx]];
                              [hs[idx], hs[to]] = [hs[to], hs[idx]];
                              writePage({
                                images: imgs,
                                imageHeights: hs,
                                imageUrl: imgs[0] || undefined,
                              });
                            };
                            const resize = (by: number) => {
                              const hs = noteImages.map((_, i) => heights[i] ?? 220);
                              hs[idx] = Math.max(120, Math.min(560, hs[idx] + by));
                              writePage({ imageHeights: hs });
                            };
                            return (
                              <View key={`${uri}_${idx}`}>
                                <View style={[styles.multiImgCard, { height: imgHeight }]}>
                                  <InkedImage
                                    key={`${inkId}-${inkVersion}`}
                                    uri={uri}
                                    imageId={inkId}
                                    ownShape
                                    style={styles.insertedImg}
                                    title={`Diagram ${idx + 1}`}
                                  />
                                </View>

                                {/*
                                  * The controls sit UNDER the picture, not on it.
                                  *
                                  * They were a red badge in the top-right corner of
                                  * each card, and the floating Add/Insert/Stylus bar
                                  * is pinned to `right: 12, top: '30%'` — so on a page
                                  * with two pictures the bar landed squarely over the
                                  * second one's delete button. It was reported exactly
                                  * that way: "delete button is not visible for 2nd
                                  * image". A row below the picture cannot be covered by
                                  * something pinned to the right edge, and it also has
                                  * room for the four controls a picture now has rather
                                  * than the one it had.
                                  */}
                                <View style={styles.imgToolRow}>
                                  <Touchable
                                    onPress={() => openMarkupOn(inkId, uri)}
                                    label={`Draw on image ${idx + 1} of ${noteImages.length}`}
                                    style={[
                                      styles.imgToolBtn,
                                      { backgroundColor: withAlpha(colors.primary, 0.15) },
                                    ]}>
                                    <PenLine size={14} color={colors.primary} />
                                    <Text style={[styles.imgToolText, { color: colors.primary }]}>
                                      Draw
                                    </Text>
                                  </Touchable>

                                  <Touchable
                                    onPress={() => resize(-60)}
                                    label={`Make image ${idx + 1} smaller`}
                                    style={[
                                      styles.imgToolBtn,
                                      { backgroundColor: withAlpha(colors.textMuted, 0.12) },
                                    ]}>
                                    <Minus size={14} color={colors.text} />
                                  </Touchable>
                                  <Touchable
                                    onPress={() => resize(60)}
                                    label={`Make image ${idx + 1} bigger`}
                                    style={[
                                      styles.imgToolBtn,
                                      { backgroundColor: withAlpha(colors.textMuted, 0.12) },
                                    ]}>
                                    <Plus size={14} color={colors.text} />
                                  </Touchable>

                                  {noteImages.length > 1 ? (
                                    <>
                                      <Touchable
                                        onPress={() => reorder(idx - 1)}
                                        disabled={idx === 0}
                                        label={`Move image ${idx + 1} up`}
                                        style={[
                                          styles.imgToolBtn,
                                          {
                                            backgroundColor: withAlpha(colors.textMuted, 0.12),
                                            opacity: idx === 0 ? 0.35 : 1,
                                          },
                                        ]}>
                                        <ChevronUp size={14} color={colors.text} />
                                      </Touchable>
                                      <Touchable
                                        onPress={() => reorder(idx + 1)}
                                        disabled={idx === noteImages.length - 1}
                                        label={`Move image ${idx + 1} down`}
                                        style={[
                                          styles.imgToolBtn,
                                          {
                                            backgroundColor: withAlpha(colors.textMuted, 0.12),
                                            opacity: idx === noteImages.length - 1 ? 0.35 : 1,
                                          },
                                        ]}>
                                        <ChevronDown size={14} color={colors.text} />
                                      </Touchable>
                                    </>
                                  ) : null}

                                  <Touchable
                                    onPress={() => {
                                      const imgs = noteImages.filter((_, i) => i !== idx);
                                      const hs = noteImages
                                        .map((_, i) => heights[i] ?? 220)
                                        .filter((_, i) => i !== idx);
                                      writePage({
                                        images: imgs,
                                        imageHeights: hs,
                                        imageUrl: imgs[0] || undefined,
                                      });
                                    }}
                                    label={`Delete image ${idx + 1} of ${noteImages.length}`}
                                    style={[
                                      styles.imgToolBtn,
                                      { backgroundColor: withAlpha(colors.danger ?? '#ef4444', 0.15) },
                                    ]}>
                                    <Trash2 size={14} color={colors.danger ?? '#ef4444'} />
                                  </Touchable>
                                </View>
                              </View>
                            );
                          })}
                        </View>
                      );
                    }

                    return (
                      /* Blank Stylus Canvas when no images attached */
                      <View style={styles.blankCanvasBox}>
                        <InkedImage
                          key={`${currentImageId}-${inkVersion}`}
                          uri=""
                          imageId={currentImageId}
                          ownShape
                          style={[styles.blankInkedCanvas, { width: displayWidth - 36, height: 180 }]}
                          title={`Stylus Canvas Note P${currentInserted.afterPage}`}
                        />
                      </View>
                    );
                  })()}

                  {/*
                    * Text notes, with the same toolbar the Notes tab has.
                    *
                    * This box was a bare `TextInput`. Everywhere else in the app
                    * that a note is written — Progress → Notes — there is a row
                    * of buttons above it for headings, bullets, numbers, bold,
                    * italic and the highlighter, and the reader's friend asked,
                    * reasonably, why the page inside a PDF did not have them.
                    *
                    * Nothing about the storage changes: the note is still the
                    * text that was typed, markers and all, so a page written
                    * before this still reads correctly and a page written now
                    * still reads if this component is deleted tomorrow. That is
                    * the same contract `NoteToolbar` was built on.
                    */}
                  <NoteToolbar
                    value={currentInserted.noteText ?? ''}
                    selection={noteSelection}
                    font={currentInserted.font ?? null}
                    onFont={key => {
                      persistInsertedPages(
                        insertedPages.map(p =>
                          p.id === currentInserted.id ? { ...p, font: key } : p,
                        ),
                      );
                    }}
                    isPreview={notePreview}
                    onTogglePreview={() => setNotePreview(v => !v)}
                    onChange={(text, cursor, select) => {
                      persistInsertedPages(
                        insertedPages.map(p =>
                          p.id === currentInserted.id ? { ...p, noteText: text } : p,
                        ),
                      );
                      setNoteSelection(select ?? { start: cursor, end: cursor });
                    }}
                  />

                  {notePreview ? (
                    <View style={styles.notePreviewBox}>
                      {(currentInserted.noteText ?? '').trim() ? (
                        <NoteText
                          content={currentInserted.noteText ?? ''}
                          font={currentInserted.font ?? null}
                        />
                      ) : (
                        <Text style={[styles.notePreviewEmpty, { color: colors.textMuted }]}>
                          Nothing written yet — switch back to Edit and type.
                        </Text>
                      )}
                    </View>
                  ) : (
                    <TextInput
                      multiline
                      value={currentInserted.noteText ?? ''}
                      onChangeText={txt => {
                        const next = insertedPages.map(p =>
                          p.id === currentInserted.id ? { ...p, noteText: txt } : p,
                        );
                        persistInsertedPages(next);
                      }}
                      onSelectionChange={e => setNoteSelection(e.nativeEvent.selection)}
                      placeholder="Type personal study points, lecture pearls, or clinical takeaways here…"
                      placeholderTextColor={colors.textMuted}
                      style={[styles.insertedInput, { color: colors.text }]}
                    />
                  )}
                </View>
              ) : currentPageObj ? (
                /* Native PDF Rendered Page with Inked Annotations */
                <InkedImage
                  key={`${currentImageId}-${inkVersion}`}
                  uri={currentPageObj.uri}
                  imageId={currentImageId}
                  ownShape
                  style={[styles.pageImage, { width: displayWidth, height: displayHeight }]}
                  title={`${file.name} - Page ${currentPage}`}
                />
              ) : null}
            </ScrollView>

            {/* Floating Side Action Bar: Add Page, Insert Image, Stylus (only shown when edit button clicked) */}
            {editBarOpen ? (
              <Animated.View
                {...barPan.panHandlers}
                style={[
                  styles.sideToolbar,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  { transform: barOffset.getTranslateTransform() },
                ]}>
                {/* The grip. Without something that looks draggable, a bar that
                    can be dragged is a bar nobody drags. */}
                <View style={[styles.barGrip, { backgroundColor: colors.border }]} />
                {/* 1. Add Note Page between PDF */}
                <Touchable
                  onPress={handleAddBlankNotePage}
                  label="Add blank note page after this page"
                  hint="Inserts a custom note page for lecture points"
                  style={[
                    styles.sideActionBtn,
                    { backgroundColor: withAlpha(colors.accent, 0.12) },
                  ]}>
                  <FilePlus size={20} color={colors.accent} />
                </Touchable>

                {/* 2. Insert Image into PDF / Note */}
                <Touchable
                  onPress={handleInsertImage}
                  label="Insert image into PDF"
                  hint="Attaches a photo or medical diagram"
                  style={[
                    styles.sideActionBtn,
                    { backgroundColor: withAlpha(colors.primary, 0.12) },
                  ]}>
                  <ImagePlus size={20} color={colors.primary} />
                </Touchable>

                {/* 3. Handwriting / Drawing Markup */}
                <Touchable
                  onPress={() => setMarkupOpen(true)}
                  label="Annotate / draw with stylus"
                  style={[
                    styles.sideActionBtn,
                    { backgroundColor: withAlpha(colors.primary, 0.12) },
                  ]}>
                  <PenLine size={20} color={colors.primary} />
                </Touchable>
              </Animated.View>
            ) : null}

            {/* Bottom Page Navigation Bar & Page Jump Popover (Unified Continuous Sequence) */}
            <View
              style={[
                styles.bottomNav,
                {
                  paddingBottom: Math.max(insets.bottom, 12) + 6,
                  backgroundColor: colors.card,
                  borderTopColor: colors.border,
                },
              ]}>
              <Touchable
                onPress={goToPrev}
                disabled={currentSeqIndex <= 0}
                label="Previous page or note"
                style={[
                  styles.navBtn,
                  { borderColor: colors.border, opacity: currentSeqIndex <= 0 ? 0.35 : 1 },
                ]}>
                <ChevronLeft size={20} color={colors.text} />
                <Text style={[styles.navBtnText, { color: colors.text }]}>Prev</Text>
              </Touchable>

              {/* Page Indicator & Jump Launcher */}
              <Touchable
                onPress={() => setJumpOpen(j => !j)}
                label="Jump to page number"
                style={[
                  styles.pageBadge,
                  {
                    backgroundColor: jumpOpen
                      ? withAlpha(colors.primary, 0.2)
                      : withAlpha(colors.textMuted, 0.12),
                  },
                ]}>
                <Text style={[styles.pageBadgeText, { color: colors.text }]}>
                  {currentInserted
                    ? `Note (P${currentInserted.afterPage}+) [${currentSeqIndex + 1}/${pageSequence.length}]`
                    : `Page ${currentPage} of ${pageCount}`}
                </Text>
              </Touchable>

              <Touchable
                onPress={goToNext}
                disabled={currentSeqIndex >= pageSequence.length - 1}
                label="Next page or note"
                style={[
                  styles.navBtn,
                  {
                    borderColor: colors.border,
                    opacity: currentSeqIndex >= pageSequence.length - 1 ? 0.35 : 1,
                  },
                ]}>
                <Text style={[styles.navBtnText, { color: colors.text }]}>Next</Text>
                <ChevronRight size={20} color={colors.text} />
              </Touchable>
            </View>

            {/* Quick Page Jump Input Bar (media_1789560899723.png Item 3) */}
            {jumpOpen ? (
              <View
                style={[
                  styles.jumpBar,
                  {
                    bottom: Math.max(insets.bottom, 12) + 56,
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                  },
                ]}>
                <TextInput
                  value={jumpInput}
                  onChangeText={setJumpInput}
                  keyboardType="numeric"
                  placeholder="Page number"
                  placeholderTextColor={colors.textMuted}
                  onSubmitEditing={handleJumpToPage}
                  style={[
                    styles.jumpInput,
                    {
                      color: colors.text,
                      backgroundColor: colors.background,
                      borderColor: colors.border,
                    },
                  ]}
                />
                <Touchable
                  onPress={handleJumpToPage}
                  label="Go to page"
                  style={[styles.jumpGoBtn, { backgroundColor: colors.primary }]}>
                  <Text style={styles.jumpGoBtnText}>Go</Text>
                </Touchable>
              </View>
            ) : null}
          </View>
        )}

        {/* ========================================================
         * FLOATING BOTTOM SEARCH BAR (media_1789561016285.png)
         * ======================================================== */}
        {searchOpen ? (
          <View
            style={[
              styles.floatingSearchPill,
              {
                bottom: Math.max(insets.bottom, 14) + (viewMode === 'page' ? 62 : 16),
                backgroundColor: '#1e293b',
                borderColor: '#334155',
              },
            ]}>
            <TextInput
              autoFocus
              value={searchQuery}
              onChangeText={txt => {
                setSearchQuery(txt);
                setActiveMatchIndex(0);
              }}
              placeholder="Search topic or page…"
              placeholderTextColor="#94a3b8"
              style={styles.searchPillInput}
            />
            {searchQuery ? (
              <Touchable
                onPress={() => {
                  setSearchQuery('');
                  setActiveMatchIndex(0);
                }}
                label="Clear search"
                style={styles.searchPillBtn}>
                <X size={16} color="#94a3b8" />
              </Touchable>
            ) : null}

            {/* Match counter */}
            <Text style={styles.searchCounterText}>
              {searchMatches.length > 0
                ? `${activeMatchIndex + 1}/${searchMatches.length}`
                : searchQuery
                ? '0'
                : ''}
            </Text>

            {/* Previous match (Up arrow) */}
            <Touchable
              onPress={handlePrevMatch}
              disabled={searchMatches.length === 0}
              label="Previous match"
              style={[
                styles.searchPillBtn,
                { opacity: searchMatches.length === 0 ? 0.4 : 1 },
              ]}>
              <ChevronUp size={20} color="#FFFFFF" />
            </Touchable>

            {/* Next match (Down arrow) */}
            <Touchable
              onPress={handleNextMatch}
              disabled={searchMatches.length === 0}
              label="Next match"
              style={[
                styles.searchPillBtn,
                { opacity: searchMatches.length === 0 ? 0.4 : 1 },
              ]}>
              <ChevronDown size={20} color="#FFFFFF" />
            </Touchable>
          </View>
        ) : null}

        {/* Fullscreen DrawCanvas for Markup / Annotation */}
        {markupOpen && (currentPageObj || currentInserted) ? (
          <Modal
            visible
            onRequestClose={() => {
              setMarkupOpen(false);
              setMarkupTarget(null);
            }}
            animationType="fade">
            <DrawCanvas
              uri={
                markupTarget
                  ? markupTarget.uri
                  : currentInserted
                  ? currentInserted.images?.[0] ?? currentInserted.imageUrl ?? ''
                  : currentPageObj?.uri ?? ''
              }
              initial={currentInk}
              onCancel={() => {
                setMarkupOpen(false);
                setMarkupTarget(null);
              }}
              onDone={handleDoneDrawing}
            />
          </Modal>
        ) : null}
      </KeyboardSafe>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 10,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  headerSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
  },
  loadingSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
  },
  errorText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 16,
  },
  fallbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  fallbackBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  pageContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
  },
  pageImage: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  sideToolbar: {
    position: 'absolute',
    right: 12,
    top: '30%',
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 6,
    gap: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  barGrip: {
    width: 22,
    height: 3,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 2,
  },
  imgToolRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  imgToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 32,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  imgToolText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notePreviewBox: {
    minHeight: 180,
    paddingTop: 4,
  },
  notePreviewEmpty: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  sideActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  navBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  pageBadge: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pageBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  jumpBar: {
    position: 'absolute',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  jumpInput: {
    width: 120,
    height: 38,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  jumpGoBtn: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jumpGoBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  gridContainer: {
    flex: 1,
  },
  gridTabRow: {
    flexDirection: 'row',
    padding: 4,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  gridTabBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridTabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  gridList: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  gridCell: {
    flex: 1 / 3,
    alignItems: 'center',
    padding: 6,
    marginBottom: 10,
  },
  thumbnailCard: {
    width: '100%',
    aspectRatio: 1 / 1.414,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  inkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pagePill: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pagePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  insertChipRow: {
    marginTop: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 4,
  },
  insertChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  insertChipText: {
    fontSize: 10,
    fontWeight: '600',
  },
  floatingSearchPill: {
    position: 'absolute',
    alignSelf: 'center',
    width: '90%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  searchPillInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    paddingVertical: 4,
  },
  searchPillBtn: {
    padding: 6,
  },
  searchCounterText: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 4,
  },
  insertedPageBox: {
    borderRadius: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    padding: 16,
  },
  insertedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#94a3b8',
    paddingBottom: 10,
    marginBottom: 12,
  },
  insertedTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insertedTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  deleteNoteBtn: {
    padding: 4,
  },
  insertedImgWrap: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  insertedImg: {
    width: '100%',
    height: '100%',
  },
  insertedInput: {
    fontSize: 14,
    lineHeight: 22,
    textAlignVertical: 'top',
    minHeight: 180,
  },
  insertedHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  noteActionBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  multiImgContainer: {
    gap: 12,
    marginBottom: 12,
  },
  multiImgCard: {
    position: 'relative',
    width: '100%',
    height: 220,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  blankCanvasBox: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  blankInkedCanvas: {
    backgroundColor: 'transparent',
    borderRadius: 8,
  },
});
