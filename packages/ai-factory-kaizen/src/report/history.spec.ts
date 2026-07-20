import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import type { Report } from './build-report';
import { appendToHistory, readHistory } from './history';

const report1: Report = { generatedAt: '2026-01-01T00:00:00.000Z', runs: [] };
const report2: Report = { generatedAt: '2026-01-02T00:00:00.000Z', runs: [] };

describe('FR-9: append-only trend history, never a single overwritten snapshot', () => {
  let tmp: string;
  let historyPath: string;

  beforeEach(() => {
    tmp = mkdtempSync(resolve(tmpdir(), 'kaizen-history-'));
    historyPath = resolve(tmp, 'history.json');
  });

  afterEach(() => {
    rmSync(tmp, { recursive: true, force: true });
  });

  it('given no prior history file, when a report is first appended, then history starts empty and gains one entry', () => {
    const history = appendToHistory(report1, historyPath);
    expect(history).toEqual([report1]);
  });

  it('given an existing history, when a second report is appended, then both generations are present, oldest first', () => {
    appendToHistory(report1, historyPath);
    const history = appendToHistory(report2, historyPath);
    expect(history).toEqual([report1, report2]);
  });

  it('given the exact same report content appended twice, when read back, then both entries are recorded, not deduplicated', () => {
    appendToHistory(report1, historyPath);
    const history = appendToHistory(report1, historyPath);
    expect(history).toHaveLength(2);
  });

  it('given a history file already on disk, when read directly, then it matches what was written', () => {
    appendToHistory(report1, historyPath);
    appendToHistory(report2, historyPath);
    expect(readHistory(historyPath)).toEqual([report1, report2]);
  });

  it('given no history file exists yet, when read directly, then it returns an empty array, not an error', () => {
    expect(readHistory(historyPath)).toEqual([]);
  });
});
