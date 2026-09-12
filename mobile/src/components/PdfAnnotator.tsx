import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, Pencil, X } from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import Svg, { Path } from 'react-native-svg';
import { DrawCanvas } from '@/components/DrawCanvas';
import type { NoteInk } from '@/lib/noteImages';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { tick } from '@/lib/haptics';
import { loadPdfInk, pdfPageCount, pdfPageImage, savePdfInk } from '@/lib/pdfPages';

/**
 * Read a PDF a page at a time, and draw on it.
 *
 * ## The bytes are never touched
 *
 * This does not edit the PDF. Android renders each page to a picture, the
 * marks are stored beside it as geometry, and the two are drawn one over the
 * other. So a lecture handout stays exactly as the professor sent it, the
 * annotation can always be undone, and nothing has to re-encode a document
 * this app did not write.
 *
 * ## Which is why the drawing half was already built
 *
 * `DrawCanvas` does pen, highlighter, six colours plus a wheel, two erasers
 * and real palm rejection, and it already draws over a photograph. A rendered
 * page is a photograph. Writing a second canvas for PDFs would be a second
 * implementation of the hardest part of this app to get right.
 *
 * ## Handing off to Android's viewer is still the right answer for READING
 *
 * `CLAUDE.md` says this app has no business being a PDF viewer, and that
 * stands: a reader who just wants to read gets the system viewer, which knows
 * about search, selection and reflow. This screen exists for the other
 * verb — marking a diagram up — and it opens from the pencil, not from the
 * file itself.
 *
 * ## A full-screen Modal is its own window
 *
 * So it pads by `insets.top` itself. The navigator's SafeAreaView does not
 * reach inside a Modal, and the control that finishes the work ending up under
 * the system clock is a bug this repo has already shipped once.
 */
