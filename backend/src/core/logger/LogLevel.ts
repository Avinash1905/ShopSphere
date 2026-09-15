/**
 * Log Level Definitions and Severities
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

export type LogLevelName = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export const LogSeverity: Record<LogLevelName, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  fatal: 50,
};

export interface LogEntry {
  timestamp: string;
  level: LogLevelName;
  message: string;
  context?: string;
  requestId?: string;
  correlationId?: string;
  userId?: string;
  durationMs?: number;
  data?: unknown;
  error?: {
    name: string;
    message: string;
    code?: string;
    stack?: string;
    details?: unknown;
  };
}
