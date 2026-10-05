import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';

const KEY = 'orbit:study-buddy-v1';
export const BUDDY_ANIMALS = [
  {
    id: 'cat',
    label: 'Cat',
    recommended: 'classic',
    reason: 'Turkish Angora: a clear cream face and expressive eyes.',
  },
  {
    id: 'dog',
    label: 'Dog',
    recommended: 'classic',
    reason: 'Pembroke Corgi: warm orange ears and a welcoming face.',
  },
  {
    id: 'fox',
    label: 'Fox',
    recommended: 'classic',
    reason: 'Smooth Cheek Fox: a bright face that reads well at small sizes.',
  },
  {
    id: 'panda',
    label: 'Panda',
    recommended: 'classic',
    reason: 'Baby Panda: strong eye contrast and a friendly round face.',
  },
  {
    id: 'rabbit',
    label: 'Rabbit',
    recommended: 'classic',
    reason: 'Fluffy Cream Rabbit: a gentle face and distinctive ears.',
  },
  {
    id: 'otter',
    label: 'Otter',
    recommended: 'classic',
    reason: 'Gentle Otter: an attentive expression and warm brown fur.',
  },
  {
    id: 'penguin',
    label: 'Penguin',
    recommended: 'classic',
    reason: 'Baby Penguin: a clear light face against a dark outline.',
  },
  {
    id: 'bear',
    label: 'Bear',
    recommended: 'classic',
    reason: 'Large Ears Bear: rounded ears and a reassuring smile.',
  },
  {
    id: 'squirrel',
    label: 'Squirrel',
    recommended: 'classic',
    reason: 'Round Ear Squirrel: lively eyes and a compact silhouette.',
  },
] as const;
export type BuddyKind = 'orb' | (typeof BUDDY_ANIMALS)[number]['id'];
export const BUDDY_VARIANTS = ['classic', 'soft', 'bold'] as const;
export type BuddyVariant = (typeof BUDDY_VARIANTS)[number];
export function recommendedVariant(kind: BuddyKind): BuddyVariant {
  return (
    BUDDY_ANIMALS.find(animal => animal.id === kind)?.recommended ?? 'classic'
  );
}
export const BUDDY_COLORS = [
  '#C782FF',
  '#42BFA9',
  '#E5A45C',
  '#6C9FE8',
] as const;
export interface BuddyPreferences {
  enabled: boolean;
  kind: BuddyKind;
  variant: BuddyVariant;
  name: string;
  color: string;
  quiet: boolean;
  minutes: number;
  topic: string;
  day: string;
  completed: number[];
  remindPlan: boolean;
  remindMcq: boolean;
}
export const todayKey = (at = new Date()) =>
  `${at.getFullYear()}-${at.getMonth() + 1}-${at.getDate()}`;
const defaults: BuddyPreferences = {
  enabled: true,
  kind: 'orb',
  variant: 'classic',
  name: 'Orbit',
  color: BUDDY_COLORS[0],
  quiet: false,
  minutes: 30,
  topic: '',
  day: todayKey(),
  completed: [],
  remindPlan: false,
  remindMcq: false,
};
let current = defaults;
let hydration: Promise<void> | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach(fn => fn());
export function cleanBuddy(value: Partial<BuddyPreferences>): BuddyPreferences {
  const legacyKind = value.kind as string | undefined;
  const kind: BuddyKind =
    legacyKind === 'owl'
      ? 'otter'
      : legacyKind === 'crocodile'
      ? 'squirrel'
      : legacyKind === 'orb' ||
        BUDDY_ANIMALS.some(animal => animal.id === legacyKind)
      ? value.kind!
      : 'orb';
  return {
    ...defaults,
    enabled: typeof value.enabled === 'boolean' ? value.enabled : true,
    kind,
    variant: BUDDY_VARIANTS.includes(value.variant as BuddyVariant)
      ? value.variant!
      : recommendedVariant(kind),
    name:
      typeof value.name === 'string'
        ? value.name.trim().slice(0, 24) || 'Orbit'
        : 'Orbit',
    color: BUDDY_COLORS.includes(value.color as (typeof BUDDY_COLORS)[number])
      ? value.color!
      : defaults.color,
    quiet: value.quiet === true,
    minutes: [15, 30, 60].includes(value.minutes ?? 0) ? value.minutes! : 30,
    topic: typeof value.topic === 'string' ? value.topic.slice(0, 100) : '',
    day: todayKey(),
    completed:
      value.day === todayKey() && Array.isArray(value.completed)
        ? [
            ...new Set(
              value.completed.filter(
                x => Number.isInteger(x) && x >= 0 && x < 3,
              ),
            ),
          ]
        : [],
    remindPlan: value.remindPlan === true,
    remindMcq: value.remindMcq === true,
  };
}
export function hydrateBuddy(): Promise<void> {
  if (!hydration)
    hydration = AsyncStorage.getItem(KEY)
      .then(raw => {
        if (raw) current = cleanBuddy(JSON.parse(raw));
        emit();
      })
      .catch(() => {});
  return hydration;
}
export const getBuddy = () => current;
export function setBuddy(patch: Partial<BuddyPreferences>): void {
  current = cleanBuddy({ ...current, ...patch });
  emit();
  void AsyncStorage.setItem(KEY, JSON.stringify(current)).catch(() => {});
}
const subscribe = (fn: () => void) => {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
};
export function useBuddy(): BuddyPreferences {
  useEffect(() => {
    void hydrateBuddy();
  }, []);
  return useSyncExternalStore(subscribe, getBuddy, getBuddy);
}
export function studyPlan(
  minutes: number,
  topic: string,
): { title: string; minutes: number; prompt: string }[] {
  const subject =
    topic.trim().slice(0, 100) || 'a topic from my current MBBS syllabus';
  const read = Math.round(minutes * 0.5),
    recall = Math.round(minutes * 0.3);
  return [
    {
      title: 'Understand one topic',
      minutes: read,
      prompt: `Explain ${subject} clearly for an MBBS student, with the key concepts and one clinical example.`,
    },
    {
      title: 'Recall without looking',
      minutes: recall,
      prompt: `Double-tapped: ${subject}`,
    },
    {
      title: 'Review and teach it back',
      minutes: minutes - read - recall,
      prompt: `Give the key revision points for ${subject}, then ask me to explain the central idea in my own words.`,
    },
  ];
}
