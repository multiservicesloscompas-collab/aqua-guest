import type { TestDetails } from '@playwright/test';

/**
 * What a test tries to do and what it expects to find, written next to the
 * test. It travels as Playwright annotations, so the narrator reporter, the
 * live runner (`npm run e2e:live`) and the HTML report all read the same text.
 */
export interface TestDoc {
  /** One sentence: what the test tries to prove. */
  intent: string;
  /** What the test does, in order. */
  steps: string[];
  /** What it expects to find. */
  expects: string[];
  /** Optional: data or numbers involved. */
  data?: string;
}

export const DOC_TYPE = {
  intent: 'intent',
  step: 'step',
  expect: 'expect',
  data: 'data',
} as const;

export function documented(doc: TestDoc): TestDetails {
  return {
    annotation: [
      { type: DOC_TYPE.intent, description: doc.intent },
      ...doc.steps.map((description) => ({ type: DOC_TYPE.step, description })),
      ...doc.expects.map((description) => ({
        type: DOC_TYPE.expect,
        description,
      })),
      ...(doc.data ? [{ type: DOC_TYPE.data, description: doc.data }] : []),
    ],
  };
}

interface AnnotationLike {
  type: string;
  description?: string;
}

/** Rebuilds the documentation from a test's annotations. */
export function readDoc(annotations: readonly AnnotationLike[]): TestDoc {
  const texts = (type: string) =>
    annotations
      .filter(
        (annotation) => annotation.type === type && annotation.description
      )
      .map((annotation) => annotation.description as string);

  return {
    intent: texts(DOC_TYPE.intent)[0] ?? '',
    steps: texts(DOC_TYPE.step),
    expects: texts(DOC_TYPE.expect),
    data: texts(DOC_TYPE.data).join(' · ') || undefined,
  };
}

/** Names of the parts a complete documentation still lacks. */
export function missingDocParts(doc: TestDoc): string[] {
  const missing: string[] = [];
  if (!doc.intent) missing.push('intent');
  if (doc.steps.length === 0) missing.push('steps');
  if (doc.expects.length === 0) missing.push('expects');
  return missing;
}
