import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarDays, Plus, Trash2 } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Kind = "theory" | "posting" | "lab";
type Mark = "present" | "absent" | "mixed" | "off";
type DayRecord = { held: number; attended: number; off?: boolean };
type Item = {
  id: string;
  kind: Kind;
  name: string;
  target: number;
  baselineHeld: number;
  baselineAttended: number;
  days: Record<string, DayRecord>;
  startDate?: string;
  endDate?: string;
  skipSundays?: boolean;
  skipSaturdays?: boolean;
};
type Stored = { version: 1; items: Item[] };
const KIND_LABELS: Record<Kind, string> = { theory: "Theory", posting: "Clinical postings", lab: "Practical labs" };
const EMPTY: Stored = { version: 1, items: [] };
const validNumber = (value: unknown, max = 100000) =>
  Math.min(max, Math.max(0, Math.floor(Number(value) || 0)));
const validDate = (value: string | undefined) =>
  !!value && /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(new Date(value + "T12:00:00").getTime());
const localDate = (day: Date) => format(day, "yyyy-MM-dd");

function read(key: string): Stored {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "null");
    if (!value || value.version !== 1 || !Array.isArray(value.items)) return EMPTY;
    const items: Item[] = value.items.flatMap((raw: unknown) => {
      if (!raw || typeof raw !== "object") return [];
      const input = raw as Record<string, unknown>;
      if (typeof input.id !== "string" || typeof input.name !== "string" || !input.name.trim()) return [];
      const kind = input.kind === "posting" || input.kind === "lab" ? input.kind : "theory";
      const held = validNumber(input.baselineHeld);
      const days: Record<string, DayRecord> = {};
      if (input.days && typeof input.days === "object" && !Array.isArray(input.days)) {
        for (const [day, record] of Object.entries(input.days as Record<string, unknown>)) {
          if (!validDate(day) || !record || typeof record !== "object") continue;
          const rawDay = record as Record<string, unknown>;
          const sessions = validNumber(rawDay.held, 24);
          days[day] = {
            held: sessions,
            attended: Math.min(sessions, validNumber(rawDay.attended, 24)),
            off: rawDay.off === true
          };
        }
      }
      return [{
        id: input.id,
        name: input.name.trim().slice(0, 90),
        kind,
        target: Math.max(1, Math.min(100, validNumber(input.target ?? 75, 100))),
        baselineHeld: held,
        baselineAttended: Math.min(held, validNumber(input.baselineAttended)),
        days,
        startDate: typeof input.startDate === "string" && validDate(input.startDate) ? input.startDate : undefined,
        endDate: typeof input.endDate === "string" && validDate(input.endDate) ? input.endDate : undefined,
        skipSundays: input.skipSundays === true,
        skipSaturdays: input.skipSaturdays === true
      }];
    });
    return { version: 1, items };
  } catch {
    return EMPTY;
  }
}
function totals(item: Item) {
  const days = Object.values(item.days);
  return {
    held: item.baselineHeld + days.reduce((n, d) => n + d.held, 0),
    attended: item.baselineAttended + days.reduce((n, d) => n + d.attended, 0)
  };
}
function safeBunks(attended: number, held: number, target: number) {
  return Math.max(0, Math.floor(attended / (target / 100) - held + 1e-10));
}
function recovery(attended: number, held: number, target: number) {
  const t = target / 100;
  if (attended >= t * held) return 0;
  if (t >= 1) return Number.POSITIVE_INFINITY;
  return Math.max(0, Math.ceil((t * held - attended) / (1 - t) - 1e-10));
}
function kindLabel(kind: Kind) { return KIND_LABELS[kind]; }
function todayKey() { return localDate(new Date()); }

/**
 * Private, browser-local attendance register.
 * The Android tracker intentionally uses device-local AsyncStorage, so do not
 * imply this is cloud-synced with phone attendance. The event calendar remains
 * separate and its existing cloud-backed events are unaffected.
 */
