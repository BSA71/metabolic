import { Card } from '../components/ui/Card';

const prompts = ['What meal is next?', 'Where do I stand with calories?', 'What exercises are left?', "Build tomorrow's meals", 'What should I eat to hit protein?', 'Summarize my week'];

export function AssistantPage() {
  return <div className="space-y-6"><h1 className="text-3xl font-bold">AI Assistant</h1><Card><p className="text-slate-500">AI calls stay behind the backend. Food lookup is available from Nutrition, and these prompts define the assistant shell.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{prompts.map((prompt) => <button key={prompt} className="rounded-2xl border border-slate-200 p-4 text-left font-semibold hover:bg-slate-50">{prompt}</button>)}</div></Card></div>;
}
