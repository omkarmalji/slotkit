'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * The visitor's IANA time zone, from the browser. `null` on the server and during
 * hydration (the server cannot know it), then the real zone on the client. Using
 * useSyncExternalStore with a null server snapshot is what avoids a hydration mismatch.
 */
export function useVisitorTimeZone(): string | null {
  return useSyncExternalStore(subscribe, getVisitorTimeZone, () => null);
}

export function getVisitorTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}
