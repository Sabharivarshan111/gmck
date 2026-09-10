import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Text } from '@/components/Text';
import { ZoomableImage } from '@/components/ZoomableImage';
import { useTheme, withAlpha } from '@/theme';
import { Maximize2 } from 'lucide-react-native';

interface DiagramCardProps {
  imageUrl: string;
  title?: string;
  caption?: string;
}

/**
 * Format a human-readable diagram name / heading.
 * Prioritizes clean explicit titles, descriptive alt text, or formatted image filenames.
 */
export function formatDiagramHeading(
  title?: string,
  caption?: string,
  imageUrl?: string,
): string {
  // 1. Check title
  if (title) {
    const cleaned = title
      .replace(/^[🎨\s]+/, '')
      .replace(/[*#★☆]/g, '')
      .trim();
    if (
      cleaned &&
      !cleaned.toLowerCase().includes('high-yield visual exam diagram') &&
      !cleaned.toLowerCase().includes('ai exam diagram')
    ) {
      return cleaned;
    }
  }

  // 2. Check caption (alt text)
  if (caption) {
    const cleaned = caption
      .replace(/!\[.*?\]\(.*?\)/g, '')
      .replace(/https:\/\/[^\s]+/g, '')
      .replace(/[*#★☆]/g, '')
      .trim();
    if (
      cleaned &&
      cleaned.length > 2 &&
      !cleaned.toLowerCase().includes('high-yield exam diagram') &&
      !cleaned.toLowerCase().includes('exam diagram') &&
      !cleaned.toLowerCase().startsWith('http')
    ) {
      return cleaned;
    }
  }

  // 3. Derive from imageUrl filename
  if (imageUrl) {
    try {
      const pathname = imageUrl.split('?')[0];
      const filename = pathname.split('/').pop() || '';
      const base = filename.replace(/\.[a-zA-Z0-9]+$/, '');
      if (base && base.length > 2) {
        return base
          .split(/[-_]+/)
          .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ')
          .replace(/\bVs\b/g, 'vs')
          .replace(/\bAnd\b/g, '&')
          .replace(/\bOf\b/g, 'of')
          .replace(/\bIn\b/g, 'in')
          .replace(/\bAt\b/g, 'at');
      }
    } catch {
      // ignore
    }
  }

  return 'Exam Diagram';
}

export function DiagramCard({ imageUrl, title, caption }: DiagramCardProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  if (!imageUrl) return null;

  const heading = formatDiagramHeading(title, caption, imageUrl);
  const cleanedCaption = caption
    ? caption
        .replace(/!\[.*?\]\(.*?\)/g, '')
        .replace(/https:\/\/[^\s]+/g, '')
        .trim()
    : '';
  // Avoid duplicating caption if it's identical to heading or generic
  const showCaption =
    cleanedCaption &&
    cleanedCaption !== heading &&
    cleanedCaption.toLowerCase() !== 'high-yield exam diagram' &&
    cleanedCaption.toLowerCase() !== 'exam diagram';

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: withAlpha(colors.fuchsia, 0.15),
              borderColor: withAlpha(colors.fuchsia, 0.4),
            },
          ]}
        >
          <Text style={[styles.badgeText, { color: colors.fuchsia }]}>
            🎨 AI EXAM DIAGRAM
          </Text>
        </View>
      </View>

      <Pressable
        onPress={() => (failed ? undefined : setModalVisible(true))}
        disabled={failed}
        style={[
          styles.imageContainer,
          { backgroundColor: withAlpha(colors.border, 0.2) },
        ]}
        accessibilityRole="button"
        accessibilityLabel="Enlarge diagram image"
      >
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color={colors.fuchsia} />
          </View>
        )}
        {failed ? (
          <View style={styles.loader}>
            <Text style={[styles.failedText, { color: colors.textMuted }]}>
              This diagram could not be loaded.
            </Text>
          </View>
        ) : (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="contain"
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setLoading(false);
              setFailed(true);
            }}
          />
        )}
        {failed ? null : (
          <View
            style={[
              styles.zoomHint,
              { backgroundColor: withAlpha(colors.card, 0.85) },
            ]}
          >
            <Maximize2 size={14} color={colors.text} />
            <Text style={[styles.zoomText, { color: colors.text }]}>
              Tap to Zoom
            </Text>
          </View>
        )}
      </Pressable>

      {/* Diagram Heading / Name */}
      <View style={styles.diagramHeadingRow}>
        <Text style={[styles.diagramHeading, { color: colors.text }]}>
          {heading}
        </Text>
      </View>

      {/* Optional explanatory caption or mnemonic note */}
      {showCaption ? (
        <Text style={[styles.caption, { color: colors.textMuted }]}>
          {cleanedCaption}
        </Text>
      ) : null}

      {/*
        The lightbox pinches to zoom, and did not before.
        It was a `<ScrollView maximumZoomScale={3} minimumZoomScale={1}
        centerContent>` — three props that are **iOS-only**. On Android, the
        only platform this app ships to, they are silently ignored, so this
        read as a zoomable lightbox and was a static picture on every phone
        that has ever run it. See ZoomableImage.tsx.
      */}
      <ZoomableImage
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        uri={imageUrl}
        title={heading}
        imageLabel={cleanedCaption || heading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    lineHeight: 20,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  failedText: {
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  loader: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  zoomHint: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  zoomText: {
    fontSize: 11,
    fontWeight: '600',
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 4,
  },
  diagramHeadingRow: {
    marginTop: 10,
    marginBottom: 2,
  },
  diagramHeading: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 20,
    letterSpacing: -0.2,
  },
});
