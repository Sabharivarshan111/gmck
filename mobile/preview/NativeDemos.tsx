import React from 'react';
import { View, Text, TextInput, ScrollView, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { Dialog } from '@/components/Dialog';
import { Touchable } from '@/components/Touchable';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import HomeScreen from '@/screens/HomeScreen';
import {
  Rocket,
  ImagePlus,
  PenLine,
  Paperclip,
  Link as LinkIcon,
  BookOpen,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  UserCheck,
  Check,
  ExternalLink,
  X,
  FileText,
  Highlighter,
} from 'lucide-react-native';

/**
 * Native Android Status Bar mockup for authentic phone screenshots.
 */
export function AndroidHeader() {
  return (
    <View style={demoStyles.androidBar}>
      <Text style={demoStyles.androidTime}>11:32</Text>
      <View style={demoStyles.androidIcons}>
        <Text style={demoStyles.androidSignal}>5G</Text>
        <Text style={demoStyles.androidSignal}>●●●●</Text>
        <View style={demoStyles.batteryBox}>
          <View style={demoStyles.batteryFill} />
        </View>
      </View>
    </View>
  );
}

/**
 * Native Update Dialog preview matching UpdateNotice.tsx on Orbit Home.
 */
export function NativeUpdateDemo() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AndroidHeader />
      <NavigationContainer theme={DarkTheme}>
        <View style={{ flex: 1, pointerEvents: 'none' }}>
          <HomeScreen initialEditing={false} />
        </View>
        <Dialog
          visible={true}
          onDismiss={() => {}}
          title="Update available — 0.0.0.19"
          message="Orbit v19 is now available"
        footer={
          <View
            style={[
              demoStyles.notesBox,
              {
                borderColor: withAlpha(colors.accent, 0.4),
                backgroundColor: withAlpha(colors.accent, 0.08),
              },
            ]}>
            <View style={demoStyles.notesHead}>
              <Rocket size={14} color={colors.accent} />
              <Text style={[demoStyles.notesTitle, { color: colors.accent }]}>
                What this update fixes
              </Text>
            </View>
            {[
              'New: Instant 1-tap MBBS year selector on Home',
              'New: Textbook deletion for uploaders & admin management',
              'New: Unclipped note attachments with direct PDF & link tools',
              'Fixed: Glass UI fluidity & performance enhancements',
            ].map((note, i) => (
              <View key={i} style={demoStyles.noteRow}>
                <Text style={[demoStyles.bullet, { color: colors.accent }]}>•</Text>
                <Text style={[demoStyles.noteText, { color: colors.text }]}>{note}</Text>
              </View>
            ))}
          </View>
        }
        actions={[
          { label: 'Not now', onPress: () => {}, tone: 'secondary' },
          { label: 'Update', onPress: () => {}, tone: 'primary' },
        ]}
      />
      </NavigationContainer>
    </View>
  );
}

/**
 * Native Notes Editor preview showing the authentic 2-row attachments grid from ProgressNotesTab.tsx.
 */
