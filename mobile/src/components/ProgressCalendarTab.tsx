import React, { useMemo, useState } from "react";
import { StyleSheet, TextInput, View } from "react-native";
import { Text } from "@/components/Text";
import { Touchable } from "@/components/Touchable";
import { useTheme, withAlpha } from "@/theme";
import { typeScale } from "@/theme/typography";
import { useCalendarEvents } from "@/hooks/useCalendarEvents";
import { ChevronLeft, ChevronRight, Plus, Star, Trash2 } from "lucide-react-native";

interface Props {
  // Nothing needed: the calendar is on-device only. See useCalendarEvents.
}

const DAYS_SHORT = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function formatDisplayDate(d: Date): string {
  const dayName = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d.getDay()];
  const monthName = MONTH_NAMES[d.getMonth()].slice(0, 3);
  return `${dayName}, ${monthName} ${d.getDate()}`;
}

function toKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function ProgressCalendarTab(_: Props) {
  const { colors } = useTheme();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMonth, setViewMonth] = useState<Date>(new Date());
  const [title, setTitle] = useState("");
  const [important, setImportant] = useState(false);

  const { events, addEvent, updateEvent, deleteEvent } = useCalendarEvents();

  const byDate = useMemo(() => {
    const map = new Map<string, { count: number; important: boolean }>();
    for (const e of events) {
      const cur = map.get(e.event_date) ?? { count: 0, important: false };
      cur.count += 1;
      if (e.important) cur.important = true;
      map.set(e.event_date, cur);
    }
    return map;
  }, [events]);

  const selectedKey = toKey(selectedDate);
  const dayEvents = useMemo(() => events.filter(e => e.event_date === selectedKey), [events, selectedKey]);

  // Calendar Grid generation
  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setViewMonth(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setViewMonth(new Date(year, month + 1, 1));
  };

  const handleAdd = () => {
    if (!title.trim()) return;
    addEvent(selectedDate, title.trim(), important);
    setTitle("");
    setImportant(false);
  };

  return (
    <View style={styles.container}>
      {/* Calendar Month Card */}
      <View style={[styles.calendarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        {/* Month Header */}
        <View style={styles.monthHeader}>
          <Text style={[styles.monthTitle, { color: colors.text }]}>
            {MONTH_NAMES[month]} {year}
          </Text>
          <View style={styles.monthNav}>
            <Touchable
              onPress={prevMonth}
              label="Previous month"
              scaleTo={0.9}
              hitSlop={10}
              style={[styles.navBtn, { borderColor: colors.border }]}>
              <ChevronLeft size={18} color={colors.text} />
            </Touchable>
            <Touchable
              onPress={nextMonth}
              label="Next month"
              scaleTo={0.9}
              hitSlop={10}
              style={[styles.navBtn, { borderColor: colors.border }]}>
              <ChevronRight size={18} color={colors.text} />
            </Touchable>
          </View>
        </View>

        {/* Days Header */}
        <View style={styles.daysRow}>
          {DAYS_SHORT.map(d => (
            <Text key={d} style={[styles.dayName, { color: colors.textMuted }]}>
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar Day Grid */}
        <View style={styles.grid}>
          {Array.from({ length: firstDay }).map((_, i) => (
            <View key={`empty-${i}`} style={styles.cell} />
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dayNum = i + 1;
            const cellDate = new Date(year, month, dayNum);
            const key = toKey(cellDate);
            const isSelected = key === selectedKey;
            const info = byDate.get(key);

            return (
              <Touchable
                key={key}
                onPress={() => setSelectedDate(cellDate)}
                label={`${MONTH_NAMES[month]} ${dayNum}`}
                scaleTo={0.9}
                style={[
                  styles.dayCell,
                  isSelected && { backgroundColor: colors.primary },
                  info?.important && !isSelected && { borderColor: withAlpha(colors.warning, 0.6), borderWidth: 1.5 },
                ]}>
                <Text
                  style={[
                    styles.dayNum,
                    { color: isSelected ? colors.primaryText : colors.text },
                  ]}>
                  {dayNum}
                </Text>
                {info && info.count > 0 ? (
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: isSelected ? colors.primaryText : (info.important ? colors.warning : colors.fuchsia) },
                    ]}
                  />
                ) : null}
              </Touchable>
            );
          })}
        </View>
      </View>

      {/* Selected Day Agenda */}
      <View style={[styles.agendaCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.agendaHeader}>
          <Text style={[styles.agendaTitle, { color: colors.text }]}>
            {formatDisplayDate(selectedDate)}
          </Text>
          <Text style={[styles.agendaCount, { color: colors.textMuted }]}>
            {dayEvents.length} event{dayEvents.length === 1 ? "" : "s"}
          </Text>
        </View>

        {/* Add Event Input */}
        <View style={styles.inputRow}>
          <TextInput
            placeholder="Add study event or exam target…"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            onSubmitEditing={handleAdd}
            style={[
              styles.input,
              {
                backgroundColor: colors.cardElevated,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
          />
          <Touchable
            onPress={() => setImportant(v => !v)}
            label="Mark event as important"
            state={{ checked: important }}
            scaleTo={0.9}
            style={[
              styles.iconBtn,
              {
                backgroundColor: important ? withAlpha(colors.warning, 0.2) : colors.cardElevated,
                borderColor: important ? colors.warning : colors.border,
              },
            ]}>
            <Star
              size={18}
              color={important ? colors.warning : colors.textMuted}
              fill={important ? colors.warning : "none"}
            />
          </Touchable>
          <Touchable
            onPress={handleAdd}
            label="Add event to date"
            disabled={!title.trim()}
            scaleTo={0.9}
            style={[
              styles.iconBtn,
              {
                backgroundColor: colors.primary,
                borderColor: colors.primary,
                opacity: title.trim() ? 1 : 0.4,
              },
            ]}>
            <Plus size={18} color={colors.primaryText} />
          </Touchable>
        </View>

        {/* Events List */}
        <View style={styles.eventsList}>
          {dayEvents.map(e => (
            <View
              key={e.id}
              style={[styles.eventRow, { backgroundColor: colors.cardElevated, borderColor: colors.border }]}>
              <Touchable
                onPress={() => updateEvent(e.id, { important: !e.important })}
                label={e.important ? "Mark as normal" : "Mark as important"}
                scaleTo={0.85}
                hitSlop={10}>
                <Star
                  size={16}
                  color={e.important ? colors.warning : colors.textMuted}
                  fill={e.important ? colors.warning : "none"}
                />
              </Touchable>
              <Text
                style={[
                  styles.eventTitle,
                  { color: colors.text },
                  e.important && { fontWeight: "700" },
                ]}>
                {e.title}
              </Text>
              <Touchable
                onPress={() => deleteEvent(e.id)}
                label="Delete event"
                scaleTo={0.85}
                hitSlop={10}>
                <Trash2 size={16} color={colors.textMuted} />
              </Touchable>
            </View>
          ))}
          {dayEvents.length === 0 ? (
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              No events scheduled for this day.
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
  },
  calendarCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
  },
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  monthTitle: {
    ...typeScale.title3,
  },
  monthNav: {
    flexDirection: "row",
    gap: 8,
  },
  navBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  dayName: {
    width: 40,
    textAlign: "center",
    ...typeScale.caption,
    fontWeight: "600",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  cell: {
    width: 40,
    height: 40,
    marginBottom: 4,
  },
  dayCell: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  dayNum: {
    ...typeScale.body,
    fontWeight: "500",
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    position: "absolute",
    bottom: 5,
  },
  agendaCard: {
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 16,
    gap: 12,
  },
  agendaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  agendaTitle: {
    ...typeScale.title3,
  },
  agendaCount: {
    ...typeScale.caption,
  },
  inputRow: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
  },
  input: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    ...typeScale.body,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },
  eventsList: {
    gap: 8,
    marginTop: 4,
  },
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  eventTitle: {
    flex: 1,
    ...typeScale.body,
  },
  emptyText: {
    textAlign: "center",
    ...typeScale.caption,
    paddingVertical: 12,
    fontStyle: "italic",
  },
});
