import { describe, expect, it } from 'vitest';
import { StaticScenarioCatalog } from '../../../../../src/modules/conversation/domain/scenario-catalog/static-scenario-catalog.js';
import { CAFETERIA_SCENARIO_ID } from '../../../../../src/modules/conversation/domain/scenario-catalog/scenarios.js';

describe('StaticScenarioCatalog', () => {
  it('finds the cafeteria scenario by id', () => {
    const catalog = new StaticScenarioCatalog();
    const scenario = catalog.findById(CAFETERIA_SCENARIO_ID);
    expect(scenario?.id).toBe(CAFETERIA_SCENARIO_ID);
    expect(scenario?.name).toBeTruthy();
    expect(scenario?.systemPrompt).toBeTruthy();
  });

  it('returns null for an unknown scenario id', () => {
    const catalog = new StaticScenarioCatalog();
    expect(catalog.findById('unknown')).toBeNull();
  });

  it('lists all scenarios in the catalog', () => {
    const catalog = new StaticScenarioCatalog();
    const scenarios = catalog.listAll();
    expect(scenarios).toHaveLength(1);
    expect(scenarios[0]?.id).toBe(CAFETERIA_SCENARIO_ID);
  });
});
