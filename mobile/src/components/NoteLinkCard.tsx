import React, { useState } from 'react';
import { Image, Linking, StyleSheet, View } from 'react-native';
import { ExternalLink, Play, Trash2 } from 'lucide-react-native';
import { WebView } from 'react-native-webview';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import {
  EMBED_ORIGIN,
  displayTitle,
  embedHtmlFor,
  thumbnailFor,
  type NoteLink,
} from '@/lib/noteLinks';

/**
 * A link in a note. A YouTube one plays where it sits; anything else opens out.
 *
 * ## The thumbnail is not the player
 *
 * The card shows a still until it is tapped, and only then mounts the WebView.
 * That ordering is the whole performance story: a note with four lectures in it
 * would otherwise mount four browsers on open, each loading YouTube's player
 * bundle, on the sort of phone this app is built for. A still is one JPEG that
 * YouTube serves from a CDN.
 *
 * It also means the reader chooses when a request goes to YouTube at all. The
 * thumbnail host sets no cookies and the embed is `youtube-nocookie.com`, so
 * until a play button is pressed, opening a note tells YouTube nothing beyond
 * which images were fetched.
 *
 * ## Why a WebView and not the video player already in the APK
 *
 * ExoPlayer is right here and may not be used: putting a YouTube video into it
 * means extracting the stream, which is a breach of YouTube's terms. The IFrame
 * player is the sanctioned route and it needs a browser. See `lib/noteLinks.ts`.
 */
/** The host of a URL, or an empty string when it is not one we can parse. */
const safeHost = (url: string): string => {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
};

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

  const open = () => {
    // `normaliseUrl` has already refused anything that is not http(s), which is
    // what makes this safe to hand to the system.
    Linking.openURL(link.url).catch(() => undefined);
  };

  const title = displayTitle(link);

  if (link.videoId && playing) {
    return (
      <View style={[styles.card, { borderColor: colors.border }]}>
        <View style={styles.stage}>
          <WebView
            /*
               HTML with a `baseUrl`, never the embed URL on its own.

               Pointed straight at `/embed/<id>` the player is the top-level
               document, sends no referrer, and answers with "Video player
               configuration error, Error 153" — which is what the app's owner
               photographed. Loading a page whose base is a real YouTube origin
               makes the player a framed sub-resource with a referrer it
               accepts. `lib/noteLinks.ts` has the long version.
            */
            source={{ html: embedHtmlFor(link), baseUrl: EMBED_ORIGIN }}
            style={styles.web}
            // The player needs both, and neither is a default: without
            // `allowsInlineMediaPlayback` iOS throws it fullscreen, and without
            // `mediaPlaybackRequiresUserAction={false}` the tap that opened the
            // card does not count as the gesture that starts the video, so the
            // reader has to press play twice.
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            allowsFullscreenVideo
            javaScriptEnabled
            domStorageEnabled
            /*
               A tap on the player's own "Watch on YouTube" asks for a new
               window. With multiple windows supported that opens a second
               WebView inside the card with no way back out of it; refused
               here, the request arrives at `onShouldStartLoadWithRequest`
               instead and leaves for the real app.
            */
            setSupportMultipleWindows={false}
            onShouldStartLoadWithRequest={(req) => {
              // The player's own navigations stay inside. Anything else — the
              // channel, a recommendation, a link in a description — is the
              // reader leaving, and it leaves through the system rather than
              // stranding them in a browser with no chrome.
              if (req.url.startsWith('about:') || /(^|\.)(youtube|youtube-nocookie|ytimg|googlevideo)\.com$/.test(safeHost(req.url))) {
                return true;
              }
              Linking.openURL(req.url).catch(() => undefined);
              return false;
            }}
          />
        </View>
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
});
