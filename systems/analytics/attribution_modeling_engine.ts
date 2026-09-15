export interface AttributionTouchpointEvent {
  touchpointId: string;
  channel: 'ORGANIC_SEARCH' | 'PAID_SEARCH' | 'META_ADS' | 'EMAIL_MARKETING' | 'AFFILIATE' | 'DIRECT';
  timestampMs: number;
  cost?: number;
}

export interface CustomerConversionJourney {
  userId: string;
  orderId: string;
  conversionValue: number;
  conversionTimestampMs: number;
  touchpoints: AttributionTouchpointEvent[];
}

export interface ChannelAttributionSummary {
  channel: string;
  attributedConversions: number;
  attributedRevenue: number;
  totalCost: number;
  roasRatio: number; // Revenue / Cost
}

export class AttributionModelingEngine {
  /**
   * Computes multi-touch attribution based on selected model
   */
  public static attributeJourneys(
    journeys: CustomerConversionJourney[],
    model: 'FIRST_TOUCH' | 'LAST_TOUCH' | 'LINEAR' | 'TIME_DECAY' | 'POSITION_BASED'
  ): Record<string, ChannelAttributionSummary> {
    const channelMap = new Map<string, { conversions: number; revenue: number; cost: number }>();

    const getEntry = (ch: string) => {
      if (!channelMap.has(ch)) {
        channelMap.set(ch, { conversions: 0, revenue: 0, cost: 0 });
      }
      return channelMap.get(ch)!;
    };

    for (const j of journeys) {
      if (j.touchpoints.length === 0) {
        const direct = getEntry('DIRECT');
        direct.conversions += 1.0;
        direct.revenue += j.conversionValue;
        continue;
      }

      // Record costs
      for (const tp of j.touchpoints) {
        getEntry(tp.channel).cost += tp.cost || 0;
      }

      const count = j.touchpoints.length;

      if (model === 'FIRST_TOUCH') {
        const first = j.touchpoints[0];
        const entry = getEntry(first.channel);
        entry.conversions += 1.0;
        entry.revenue += j.conversionValue;
      } else if (model === 'LAST_TOUCH') {
        const last = j.touchpoints[count - 1];
        const entry = getEntry(last.channel);
        entry.conversions += 1.0;
        entry.revenue += j.conversionValue;
      } else if (model === 'LINEAR') {
        const share = 1.0 / count;
        const revShare = j.conversionValue / count;
        for (const tp of j.touchpoints) {
          const entry = getEntry(tp.channel);
          entry.conversions += share;
          entry.revenue += revShare;
        }
      } else if (model === 'TIME_DECAY') {
        const halfLifeMs = 7 * 24 * 60 * 60 * 1000;
        let totalWeight = 0;
        const weights = j.touchpoints.map((tp) => {
          const timeDiff = Math.max(0, j.conversionTimestampMs - tp.timestampMs);
          const w = Math.pow(2, -timeDiff / halfLifeMs);
          totalWeight += w;
          return w;
        });

        for (let i = 0; i < count; i++) {
          const tp = j.touchpoints[i];
          const normalizedWeight = totalWeight > 0 ? weights[i] / totalWeight : 1.0 / count;
          const entry = getEntry(tp.channel);
          entry.conversions += normalizedWeight;
          entry.revenue += j.conversionValue * normalizedWeight;
        }
      } else if (model === 'POSITION_BASED') {
        if (count === 1) {
          const entry = getEntry(j.touchpoints[0].channel);
          entry.conversions += 1.0;
          entry.revenue += j.conversionValue;
        } else if (count === 2) {
          const e1 = getEntry(j.touchpoints[0].channel);
          const e2 = getEntry(j.touchpoints[1].channel);
          e1.conversions += 0.5;
          e1.revenue += j.conversionValue * 0.5;
          e2.conversions += 0.5;
          e2.revenue += j.conversionValue * 0.5;
        } else {
          const first = getEntry(j.touchpoints[0].channel);
          const last = getEntry(j.touchpoints[count - 1].channel);
          first.conversions += 0.4;
          first.revenue += j.conversionValue * 0.4;
          last.conversions += 0.4;
          last.revenue += j.conversionValue * 0.4;

          const middleShare = 0.2 / (count - 2);
          const middleRev = (j.conversionValue * 0.2) / (count - 2);
          for (let i = 1; i < count - 1; i++) {
            const entry = getEntry(j.touchpoints[i].channel);
            entry.conversions += middleShare;
            entry.revenue += middleRev;
          }
        }
      }
    }

    const summaries: Record<string, ChannelAttributionSummary> = {};
    for (const [ch, data] of channelMap.entries()) {
      const roas = data.cost > 0 ? data.revenue / data.cost : data.revenue > 0 ? 99.0 : 0.0;
      summaries[ch] = {
        channel: ch,
        attributedConversions: Math.round(data.conversions * 100) / 100,
        attributedRevenue: Math.round(data.revenue * 100) / 100,
        totalCost: Math.round(data.cost * 100) / 100,
        roasRatio: Math.round(roas * 100) / 100,
      };
    }

    return summaries;
  }
}
