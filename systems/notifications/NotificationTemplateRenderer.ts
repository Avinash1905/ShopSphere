export class NotificationTemplateRenderer {
  private templates: Map<string, { subject: string; body: string }> = new Map();

  constructor() {
    this.register('ORDER_PLACED', {
      subject: 'Order Confirmation - {{orderId}}',
      body: 'Hello {{customerName}}, your order of {{itemCount}} item(s) totaling ${{totalAmount}} is confirmed.'
    });
    this.register('SHIPMENT_SHIPPED', {
      subject: 'Your order {{orderId}} is on its way!',
      body: 'Track your package with tracking number {{trackingNumber}} via {{carrier}}.'
    });
  }

  public register(type: string, template: { subject: string; body: string }): void {
    this.templates.set(type, template);
  }

  public render(type: string, variables: Record<string, string | number>): { subject: string; body: string } {
    const tpl = this.templates.get(type);
    if (!tpl) throw new Error(`Notification template '${type}' not found.`);

    const interpolate = (text: string) => {
      return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
        return variables[key] !== undefined ? String(variables[key]) : `{{${key}}}`;
      });
    };

    return {
      subject: interpolate(tpl.subject),
      body: interpolate(tpl.body)
    };
  }
}
