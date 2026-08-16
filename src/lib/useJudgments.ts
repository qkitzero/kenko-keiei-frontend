"use client";

import type { Judgment } from "@/lib/judgment";
import type { Judgments } from "@/lib/trend";
import { useCallback, useEffect, useMemo, useState } from "react";

export const JUDGMENTS_TIMEOUT_MS = 30_000;

export type JudgmentsState =
  | { status: "loading" }
  | { status: "unauthenticated" }
  | {
      status: "ok";
      judgments: Judgments;
      failed: string[];
      retry: () => void;
    };

type Fetched =
  | { status: "ok"; measurementId: string; judgment: Judgment | null }
  | { status: "unauthenticated"; measurementId: string }
  | { status: "error"; measurementId: string };

type Loaded = {
  key: string;
  judgments: Judgments;
  failed: string[];
  unauthenticated: boolean;
};

const EMPTY_JUDGMENTS: Judgments = new Map();

const EMPTY_FAILED: string[] = [];

async function loadJudgment(
  measurementId: string,
  signal: AbortSignal,
): Promise<Fetched> {
  const res = await fetch(
    `/api/fitness/measurement/${measurementId}/judgment`,
    { signal },
  );
  if (res.status === 401) return { status: "unauthenticated", measurementId };
  if (!res.ok) return { status: "error", measurementId };

  const body = (await res.json()) as { judgment?: Judgment } | null;
  const judgment = body?.judgment?.measurementId ? body.judgment : null;
  return { status: "ok", measurementId, judgment };
}

export function useJudgments(measurementIds: string[]): JudgmentsState {
  const key = measurementIds.filter(Boolean).join(",");
  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const retry = useCallback(() => setReloadKey((value) => value + 1), []);

  const requestKey = `${reloadKey}:${key}`;

  useEffect(() => {
    const ids = key.split(",").filter(Boolean);
    if (ids.length === 0) return;

    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), JUDGMENTS_TIMEOUT_MS);

    (async () => {
      const results = await Promise.all(
        ids.map((id) =>
          loadJudgment(id, controller.signal).catch(
            () => ({ status: "error", measurementId: id }) as const,
          ),
        ),
      );
      clearTimeout(timer);
      if (!active) return;

      const judgments: Judgments = new Map();
      const failed: string[] = [];
      let unauthorized = 0;

      for (const result of results) {
        if (result.status === "ok") {
          judgments.set(result.measurementId, result.judgment);
          continue;
        }
        if (result.status === "unauthenticated") unauthorized += 1;
        failed.push(result.measurementId);
      }

      setLoaded({
        key: requestKey,
        judgments,
        failed,
        unauthenticated: unauthorized === ids.length,
      });
    })();

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, [key, requestKey]);

  return useMemo(() => {
    if (key === "") {
      return {
        status: "ok",
        judgments: EMPTY_JUDGMENTS,
        failed: EMPTY_FAILED,
        retry,
      };
    }
    if (loaded?.key !== requestKey) return { status: "loading" };
    if (loaded.unauthenticated) return { status: "unauthenticated" };
    return {
      status: "ok",
      judgments: loaded.judgments,
      failed: loaded.failed,
      retry,
    };
  }, [key, loaded, requestKey, retry]);
}
