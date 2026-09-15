export interface ConcurrentTaskResult<T> {
  taskId: number;
  success: boolean;
  result?: T;
  error?: string;
  durationMs: number;
}

export interface RaceHarnessSummary<T> {
  totalTasks: number;
  successfulTasks: number;
  failedTasks: number;
  totalDurationMs: number;
  throughputOpsPerSec: number;
  results: ConcurrentTaskResult<T>[];
}

export class ConcurrencyRaceHarness {
  /**
   * Runs N concurrent async tasks simultaneously with Promise.all
   */
  public static async runConcurrentTasks<T>(
    concurrencyCount: number,
    taskFn: (taskId: number) => Promise<T>
  ): Promise<RaceHarnessSummary<T>> {
    const startTime = Date.now();
    const taskPromises: Promise<ConcurrentTaskResult<T>>[] = [];

    for (let i = 0; i < concurrencyCount; i++) {
      const taskId = i + 1;
      const p = (async () => {
        const taskStart = Date.now();
        try {
          const res = await taskFn(taskId);
          return {
            taskId,
            success: true,
            result: res,
            durationMs: Date.now() - taskStart,
          };
        } catch (err: any) {
          return {
            taskId,
            success: false,
            error: err.message || 'Unknown error',
            durationMs: Date.now() - taskStart,
          };
        }
      })();

      taskPromises.push(p);
    }

    const results = await Promise.all(taskPromises);
    const totalDuration = Math.max(1, Date.now() - startTime);

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;
    const throughput = Math.round((concurrencyCount / (totalDuration / 1000)) * 100) / 100;

    return {
      totalTasks: concurrencyCount,
      successfulTasks: successful,
      failedTasks: failed,
      totalDurationMs: totalDuration,
      throughputOpsPerSec: throughput,
      results,
    };
  }
}
