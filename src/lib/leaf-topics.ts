/**
 * Walking a subject down to its chapters.
 *
 * A "leaf topic" is the smallest thing in the bank that has questions of its
 * own — the chapter a note is written from and the chapter a flashcard deck is
 * built from. Both features need the identical walk, because both send
 * `topic.key` to an edge function that caches on it: two walks that disagreed
 * by one path segment would be two caches for one chapter.
 *
 * This lived inside `HandwrittenNotesHub` until the flashcards hub needed it
 * too. It is lifted out rather than copied for that reason and no other; the
 * behaviour is unchanged.
 */
import { collectQuestions } from "@/lib/question-progress";

export interface LeafTopic {
  /** Stable identity for the cache: "pathology::paper-1/neoplasia". */
  key: string;
  /** Display name — the last segment of the path. */
  name: string;
  /** "Paper 1 › Cell Injury". */
  breadcrumb: string;
  questions: string[];
}

/** A node is a leaf shape when its subtopics are only question buckets. */
function isLeafShape(n: any) {
  if (!n?.subtopics) return true;
  const keys = Object.keys(n.subtopics);
  return keys.every(
    (k) =>
      k === "essay" ||
      k === "short-note" ||
      k === "short-notes" ||
      Array.isArray(n.subtopics[k]?.questions)
  );
}

/** Every leaf topic under a subject that has at least one question. */
export function flattenSubjectTopics(subjectKey: string, node: any): LeafTopic[] {
  const out: LeafTopic[] = [];
  function walk(n: any, keyPath: string[], namePath: string[]) {
    if (!n || typeof n !== "object") return;
    // If this node itself has essay/short-note arrays -> it's a leaf topic.
    const essay = collectQuestions(n, "essay");
    const shorts = collectQuestions(n, "short-notes");
    const unique = Array.from(new Set([...essay, ...shorts])).filter(Boolean);
    const hasChildren = n.subtopics && typeof n.subtopics === "object";
    if (
      unique.length > 0 &&
      (!hasChildren || Object.keys(n.subtopics).length === 0 || isLeafShape(n))
    ) {
      out.push({
        key: `${subjectKey}::${keyPath.join("/")}`,
        name: namePath[namePath.length - 1] ?? n.name ?? "Topic",
        breadcrumb: namePath.join(" › "),
        questions: unique,
      });
      return;
    }
    if (hasChildren) {
      for (const [k, v] of Object.entries<any>(n.subtopics)) {
        walk(v, [...keyPath, k], [...namePath, v?.name ?? k]);
      }
    }
  }
  walk(node, [], [node?.name ?? subjectKey]);
  // dedupe by key
  const seen = new Set<string>();
  return out.filter((t) => (seen.has(t.key) ? false : (seen.add(t.key), true)));
}

/**
 * The key the *diagrams* for a chapter are filed under.
 *
 * The last segment of the leaf key, not the whole thing. `generate-flashcards`
 * matches `question_diagrams.subtopic_key` against it, and sending the full
 * "community-medicine::epidemiology/communicable-diseases" matches no diagram
 * row at all — which produces a silently all-theory deck rather than an error.
 */
export function diagramSubtopicKey(topicKey: string): string {
  const path = topicKey.split("::").pop() ?? topicKey;
  return path.split("/").pop() ?? path;
}
