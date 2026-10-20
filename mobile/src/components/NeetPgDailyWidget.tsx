import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Text } from './Text';
import { Touchable } from './Touchable';
import { PgEntranceBankModal } from './PgEntranceBankModal';
import { loadBundledNeetBank } from '@/lib/neetPgBundledBank';
import { installedNeetBank } from '@/lib/neetPgInstalledBank';
import { dailyQuestionOffset, studyDay } from '@/lib/neetPgPlan';
import { useTheme } from '@/theme';
import { typeScale } from '@/theme/typography';
import type { OfflineMcq } from '@shared/neetPgOffline';
export function NeetPgDailyWidget({ day = studyDay() }: { day?: string }) {
  const { colors } = useTheme();
  const [question, setQuestion] = useState<OfflineMcq | null>(null);
  const [error, setError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    let active = true;
    setError(false);
    setQuestion(null);
    void installedNeetBank
      .load()
      .catch(() => null)
      .then(async bank => bank ?? (await loadBundledNeetBank()))
      .then(bank => {
        if (active)
          setQuestion(
            bank.reader.search({
              offset: dailyQuestionOffset(day, bank.reader.total),
              limit: 1,
            }).records[0] ?? null,
          );
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [day, retry]);
  return (
    <View style={{ gap: 12 }}>
      <Text
        accessibilityRole="header"
        style={[typeScale.title3, { color: colors.text }]}
        numberOfLines={4}
      >
        {question?.question ??
          (error
            ? 'Your daily question couldn’t be opened.'
            : 'Opening today’s offline question…')}
      </Text>
      <Text style={[typeScale.caption, { color: colors.textMuted }]}>
        One question. A fresh start. {day}
      </Text>
      {error ? (
        <Touchable
          label="Retry daily NEET PG question"
          onPress={() => setRetry(retry + 1)}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={[typeScale.bodyStrong, { color: colors.accent }]}>
            Try again
          </Text>
        </Touchable>
      ) : (
        <Touchable
          label="Answer NEET PG question of the day"
          disabled={!question}
          onPress={() => setOpen(true)}
          style={{ minHeight: 44, justifyContent: 'center' }}
        >
          <Text style={[typeScale.bodyStrong, { color: colors.accent }]}>
            Answer today’s question →
          </Text>
        </Touchable>
      )}
      <PgEntranceBankModal
        visible={open}
        onClose={() => setOpen(false)}
        initialQuestionId={question?.id}
      />
    </View>
  );
}
