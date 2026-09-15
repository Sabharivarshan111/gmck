import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PenLine,
  X,
} from 'lucide-react-native';
import { DrawCanvas, type Stroke } from '@/components/DrawCanvas';
import { InkedImage } from '@/components/InkedImage';
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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<RenderedPdfPage[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  // Markup / annotation state
  const [markupOpen, setMarkupOpen] = useState(false);
  const [currentInk, setCurrentInk] = useState<NoteInk | null>(null);
  const [inkVersion, setInkVersion] = useState(0);

  // Load and render PDF pages when modal opens
  useEffect(() => {
    if (!visible || !file) {
      setPages([]);
      setPageCount(0);
      setCurrentPage(1);
      setError(null);
      setMarkupOpen(false);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    renderNotePdf(file, 40)
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
  }, [visible, file]);

  const currentPageObj = pages.find(p => p.page === currentPage) ?? pages[0];
  const currentImageId = file ? `${file.id}_p${currentPage}` : '';

  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const pageAspect =
    currentPageObj && currentPageObj.width > 0 && currentPageObj.height > 0
      ? currentPageObj.width / currentPageObj.height
      : 1 / 1.414;

  const maxContentWidth = Math.min(windowWidth - 24, 600);
  const maxContentHeight = Math.max(320, windowHeight - 170 - insets.top - insets.bottom);
  const displayWidth =
    maxContentWidth / pageAspect > maxContentHeight
      ? Math.round(maxContentHeight * pageAspect)
      : Math.round(maxContentWidth);
  const displayHeight = Math.round(displayWidth / pageAspect);

  // Load existing ink whenever current page or inkVersion changes
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

  if (!visible || !file) return null;

  return (
    <Modal visible={visible} onRequestClose={onClose} animationType="slide">
      <View style={[styles.container, { backgroundColor: colors.background }]}>
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
                Page {currentPage} of {pageCount}
              </Text>
            ) : null}
          </View>

          <View style={styles.headerActions}>
            {/* Draw / Markup toggle */}
            {currentPageObj ? (
              <Touchable
                onPress={() => setMarkupOpen(true)}
                label="Mark up / annotate this PDF page"
                hint="Opens pen, highlighter and drawing tools"
                style={[
                  styles.iconBtn,
                  {
                    borderColor: colors.border,
                    backgroundColor: withAlpha(colors.accent, 0.12),
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
            <ActivityIndicator size="large" color={colors.accent} />
            <Text style={[styles.loadingText, { color: colors.text }]}>
              Rendering PDF pages…
            </Text>
            <Text style={[styles.loadingSub, { color: colors.textMuted }]}>
              Processed on this phone for instant reading & markup
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
        ) : currentPageObj ? (
          <View style={styles.pageContainer}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              maximumZoomScale={3}
              minimumZoomScale={1}
              showsVerticalScrollIndicator={false}>
              <InkedImage
                key={`${currentImageId}-${inkVersion}`}
                uri={currentPageObj.uri}
                imageId={currentImageId}
                ownShape
                style={[styles.pageImage, { width: displayWidth, height: displayHeight }]}
                title={`${file.name} - Page ${currentPage}`}
              />
            </ScrollView>

            {/* Bottom Page Navigation Bar */}
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
                onPress={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                label="Previous page"
                style={[
                  styles.navBtn,
                  { borderColor: colors.border, opacity: currentPage <= 1 ? 0.35 : 1 },
                ]}>
                <ChevronLeft size={20} color={colors.text} />
                <Text style={[styles.navBtnText, { color: colors.text }]}>Prev</Text>
              </Touchable>

              <View style={styles.pageBadge}>
                <Text style={[styles.pageBadgeText, { color: colors.text }]}>
                  {currentPage} / {pageCount}
                </Text>
              </View>

              <Touchable
                onPress={() => setCurrentPage(p => Math.min(pageCount, p + 1))}
                disabled={currentPage >= pageCount}
                label="Next page"
                style={[
                  styles.navBtn,
                  { borderColor: colors.border, opacity: currentPage >= pageCount ? 0.35 : 1 },
                ]}>
                <Text style={[styles.navBtnText, { color: colors.text }]}>Next</Text>
                <ChevronRight size={20} color={colors.text} />
              </Touchable>
            </View>
          </View>
        ) : null}

        {/* Fullscreen DrawCanvas for Markup / Annotation */}
        {markupOpen && currentPageObj ? (
          <Modal visible onRequestClose={() => setMarkupOpen(false)} animationType="fade">
            <DrawCanvas
              uri={currentPageObj.uri}
              initial={currentInk}
              onCancel={() => setMarkupOpen(false)}
              onDone={handleDoneDrawing}
            />
          </Modal>
        ) : null}
      </View>
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
    gap: 12,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '600',
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
    width: 38,
    height: 38,
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
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  pageBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
