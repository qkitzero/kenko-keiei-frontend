"use client";

import type { TrainingMenu } from "@/lib/trainingMenu";
import { useResource, type ResourceState } from "@/lib/useResource";

const TRAINING_MENUS_URL = "/api/fitness/training-menus";

function selectTrainingMenus(body: unknown): TrainingMenu[] {
  const data = body as { trainingMenus?: TrainingMenu[] } | null;
  return (data?.trainingMenus ?? []).filter((menu) => menu.trainingMenuId);
}

export function useTrainingMenus(): ResourceState<TrainingMenu[]> {
  return useResource(TRAINING_MENUS_URL, selectTrainingMenus);
}