export function NativeNotesEditorDemo() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AndroidHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 14 }}>
        {/* Editor Top Bar */}
        <View style={demoStyles.navRow}>
          <View style={demoStyles.navLeft}>
            <ChevronLeft size={22} color={colors.text} />
            <Text style={[demoStyles.navTitle, { color: colors.text }]}>Your notes</Text>
          </View>
          <View style={[demoStyles.savePill, { backgroundColor: colors.primary }]}>
            <Check size={14} color={colors.primaryText} />
            <Text style={[demoStyles.savePillText, { color: colors.primaryText }]}>Saved</Text>
          </View>
        </View>

        {/* Note Card */}
        <View
          style={[
            demoStyles.editorCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          {/* Subject Badge */}
          <View style={demoStyles.badgeRow}>
            <View
              style={[
                demoStyles.badge,
                {
                  backgroundColor: withAlpha(colors.accent, 0.12),
                  borderColor: withAlpha(colors.accent, 0.3),
                },
              ]}>
              <Text style={[demoStyles.badgeText, { color: colors.accent }]}>
                General Medicine › Respiratory
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[demoStyles.fieldLabel, { color: colors.textMuted }]}>NOTE TITLE</Text>
          <TextInput
            value="Complications of Lobar Pneumonia"
            editable={false}
            style={[
              demoStyles.titleInput,
              { color: colors.text, backgroundColor: colors.cardElevated, borderColor: colors.border },
            ]}
          />

          {/* Body Content */}
          <Text style={[demoStyles.fieldLabel, { color: colors.textMuted }]}>NOTE CONTENT</Text>
          <View
            style={[
              demoStyles.contentBox,
              { backgroundColor: colors.cardElevated, borderColor: colors.border },
            ]}>
            <Text style={[demoStyles.noteBodyText, { color: colors.text }]}>
              Key pulmonary & systemic complications:{'\n'}
              1. <Text style={{ fontWeight: '700', color: colors.accent }}>Parapneumonic effusion</Text> & Empyema thoracis{'\n'}
              2. Lung abscess & tissue necrosis{'\n'}
              3. ARDS (Acute Respiratory Distress Syndrome){'\n'}
              4. Sepsis, bacteremia & metastatic abscesses
            </Text>
          </View>

          {/* 2-Row Attachment Grid (Exact code from ProgressNotesTab.tsx lines 1408-1464) */}
          <Text style={[demoStyles.fieldLabel, { color: colors.textMuted, marginTop: 4 }]}>
            ATTACHMENTS (2-ROW GRID)
          </Text>
          <View style={demoStyles.attachGrid}>
            {/* Row 1: Add picture + Write by hand */}
            <View style={demoStyles.attachRow}>
              <Touchable
                label="Add picture"
                style={[
                  demoStyles.attachBtn,
                  { backgroundColor: colors.cardElevated, borderColor: colors.border },
                ]}>
                <ImagePlus size={16} color={colors.accent} />
                <Text style={[demoStyles.attachBtnText, { color: colors.accent }]}>
                  Add picture
                </Text>
              </Touchable>
              <Touchable
                label="Write by hand"
                style={[
                  demoStyles.attachBtn,
                  { backgroundColor: colors.cardElevated, borderColor: colors.border },
                ]}>
                <PenLine size={16} color={colors.accent} />
                <Text style={[demoStyles.attachBtnText, { color: colors.accent }]}>
                  Write by hand
                </Text>
              </Touchable>
            </View>

            {/* Row 2: Add file / PDF (directly below Add picture) + Add link (directly below Write by hand) */}
            <View style={demoStyles.attachRow}>
              <Touchable
                label="Add file / PDF"
                style={[
                  demoStyles.attachBtn,
                  {
                    backgroundColor: colors.cardElevated,
                    borderColor: withAlpha(colors.accent, 0.4),
                  },
                ]}>
                <Paperclip size={16} color={colors.accent} />
                <Text style={[demoStyles.attachBtnText, { color: colors.accent }]}>
                  Add file / PDF
                </Text>
              </Touchable>
              <Touchable
                label="Add link"
                style={[
                  demoStyles.attachBtn,
                  { backgroundColor: colors.cardElevated, borderColor: colors.border },
                ]}>
                <LinkIcon size={16} color={colors.accent} />
                <Text style={[demoStyles.attachBtnText, { color: colors.accent }]}>Add link</Text>
              </Touchable>
            </View>
          </View>

          <View
            style={[
              demoStyles.layoutCallout,
              {
                backgroundColor: withAlpha(colors.primary, 0.08),
                borderColor: withAlpha(colors.primary, 0.25),
              },
            ]}>
            <Text style={[demoStyles.calloutText, { color: colors.text }]}>
              ✓ <Text style={{ fontWeight: '700', color: colors.primary }}>Row 1:</Text> Add picture & Write by hand{'\n'}
              ✓ <Text style={{ fontWeight: '700', color: colors.primary }}>Row 2:</Text> Add file / PDF (below picture) & Add link (below hand)
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Native Textbook Deletion Permissions demo showing PageRefSheet.tsx with creator vs peer vs admin.
 */
export function NativePageRefDemo() {
  const { colors } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <AndroidHeader />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40, gap: 18 }}>
        <View style={demoStyles.sheetHeader}>
          <Text style={[typeScale.title2, { color: colors.text, fontWeight: '800' }]}>
            Textbook page
          </Text>
          <Text style={[typeScale.subhead, { color: colors.textMuted }]}>
            A page number appears for everyone once 3 readers have entered the same one for the same book and edition.
          </Text>
        </View>

        {/* SECTION 1: Regular Student View */}
        <View
          style={[
            demoStyles.permSection,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}>
          <View style={demoStyles.roleHead}>
            <UserCheck size={16} color={colors.accent} />
            <Text style={[demoStyles.roleTitle, { color: colors.accent }]}>
              STUDENT VIEW (Logged in as Uploader)
            </Text>
          </View>
          <Text style={[demoStyles.roleSub, { color: colors.textMuted }]}>
            Can delete own uploaded textbook. Other students' books are protected.
          </Text>

          <View style={demoStyles.bookList}>
            {/* Book 1: Own upload -> Delete trash can visible */}
            <View
              style={[
                demoStyles.bookCard,
                { backgroundColor: colors.cardElevated, borderColor: colors.border },
              ]}>
              <View style={demoStyles.bookLeft}>
                <BookOpen size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[demoStyles.bookName, { color: colors.text }]}>
                    Robbins Basic Pathology · 10th
                  </Text>
                  <Text style={[demoStyles.bookMeta, { color: colors.accent }]}>
                    Uploaded by you (Creator)
                  </Text>
                </View>
              </View>
              <View style={demoStyles.deleteBadge}>
                <Trash2 size={16} color={colors.danger} />
              </View>
            </View>

            {/* Book 2: Peer upload -> NO delete trash can (Protected) */}
            <View
              style={[
                demoStyles.bookCard,
                { backgroundColor: colors.cardElevated, borderColor: colors.border },
              ]}>
              <View style={demoStyles.bookLeft}>
                <BookOpen size={16} color={colors.textMuted} />
                <View style={{ flex: 1 }}>
                  <Text style={[demoStyles.bookName, { color: colors.text }]}>
                    Harsh Mohan Pathology · 8th
                  </Text>
                  <Text style={[demoStyles.bookMeta, { color: colors.textMuted }]}>
                    Uploaded by Peer · Protected
                  </Text>
                </View>
              </View>
              <View
                style={[
                  demoStyles.protectedBadge,
                  { backgroundColor: withAlpha(colors.textMuted, 0.1) },
                ]}>
                <Text style={[demoStyles.protectedText, { color: colors.textMuted }]}>
                  Protected
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* SECTION 2: Admin View */}
        <View
          style={[
            demoStyles.permSection,
            {
              backgroundColor: colors.card,
              borderColor: withAlpha(colors.accent, 0.35),
            },
          ]}>
          <View style={demoStyles.roleHead}>
            <ShieldCheck size={16} color={colors.accent} />
            <Text style={[demoStyles.roleTitle, { color: colors.accent }]}>
              ADMIN VIEW (Sabharivarshan111@gmail.com)
            </Text>
          </View>
          <Text style={[demoStyles.roleSub, { color: colors.textMuted }]}>
            Administrator privileges: Global deletion enabled across all textbooks.
          </Text>

          <View style={demoStyles.bookList}>
            <View
              style={[
                demoStyles.bookCard,
                { backgroundColor: colors.cardElevated, borderColor: colors.border },
              ]}>
              <View style={demoStyles.bookLeft}>
                <BookOpen size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[demoStyles.bookName, { color: colors.text }]}>
                    Robbins Basic Pathology · 10th
                  </Text>
                  <Text style={[demoStyles.bookMeta, { color: colors.textMuted }]}>
                    Global Management
                  </Text>
                </View>
              </View>
              <View style={demoStyles.deleteBadge}>
                <Trash2 size={16} color={colors.danger} />
              </View>
            </View>

            <View
              style={[
                demoStyles.bookCard,
                { backgroundColor: colors.cardElevated, borderColor: colors.border },
              ]}>
              <View style={demoStyles.bookLeft}>
                <BookOpen size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[demoStyles.bookName, { color: colors.text }]}>
                    Harsh Mohan Pathology · 8th
                  </Text>
                  <Text style={[demoStyles.bookMeta, { color: colors.textMuted }]}>
                    Global Management
                  </Text>
                </View>
              </View>
              <View style={demoStyles.deleteBadge}>
                <Trash2 size={16} color={colors.danger} />
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

