export class AnalyticsValidator {
  public static validateDateRange(startDate?: string, endDate?: string): { isValid: boolean; error?: string } {
    if (startDate && isNaN(new Date(startDate).getTime())) {
      return { isValid: false, error: `Invalid startDate format: ${startDate}` };
    }
    if (endDate && isNaN(new Date(endDate).getTime())) {
      return { isValid: false, error: `Invalid endDate format: ${endDate}` };
    }
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return { isValid: false, error: 'startDate cannot be after endDate' };
    }
    return { isValid: true };
  }

  public static safeDivide(numerator: number, denominator: number, fallback: number = 0): number {
    if (!denominator || isNaN(denominator) || denominator === 0) {
      return fallback;
    }
    return numerator / denominator;
  }
}
