/**
 * Server Bootstrap & Graceful Lifecycle Coordinator
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import http from 'http';
import { app } from './app';
import { config } from './config';
import { logger } from './core/logger/Logger';

export class Server {
  private server: http.Server | null = null;
  private isShuttingDown = false;

  public start(): http.Server {
    const port = config.env.PORT;
    const host = config.env.HOST;

    this.server = http.createServer(app);

    this.server.listen(port, () => {
      logger.info(`=======================================================`);
      logger.info(`ShopSphere Backend Server Started Successfully`);
      logger.info(`Environment:  ${config.env.NODE_ENV}`);
      logger.info(`Listening on: http://${host}:${port}`);
      logger.info(`API Prefix:   ${config.env.API_PREFIX}`);
      logger.info(`Health check: http://${host}:${port}/health`);
      logger.info(`Member 2 Phase 1 Foundation & Auth Active`);
      logger.info(`=======================================================`);
    });

    this.server.on('error', (err: Error) => {
      logger.fatal('Fatal HTTP server error:', err);
      process.exit(1);
    });

    // Register process signal listeners
    process.on('SIGTERM', () => this.handleSignal('SIGTERM'));
    process.on('SIGINT', () => this.handleSignal('SIGINT'));

    process.on('unhandledRejection', (reason: unknown) => {
      logger.error('Unhandled Promise Rejection:', reason instanceof Error ? reason : new Error(String(reason)));
    });

    process.on('uncaughtException', (err: Error) => {
      logger.fatal('Uncaught Exception occurred:', err);
      this.gracefulShutdown(1);
    });

    return this.server;
  }

  private handleSignal(signal: string): void {
    logger.info(`Received ${signal} signal. Initiating graceful shutdown...`);
    this.gracefulShutdown(0);
  }

  public gracefulShutdown(exitCode = 0): void {
    if (this.isShuttingDown) return;
    this.isShuttingDown = true;

    const timeout = setTimeout(() => {
      logger.error('Graceful shutdown timeout exceeded. Forcing exit.');
      process.exit(exitCode || 1);
    }, 10000);

    if (timeout.unref) {
      timeout.unref();
    }

    if (this.server) {
      this.server.close((err) => {
        if (err) {
          logger.error('Error closing HTTP server:', err);
        } else {
          logger.info('HTTP server closed successfully.');
        }
        clearTimeout(timeout);
        process.exit(exitCode);
      });
    } else {
      process.exit(exitCode);
    }
  }

  public getServer(): http.Server | null {
    return this.server;
  }
}

export const server = new Server();

// Start automatically when executed directly
if (require.main === module) {
  server.start();
}