/**
 * Native PDF Viewer and Annotator demo matching PdfViewerModal.tsx.
 */
export function NativePdfViewerDemo({ annotating = false }: { annotating?: boolean }) {
  return (
    <View style={{ flex: 1, backgroundColor: '#020617' }}>
      <AndroidHeader />

      {/* Header bar matching PdfViewerModal */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: 'rgba(255, 255, 255, 0.1)',
          backgroundColor: '#090d16',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View
            style={{
              padding: 6,
              borderRadius: 8,
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
            }}>
            <FileText size={18} color="#ef4444" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{ fontSize: 13, fontWeight: '700', color: '#f8fafc' }}>
              Robbins_Pathology_Granuloma.pdf
            </Text>
            <Text style={{ fontSize: 11, color: '#94a3b8' }}>Page 1 of 4 · Native PDF Engine</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          {/* Markup toggle */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 4,
              paddingVertical: 6,
              paddingHorizontal: 10,
              borderRadius: 20,
              backgroundColor: annotating ? 'rgba(168, 85, 247, 0.25)' : 'rgba(255, 255, 255, 0.08)',
              borderWidth: StyleSheet.hairlineWidth,
              borderColor: annotating ? '#a855f7' : 'rgba(255, 255, 255, 0.12)',
            }}>
            <PenLine size={14} color={annotating ? '#d8b4fe' : '#cbd5e1'} />
            <Text
              style={{
                fontSize: 11,
                fontWeight: '700',
                color: annotating ? '#d8b4fe' : '#cbd5e1',
              }}>
              {annotating ? 'Markup Active' : 'Annotate'}
            </Text>
          </View>

          {/* External Viewer */}
          <View
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            }}>
            <ExternalLink size={15} color="#cbd5e1" />
          </View>

          {/* Close */}
          <View
            style={{
              padding: 8,
              borderRadius: 20,
              backgroundColor: 'rgba(255, 255, 255, 0.08)',
            }}>
            <X size={15} color="#cbd5e1" />
          </View>
        </View>
      </View>

      {/* Annotator toolbar if active */}
      {annotating && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: '#111827',
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: 'rgba(255, 255, 255, 0.08)',
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 8,
                backgroundColor: '#7c3aed',
              }}>
              <PenLine size={12} color="#ffffff" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#ffffff' }}>Pen</Text>
            </View>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 8,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }}>
              <Highlighter size={12} color="#cbd5e1" />
              <Text style={{ fontSize: 11, fontWeight: '600', color: '#cbd5e1' }}>Highlighter</Text>
            </View>

            {/* Colors */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 6 }}>
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#facc15' }} />
              <View style={{ width: 16, height: 16, borderRadius: 8, backgroundColor: '#38bdf8', borderWidth: 1.5, borderColor: '#ffffff' }} />
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#f43f5e' }} />
              <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: '#4ade80' }} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View
              style={{
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 6,
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
              }}>
              <Text style={{ fontSize: 11, color: '#94a3b8' }}>Undo</Text>
            </View>
            <View
              style={{
                paddingVertical: 4,
                paddingHorizontal: 10,
                borderRadius: 6,
                backgroundColor: '#a855f7',
              }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#ffffff' }}>Done</Text>
            </View>
          </View>
        </View>
      )}

      {/* PDF Document Page Viewport */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, alignItems: 'center' }}>
        <View
          style={{
            width: '100%',
            maxWidth: 380,
            minHeight: 520,
            backgroundColor: '#ffffff',
            borderRadius: 8,
            padding: 20,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            position: 'relative',
          }}>
          {/* Document Content */}
          <Text
            style={{
              fontSize: 9,
              fontWeight: '800',
              letterSpacing: 1.2,
              color: '#64748b',
              marginBottom: 4,
            }}>
            ROBBINS BASIC PATHOLOGY · CHAPTER 2
          </Text>
          <Text
            style={{
              fontSize: 16,
              fontWeight: '800',
              color: '#0f172a',
              marginBottom: 10,
              borderBottomWidth: 1.5,
              borderBottomColor: '#0f172a',
              paddingBottom: 4,
            }}>
            Granulomatous Inflammation & Giant Cells
          </Text>

          <Text
            style={{
              fontSize: 11,
              lineHeight: 16,
              color: '#334155',
              marginBottom: 8,
            }}>
            <Text style={{ fontWeight: '700', color: '#0f172a' }}>Definition: </Text>
            A distinctive pattern of chronic inflammation characterized by aggregates of activated macrophages, often with scattered lymphocytes and central necrosis.
          </Text>

          {/* Callout box */}
          <View
            style={{
              marginVertical: 8,
              padding: 10,
              backgroundColor: '#f8fafc',
              borderLeftWidth: 3,
              borderLeftColor: '#3b82f6',
              borderRadius: 4,
            }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#1e3a8a', marginBottom: 2 }}>
              Microscopic Hallmark
            </Text>
            <Text style={{ fontSize: 10, lineHeight: 15, color: '#334155' }}>
              • <Text style={{ fontWeight: '700' }}>Epithelioid cells:</Text> Modified macrophages with slipper-shaped pale nuclei and abundant granular eosinophilic cytoplasm.{'\n'}
              • <Text style={{ fontWeight: '700' }}>Langhans giant cells:</Text> Fusion of epithelioid cells with nuclei arranged peripherally in a horseshoe / collar pattern.
            </Text>
          </View>

          {/* Highlighted text demonstration */}
          <View
            style={{
              backgroundColor: 'rgba(250, 204, 21, 0.35)',
              paddingHorizontal: 4,
              paddingVertical: 2,
              borderRadius: 3,
              alignSelf: 'flex-start',
              marginVertical: 4,
            }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#854d0e' }}>
              ⭐ Caseous necrosis = Core feature of Tuberculosis Granulomas
            </Text>
          </View>

          <Text
            style={{
              fontSize: 10,
              lineHeight: 15,
              color: '#475569',
              marginTop: 6,
            }}>
            Non-caseating granulomas are classically seen in Sarcoidosis, Crohn disease, and foreign-body reactions.
          </Text>

          {/* Stylus Annotation Drawing Overlay (Handwriting & circles) */}
          <View
            style={{
              position: 'absolute',
              top: 150,
              right: 20,
              padding: 6,
              borderWidth: 2,
              borderColor: '#38bdf8',
              borderRadius: 12,
              backgroundColor: 'rgba(56, 189, 248, 0.08)',
              transform: [{ rotate: '-3deg' }],
            }}>
            <Text style={{ fontSize: 10, fontWeight: '800', color: '#0284c7' }}>
              ✎ High-yield exam question!
            </Text>
            <Text style={{ fontSize: 9, color: '#0369a1' }}>
              Horseshoe nuclei = Langhans
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Paging Bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 12,
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          backgroundColor: '#090d16',
        }}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          }}>
          <ChevronLeft size={16} color="#94a3b8" />
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>Prev</Text>
        </View>

        <Text style={{ fontSize: 12, fontWeight: '700', color: '#f8fafc' }}>
          Page 1 of 4
        </Text>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 4,
            paddingVertical: 6,
            paddingHorizontal: 12,
            borderRadius: 8,
            backgroundColor: 'rgba(255, 255, 255, 0.12)',
          }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#f8fafc' }}>Next</Text>
          <ChevronRight size={16} color="#f8fafc" />
        </View>
      </View>
    </View>
  );
}

