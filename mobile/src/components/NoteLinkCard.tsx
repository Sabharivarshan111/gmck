import React, { useMemo, useRef, useState } from 'react';
import { Animated, Image, Linking, Modal, PanResponder, StyleSheet, View } from 'react-native';
import { ExternalLink, Maximize2, Move, Play, Trash2, X } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { displayTitle, embedUrlFor, thumbnailFor, type NoteLink } from '@/lib/noteLinks';

export function NoteLinkCard({
  link,
  onRemove,
}: {
  link: NoteLink;
  /** Absent while reading; present in the editor. */
  onRemove?: () => void;
}) {
  const { colors } = useTheme();
  const [playing, setPlaying] = useState(false);
  const [thumbFailed, setThumbFailed] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [floating, setFloating] = useState(false);

  // Floating draggable player position
  const pan = useRef(new Animated.ValueXY({ x: 16, y: 140 })).current;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderGrant: () => {
          pan.setOffset({
            x: (pan.x as any)._value,
            y: (pan.y as any)._value,
          });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: () => {
          pan.flattenOffset();
        },
      }),
    [pan],
  );

  const open = () => {
    Linking.openURL(link.url).catch(() => undefined);
  };

  const title = displayTitle(link);

  if (link.videoId && (playing || floating || fullscreen)) {
    const embedUrl = embedUrlFor(link);
    const embedHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
      .wrapper { position: relative; width: 100%; height: 100%; }
      iframe { width: 100%; height: 100%; border: 0; display: block; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <iframe
        src="${embedUrl}"
        frameborder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin">
      </iframe>
    </div>
  </body>
</html>`;

    return (
      <View style={[styles.card, { borderColor: colors.border }]}>
        {/* Inline Player */}
        {!floating && (
          <View style={styles.stage}>
            <WebView
              source={{
                html: embedHtml,
                baseUrl: 'https://www.youtube-nocookie.com',
              }}
              style={styles.web}
              allowsInlineMediaPlayback
              mediaPlaybackRequiresUserAction={false}
              allowsFullscreenVideo
              javaScriptEnabled
              domStorageEnabled
              originWhitelist={['*']}
              userAgent="Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36"
            />
          </View>
        )}

        <View style={styles.foot}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>

          {/* Fullscreen Expand Button */}
          <Touchable
            onPress={() => setFullscreen(true)}
            label="Expand video to fullscreen"
            hitSlop={8}
            style={styles.icon}>
            <Maximize2 size={16} color={colors.primary} />
          </Touchable>

          {/* Freely Movable Floating PiP Button */}
          <Touchable
            onPress={() => setFloating(f => !f)}
            label={floating ? 'Dock video' : 'Move video freely'}
            hitSlop={8}
            style={[styles.icon, floating && { backgroundColor: withAlpha(colors.primary, 0.2) }]}>
            <Move size={16} color={floating ? colors.primary : colors.textMuted} />
          </Touchable>

          <Touchable onPress={open} label="Open this video in YouTube" hitSlop={8} style={styles.icon}>
            <ExternalLink size={15} color={colors.textMuted} />
          </Touchable>

          {onRemove ? (
            <Touchable onPress={onRemove} label={`Remove ${title}`} hitSlop={8} style={styles.icon}>
              <Trash2 size={15} color={colors.danger} />
            </Touchable>
          ) : null}
        </View>

        {/* Dedicated Fullscreen Modal (Never vanishes) */}
        {fullscreen && (
          <Modal visible={fullscreen} onRequestClose={() => setFullscreen(false)} animationType="slide">
            <View style={styles.fullscreenModal}>
              <View style={styles.fullscreenBar}>
                <Text numberOfLines={1} style={styles.fullscreenTitle}>
                  {title}
                </Text>
                <Touchable
                  onPress={() => setFullscreen(false)}
                  label="Close fullscreen"
                  style={styles.fullscreenCloseBtn}>
                  <X size={22} color="#FFFFFF" />
                </Touchable>
              </View>
              <View style={styles.fullscreenVideoStage}>
                <WebView
                  source={{
                    html: embedHtml,
                    baseUrl: 'https://www.youtube-nocookie.com',
                  }}
                  style={styles.web}
                  allowsInlineMediaPlayback
                  mediaPlaybackRequiresUserAction={false}
                  allowsFullscreenVideo
                  javaScriptEnabled
                  domStorageEnabled
                  originWhitelist={['*']}
                />
              </View>
            </View>
          </Modal>
        )}

        {/* Freely Draggable Floating Player */}
        {floating && (
          <Animated.View
            style={[
              styles.floatingBox,
              {
                transform: pan.getTranslateTransform(),
                borderColor: colors.border,
                backgroundColor: colors.card,
              },
            ]}
            {...panResponder.panHandlers}>
            <View style={styles.floatingHeader}>
              <View style={styles.floatingHeaderLeft}>
                <Move size={13} color="#FFFFFF" />
                <Text numberOfLines={1} style={styles.floatingHeaderText}>
                  Drag to Move
                </Text>
              </View>
              <View style={styles.floatingHeaderRight}>
                <Touchable
                  onPress={() => {
                    setFloating(false);
                    setFullscreen(true);
                  }}
                  label="Expand"
                  style={styles.floatingHeaderBtn}>
                  <Maximize2 size={13} color="#FFFFFF" />
                </Touchable>
                <Touchable
                  onPress={() => setFloating(false)}
                  label="Close floating player"
                  style={styles.floatingHeaderBtn}>
                  <X size={13} color="#FFFFFF" />
                </Touchable>
              </View>
            </View>
            <View style={styles.floatingStage}>
              <WebView
                source={{
                  html: embedHtml,
                  baseUrl: 'https://www.youtube-nocookie.com',
                }}
                style={styles.web}
                allowsInlineMediaPlayback
                mediaPlaybackRequiresUserAction={false}
                allowsFullscreenVideo
                javaScriptEnabled
                domStorageEnabled
                originWhitelist={['*']}
              />
            </View>
          </Animated.View>
        )}
      </View>
    );
  }

  if (link.videoId) {
    return (
      <View style={[styles.card, { borderColor: colors.border }]}>
        <Touchable
          onPress={() => setPlaying(true)}
          label={`Play ${title}`}
          hint="Plays here in the note"
          scaleTo={0.99}
          style={styles.stage}>
          {thumbFailed ? (
            <View style={[styles.web, styles.centre, { backgroundColor: colors.cardElevated }]} />
          ) : (
            <Image
              source={{ uri: thumbnailFor(link.videoId) }}
              style={styles.web}
              resizeMode="cover"
              // A missing still is not a missing video. `hqdefault` exists for
              // everything, but a phone with no network has neither.
              onError={() => setThumbFailed(true)}
            />
          )}
          <View style={styles.playWrap} pointerEvents="none">
            <View style={[styles.play, { backgroundColor: withAlpha('#000000', 0.55) }]}>
              <Play size={22} color="#ffffff" fill="#ffffff" />
            </View>
          </View>
        </Touchable>
        <View style={styles.foot}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
          <Touchable onPress={open} label="Open this video in YouTube" hitSlop={8} style={styles.icon}>
            <ExternalLink size={15} color={colors.textMuted} />
          </Touchable>
          {onRemove ? (
            <Touchable onPress={onRemove} label={`Remove ${title}`} hitSlop={8} style={styles.icon}>
              <Trash2 size={15} color={colors.danger} />
            </Touchable>
          ) : null}
        </View>
      </View>
    );
  }

  // Not YouTube. One row that opens out, and says where it goes — a link whose
  // destination is hidden is one nobody should tap.
  return (
    <View style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Touchable onPress={open} label={`Open ${title}`} hint={link.url} style={styles.rowBody}>
        <ExternalLink size={16} color={colors.accent} />
        <View style={styles.grow}>
          <Text numberOfLines={1} style={[styles.title, { color: colors.text }]}>
            {title}
          </Text>
          <Text numberOfLines={1} style={[styles.url, { color: colors.textMuted }]}>
            {link.url}
          </Text>
        </View>
      </Touchable>
      {onRemove ? (
        <Touchable onPress={onRemove} label={`Remove ${title}`} hitSlop={8} style={styles.icon}>
          <Trash2 size={15} color={colors.danger} />
        </Touchable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginBottom: 8,
  },
  // 16:9, which is what YouTube serves and what the still is cropped to.
  stage: { width: '100%', aspectRatio: 16 / 9, position: 'relative' },
  web: { width: '100%', height: '100%' },
  centre: { alignItems: 'center', justifyContent: 'center' },
  playWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  play: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  foot: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  rowBody: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  grow: { flex: 1 },
  title: { ...typeScale.footnote, fontWeight: '700', flex: 1 },
  url: { ...typeScale.caption },
  icon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  fullscreenModal: {
    flex: 1,
    backgroundColor: '#000000',
  },
  fullscreenBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  fullscreenTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  fullscreenCloseBtn: {
    padding: 6,
  },
  fullscreenVideoStage: {
    flex: 1,
    backgroundColor: '#000000',
  },
  floatingBox: {
    position: 'absolute',
    width: 220,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 9999,
  },
  floatingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0f172a',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  floatingHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  floatingHeaderText: {
    color: '#94a3b8',
    fontSize: 11,
    fontWeight: '600',
  },
  floatingHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  floatingHeaderBtn: {
    padding: 4,
  },
  floatingStage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000000',
  },
});
