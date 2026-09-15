export interface ShippingOptionSla {
  carrierCode: 'fedex' | 'ups' | 'dhl' | 'usps' | 'bluedart';
  serviceLevel: 'standard' | 'express' | 'overnight' | 'same_day';
  minBusinessDays: number;
  maxBusinessDays: number;
}

export class DeliverySlaEstimator {
  public static calculateEstimatedDelivery(
    orderDate: Date,
    option: ShippingOptionSla,
    cutoffHourLocal: number = 15
  ): { minDeliveryDate: Date; maxDeliveryDate: Date; isShippedToday: boolean } {
    const orderHour = orderDate.getHours();
    const isShippedToday = orderHour < cutoffHourLocal && orderDate.getDay() !== 0 && orderDate.getDay() !== 6;
    
    const startDayOffset = isShippedToday ? 0 : 1;
    const minDeliveryDate = this.addBusinessDays(orderDate, option.minBusinessDays + startDayOffset);
    const maxDeliveryDate = this.addBusinessDays(orderDate, option.maxBusinessDays + startDayOffset);

    return { minDeliveryDate, maxDeliveryDate, isShippedToday };
  }

  private static addBusinessDays(startDate: Date, businessDays: number): Date {
    const result = new Date(startDate);
    let added = 0;
    while (added < businessDays) {
      result.setDate(result.getDate() + 1);
      const day = result.getDay();
      if (day !== 0 && day !== 6) {
        added++;
      }
    }
    return result;
  }
}