const demoStyles = StyleSheet.create({
  androidBar: {
    height: 32,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  androidTime: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E2E8F0',
    letterSpacing: 0.2,
  },
  androidIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  androidSignal: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  batteryBox: {
    width: 20,
    height: 10,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 1,
    justifyContent: 'center',
  },
  batteryFill: {
    width: 14,
    height: 6,
    borderRadius: 1,
    backgroundColor: '#10B981',
  },
  notesBox: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
    marginTop: 12,
  },
  notesHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notesTitle: {
    ...typeScale.caption,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  noteRow: {
    flexDirection: 'row',
    gap: 8,
  },
  bullet: {
    ...typeScale.caption,
    lineHeight: 19,
  },
  noteText: {
    ...typeScale.caption,
    lineHeight: 19,
    flex: 1,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  savePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  savePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  editorCard: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
  },
  badgeRow: {
    flexDirection: 'row',
  },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  titleInput: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontWeight: '700',
  },
  contentBox: {
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 12,
    minHeight: 100,
  },
  noteBodyText: {
    fontSize: 13,
    lineHeight: 20,
  },
  attachGrid: {
    gap: 8,
    marginTop: 2,
  },
  attachRow: {
    flexDirection: 'row',
    gap: 8,
  },
  attachBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  attachBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  layoutCallout: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  calloutText: {
    fontSize: 11,
    lineHeight: 17,
  },
  sheetHeader: {
    gap: 6,
  },
  permSection: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 10,
  },
  roleHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  roleTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  roleSub: {
    fontSize: 12,
    lineHeight: 17,
  },
  bookList: {
    gap: 8,
    marginTop: 4,
  },
  bookCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bookLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  bookName: {
    fontSize: 14,
    fontWeight: '700',
  },
  bookMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  deleteBadge: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  protectedBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  protectedText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
