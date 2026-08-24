import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { Text } from "@/components/Text";
import { useTheme, withAlpha } from "@/theme";
import { Maximize2, X } from "lucide-react-native";

interface DiagramCardProps {
  imageUrl: string;
  title?: string;
  caption?: string;
}

export function DiagramCard({ imageUrl, title, caption }: DiagramCardProps) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const screen = Dimensions.get("window");

  if (!imageUrl) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header Tag */}
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: withAlpha(colors.fuchsia, 0.15), borderColor: withAlpha(colors.fuchsia, 0.4) }]}>
          <Text style={[styles.badgeText, { color: colors.fuchsia }]}>🎨 AI EXAM DIAGRAM</Text>
        </View>
        <Text style={[styles.groundedText, { color: colors.textMuted }]}>Park & Vision FMT</Text>
      </View>

      {title ? (
        <Text style={[styles.title, { color: colors.text }]}>{title.replace(/^[🎨\s]+/, "")}</Text>
      ) : null}

      {/* Main Image with Tap-to-Zoom */}
      <Pressable
        onPress={() => setModalVisible(true)}
        style={[styles.imageContainer, { backgroundColor: withAlpha(colors.border, 0.2) }]}
        accessibilityRole="button"
        accessibilityLabel="Enlarge diagram image"
      >
        {loading && (
          <View style={styles.loader}>
            <ActivityIndicator size="small" color={colors.fuchsia} />
          </View>
        )}
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
          resizeMode="contain"
          onLoadEnd={() => setLoading(false)}
        />
        <View style={[styles.zoomHint, { backgroundColor: withAlpha(colors.card, 0.85) }]}>
          <Maximize2 size={14} color={colors.text} />
          <Text style={[styles.zoomText, { color: colors.text }]}>Tap to Zoom</Text>
        </View>
      </Pressable>

      {/* Caption */}
      {caption ? (
        <Text style={[styles.caption, { color: colors.textMuted }]}>
          {caption.replace(/!\[.*?\]\(.*?\)/g, "").replace(/https:\/\/[^\s]+/g, "").trim()}
        </Text>
      ) : null}

      {/* Fullscreen Lightbox Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle} numberOfLines={1}>
              {title ? title.replace(/^[🎨\s]+/, "") : "Exam Diagram"}
            </Text>
            <Pressable
              onPress={() => setModalVisible(false)}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close enlarged diagram"
            >
              <X size={24} color="#ffffff" />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            maximumZoomScale={3}
            minimumZoomScale={1}
            centerContent
          >
            <Image
              source={{ uri: imageUrl }}
              style={{
                width: screen.width,
                height: screen.height * 0.75,
              }}
              resizeMode="contain"
            />
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 12,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  groundedText: {
    fontSize: 11,
    fontWeight: "500",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 10,
    lineHeight: 20,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: "hidden",
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  loader: {
    ...StyleSheet.absoluteFill,
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  zoomHint: {
    position: "absolute",
    bottom: 8,
    right: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  zoomText: {
    fontSize: 11,
    fontWeight: "600",
  },
  caption: {
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 16,
  },
  modalTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
    marginRight: 12,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
