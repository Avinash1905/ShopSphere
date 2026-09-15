export interface SnapshotDifference {
  path: string;
  type: 'VALUE_MISMATCH' | 'KEY_MISSING' | 'KEY_UNEXPECTED' | 'TYPE_MISMATCH';
  expectedValue: any;
  actualValue: any;
}

export interface SnapshotComparisonResult {
  matches: boolean;
  totalDifferences: number;
  differences: SnapshotDifference[];
  formattedDiff: string;
}

export class DataSnapshotComparator {
  /**
   * Compares expected snapshot against actual object
   */
  public static compare(expected: any, actual: any, path: string = '$'): SnapshotComparisonResult {
    const differences: SnapshotDifference[] = [];
    DataSnapshotComparator.recursiveCompare(expected, actual, path, differences);

    const matches = differences.length === 0;
    const formatted = matches
      ? '✓ Snapshots match 100% identically.'
      : differences.map((d) => `[-] Path: ${d.path} [${d.type}] Expected: ${JSON.stringify(d.expectedValue)} Actual: ${JSON.stringify(d.actualValue)}`).join('\n');

    return {
      matches,
      totalDifferences: differences.length,
      differences,
      formattedDiff: formatted,
    };
  }

  private static recursiveCompare(
    exp: any,
    act: any,
    currentPath: string,
    diffs: SnapshotDifference[]
  ): void {
    if (exp === act) return;

    if (exp === null || exp === undefined || act === null || act === undefined) {
      diffs.push({ path: currentPath, type: 'VALUE_MISMATCH', expectedValue: exp, actualValue: act });
      return;
    }

    if (typeof exp !== typeof act) {
      diffs.push({ path: currentPath, type: 'TYPE_MISMATCH', expectedValue: typeof exp, actualValue: typeof act });
      return;
    }

    if (Array.isArray(exp) && Array.isArray(act)) {
      const maxLen = Math.max(exp.length, act.length);
      for (let i = 0; i < maxLen; i++) {
        const itemPath = `${currentPath}[${i}]`;
        if (i >= exp.length) {
          diffs.push({ path: itemPath, type: 'KEY_UNEXPECTED', expectedValue: undefined, actualValue: act[i] });
        } else if (i >= act.length) {
          diffs.push({ path: itemPath, type: 'KEY_MISSING', expectedValue: exp[i], actualValue: undefined });
        } else {
          DataSnapshotComparator.recursiveCompare(exp[i], act[i], itemPath, diffs);
        }
      }
      return;
    }

    if (typeof exp === 'object') {
      const expKeys = new Set(Object.keys(exp));
      const actKeys = new Set(Object.keys(act));

      for (const k of expKeys) {
        const keyPath = `${currentPath}.${k}`;
        if (!actKeys.has(k)) {
          diffs.push({ path: keyPath, type: 'KEY_MISSING', expectedValue: exp[k], actualValue: undefined });
        } else {
          DataSnapshotComparator.recursiveCompare(exp[k], act[k], keyPath, diffs);
        }
      }

      for (const k of actKeys) {
        if (!expKeys.has(k)) {
          diffs.push({ path: `${currentPath}.${k}`, type: 'KEY_UNEXPECTED', expectedValue: undefined, actualValue: act[k] });
        }
      }
      return;
    }

    if (exp !== act) {
      diffs.push({ path: currentPath, type: 'VALUE_MISMATCH', expectedValue: exp, actualValue: act });
    }
  }
}
