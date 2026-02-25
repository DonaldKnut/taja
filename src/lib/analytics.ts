"use client";

export interface AnalyticsEvent {
  name: string;
  properties?: Record<string, any>;
  context?: Record<string, any>;
}

const pending: AnalyticsEvent[] = [];
let flushScheduled = false;

async function flushQueue() {
  if (typeof window === "undefined") return;
  if (pending.length === 0) {
    flushScheduled = false;
    return;
  }

  const payload = pending.splice(0, pending.length).map((event) => ({
    ...event,
    timestamp: new Date().toISOString(),
  }));

  const body = JSON.stringify({ events: payload });

  try {
    const url = "/api/analytics/events";
    if (typeof navigator !== "undefined" && navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
      flushScheduled = false;
      return;
    }
    
    // Use fetch directly instead of api to avoid circular dependency
    if (typeof fetch !== "undefined") {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body,
      });
      
      if (!response.ok && process.env.NODE_ENV === "development") {
        console.warn("Analytics dispatch failed", response.statusText);
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Analytics dispatch failed", err);
    }
  } finally {
    flushScheduled = false;
  }
}

export function trackEvent(event: AnalyticsEvent) {
  if (typeof window === "undefined") return;
  if (!event || !event.name) return;

  try {
    const enriched: AnalyticsEvent = {
      ...event,
      context: {
        url: typeof window !== "undefined" ? window.location.href : "",
        referrer: typeof document !== "undefined" ? document.referrer : "",
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
        ...event.context,
      },
    };

    if (process.env.NODE_ENV === "development") {
      console.debug("[analytics]", enriched);
    }

    pending.push(enriched);

    if (!flushScheduled && typeof window !== "undefined") {
      flushScheduled = true;
      window.setTimeout(() => {
        void flushQueue();
      }, 500);
    }
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.warn("Analytics trackEvent error:", err);
    }
  }
}

export function trackPageView(name: string, properties?: Record<string, any>) {
  if (!name) return;
  trackEvent({
    name,
    properties: {
      ...properties,
      eventType: "page_view",
    },
  });
}