export function PdfAnnotator({
  fileId,
  name,
  onClose,
}: {
  fileId: string;
  name: string;
  onClose: () => void;
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [pages, setPages] = useState<number | null>(null);
  const [page, setPage] = useState(0);
  const [image, setImage] = useState<string | null>(null);
  const [ink, setInk] = useState<NoteInk | null>(null);
  const [drawing, setDrawing] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    pdfPageCount(fileId).then(count => {
      if (cancelled) {
        return;
      }
      setPages(count);
      setFailed(count === 0);
    });
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  /*
   * The render is asked for at a fixed width rather than the measured one.
   *
   * A measured width changes with the text size and the rotation, and each
   * distinct width is another cached PNG on disk for the same page. A page
   * wider than the screen simply scales down, and the ink is stored as
   * geometry over the page's own box, so it lands correctly at any size.
   */
  useEffect(() => {
    let cancelled = false;
    setImage(null);
    Promise.all([pdfPageImage(fileId, page, 1240), loadPdfInk(fileId, page)]).then(
      ([path, stored]) => {
        if (cancelled) {
          return;
        }
        setImage(path);
        // Stored as JSON so a corrupt value costs one page's marks, not the
        // screen.
        let parsed: NoteInk | null = null;
        try {
          parsed = stored ? (JSON.parse(stored) as NoteInk) : null;
        } catch {
          parsed = null;
        }
        setInk(parsed);
        if (!path) {
          setFailed(true);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [fileId, page]);

  const keep = useCallback(
    async (
      strokes: NoteInk['strokes'],
      size: { width: number; height: number },
      paper: string,
    ) => {
      // No strokes is no ink, not ink with an empty list — see savePdfInk.
      const next: NoteInk | null =
        strokes.length > 0 ? { strokes, width: size.width, height: size.height, paper } : null;
      setInk(next);
      setDrawing(false);
      await savePdfInk(fileId, page, next ? JSON.stringify(next) : null);
      tick();
    },
    [fileId, page],
  );

  const step = (by: number) => {
    if (pages === null) {
      return;
    }
    const next = page + by;
    if (next < 0 || next >= pages) {
      return;
    }
    tick();
    setPage(next);
  };

  return (
    <Modal visible animationType="slide" onRequestClose={onClose}>
      <View style={[styles.wrap, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.bar}>
          <Touchable onPress={onClose} label="Close this document" style={styles.iconButton}>
            <X size={20} color={colors.text} />
          </Touchable>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {name}
          </Text>
          <Touchable
            onPress={() => {
              tick();
              setDrawing(true);
            }}
            label="Draw on this page"
            disabled={!image}
            style={[
              styles.iconButton,
              { backgroundColor: image ? withAlpha(colors.accent, 0.16) : 'transparent' },
            ]}>
            <Pencil size={18} color={image ? colors.accent : colors.textMuted} />
          </Touchable>
        </View>

        <View style={styles.stage}>
          {failed ? (
            <Text style={[styles.message, { color: colors.textMuted }]}>
              This file could not be opened as a PDF. It may be protected, or it
              may not be a PDF at all.
            </Text>
          ) : image ? (
            <View style={styles.pageBox}>
              <Image source={{ uri: image }} style={styles.page} resizeMode="contain" />
              {/*
                The marks are replayed over the page by the same canvas that
                drew them, in read-only mode, so what is shown here is exactly
                what will be there when it is opened again.
              */}
              {ink && ink.strokes.length > 0 ? (
                /*
                 * The marks replayed over the page, in the page's own
                 * coordinate space.
                 *
                 * `viewBox` is the board they were drawn on, which is how they
                 * land correctly at any size — the same geometry `InkedImage`
                 * uses. A fixed pixel overlay would drift the moment the page
                 * is rendered at a different width, and every mark would sit
                 * beside the thing it was pointing at.
                 *
                 * Highlighter strokes carry an opacity below 1 and are drawn
                 * first, so a wash sits UNDER the writing rather than over it.
                 */
                <Svg
                  style={StyleSheet.absoluteFill}
                  width="100%"
                  height="100%"
                  viewBox={`0 0 ${ink.width} ${ink.height}`}
                  pointerEvents="none">
                  {[...ink.strokes]
                    .sort((a, b) => (a.opacity ?? 1) - (b.opacity ?? 1))
                    .map((stroke, index) => (
                      <Path
                        key={index}
                        d={stroke.d}
                        stroke={stroke.color}
                        strokeWidth={stroke.width}
                        strokeOpacity={stroke.opacity ?? 1}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        fill="none"
                      />
                    ))}
                </Svg>
              ) : null}
            </View>
          ) : (
            <ActivityIndicator color={colors.accent} />
          )}
        </View>

        <View style={[styles.pager, { borderColor: colors.border }]}>
          <Touchable
            onPress={() => step(-1)}
            label="Previous page"
            disabled={page === 0}
            style={styles.iconButton}>
            <ChevronLeft size={20} color={page === 0 ? colors.textMuted : colors.text} />
          </Touchable>
          <Text style={[styles.count, { color: colors.textMuted }]}>
            {pages === null ? '…' : `Page ${page + 1} of ${pages}`}
          </Text>
          <Touchable
            onPress={() => step(1)}
            label="Next page"
            disabled={pages === null || page >= pages - 1}
            style={styles.iconButton}>
            <ChevronRight
              size={20}
              color={pages !== null && page < pages - 1 ? colors.text : colors.textMuted}
            />
          </Touchable>
        </View>

        {drawing && image ? (
          <DrawCanvas
            uri={image}
            initial={ink}
            onCancel={() => setDrawing(false)}
            onDone={keep}
          />
        ) : null}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  bar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 8 },
  title: { ...typeScale.bodyStrong, flex: 1 },
  iconButton: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  stage: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 10 },
  pageBox: { flex: 1, width: '100%' },
  page: { flex: 1, width: '100%' },
  message: { ...typeScale.body, textAlign: 'center', paddingHorizontal: 24 },
  pager: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  count: { ...typeScale.footnote },
});
