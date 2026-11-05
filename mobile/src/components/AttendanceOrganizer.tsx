import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Image, StyleSheet, TextInput, View } from 'react-native';
import {
  CalendarClock,
  Check,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react-native';
import { Text } from '@/components/Text';
import { Touchable } from '@/components/Touchable';
import { Sheet } from '@/components/Sheet';
import { DatePicker } from '@/components/DatePicker';
import { useTheme, withAlpha } from '@/theme';
import { typeScale } from '@/theme/typography';
import { radius, space, TOUCH_MIN } from '@/theme/tokens';
import {
  formatLocalIsoDate,
  parseLocalIsoDate,
  getAttendance,
  attendanceVersion,
  subscribeAttendance,
} from '@/lib/attendance';
import { pickCardImage } from '@/lib/cardImage';
import {
  changeOrganizer,
  classError,
  getOrganizer,
  hydrateOrganizer,
  organizerId,
  organizerVersion,
  projectProgress,
  subscribeOrganizer,
  validDue,
  type OrganizerData,
  type OrganizerTab,
} from '@/lib/attendanceOrganizer';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const TABS: { key: OrganizerTab; title: string }[] = [
  { key: 'week', title: 'Week' },
  { key: 'tasks', title: 'Tasks' },
  { key: 'projects', title: 'Projects' },
  { key: 'notes', title: 'Notes' },
  { key: 'break', title: 'Break' },
];
type Collection = 'classes' | 'tasks' | 'projects' | 'notes';
type Form = {
  collection: Collection;
  id: string;
  title: string;
  due: string;
  body: string;
  weekday: number;
  start: string;
  end: string;
  room: string;
  subjectId: string;
  projectId: string;
  done: boolean;
};
const newForm = (collection: Collection): Form => ({
  collection,
  id: organizerId(),
  title: '',
  due: '',
  body: '',
  weekday: new Date().getDay(),
  start: '09:00',
  end: '10:00',
  room: '',
  subjectId: '',
  projectId: '',
  done: false,
});

/** Embedded in the existing tracker; every control is shared with the Android app. */
export function AttendanceOrganizer() {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<OrganizerTab>('week');
  const [day, setDay] = useState(new Date().getDay());
  const [form, setForm] = useState<Form | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [removing, setRemoving] = useState<{
    collection: Collection;
    id: string;
    title: string;
  } | null>(null);
  useSyncExternalStore(subscribeOrganizer, organizerVersion, organizerVersion);
  useSyncExternalStore(
    subscribeAttendance,
    attendanceVersion,
    attendanceVersion,
  );
  const data = getOrganizer();
  const subjects = getAttendance().items;
  const today = formatLocalIsoDate(new Date());
  useEffect(() => {
    if (open)
      void hydrateOrganizer().catch(() =>
        setError(
          'Could not read your organizer. Close and reopen to retry; existing data has been kept.',
        ),
      );
  }, [open]);

  async function save(
    change: (previous: OrganizerData) => OrganizerData,
    after?: () => void,
  ) {
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await changeOrganizer(change);
      after?.();
    } catch {
      setError('Could not save. Your previous data is safe. Please try again.');
    } finally {
      setBusy(false);
    }
  }
  function edit(collection: Collection, id?: string) {
    const row = id
      ? data[collection].find(entry => entry.id === id)
      : undefined;
    setForm({ ...newForm(collection), ...row });
    setRemoving(null);
    setError('');
  }
  async function submit() {
    if (!form) return;
    if (!form.title.trim()) {
      setError('Enter a title.');
      return;
    }
    if (!validDue(form.due)) {
      setError('Choose a valid due date.');
      return;
    }
    const collection = form.collection;
    const row =
      collection === 'classes'
        ? {
            id: form.id,
            title: form.title.trim(),
            weekday: form.weekday,
            start: form.start,
            end: form.end,
            room: form.room.trim(),
            subjectId: form.subjectId || undefined,
          }
        : collection === 'tasks'
        ? {
            id: form.id,
            title: form.title.trim(),
            due: form.due,
            projectId: form.projectId || undefined,
            done: form.done,
          }
        : collection === 'projects'
        ? { id: form.id, title: form.title.trim(), due: form.due }
        : { id: form.id, title: form.title.trim(), body: form.body.trim() };
    if (collection === 'classes') {
      const message = classError(
        {
          title: form.title,
          weekday: form.weekday,
          start: form.start,
          end: form.end,
          room: form.room,
        },
        data.classes,
        form.id,
      );
      if (message) {
        setError(message);
        return;
      }
    }
    await save(
      previous =>
        ({
          ...previous,
          [collection]: [
            ...previous[collection].filter(entry => entry.id !== form.id),
            row,
          ],
        } as OrganizerData),
      () => setForm(null),
    );
  }
  const button = (
    label: string,
    action: () => void,
    primary = false,
    key?: string,
  ) => (
    <Touchable
      key={key ?? label}
      label={label}
      disabled={busy}
      onPress={action}
      style={[
        s.button,
        {
          backgroundColor: primary ? colors.accent : colors.cardElevated,
          borderColor: colors.border,
          opacity: busy ? 0.5 : 1,
        },
      ]}
    >
      <Text
        style={[s.label, { color: primary ? colors.onAccent : colors.text }]}
      >
        {label}
      </Text>
    </Touchable>
  );
  const field = (
    label: string,
    key: 'title' | 'start' | 'end' | 'room' | 'body',
    multiline = false,
  ) => (
    <View style={s.stack}>
      <Text style={[s.caption, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={form?.[key] ?? ''}
        onChangeText={value =>
          setForm(current => (current ? { ...current, [key]: value } : null))
        }
        multiline={multiline}
        autoCapitalize={key === 'start' || key === 'end' ? 'none' : 'sentences'}
        placeholderTextColor={colors.textMuted}
        style={[
          s.input,
          {
            color: colors.text,
            borderColor: colors.border,
            minHeight: multiline ? 120 : TOUCH_MIN,
          },
        ]}
      />
    </View>
  );
  const actions = (
    collection: Collection,
    row: { id: string; title: string },
  ) => (
    <View style={s.row}>
      <Touchable
        label={`Edit ${row.title}`}
        onPress={() => edit(collection, row.id)}
        style={s.icon}
      >
        <Pencil size={18} color={colors.accent} />
      </Touchable>
      <Touchable
        label={`Delete ${row.title}`}
        onPress={() => setRemoving({ collection, ...row })}
        style={s.icon}
      >
        <Trash2 size={18} color={colors.danger} />
      </Touchable>
    </View>
  );
  return (
    <>
      <Touchable
        label="Open timetable and organizer"
        onPress={() => setOpen(true)}
        style={[
          s.launch,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <CalendarClock size={22} color={colors.accent} />
        <View style={s.grow}>
          <Text style={[s.heading, { color: colors.text }]}>
            Your college week
          </Text>
          <Text style={[s.caption, { color: colors.textMuted }]}>
            Timetable · tasks · projects · quick notes
          </Text>
        </View>
        <Plus size={18} color={colors.accent} />
      </Touchable>
      <Sheet
        visible={open}
        onClose={() => {
          setOpen(false);
          setForm(null);
          setError('');
        }}
        title="College organizer"
      >
        <View style={s.stack}>
          <Text style={[s.caption, { color: colors.textMuted }]}>
            Saved on this device. Attendance stays in your existing subject
            cards.
          </Text>
          {!form && (
            <View style={s.row}>
              {TABS.map(item => (
                <Touchable
                  key={item.key}
                  label={`Organizer ${item.title}`}
                  role="tab"
                  state={{ selected: tab === item.key }}
                  onPress={() => {
                    setTab(item.key);
                    setRemoving(null);
                    setError('');
                  }}
                  style={[
                    s.tab,
                    {
                      backgroundColor:
                        tab === item.key
                          ? withAlpha(colors.accent, 0.16)
                          : colors.cardElevated,
                    },
                  ]}
                >
                  <Text
                    style={[
                      s.caption,
                      {
                        color:
                          tab === item.key ? colors.accent : colors.textMuted,
                      },
                    ]}
                  >
                    {item.title}
                  </Text>
                </Touchable>
              ))}
            </View>
          )}
          {!!error && (
            <Text
              accessibilityRole="alert"
              style={[s.body, { color: colors.danger }]}
            >
              {error}
            </Text>
          )}
          {!data.loaded && !error && (
            <Text style={{ color: colors.textMuted }}>Loading organizer…</Text>
          )}
          {removing && (
            <View style={[s.card, { borderColor: colors.danger }]}>
              <Text style={[s.body, { color: colors.text }]}>
                Delete “{removing.title}”?
                {removing.collection === 'projects'
                  ? ' Its tasks will remain without a project.'
                  : ''}
              </Text>
              <View style={s.row}>
                {button('Keep item', () => setRemoving(null))}
                {button('Confirm delete', () => {
                  void save(
                    previous => ({
                      ...previous,
                      [removing.collection]: previous[
                        removing.collection
                      ].filter(row => row.id !== removing.id),
                      ...(removing.collection === 'projects'
                        ? {
                            tasks: previous.tasks.map(task =>
                              task.projectId === removing.id
                                ? { ...task, projectId: undefined }
                                : task,
                            ),
                          }
                        : {}),
                    }),
                    () => setRemoving(null),
                  );
                })}
              </View>
            </View>
          )}
          {form ? (
            <View style={s.stack}>
              {field('Title', 'title')}
              {form.collection === 'classes' ? (
                <>
                  <View style={s.row}>
                    {DAYS.map((name, i) => (
                      <Touchable
                        key={name}
                        label={`Class on ${name}`}
                        state={{ selected: form.weekday === i }}
                        onPress={() => setForm({ ...form, weekday: i })}
                        style={[
                          s.day,
                          {
                            backgroundColor:
                              form.weekday === i
                                ? colors.accent
                                : colors.cardElevated,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            s.caption,
                            {
                              color:
                                form.weekday === i
                                  ? colors.onAccent
                                  : colors.text,
                            },
                          ]}
                        >
                          {name}
                        </Text>
                      </Touchable>
                    ))}
                  </View>
                  <Text style={[s.caption, { color: colors.textMuted }]}>
                    24-hour times, for example 09:00. Classes repeat every week.
                  </Text>
                  {field('Start time', 'start')}
                  {field('End time', 'end')}
                  {field('Room or location', 'room')}
                  <Text style={[s.caption, { color: colors.textMuted }]}>
                    Link an attendance subject (optional)
                  </Text>
                  <View style={s.wrap}>
                    {button(
                      form.subjectId
                        ? 'Clear subject link'
                        : 'No subject linked',
                      () => setForm({ ...form, subjectId: '' }),
                    )}
                    {subjects.map(subject =>
                      button(
                        `${form.subjectId === subject.id ? '✓ ' : ''}${
                          subject.name
                        }`,
                        () => setForm({ ...form, subjectId: subject.id }),
                        false, subject.id,
                      ),
                    )}
                  </View>
                </>
              ) : form.collection === 'notes' ? (
                field('Quick note', 'body', true)
              ) : (
                <>
                  {button(
                    form.due ? `Due ${form.due}` : 'Choose due date',
                    () => setDateOpen(true),
                  )}
                  {!!form.due &&
                    button('Clear due date', () =>
                      setForm({ ...form, due: '' }),
                    )}
                  {form.collection === 'tasks' && (
                    <>
                      <Text style={[s.caption, { color: colors.textMuted }]}>
                        Project (optional)
                      </Text>
                      <View style={s.wrap}>
                        {button('No project', () =>
                          setForm({ ...form, projectId: '' }),
                        )}
                        {data.projects.map(project =>
                          button(
                            `${form.projectId === project.id ? '✓ ' : ''}${
                              project.title
                            }`,
                            () => setForm({ ...form, projectId: project.id }),
                            false, project.id,
                          ),
                        )}
                      </View>
                    </>
                  )}
                </>
              )}
              <View style={s.row}>
                {button('Cancel edit', () => {
                  setForm(null);
                  setError('');
                })}
                {button(
                  busy ? 'Saving…' : 'Save item',
                  () => {
                    void submit();
                  },
                  true,
                )}
              </View>
            </View>
          ) : (
            data.loaded && (
              <>
                {tab === 'week' && (
                  <>
                    <View style={s.row}>
                      {DAYS.map((name, i) => (
                        <Touchable
                          key={name}
                          label={`Show ${name} timetable`}
                          state={{ selected: day === i }}
                          onPress={() => setDay(i)}
                          style={[
                            s.day,
                            {
                              backgroundColor:
                                day === i ? colors.accent : colors.cardElevated,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              s.caption,
                              {
                                color:
                                  day === i ? colors.onAccent : colors.text,
                              },
                            ]}
                          >
                            {name}
                          </Text>
                        </Touchable>
                      ))}
                    </View>
                    <Text style={[s.heading, { color: colors.text }]}>
                      {DAYS[day]} · weekly classes
                    </Text>
                    {data.classes
                      .filter(row => row.weekday === day)
                      .sort((a, b) => a.start.localeCompare(b.start))
                      .map(row => (
                        <View
                          key={row.id}
                          style={[s.card, { borderColor: colors.border }]}
                        >
                          <Text style={[s.caption, { color: colors.accent }]}>
                            {row.start}–{row.end}
                            {row.room ? ` · ${row.room}` : ''}
                          </Text>
                          <Text style={[s.heading, { color: colors.text }]}>
                            {row.title}
                          </Text>
                          {!!row.subjectId && (
                            <Text
                              style={[s.caption, { color: colors.textMuted }]}
                            >
                              Attendance:{' '}
                              {subjects.find(item => item.id === row.subjectId)
                                ?.name ?? 'Subject removed — edit to relink'}
                            </Text>
                          )}
                          {actions('classes', row)}
                        </View>
                      ))}
                    {!data.classes.some(row => row.weekday === day) && (
                      <Text style={[s.body, { color: colors.textMuted }]}>
                        No classes scheduled for {DAYS[day]}.
                      </Text>
                    )}
                    {button(
                      'Add weekly class',
                      () => {
                        edit('classes');
                        setForm(current =>
                          current ? { ...current, weekday: day } : null,
                        );
                      },
                      true,
                    )}
                    {button(
                      data.timetableImage
                        ? 'Replace timetable image'
                        : 'Attach timetable image',
                      () => {
                        if (busy) return;
                        setBusy(true);
                        void pickCardImage()
                          .then(result => {
                            setBusy(false);
                            if (result && 'uri' in result) {
                              void save(previous => ({
                                ...previous,
                                timetableImage: result.uri,
                              }));
                            } else if (result)
                              setError('Choose a smaller timetable image.');
                          })
                          .catch(() => {
                            setBusy(false);
                            setError('Could not open the image picker.');
                          });
                      },
                    )}
                    {!!data.timetableImage && (
                      <>
                        <Touchable
                          label="View timetable image"
                          onPress={() => setImageOpen(true)}
                        >
                          <Image
                            source={{ uri: data.timetableImage }}
                            resizeMode="contain"
                            style={s.thumbnail}
                          />
                        </Touchable>
                        {button('Remove timetable image', () => {
                          void save(previous => ({
                            ...previous,
                            timetableImage: undefined,
                          }));
                        })}
                      </>
                    )}
                    <Text style={[s.caption, { color: colors.textMuted }]}>
                      An attached image is a reference; enter class times
                      manually. Daily attendance warnings are available in
                      Settings. This timetable does not send class-time alarms.
                    </Text>
                  </>
                )}
                {tab === 'tasks' && (
                  <>
                    <Text style={[s.heading, { color: colors.text }]}>
                      {data.tasks.filter(task => !task.done).length} tasks
                      remaining
                    </Text>
                    {data.tasks
                      .slice()
                      .sort(
                        (a, b) =>
                          Number(a.done) - Number(b.done) ||
                          (a.due || '9999').localeCompare(b.due || '9999'),
                      )
                      .map(task => (
                        <View
                          key={task.id}
                          style={[s.card, { borderColor: colors.border }]}
                        >
                          <Touchable
                            label={`${task.done ? 'Reopen' : 'Complete'} task ${
                              task.title
                            }`}
                            role="checkbox"
                            state={{ checked: task.done }}
                            disabled={busy}
                            onPress={() => {
                              void save(previous => ({
                                ...previous,
                                tasks: previous.tasks.map(row =>
                                  row.id === task.id
                                    ? { ...row, done: !row.done }
                                    : row,
                                ),
                              }));
                            }}
                            style={s.row}
                          >
                            <Check
                              size={20}
                              color={
                                task.done ? colors.success : colors.textMuted
                              }
                            />
                            <Text
                              style={[
                                s.heading,
                                s.grow,
                                {
                                  color: colors.text,
                                  textDecorationLine: task.done
                                    ? 'line-through'
                                    : 'none',
                                },
                              ]}
                            >
                              {task.title}
                            </Text>
                          </Touchable>
                          <Text
                            style={[
                              s.caption,
                              {
                                color:
                                  !task.done && task.due && task.due < today
                                    ? colors.danger
                                    : colors.textMuted,
                              },
                            ]}
                          >
                            {task.due
                              ? `${
                                  !task.done && task.due < today
                                    ? 'Overdue · '
                                    : 'Due '
                                }${task.due}`
                              : 'No deadline'}
                            {task.projectId
                              ? ` · ${
                                  data.projects.find(
                                    project => project.id === task.projectId,
                                  )?.title ?? ''
                                }`
                              : ''}
                          </Text>
                          {actions('tasks', task)}
                        </View>
                      ))}
                    {button('Add task', () => edit('tasks'), true)}
                  </>
                )}
                {tab === 'projects' && (
                  <>
                    {data.projects.map(project => {
                      const progress = projectProgress(project.id, data.tasks);
                      return (
                        <View
                          key={project.id}
                          style={[s.card, { borderColor: colors.border }]}
                        >
                          <Text style={[s.heading, { color: colors.text }]}>
                            {project.title}
                          </Text>
                          <Text style={[s.body, { color: colors.textMuted }]}>
                            {progress.done}/{progress.total} linked tasks
                            completed
                            {project.due ? ` · Due ${project.due}` : ''}
                          </Text>
                          <Text
                            style={[s.caption, { color: colors.textMuted }]}
                          >
                            {progress.total
                              ? `${Math.round(
                                  (progress.done / progress.total) * 100,
                                )}% complete`
                              : 'Add tasks and link them to this project.'}
                          </Text>
                          {actions('projects', project)}
                        </View>
                      );
                    })}
                    {!data.projects.length && (
                      <Text style={[s.body, { color: colors.textMuted }]}>
                        Keep assignments, exams and college projects together.
                      </Text>
                    )}
                    {button('Add project', () => edit('projects'), true)}
                  </>
                )}
                {tab === 'notes' && (
                  <>
                    {data.notes.map(note => (
                      <View
                        key={note.id}
                        style={[s.card, { borderColor: colors.border }]}
                      >
                        <Text style={[s.heading, { color: colors.text }]}>
                          {note.title}
                        </Text>
                        <Text style={[s.body, { color: colors.textMuted }]}>
                          {note.body}
                        </Text>
                        {actions('notes', note)}
                      </View>
                    ))}
                    {!data.notes.length && (
                      <Text style={[s.body, { color: colors.textMuted }]}>
                        Pin a short reminder or something to remember after
                        class.
                      </Text>
                    )}
                    {button('Add quick note', () => edit('notes'), true)}
                  </>
                )}
                {tab === 'break' && <RecallBreak />}
              </>
            )
          )}
        </View>
      </Sheet>
      <Sheet
        visible={dateOpen && !!form}
        onClose={() => setDateOpen(false)}
        title="Due date"
      >
        <DatePicker
          value={
            form?.due ? parseLocalIsoDate(form.due)?.getTime() ?? null : null
          }
          onChange={stamp => {
            setForm(current =>
              current
                ? { ...current, due: formatLocalIsoDate(new Date(stamp)) }
                : null,
            );
            setDateOpen(false);
          }}
        />
      </Sheet>
      <Sheet
        visible={imageOpen}
        onClose={() => setImageOpen(false)}
        title="Your timetable"
      >
        <Image
          source={{ uri: data.timetableImage }}
          resizeMode="contain"
          style={s.fullImage}
        />
      </Sheet>
    </>
  );
}

/** An original, asset-free short break. No copied mini-game implementation. */
function RecallBreak() {
  const { colors } = useTheme();
  function shuffle() {
    const cards = ['Na', 'K', 'Ca', 'Mg', 'Cl', 'Fe'].flatMap(value => [
      value,
      value,
    ]);
    for (let i = cards.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    return cards;
  }
  const [cards, setCards] = useState(shuffle);
  const [turned, setTurned] = useState<number[]>([]);
  const [matched, setMatched] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const mismatch = turned.length === 2 && cards[turned[0]] !== cards[turned[1]];
  return (
    <View style={s.stack}>
      <Text style={[s.heading, { color: colors.text }]}>Ion recall</Text>
      <Text style={[s.body, { color: colors.textMuted }]}>
        Find six matching pairs. {moves} turns · {matched.length / 2}/6 pairs
      </Text>
      <View style={s.wrap}>
        {cards.map((value, i) => (
          <Touchable
            key={i}
            label={`Recall card ${i + 1}${
              matched.includes(i)
                ? ` matched ${value}`
                : turned.includes(i)
                ? ` ${value}`
                : ''
            }`}
            disabled={mismatch || matched.includes(i) || turned.includes(i)}
            onPress={() => {
              const next = turned.length === 0 ? [i] : [turned[0], i];
              setTurned(next);
              if (next.length === 2) {
                setMoves(current => current + 1);
                if (cards[next[0]] === cards[next[1]]) {
                  setMatched(current => [...current, ...next]);
                  setTurned([]);
                }
              }
            }}
            style={[
              s.gameCard,
              {
                borderColor: colors.border,
                backgroundColor: matched.includes(i)
                  ? withAlpha(colors.success, 0.18)
                  : colors.cardElevated,
              },
            ]}
          >
            <Text style={[s.heading, { color: colors.text }]}>
              {matched.includes(i) || turned.includes(i) ? value : '?'}
            </Text>
          </Touchable>
        ))}
      </View>
      {mismatch && (
        <Touchable
          label="Turn unmatched cards over"
          onPress={() => setTurned([])}
          style={[s.button, { borderColor: colors.border }]}
        >
          <Text style={{ color: colors.accent }}>Try another pair</Text>
        </Touchable>
      )}
      {matched.length === 12 && (
        <Text style={{ color: colors.success }}>
          All pairs found. Ready to get back to studying?
        </Text>
      )}
      <Touchable
        label="Restart recall break"
        onPress={() => {
          setCards(shuffle());
          setMatched([]);
          setTurned([]);
          setMoves(0);
        }}
        style={[s.button, { borderColor: colors.border }]}
      >
        <Text style={{ color: colors.accent }}>New round</Text>
      </Touchable>
    </View>
  );
}

const s = StyleSheet.create({
  launch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    padding: space.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  stack: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  grow: { flex: 1 },
  heading: { ...typeScale.bodyStrong },
  caption: { ...typeScale.caption },
  body: { ...typeScale.callout },
  label: { ...typeScale.bodyStrong },
  card: {
    padding: space.md,
    gap: space.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
  },
  button: {
    minHeight: TOUCH_MIN,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tab: {
    flex: 1,
    minHeight: TOUCH_MIN,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  day: {
    flex: 1,
    minHeight: TOUCH_MIN,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
  },
  icon: {
    minWidth: TOUCH_MIN,
    minHeight: TOUCH_MIN,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    ...typeScale.callout,
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    textAlignVertical: 'top',
  },
  thumbnail: { width: '100%', height: 180 },
  fullImage: { width: '100%', height: 450 },
  gameCard: {
    width: '22%',
    minHeight: 64,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
  },
});
