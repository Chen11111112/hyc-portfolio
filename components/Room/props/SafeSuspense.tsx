"use client";

import { Component, Suspense, type ReactNode } from "react";

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

/**
 * Suspense for texture loads that also catches load errors: a missing or rejected image shows
 * `fallback` instead of throwing and taking the whole 3D canvas down with it.
 */
export default function SafeSuspense({ fallback, children }: { fallback: ReactNode; children: ReactNode }) {
  return (
    <Boundary fallback={fallback}>
      <Suspense fallback={fallback}>{children}</Suspense>
    </Boundary>
  );
}
