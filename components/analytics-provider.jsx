"use client";

import { TempsAnalyticsProvider } from "@temps-sdk/react-analytics";

export default function AnalyticsProvider({ children }) {
  return (
    <TempsAnalyticsProvider
      autoTrackPageviews
      autoTrackPageLeave
      autoTrackSpeedAnalytics
      autoTrackEngagement
      ignoreLocalhost
      enableSessionRecording={false}
    >
      {children}
    </TempsAnalyticsProvider>
  );
}
