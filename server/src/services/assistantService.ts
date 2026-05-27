import { getTodayDashboard } from './dashboardService.js';
import { getAiProvider, type ChatMessage } from './aiService.js';
import { n } from '../utils/numbers.js';

function mealSummary(meals: Awaited<ReturnType<typeof getTodayDashboard>>['meals']) {
  return meals.map((meal) => ({
    name: meal.name,
    status: meal.status,
    plannedCalories: n(meal.plannedCalories),
    actualCalories: n(meal.actualCalories),
    items: meal.items.map((item) => ({
      name: item.nameSnapshot,
      type: item.type,
      calories: n(item.calories),
      protein: n(item.protein)
    }))
  }));
}

function exerciseSummary(exercises: Awaited<ReturnType<typeof getTodayDashboard>>['exercises']) {
  return exercises.map((entry) => ({
    name: entry.exercise.name,
    status: entry.status,
    scheduledDate: entry.scheduledDate.toISOString().slice(0, 10)
  }));
}

export async function buildAssistantContext(userId: string) {
  const dashboard = await getTodayDashboard(userId);
  if (!dashboard.program) {
    return JSON.stringify({ hasProgram: false, message: 'User has no active program.' });
  }

  return JSON.stringify({
    hasProgram: true,
    program: {
      name: dashboard.program.name,
      status: dashboard.program.status
    },
    today: dashboard.dailyLog
      ? {
          date: dashboard.dailyLog.date.toISOString().slice(0, 10),
          calorieTarget: n(dashboard.dailyLog.calorieTarget),
          caloriesActual: n(dashboard.dailyLog.caloriesActual),
          proteinTarget: n(dashboard.dailyLog.proteinTarget),
          proteinActual: n(dashboard.dailyLog.proteinActual),
          complianceScore: n(dashboard.dailyLog.complianceScore)
        }
      : null,
    summary: dashboard.summary,
    meals: mealSummary(dashboard.meals),
    exercises: exerciseSummary(dashboard.exercises),
    weightTrend: dashboard.weightTrend.slice(-7)
  });
}

export async function chatWithAssistant(userId: string, messages: ChatMessage[]) {
  const context = await buildAssistantContext(userId);
  const reply = await getAiProvider().chat(messages, context);
  return { reply, contextUsed: true };
}
