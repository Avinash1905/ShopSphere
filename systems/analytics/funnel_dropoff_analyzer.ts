/**
 * ShopSphere Analytics Engine - Multi-Stage Funnel & Attribution Analyzer
 * Features:
 * - Conversion Funnel Stages: Impression -> View -> AddToCart -> Checkout -> Purchase
 * - Stage-to-stage drop-off and conversion rates
 * - Multi-touch marketing attribution (First-Touch, Last-Touch, Linear attribution)
 */

export interface FunnelStageCount {
  stage: string;
  users: number;
  dropoffUsers: number;
  conversionRateFromStart: number;
  stageConversionRate: number;
}

export interface TouchpointEvent {
  userId: string;
  channel: string; // 'organic_search', 'paid_ads', 'email', 'social', 'direct'
  timestamp: Date;
  isConversion: boolean;
  revenue?: number;
}

export class FunnelDropoffAnalyzer {
  public static calculateFunnel(stages: Array<{ name: string; userCount: number }>): FunnelStageCount[] {
    if (stages.length === 0) return [];

    const topUsers = stages[0].userCount;
    const result: FunnelStageCount[] = [];

    for (let i = 0; i < stages.length; i++) {
      const cur = stages[i];
      const prev = i > 0 ? stages[i - 1] : cur;
      const nextUsers = i < stages.length - 1 ? stages[i + 1].userCount : 0;
      const dropoff = i < stages.length - 1 ? cur.userCount - nextUsers : 0;

      result.push({
        stage: cur.name,
        users: cur.userCount,
        dropoffUsers: Math.max(0, dropoff),
        conversionRateFromStart: topUsers > 0 ? Math.round((cur.userCount / topUsers) * 10000) / 100 : 0,
        stageConversionRate: prev.userCount > 0 ? Math.round((cur.userCount / prev.userCount) * 10000) / 100 : 0,
      });
    }

    return result;
  }

  /**
   * Calculates multi-touch marketing attribution
   */
  public static attributeRevenue(
    events: TouchpointEvent[],
    model: 'FIRST_TOUCH' | 'LAST_TOUCH' | 'LINEAR' = 'LINEAR'
  ): Map<string, number> {
    const channelRevenue = new Map<string, number>();

    // Group events by user
    const userEvents = new Map<string, TouchpointEvent[]>();
    for (const e of events) {
      if (!userEvents.has(e.userId)) {
        userEvents.set(e.userId, []);
      }
      userEvents.get(e.userId)!.push(e);
    }

    for (const [, list] of userEvents) {
      list.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const conversionEvent = list.find((e) => e.isConversion);
      if (!conversionEvent || !conversionEvent.revenue) continue;

      const rev = conversionEvent.revenue;
      const touchpoints = list.filter((e) => !e.isConversion || list.length === 1);

      if (touchpoints.length === 0) continue;

      if (model === 'FIRST_TOUCH') {
        const first = touchpoints[0].channel;
        channelRevenue.set(first, (channelRevenue.get(first) || 0) + rev);
      } else if (model === 'LAST_TOUCH') {
        const last = touchpoints[touchpoints.length - 1].channel;
        channelRevenue.set(last, (channelRevenue.get(last) || 0) + rev);
      } else if (model === 'LINEAR') {
        const share = rev / touchpoints.length;
        for (const t of touchpoints) {
          channelRevenue.set(t.channel, (channelRevenue.get(t.channel) || 0) + share);
        }
      }
    }

    // Round values
    for (const [ch, amount] of channelRevenue) {
      channelRevenue.set(ch, Math.round(amount * 100) / 100);
    }

    return channelRevenue;
  }
}
