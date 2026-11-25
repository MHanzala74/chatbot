"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", padding: "2rem" }}>
        <h2>Something went wrong.</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
