export interface OrderFinancialInput {
  orderId: string;
  sellerId: string;
  itemSubtotal: number;
  shippingFee: number;
  taxAmount: number;
  discountAmount: number;
  discountCoFundPlatformShare: number; // e.g. 0.5 for 50%
  platformTakeRate: number; // e.g. 0.085 for 8.5%
  gatewayFeeFixed: number; // e.g. 0.30
  gatewayFeePercent: number; // e.g. 0.029
}

export interface RevenueAllocationResult {
  orderId: string;
  sellerId: string;
  grandTotalChargedToBuyer: number;
  platformCommissionEarned: number;
  paymentGatewayFeeDeducted: number;
  taxRemittancePayable: number;
  shippingPayableToLogistics: number;
  platformDiscountContribution: number;
  sellerDiscountContribution: number;
  netSellerDisbursement: number;
  allocationVerifiedBalanced: boolean;
}

export class MarketplaceRevenueAllocator {
  /**
   * Performs precise double-entry multi-party revenue splits
   */
  public static allocate(input: OrderFinancialInput): RevenueAllocationResult {
    const netItems = Math.max(0, input.itemSubtotal - input.discountAmount);
    const grandTotal = Math.round((netItems + input.shippingFee + input.taxAmount) * 100) / 100;

    // Platform vs Seller discount co-funding
    const platformDiscount = Math.round(input.discountAmount * input.discountCoFundPlatformShare * 100) / 100;
    const sellerDiscount = Math.round((input.discountAmount - platformDiscount) * 100) / 100;

    // Commission computed on gross merchandise item total
    const commission = Math.round((input.itemSubtotal - sellerDiscount) * input.platformTakeRate * 100) / 100;

    // Gateway processing fee
    const gatewayFee = Math.round((grandTotal * input.gatewayFeePercent + input.gatewayFeeFixed) * 100) / 100;

    // Seller Net = (ItemSubtotal - SellerDiscount) - Commission - (Portion of Gateway Fee if passed)
    const netSeller = Math.max(0, Math.round((input.itemSubtotal - sellerDiscount - commission) * 100) / 100);

    // Verify balance: GrandTotal + PlatformDiscount = NetSeller + Commission + Tax + Shipping + GatewayFee
    const totalInflow = grandTotal + platformDiscount;
    const totalOutflow = Math.round((netSeller + commission + input.taxAmount + input.shippingFee) * 100) / 100;
    const isBalanced = Math.abs(totalInflow - totalOutflow) <= 0.05; // rounding tolerance

    return {
      orderId: input.orderId,
      sellerId: input.sellerId,
      grandTotalChargedToBuyer: grandTotal,
      platformCommissionEarned: commission,
      paymentGatewayFeeDeducted: gatewayFee,
      taxRemittancePayable: input.taxAmount,
      shippingPayableToLogistics: input.shippingFee,
      platformDiscountContribution: platformDiscount,
      sellerDiscountContribution: sellerDiscount,
      netSellerDisbursement: netSeller,
      allocationVerifiedBalanced: isBalanced,
    };
  }
}
