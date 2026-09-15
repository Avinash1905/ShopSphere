export interface MockRequestRule {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  urlPattern: string | RegExp;
  responseStatus: number;
  responseBody: any;
  responseHeaders?: Record<string, string>;
  delayMs?: number;
  remainingCalls?: number; // Times this mock can be consumed
}

export interface InterceptedRequest {
  id: string;
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
  timestamp: string;
}

export class HTTPMockInterceptor {
  private rules: MockRequestRule[] = [];
  private history: InterceptedRequest[] = [];

  /**
   * Registers a mock request rule
   */
  public mock(rule: Omit<MockRequestRule, 'id'>): string {
    const id = `RULE-${Date.now()}-${this.rules.length + 1}`;
    this.rules.push({ ...rule, id });
    return id;
  }

  /**
   * Intercepts a request and returns the configured mock response
   */
  public async handleRequest(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    url: string,
    headers: Record<string, string> = {},
    body?: any
  ): Promise<{ status: number; body: any; headers: Record<string, string> }> {
    const record: InterceptedRequest = {
      id: `REQ-${Date.now()}-${this.history.length + 1}`,
      method,
      url,
      headers,
      body,
      timestamp: new Date().toISOString(),
    };
    this.history.push(record);

    for (const rule of this.rules) {
      if (rule.remainingCalls !== undefined && rule.remainingCalls <= 0) {
        continue;
      }

      if (rule.method === method) {
        let isMatch = false;
        if (typeof rule.urlPattern === 'string') {
          isMatch = url.includes(rule.urlPattern);
        } else if (rule.urlPattern instanceof RegExp) {
          isMatch = rule.urlPattern.test(url);
        }

        if (isMatch) {
          if (rule.remainingCalls !== undefined) {
            rule.remainingCalls--;
          }

          if (rule.delayMs && rule.delayMs > 0) {
            await new Promise((resolve) => setTimeout(resolve, rule.delayMs));
          }

          return {
            status: rule.responseStatus,
            body: rule.responseBody,
            headers: rule.responseHeaders || { 'content-type': 'application/json' },
          };
        }
      }
    }

    // Default unhandled mock response
    return {
      status: 404,
      body: { error: 'No mock rule matched requested endpoint' },
      headers: { 'content-type': 'application/json' },
    };
  }

  public getHistory(): InterceptedRequest[] {
    return [...this.history];
  }

  public verifyCalled(urlPattern: string | RegExp, times?: number): boolean {
    const matches = this.history.filter((h) =>
      typeof urlPattern === 'string' ? h.url.includes(urlPattern) : urlPattern.test(h.url)
    );

    if (times !== undefined) {
      return matches.length === times;
    }
    return matches.length > 0;
  }

  public clear(): void {
    this.rules = [];
    this.history = [];
  }
}
