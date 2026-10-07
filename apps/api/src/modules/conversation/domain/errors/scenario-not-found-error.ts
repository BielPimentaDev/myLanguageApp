export class ScenarioNotFoundError extends Error {
  constructor(scenarioId: string) {
    super(`Scenario ${scenarioId} not found`);
    this.name = 'ScenarioNotFoundError';
  }
}
