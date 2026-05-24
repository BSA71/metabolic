export type FoodEstimate = { normalizedFoodName: string; calories: number; protein: number; carbs: number; fat: number; confidence: number };

export interface AiProvider {
  lookupFood(input: string): Promise<FoodEstimate>;
}

class MockAiProvider implements AiProvider {
  async lookupFood(input: string): Promise<FoodEstimate> {
    const lower = input.toLowerCase();
    const protein = lower.includes('chicken') ? 42 : lower.includes('egg') ? 18 : 24;
    const carbs = lower.includes('rice') ? 45 : lower.includes('banana') ? 27 : 20;
    const fat = lower.includes('salmon') ? 14 : lower.includes('avocado') ? 18 : 6;
    return {
      normalizedFoodName: input.trim().replace(/\s+/g, ' '),
      calories: Math.round(protein * 4 + carbs * 4 + fat * 9),
      protein,
      carbs,
      fat,
      confidence: 0.72
    };
  }
}

export function getAiProvider(): AiProvider {
  return new MockAiProvider();
}
