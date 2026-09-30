import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import {
  formatFailure,
  formatFicha,
  formatPassed,
  formatSummary,
} from '../support/narration';
import {
  classifyBugResult,
  formatBugFicha,
  formatBugOutcome,
  formatBugSummary,
  readBugInfo,
  type BugSummaryRow,
} from '../support/bugs/bugNarration';
import { DOC_TYPE, readDoc } from '../support/testDoc';

// Playwright empties test-results/ at the start of every run, so the timings
// live in the (git-ignored) node_modules cache, next to where the runner reads them.
const TIMINGS_FILE = path.resolve(
  __dirname,
  '../../../../node_modules/.cache/aquaguest-e2e/timings.json'
);

function relativeFile(file: string): string {
  return path.relative(process.cwd(), file);
}

function displayTitle(test: TestCase): string {
  return test.titlePath().slice(3).join(' › ');
}

function timingKey(test: TestCase): string {
  return `${relativeFile(test.location.file)}::${displayTitle(test)}`;
}

/**
 * Prints, for every test, what it tries to do and what it expects (from its
 * `documented()` annotations) before it runs, and a plain explanation of the
 * result afterwards. Enabled with E2E_NARRATE=1; the live runner sets it.
 * It also records how long each test took, so the runner can estimate times.
 */
export default class NarratorReporter implements Reporter {
  private total = 0;
  private started = 0;
  private startedAt = 0;
  private annotationsAtStart = new Map<string, number>();
  private counts = { passed: 0, failed: 0, skipped: 0 };
  private timings: Record<string, number> = {};
  private bugRows: BugSummaryRow[] = [];

  printsToStdio(): boolean {
    return true;
  }

  onBegin(_config: FullConfig, suite: Suite): void {
    this.total = suite.allTests().length;
    this.startedAt = Date.now();
    process.stdout.write(`\nEjecutando ${this.total} tests\n`);
  }

  onTestBegin(test: TestCase): void {
    this.started += 1;
    this.annotationsAtStart.set(test.id, test.annotations.length);
    const doc = readDoc(test.annotations);
    const bugInfo = readBugInfo(test.annotations);
    if (bugInfo) {
      process.stdout.write(
        formatBugFicha({
          title: doc.titulo || displayTitle(test),
          doc,
          info: bugInfo,
          position: { index: this.started, total: this.total },
        })
      );
      return;
    }
    process.stdout.write(
      formatFicha({
        title: doc.titulo || displayTitle(test),
        doc,
        position: { index: this.started, total: this.total },
      })
    );
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const runData = test.annotations
      .slice(this.annotationsAtStart.get(test.id) ?? test.annotations.length)
      .filter((annotation) => annotation.type === DOC_TYPE.data)
      .map((annotation) => annotation.description)
      .filter((text): text is string => Boolean(text));
    if (runData.length > 0) {
      process.stdout.write(
        `   Datos de esta corrida:\n${runData
          .map((text) => `     · ${text}`)
          .join('\n')}\n`
      );
    }

    if (result.status === 'skipped') {
      this.counts.skipped += 1;
      process.stdout.write('   ⏭ Omitido\n');
      return;
    }

    const bugInfo = readBugInfo(test.annotations);
    if (bugInfo) {
      this.reportBug(test, result, bugInfo);
      return;
    }

    if (result.status === 'passed') {
      this.counts.passed += 1;
      this.timings[timingKey(test)] = result.duration;
      process.stdout.write(formatPassed(result.duration));
      return;
    }

    this.counts.failed += 1;
    const errorLocation = result.error?.location ?? test.location;
    process.stdout.write(
      formatFailure({
        durationMs: result.duration,
        message: result.error?.message ?? 'Error sin mensaje',
        location: `${relativeFile(errorLocation.file)}:${errorLocation.line}`,
        evidence: result.attachments
          .filter((attachment) => attachment.path)
          .map((attachment) => ({
            name: attachment.name,
            path: relativeFile(attachment.path as string),
          })),
      })
    );
  }

  private reportBug(
    test: TestCase,
    result: TestResult,
    info: NonNullable<ReturnType<typeof readBugInfo>>
  ): void {
    const message = result.error?.message;
    const verdict = classifyBugResult({
      kind: info.kind,
      status: result.status,
      message,
    });
    if (result.status === 'passed') {
      this.counts.passed += 1;
      this.timings[timingKey(test)] = result.duration;
    } else {
      this.counts.failed += 1;
    }
    this.bugRows.push({
      id: info.id,
      title: readDoc(test.annotations).titulo || displayTitle(test),
      verdict,
    });
    process.stdout.write(
      formatBugOutcome({
        info,
        verdict,
        durationMs: result.duration,
        message,
        evidence: result.attachments
          .filter((attachment) => attachment.path)
          .map((attachment) => ({
            name: attachment.name,
            path: relativeFile(attachment.path as string),
          })),
      })
    );
  }

  onEnd(_result: FullResult): void {
    process.stdout.write(formatBugSummary(this.bugRows));
    process.stdout.write(
      formatSummary({ ...this.counts, durationMs: Date.now() - this.startedAt })
    );
    this.saveTimings();
  }

  private saveTimings(): void {
    if (Object.keys(this.timings).length === 0) return;
    let previous: Record<string, number> = {};
    if (existsSync(TIMINGS_FILE)) {
      try {
        previous = JSON.parse(readFileSync(TIMINGS_FILE, 'utf8'));
      } catch {
        previous = {};
      }
    }
    mkdirSync(path.dirname(TIMINGS_FILE), { recursive: true });
    writeFileSync(
      TIMINGS_FILE,
      JSON.stringify({ ...previous, ...this.timings }, null, 2)
    );
  }
}
