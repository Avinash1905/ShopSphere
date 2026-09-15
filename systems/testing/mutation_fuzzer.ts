export interface MutationResult<T> {
  mutant: T;
  mutationType: string;
  fieldMutated: string;
  originalValue: any;
  mutatedValue: any;
}

export interface MutationAnalysisResult {
  totalMutants: number;
  killedCount: number;
  survivedCount: number;
  mutationScorePercentage: number;
  survivedMutants: { mutationType: string; field: string; details: string }[];
}

export class MutationFuzzer {
  public static mutateNumber(val: number): number[] {
    return [
      val + 1,
      val - 1,
      -val,
      0,
      -1,
      Number.MAX_SAFE_INTEGER,
      val * 10,
      val / 2,
    ];
  }

  public static mutateString(val: string): string[] {
    return [
      '',
      val + ' ',
      val.toUpperCase(),
      val.slice(0, Math.max(0, val.length - 1)),
      '<script>alert(1)</script>' + val,
      val + "' OR '1'='1",
      val + '\0',
      val.repeat(10),
    ];
  }

  public static mutateBoolean(val: boolean): boolean[] {
    return [!val];
  }

  public static generateMutants<T extends Record<string, any>>(record: T): MutationResult<T>[] {
    const mutants: MutationResult<T>[] = [];

    for (const [key, val] of Object.entries(record)) {
      if (typeof val === 'number') {
        for (const mutVal of this.mutateNumber(val)) {
          mutants.push({
            mutant: { ...record, [key]: mutVal },
            mutationType: 'ARITHMETIC_OR_BOUNDARY',
            fieldMutated: key,
            originalValue: val,
            mutatedValue: mutVal,
          });
        }
      } else if (typeof val === 'string') {
        for (const mutVal of this.mutateString(val)) {
          mutants.push({
            mutant: { ...record, [key]: mutVal },
            mutationType: 'STRING_MUTATION',
            fieldMutated: key,
            originalValue: val,
            mutatedValue: mutVal,
          });
        }
      } else if (typeof val === 'boolean') {
        for (const mutVal of this.mutateBoolean(val)) {
          mutants.push({
            mutant: { ...record, [key]: mutVal },
            mutationType: 'BOOLEAN_INVERSION',
            fieldMutated: key,
            originalValue: val,
            mutatedValue: mutVal,
          });
        }
      }
    }

    return mutants;
  }

  public static evaluateMutationScore<T extends Record<string, any>>(
    original: T,
    validator: (record: T) => boolean | { isValid: boolean }
  ): MutationAnalysisResult {
    const mutants = this.generateMutants(original);
    let killed = 0;
    const survived: { mutationType: string; field: string; details: string }[] = [];

    for (const item of mutants) {
      let passed = false;
      try {
        const res = validator(item.mutant);
        passed = typeof res === 'boolean' ? res : res.isValid;
      } catch (e) {
        passed = false;
      }

      if (!passed) {
        killed++;
      } else {
        survived.push({
          mutationType: item.mutationType,
          field: item.fieldMutated,
          details: 'Mutant with ' + item.fieldMutated + '=' + JSON.stringify(item.mutatedValue) + ' passed validation',
        });
      }
    }

    const total = mutants.length;
    const pct = total > 0 ? Math.round((killed / total) * 10000) / 100 : 100;

    return {
      totalMutants: total,
      killedCount: killed,
      survivedCount: survived.length,
      mutationScorePercentage: pct,
      survivedMutants: survived,
    };
  }
}
