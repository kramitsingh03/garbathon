// Demo-only analysis. Replace with a Google Gemini-backed service during integration.
export function analyzeScenario(scenario) {
  return {
    risk: scenario.risk,
    explanation: scenario.explanation,
    phrases: scenario.phrases,
    action: scenario.action,
    source: 'Simulated demo analysis',
  }
}
