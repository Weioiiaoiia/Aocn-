/**
 * PSA Sequential Certificate Number Detector
 * 
 * Algorithm:
 * 1. Extract numeric serial from each card's `serial` field
 * 2. Group cards by (gradingCompany, grade, setName) to form logical groups
 * 3. Sort each group by serial number ascending
 * 4. Scan for consecutive sequences: n, n+1, n+2, ...
 * 5. Any sequence of length >= 2 is flagged as a "sequential group"
 * 
 * Complexity: O(N log N) per group due to sorting
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { Card } from '@/lib/data';

export interface SequentialGroup {
  /** Unique key for this group */
  id: string;
  /** Cards in this sequential run, ordered by serial */
  cards: Card[];
  /** The starting serial number */
  startSerial: number;
  /** The ending serial number */
  endSerial: number;
  /** Length of the consecutive run */
  length: number;
  /** Shared grading company */
  gradingCompany: string;
  /** Shared grade */
  grade: string;
  /** Shared set name */
  setName: string;
  /** Combined estimated value */
  totalValue: number;
  /** Combined FMV */
  totalFmv: number;
}

export interface SequentialDetectorResult {
  /** All detected sequential groups */
  groups: SequentialGroup[];
  /** Total number of sequential groups */
  groupCount: number;
  /** Total cards involved in sequential runs */
  sequentialCardCount: number;
  /** Whether detection is in progress */
  isScanning: boolean;
  /** Last scan timestamp */
  lastScanTime: Date | null;
  /** Force re-scan */
  rescan: () => void;
}

/**
 * Extract numeric serial from a card's serial field.
 * Handles formats like "88000123", "#880001", "PSA-880001", etc.
 */
function extractSerialNumber(serial: string): number | null {
  if (!serial || serial.trim() === '') return null;
  // Remove common prefixes and non-numeric chars, keep digits
  const cleaned = serial.replace(/[^0-9]/g, '');
  if (cleaned.length === 0) return null;
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

/**
 * Build a grouping key for cards that could be sequential.
 * Cards must share the same grading company, grade, and set to be considered.
 */
function buildGroupKey(card: Card): string {
  return `${card.gradingCompany}|${card.grade}|${card.setName}`;
}

/**
 * Detect consecutive sequences within a sorted array of (serial, card) pairs.
 * Returns arrays of consecutive runs with length >= 2.
 */
function findConsecutiveRuns(
  sortedPairs: { serial: number; card: Card }[]
): { serial: number; card: Card }[][] {
  if (sortedPairs.length < 2) return [];

  const runs: { serial: number; card: Card }[][] = [];
  let currentRun: { serial: number; card: Card }[] = [sortedPairs[0]];

  for (let i = 1; i < sortedPairs.length; i++) {
    const prev = sortedPairs[i - 1];
    const curr = sortedPairs[i];

    if (curr.serial === prev.serial + 1) {
      currentRun.push(curr);
    } else {
      if (currentRun.length >= 2) {
        runs.push([...currentRun]);
      }
      currentRun = [curr];
    }
  }

  // Don't forget the last run
  if (currentRun.length >= 2) {
    runs.push(currentRun);
  }

  return runs;
}

/**
 * Main detection function: scans all cards and returns sequential groups.
 */
function detectSequentialGroups(cards: Card[]): SequentialGroup[] {
  // Step 1: Group cards by (gradingCompany, grade, setName)
  const groupMap = new Map<string, { serial: number; card: Card }[]>();

  for (const card of cards) {
    const serial = extractSerialNumber(card.serial);
    if (serial === null) continue;

    const key = buildGroupKey(card);
    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }
    groupMap.get(key)!.push({ serial, card });
  }

  const allGroups: SequentialGroup[] = [];

  // Step 2: For each logical group, sort by serial and find consecutive runs
  for (const [_key, pairs] of groupMap) {
    if (pairs.length < 2) continue;

    // Sort by serial ascending
    pairs.sort((a, b) => a.serial - b.serial);

    // Remove duplicates (same serial number)
    const uniquePairs: { serial: number; card: Card }[] = [];
    for (const pair of pairs) {
      if (uniquePairs.length === 0 || uniquePairs[uniquePairs.length - 1].serial !== pair.serial) {
        uniquePairs.push(pair);
      }
    }

    const runs = findConsecutiveRuns(uniquePairs);

    for (const run of runs) {
      const cards = run.map(r => r.card);
      const firstCard = cards[0];
      allGroups.push({
        id: `seq-${firstCard.gradingCompany}-${firstCard.grade}-${run[0].serial}-${run[run.length - 1].serial}`,
        cards,
        startSerial: run[0].serial,
        endSerial: run[run.length - 1].serial,
        length: run.length,
        gradingCompany: firstCard.gradingCompany,
        grade: firstCard.grade,
        setName: firstCard.setName,
        totalValue: cards.reduce((sum, c) => sum + c.price, 0),
        totalFmv: cards.reduce((sum, c) => sum + c.fmv, 0),
      });
    }
  }

  // Sort by length descending (longest runs first)
  allGroups.sort((a, b) => b.length - a.length);

  return allGroups;
}

/**
 * React Hook: useSequentialDetector
 * 
 * Accepts a card array and automatically detects PSA sequential certificate numbers.
 * Re-scans whenever the card data changes.
 */
export function useSequentialDetector(cards: Card[]): SequentialDetectorResult {
  const [isScanning, setIsScanning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<Date | null>(null);
  const [scanVersion, setScanVersion] = useState(0);
  const cardsRef = useRef(cards);
  cardsRef.current = cards;

  const groups = useMemo(() => {
    if (!cards || cards.length === 0) return [];
    setIsScanning(true);
    const result = detectSequentialGroups(cards);
    setIsScanning(false);
    setLastScanTime(new Date());
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, scanVersion]);

  const groupCount = groups.length;
  const sequentialCardCount = groups.reduce((sum, g) => sum + g.length, 0);

  const rescan = useCallback(() => {
    setScanVersion(v => v + 1);
  }, []);

  return {
    groups,
    groupCount,
    sequentialCardCount,
    isScanning,
    lastScanTime,
    rescan,
  };
}

export default useSequentialDetector;
