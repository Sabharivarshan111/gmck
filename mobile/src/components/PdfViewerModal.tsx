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
  PenLine,
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

const PDF_TOOLS_POSITION_KEY = 'orbit:pdf-tools-position-v1';
const PDF_TOOLS_BOTTOM_CLEARANCE = 72;

function clampTool(value: number, max: number): number {
  return Math.max(0, Math.min(max, value));
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
  const toolPosition = useRef(new Animated.ValueXY({
    x: Math.max(0, windowWidth - 66),
    y: windowHeight * 0.25,
  })).current;
  const toolPoint = useRef({ x: 0, y: 0 });
  const toolBounds = useRef({ width: 0, height: 0 });
  const toolSize = useRef({ width: 54, height: 190 });
  const savedToolPosition = useRef<{ x: number; y: number } | null>(null);
  const [toolLayout, setToolLayout] = useState({ width: 0, height: 0 });

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(PDF_TOOLS_POSITION_KEY).then(raw => {
      if (!active || !raw) return;
      try {
        const saved = JSON.parse(raw) as { x: number; y: number };
        if (Number.isFinite(saved.x) && Number.isFinite(saved.y)) {
          savedToolPosition.current = saved;
          const { width, height } = toolBounds.current;
          if (width && height) {
            const freeX = Math.max(0, width - toolSize.current.width);
            const freeY = Math.max(0, height - toolSize.current.height - PDF_TOOLS_BOTTOM_CLEARANCE);
            const point = {
              x: clampTool(saved.x * freeX, freeX),
              y: clampTool(saved.y * freeY, freeY),
            };
            toolPoint.current = point;
            toolPosition.setValue(point);
          }
        }
      } catch {}
    }).catch(() => {});
    return () => { active = false; };
  }, [toolPosition]);

  useEffect(() => {
    if (!toolLayout.width || !toolLayout.height) return;
    toolBounds.current = toolLayout;
    const freeX = Math.max(0, toolLayout.width - toolSize.current.width);
    const freeY = Math.max(0, toolLayout.height - toolSize.current.height - PDF_TOOLS_BOTTOM_CLEARANCE);
    const saved = savedToolPosition.current;
    const point = {
      x: saved ? clampTool(saved.x * freeX, freeX) : Math.max(0, freeX - 12),
      y: saved ? clampTool(saved.y * freeY, freeY) : freeY * 0.3,
    };
    toolPoint.current = point;
    toolPosition.setValue(point);
  }, [toolLayout, toolPosition]);

  const toolDrag = useMemo(() => {
    let start = { x: 0, y: 0 };
    const move = (dx: number, dy: number) => {
      const freeX = Math.max(0, toolBounds.current.width - toolSize.current.width);
      const freeY = Math.max(0, toolBounds.current.height - toolSize.current.height - PDF_TOOLS_BOTTOM_CLEARANCE);
      const point = { x: clampTool(start.x + dx, freeX), y: clampTool(start.y + dy, freeY) };
      toolPoint.current = point;
      toolPosition.setValue(point);
    };
    const save = () => {
      const freeX = Math.max(0, toolBounds.current.width - toolSize.current.width);
      const freeY = Math.max(0, toolBounds.current.height - toolSize.current.height - PDF_TOOLS_BOTTOM_CLEARANCE);
      const saved = { x: freeX ? toolPoint.current.x / freeX : 0, y: freeY ? toolPoint.current.y / freeY : 0 };
      savedToolPosition.current = saved;
      AsyncStorage.setItem(PDF_TOOLS_POSITION_KEY, JSON.stringify(saved)).catch(() => {});
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => { start = toolPoint.current; },
      onPanResponderMove: (_, gesture) => move(gesture.dx, gesture.dy),
      onPanResponderRelease: save,
      onPanResponderTerminate: save,
      onPanResponderTerminationRequest: () => false,
    });
  }, [toolPosition]);
  const [currentInk, setCurrentInk] = useState<NoteInk | null>(null);
  const [inkVersion, setInkVersion] = useState(0);
  const [annotatedPages, setAnnotatedPages] = useState<Set<number>>(new Set());

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

  const handleDoneDrawing = useCallback(
    async (strokes: Stroke[], size: { width: number; height: number }, paper: string) => {
      if (!currentImageId) return;
      await saveNoteInk(currentImageId, {
        strokes,
        width: size.width,
        height: size.height,
        paper,
      });
      setInkVersion(v => v + 1);
      setMarkupOpen(false);
    },
    [currentImageId],
  );

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

  // Undo last stylus stroke for current page or blank note
  const handleUndoInk = useCallback(async () => {
    if (!currentImageId) return;
    const ink = await loadNoteInk(currentImageId);
    if (ink && ink.strokes && ink.strokes.length > 0) {
      const nextStrokes = ink.strokes.slice(0, -1);
      await saveNoteInk(currentImageId, {
        ...ink,
        strokes: nextStrokes,
      });
      setInkVersion(v => v + 1);
    }
  }, [currentImageId]);

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
          <View
            style={styles.pageContainer}
            onLayout={event => {
              const { width, height } = event.nativeEvent.layout;
              if (width !== toolLayout.width || height !== toolLayout.height) {
                setToolLayout({ width, height });
              }
            }}
            {...panResponder.panHandlers}>
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
                      return (
                        <View style={styles.multiImgContainer}>
                          {noteImages.map((uri, idx) => (
                            <View key={`${uri}_${idx}`} style={styles.multiImgCard}>
                              <InkedImage
                                key={`${currentImageId}_${idx}-${inkVersion}`}
                                uri={uri}
                                imageId={idx === 0 ? currentImageId : `${currentImageId}_sub_${idx}`}
                                ownShape
                                style={styles.insertedImg}
                                title={`Diagram ${idx + 1}`}
                              />
                              <Touchable
                                onPress={() => {
                                  const nextImages = noteImages.filter((_, i) => i !== idx);
                                  const next = insertedPages.map(p =>
                                    p.id === currentInserted.id
                                      ? {
                                          ...p,
                                          images: nextImages,
                                          imageUrl: nextImages[0] || undefined,
                                        }
                                      : p,
                                  );
                                  persistInsertedPages(next);
                                }}
                                label={`Delete image ${idx + 1}`}
                                style={styles.deleteImgBadge}>
                                <Trash2 size={12} color="#FFFFFF" />
                              </Touchable>
                            </View>
                          ))}
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

                  {/* Text Notes */}
                  <TextInput
                    multiline
                    value={currentInserted.noteText ?? ''}
                    onChangeText={txt => {
                      const next = insertedPages.map(p =>
                        p.id === currentInserted.id ? { ...p, noteText: txt } : p,
                      );
                      persistInsertedPages(next);
                    }}
                    placeholder="Type personal study points, lecture pearls, or clinical takeaways here…"
                    placeholderTextColor={colors.textMuted}
                    style={[styles.insertedInput, { color: colors.text }]}
                  />
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
                onLayout={event => {
                  const { width, height } = event.nativeEvent.layout;
                  toolSize.current = { width, height };
                  const freeX = Math.max(0, toolBounds.current.width - width);
                  const freeY = Math.max(0, toolBounds.current.height - height - PDF_TOOLS_BOTTOM_CLEARANCE);
                  const point = {
                    x: clampTool(toolPoint.current.x, freeX),
                    y: clampTool(toolPoint.current.y, freeY),
                  };
                  if (point.x !== toolPoint.current.x || point.y !== toolPoint.current.y) {
                    toolPoint.current = point;
                    toolPosition.setValue(point);
                  }
                }}
                style={[
                  styles.sideToolbar,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  { transform: [{ translateX: toolPosition.x }, { translateY: toolPosition.y }] },
                ]}>
                <View
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Move PDF editing tools"
                  accessibilityHint="Drag these three lines to place the tools on the page"
                  style={styles.sideDragHandle}
                  {...toolDrag.panHandlers}>
                  <View style={[styles.sideDragLine, { backgroundColor: colors.textMuted }]} />
                  <View style={[styles.sideDragLine, { backgroundColor: colors.textMuted }]} />
                  <View style={[styles.sideDragLine, { backgroundColor: colors.textMuted }]} />
                </View>
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
          <Modal visible onRequestClose={() => setMarkupOpen(false)} animationType="fade">
            <DrawCanvas
              uri={
                currentInserted
                  ? currentInserted.images?.[0] ?? currentInserted.imageUrl ?? ''
                  : currentPageObj?.uri ?? ''
              }
              initial={currentInk}
              onCancel={() => setMarkupOpen(false)}
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
    left: 0,
    top: 0,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 6,
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  sideDragHandle: {
    width: 42,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  sideDragLine: {
    width: 22,
    height: 2.5,
    borderRadius: 2,
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
  deleteImgBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.85)',
    borderRadius: 12,
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
