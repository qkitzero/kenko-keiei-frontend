import type { components } from "../../gen/training/v1/training_menu.schema";

type Schemas = components["schemas"];

export type TrainingMenu = Schemas["v1TrainingMenu"];
export type TrainingElement = Schemas["v1TrainingElement"];
export type Part = Schemas["v1Part"];
export type TrainingUnit = Schemas["v1TrainingUnit"];

export function trainingMenusById(
  menus: TrainingMenu[],
): Map<string, TrainingMenu> {
  const byId = new Map<string, TrainingMenu>();
  for (const menu of menus) {
    const id = menu.trainingMenuId?.trim().toLowerCase();
    if (id) byId.set(id, menu);
  }
  return byId;
}

export function findTrainingMenu(
  byId: Map<string, TrainingMenu>,
  trainingMenuId: string | undefined,
): TrainingMenu | null {
  const id = trainingMenuId?.trim().toLowerCase();
  return (id && byId.get(id)) || null;
}
