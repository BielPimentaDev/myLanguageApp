import type { Scenario } from '../entities/scenario.js';
import type { ScenarioCatalog } from '../ports/scenario-catalog.js';
import { SCENARIOS } from './scenarios.js';

export class StaticScenarioCatalog implements ScenarioCatalog {
  findById(id: string): Scenario | null {
    return SCENARIOS.find((scenario) => scenario.id === id) ?? null;
  }

  listAll(): Scenario[] {
    return [...SCENARIOS];
  }
}
