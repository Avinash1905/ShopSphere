/**
 * In-Process Typed Event Bus with Asynchronous Error Isolation
 * Member 2 - Phase 1: Backend Foundation + Authentication + Users
 */

import { v4 as uuidv4 } from 'uuid';
import { DomainEventMap, EventKey, BaseDomainEvent } from './event.types';
import { logger } from '../logger/Logger';
import { RequestContext } from '../context/RequestContext';

export type EventHandler<T> = (event: T) => Promise<void> | void;

export class EventBus {
  private static instance: EventBus;
  private readonly handlers = new Map<string, Set<EventHandler<any>>>();
  private readonly recentEvents: BaseDomainEvent<unknown>[] = [];
  private readonly maxStoredEvents = 100;

  private constructor() {}

  public static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  public subscribe<K extends EventKey>(eventType: K, handler: EventHandler<DomainEventMap[K]>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler);

    // Return un-subscriber
    return () => {
      const set = this.handlers.get(eventType);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    };
  }

  public async publish<K extends EventKey>(eventType: K, payload: DomainEventMap[K]['payload']): Promise<void> {
    const event: BaseDomainEvent<DomainEventMap[K]['payload']> = {
      eventId: uuidv4(),
      eventType,
      timestamp: new Date().toISOString(),
      correlationId: RequestContext.getCorrelationId(),
      payload,
    };

    // Store in recent memory ring buffer
    this.recentEvents.unshift(event);
    if (this.recentEvents.length > this.maxStoredEvents) {
      this.recentEvents.pop();
    }

    const listeners = this.handlers.get(eventType);
    if (!listeners || listeners.size === 0) {
      logger.debug(`No listeners registered for event: ${eventType}`);
      return;
    }

    const promises: Promise<void>[] = [];
    for (const handler of listeners) {
      promises.push(
        (async () => {
          try {
            await handler(event);
          } catch (err) {
            logger.error(`Error in event handler for '${eventType}':`, err);
          }
        })()
      );
    }

    await Promise.allSettled(promises);
  }

  public getRecentEvents(): ReadonlyArray<BaseDomainEvent<unknown>> {
    return [...this.recentEvents];
  }

  public clearAllListeners(): void {
    this.handlers.clear();
  }
}

export const eventBus = EventBus.getInstance();
