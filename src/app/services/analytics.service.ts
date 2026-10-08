import { Injectable } from '@angular/core';

declare let gtag: Function;

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  public trackEvent(event: string, params: Record<string, any>) {
    if (typeof gtag !== 'undefined') {
      const localTime = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
      const eventParams = {
        ...params,
        event_timestamp: localTime 
      };
      gtag('event', event, eventParams);
      console.log(`[Analytics] ${event} logged:`, eventParams);
    }
  }

  logApiFailure(endpoint: string, method: string, statusCode: number, errorMessage: string, orderId?: string | null, orgId?: string | null) {
    this.trackEvent('api_failure', {
      endpoint: endpoint,
      method: method,
      status_code: statusCode,
      error_message: errorMessage,
      order_id: orderId ? orderId.toString() : null,
      org_id: orgId ? orgId.toString() : null 
    });
  }

  logSystemError(category: string, message: string, orderId?: string | number) {
    this.trackEvent('system_error', {
      error_category: category,
      error_message: message,
      order_id: orderId ? orderId.toString() : null,
    });
  }

  logPurchase(orderId: string | number, serviceType: string) {
    this.trackEvent('purchase', {
      order_id: orderId.toString(),
      currency: 'INR',
      service_type: serviceType,
    });
  }

  trackViewInteraction(tab: string, source: 'row_click' | 'icon_click') {
    this.trackEvent('view_order_interaction', {
      tab,
      interaction_type: source,
    });
  }
}
