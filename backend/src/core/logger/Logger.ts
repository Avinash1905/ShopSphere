/**
 * High-Performance Structured Logger
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { LogLevelName, LogSeverity, LogEntry } from './LogLevel';
import { LogRedactor } from './LogRedactor';
import { RequestContext } from '../context/RequestContext';

export class Logger {
  private readonly context: string;
  private minLevel: LogLevelName;
  private format: 'json' | 'pretty';

  constructor(context = 'App', minLevel: LogLevelName = 'debug', format: 'json' | 'pretty' = 'pretty') {
    this.context = context;
    this.minLevel = minLevel;
    this.format = format;
  }

  public setLevel(level: LogLevelName): void {
    this.minLevel = level;
  }

  public setFormat(format: 'json' | 'pretty'): void {
    this.format = format;
  }

  public child(context: string): Logger {
    return new Logger(`${this.context}:${context}`, this.minLevel, this.format);
  }

  private shouldLog(level: LogLevelName): boolean {
    return LogSeverity[level] >= LogSeverity[this.minLevel];
  }

  private write(level: LogLevelName, message: string, data?: unknown, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const ctx = RequestContext.get();
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.context,
      requestId: ctx?.requestId,
      correlationId: ctx?.correlationId,
      userId: ctx?.userId,
      durationMs: ctx ? Date.now() - ctx.startTime : undefined,
    };

    if (data !== undefined) {
      entry.data = LogRedactor.redact(data);
    }

    if (error) {
      entry.error = {
        name: error.name,
        message: error.message,
        stack: error.stack,
        ...('code' in error ? { code: String((error as { code: unknown }).code) } : {}),
        ...('details' in error ? { details: LogRedactor.redact((error as { details: unknown }).details) } : {}),
      };
    }

    if (this.format === 'json') {
      const output = JSON.stringify(entry);
      if (level === 'error' || level === 'fatal') {
        process.stderr.write(`${output}\n`);
      } else {
        process.stdout.write(`${output}\n`);
      }
    } else {
      this.writePretty(entry);
    }
  }

  private writePretty(entry: LogEntry): void {
    const colorMap: Record<LogLevelName, string> = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
      fatal: '\x1b[35m', // magenta
    };
    const reset = '\x1b[0m';
    const dim = '\x1b[2m';
    const color = colorMap[entry.level] || '';

    const reqInfo = entry.requestId ? `${dim}[req:${entry.requestId}]${reset} ` : '';
    const durInfo = entry.durationMs !== undefined ? ` ${dim}(+${entry.durationMs}ms)${reset}` : '';

    const header = `${dim}${entry.timestamp}${reset} ${color}[${entry.level.toUpperCase().padEnd(5)}]${reset} [${entry.context}] ${reqInfo}${entry.message}${durInfo}`;

    if (entry.level === 'error' || entry.level === 'fatal') {
      process.stderr.write(`${header}\n`);
      if (entry.error?.stack) {
        process.stderr.write(`${dim}${entry.error.stack}${reset}\n`);
      }
      if (entry.data) {
        process.stderr.write(`${JSON.stringify(entry.data, null, 2)}\n`);
      }
    } else {
      process.stdout.write(`${header}\n`);
      if (entry.data && entry.level === 'debug') {
        process.stdout.write(`${dim}${JSON.stringify(entry.data, null, 2)}${reset}\n`);
      }
    }
  }

  public debug(message: string, data?: unknown): void {
    this.write('debug', message, data);
  }

  public info(message: string, data?: unknown): void {
    this.write('info', message, data);
  }

  public warn(message: string, data?: unknown): void {
    this.write('warn', message, data);
  }

  public error(message: string, error?: unknown, data?: unknown): void {
    const err = error instanceof Error ? error : error ? new Error(String(error)) : undefined;
    this.write('error', message, data, err);
  }

  public fatal(message: string, error?: unknown, data?: unknown): void {
    const err = error instanceof Error ? error : error ? new Error(String(error)) : undefined;
    this.write('fatal', message, data, err);
  }
}

export const logger = new Logger('ShopSphere');
