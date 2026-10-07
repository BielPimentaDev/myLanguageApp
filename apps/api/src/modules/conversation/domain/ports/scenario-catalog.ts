import type { Scenario } from '../entities/scenario.js';

export interface ScenarioCatalog {
  findById(id: string): Scenario | null;
  listAll(): Scenario[];
}