export default function WebAttendanceCalendar({ userId }: { userId: string | null }) {
  const key = "orbit:web-attendance:v1:" + (userId || "local");
  const [items, setItems] = useState<Item[]>(() => read(key).items);
  const [kind, setKind] = useState<Kind>("theory");
  const [selectedId, setSelectedId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());
  const [subject, setSubject] = useState("");
  const [target, setTarget] = useState(75);
  const [priorHeld, setPriorHeld] = useState(0);
  const [priorAttended, setPriorAttended] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [skipSundays, setSkipSundays] = useState(true);
  const [skipSaturdays, setSkipSaturdays] = useState(false);
  const [sessions, setSessions] = useState(1);
  const [presentSessions, setPresentSessions] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify({ version: 1, items }));
      setError("");
    } catch {
      setError("Browser storage is full or unavailable. Recent changes may not be saved.");
    }
  }, [key, items]);
  useEffect(() => {
    const reload = (e: StorageEvent) => {
      if (e.key === key) setItems(read(key).items);
    };
    window.addEventListener("storage", reload);
    return () => window.removeEventListener("storage", reload);
  }, [key]);

  const filtered = useMemo(() => items.filter(item => item.kind === kind), [items, kind]);
  const current = filtered.find(item => item.id === selectedId) || filtered[0] || null;
  const active = current ? totals(current) : { held: 0, attended: 0 };
  const aggregate = filtered.reduce((a, item) => {
    const t = totals(item);
    return { held: a.held + t.held, attended: a.attended + t.attended };
  }, { held: 0, attended: 0 });
  const selectedKey = localDate(selectedDate);
  const day = current?.days[selectedKey];
  const dayStatus = day?.off ? "off" : !day ? "unmarked" :
    day.attended === day.held && day.held > 0 ? "present" :
    day.attended === 0 ? "absent" : "mixed";
  const currentPercent = active.held ? 100 * active.attended / active.held : 0;
  const needs = current ? recovery(active.attended, active.held, current.target) : 0;

  const saveItem = () => {
    const name = subject.trim().slice(0, 90);
    if (!name) { setError("Enter a subject, clinical posting or practical lab name."); return; }
    if (priorAttended > priorHeld) { setError("Previously attended sessions cannot exceed sessions held."); return; }
    if (kind === "posting" && startDate && endDate && endDate < startDate) {
      setError("The posting end date must be after the start date."); return;
    }
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID() : "item-" + Date.now() + "-" + Math.random().toString(36).slice(2);
    const next: Item = {
      id, name, kind,
      target: Math.max(1, Math.min(100, validNumber(target, 100))),
      baselineHeld: validNumber(priorHeld),
      baselineAttended: validNumber(priorAttended),
      days: {},
      ...(kind === "posting" && validDate(startDate) ? { startDate } : {}),
      ...(kind === "posting" && validDate(endDate) ? { endDate } : {}),
      skipSundays: kind === "posting" && skipSundays,
      skipSaturdays: kind === "posting" && skipSaturdays,
    };
    setItems(old => [...old, next]);
    setSelectedId(id);
    setSubject(""); setPriorHeld(0); setPriorAttended(0); setError("");
  };
  const changeDay = (mark: Mark | "clear") => {
    if (!current) return;
    const count = Math.max(1, Math.min(24, validNumber(sessions, 24)));
    const attended = Math.min(count, validNumber(presentSessions, 24));
    const record: DayRecord | null =
      mark === "present" ? { held: count, attended: count } :
      mark === "absent" ? { held: count, attended: 0 } :
      mark === "mixed" ? { held: count, attended } :
      mark === "off" ? { held: 0, attended: 0, off: true } : null;
    if (mark === "mixed" && (count < 2 || attended === 0 || attended === count)) {
      setError("For a mixed day, enter at least two sessions and a partial number attended.");
      return;
    }
    setItems(old => old.map(item => {
      if (item.id !== current.id) return item;
      const days = { ...item.days };
      if (record) days[selectedKey] = record;
      else delete days[selectedKey];
      return { ...item, days };
    }));
    setError("");
  };
  const deleteItem = (item: Item) => {
    if (!window.confirm("Delete " + item.name + " and its attendance history from this browser?")) return;
    setItems(old => old.filter(x => x.id !== item.id));
    setSelectedId("");
  };
  const changeTarget = (item: Item, next: number) => {
    setItems(old => old.map(x => x.id === item.id
      ? { ...x, target: Math.max(1, Math.min(100, validNumber(next, 100))) } : x));
  };
  const isNonworking = (d: Date) => !!current && current.kind === "posting" &&
    ((current.skipSundays && d.getDay() === 0) || (current.skipSaturdays && d.getDay() === 6) ||
      (current.startDate && localDate(d) < current.startDate) ||
      (current.endDate && localDate(d) > current.endDate));

  return <div className="space-y-4" data-testid="web-attendance-calendar">
    <div className="rounded-2xl border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /><h3 className="font-semibold">Attendance dashboard</h3></div>
      <p className="text-xs text-muted-foreground">Date-wise history, safe bunk allowance, theory, clinical postings and practical labs.</p>
      <div className="grid grid-cols-3 gap-2 pt-1 text-center">
        <div className="rounded-xl bg-muted/50 p-2"><strong className="block text-lg">{aggregate.held ? Math.round(aggregate.attended / aggregate.held * 100) + "%" : "—"}</strong><span className="text-[10px] text-muted-foreground">Attendance</span></div>
        <div className="rounded-xl bg-muted/50 p-2"><strong className="block text-lg">{aggregate.attended}/{aggregate.held}</strong><span className="text-[10px] text-muted-foreground">Attended / held</span></div>
        <div className="rounded-xl bg-muted/50 p-2"><strong className="block text-lg">{filtered.filter(item => { const t = totals(item); return t.held > 0 && t.attended / t.held * 100 < item.target; }).length}</strong><span className="text-[10px] text-muted-foreground">Below target</span></div>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-1 rounded-xl bg-muted/50 p-1">
      {(["theory", "posting", "lab"] as const).map(option =>
        <button key={option} type="button" onClick={() => { setKind(option); setSelectedId(""); }}
          className={cn("rounded-lg px-1 py-2 text-xs sm:text-sm transition-colors", kind === option ? "bg-background font-semibold shadow-sm text-foreground" : "text-muted-foreground")}
          aria-pressed={kind === option}>{option === "posting" ? "Postings" : option === "lab" ? "Labs" : "Theory"}</button>)}
    </div>
    <div className="rounded-2xl border bg-card p-4 space-y-3">
      <h4 className="font-semibold">Add {kindLabel(kind).toLowerCase().replace("clinical ", "").replace("practical ", "")}</h4>
      <Input value={subject} onChange={e => setSubject(e.target.value)} maxLength={90} placeholder={kind === "posting" ? "e.g. Medicine posting" : kind === "lab" ? "e.g. Pathology practical" : "e.g. General Medicine"} aria-label="Attendance subject name" />
      <div className="grid grid-cols-3 gap-2">
        <label className="text-xs text-muted-foreground space-y-1">Target %<Input type="number" min={1} max={100} value={target} onChange={e => setTarget(Number(e.target.value))} /></label>
        <label className="text-xs text-muted-foreground space-y-1">Earlier held<Input type="number" min={0} value={priorHeld} onChange={e => setPriorHeld(validNumber(e.target.value))} /></label>
        <label className="text-xs text-muted-foreground space-y-1">Earlier attended<Input type="number" min={0} max={priorHeld} value={priorAttended} onChange={e => setPriorAttended(validNumber(e.target.value))} /></label>
      </div>
      {kind === "posting" && <div className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground space-y-1">Posting starts<Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label>
          <label className="text-xs text-muted-foreground space-y-1">Posting ends<Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label>
        </div>
        <div className="flex flex-wrap gap-4 text-xs">
          <label className="flex items-center gap-2"><input type="checkbox" checked={skipSundays} onChange={e => setSkipSundays(e.target.checked)} /> Sundays off</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={skipSaturdays} onChange={e => setSkipSaturdays(e.target.checked)} /> Saturdays off</label>
        </div>
      </div>}
      <Button type="button" onClick={saveItem} className="w-full"><Plus className="mr-2 h-4 w-4" />Add to register</Button>
    </div>
    {filtered.length > 0 && <div className="rounded-2xl border bg-card p-3 space-y-3">
      <h4 className="px-1 font-semibold">Your {kindLabel(kind).toLowerCase()}</h4>
      <div className="space-y-2">{filtered.map(item => {
        const t = totals(item);
        return <div key={item.id} className={cn("rounded-xl border px-3 py-2", current?.id === item.id ? "border-primary/70 bg-primary/5" : "")}>
          <div className="flex items-center gap-2">
            <button className="flex-1 text-left min-w-0" onClick={() => setSelectedId(item.id)} aria-pressed={current?.id === item.id}>
              <strong className="block truncate text-sm">{item.name}</strong>
              <span className="text-xs text-muted-foreground">{t.attended}/{t.held} · {t.held ? Math.round(100 * t.attended / t.held) + "%" : "Not marked"}</span>
            </button>
            <label className="text-[10px] text-muted-foreground text-right">Target
              <Input type="number" min={1} max={100} className="h-8 w-16" value={item.target} onChange={e => changeTarget(item, Number(e.target.value))} aria-label={"Target percent for " + item.name} />
            </label>
            <button type="button" onClick={() => deleteItem(item)} className="rounded-lg p-2 text-destructive" aria-label={"Delete " + item.name}><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>;
      })}</div>
    </div>}
    {current && <div className="rounded-2xl border bg-card p-4 space-y-4">
      <div>
        <h4 className="font-semibold">{current.name} · history calendar</h4>
        <p className="text-xs text-muted-foreground">Select a date to add or edit its sessions. Existing records stay intact.</p>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl bg-muted/50 p-2"><strong className="block">{active.held ? currentPercent.toFixed(1) + "%" : "—"}</strong><span className="text-[10px] text-muted-foreground">Current</span></div>
        <div className="rounded-xl bg-muted/50 p-2"><strong className="block">{safeBunks(active.attended, active.held, current.target)}</strong><span className="text-[10px] text-muted-foreground">Safe bunks now</span></div>
        <div className="rounded-xl bg-muted/50 p-2"><strong className="block">{needs === Infinity ? "Not possible" : needs}</strong><span className="text-[10px] text-muted-foreground">Attend to recover</span></div>
      </div>
      <div className="rounded-xl border p-2 flex justify-center">
        <Calendar mode="single" selected={selectedDate} onSelect={d => { if (d) setSelectedDate(d); }}
          className="pointer-events-auto" modifiers={{
            present: d => current.days[localDate(d)]?.held > 0 && current.days[localDate(d)].attended === current.days[localDate(d)].held,
            absent: d => current.days[localDate(d)]?.held > 0 && current.days[localDate(d)].attended === 0,
            mixed: d => current.days[localDate(d)]?.held > 0 && current.days[localDate(d)].attended > 0 && current.days[localDate(d)].attended < current.days[localDate(d)].held,
            off: d => !!current.days[localDate(d)]?.off,
            nonworking: d => isNonworking(d)
          }} modifiersClassNames={{
            present: "border-b-2 border-green-500",
            absent: "border-b-2 border-rose-500",
            mixed: "border-b-2 border-amber-500",
            off: "text-muted-foreground opacity-50",
            nonworking: "text-muted-foreground/50"
          }} />
      </div>
      <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span className="border-b-2 border-green-500">Present</span><span className="border-b-2 border-rose-500">Absent</span><span className="border-b-2 border-amber-500">Mixed</span><span>Off / nonworking</span>
      </div>
      <div className="space-y-3 border-t pt-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <strong className="text-sm">{format(selectedDate, "EEE, MMM d, yyyy")}</strong>
          <span className="text-xs text-muted-foreground">Status: {dayStatus}</span>
        </div>
        {isNonworking(selectedDate) && <p className="text-xs text-amber-600">This day is outside the selected posting schedule. You can still override it if your college held a session.</p>}
        {day && <p className="text-xs text-muted-foreground">{day.off ? "Marked off day" : day.attended + " of " + day.held + " sessions attended"}</p>}
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-muted-foreground space-y-1">Sessions held<input type="number" min={1} max={24} value={sessions} onChange={e => setSessions(Math.max(1, Math.min(24, validNumber(e.target.value, 24))))} className="w-full h-10 rounded-md border bg-background px-3 text-foreground" /></label>
          <label className="text-xs text-muted-foreground space-y-1">Sessions attended<input type="number" min={0} max={sessions} value={presentSessions} onChange={e => setPresentSessions(Math.min(sessions, validNumber(e.target.value, 24)))} className="w-full h-10 rounded-md border bg-background px-3 text-foreground" /></label>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" onClick={() => changeDay("present")}>Present</Button>
          <Button variant="outline" onClick={() => changeDay("absent")}>Absent</Button>
          <Button variant="outline" onClick={() => changeDay("mixed")}>Mixed</Button>
          <Button variant="secondary" onClick={() => changeDay("off")}>Off day</Button>
          <Button variant="ghost" onClick={() => changeDay("clear")}>Clear</Button>
          <Button variant="ghost" onClick={() => setSelectedDate(new Date())}>Today</Button>
        </div>
      </div>
      <div className="border-t pt-3">
        <h5 className="font-semibold text-sm mb-2">Recorded history</h5>
        {Object.entries(current.days).length ? <ul className="max-h-48 overflow-auto space-y-1 text-xs">
          {Object.entries(current.days).sort(([a], [b]) => b.localeCompare(a)).map(([date, rec]) =>
            <li key={date} className="flex justify-between gap-2 rounded-lg bg-muted/40 p-2">
              <button className="underline-offset-2 hover:underline text-left" onClick={() => setSelectedDate(new Date(date + "T12:00:00"))}>{date}</button>
              <span>{rec.off ? "Off day" : rec.attended + " / " + rec.held}</span>
            </li>)}
        </ul> : <p className="text-xs text-muted-foreground">No dates recorded yet. Earlier totals entered above are retained separately.</p>}
      </div>
    </div>}
    {filtered.length === 0 && <p className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">Add your first {kindLabel(kind).toLowerCase()} to open the attendance calendar.</p>}
    <p className="text-xs text-muted-foreground">Privacy: attendance is saved only in this browser. The Android tracker also stores data locally, so entries are not automatically synced between devices. Your existing study-events calendar remains unchanged.</p>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </div>;
}
