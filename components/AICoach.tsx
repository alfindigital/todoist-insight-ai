import React, { useState, useCallback, memo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import { DashboardData, AIInsightSummary } from '../types';
import { calculateMostProductiveDay } from '../utils/calculateMostProductiveDay';
import { calculateMostProductiveTimeOfDay } from '../utils/calculateMostProductiveTimeOfDay';
import { calculateMostProductiveDayOfWeek } from '../utils/calculateMostProductiveDayOfWeek';
import { calculateCompletionRates } from '../utils/calculateCompletionRates';
import { getDayOfWeekName } from '../utils/getDayOfWeekName';

const DAY_MS = 1000 * 60 * 60 * 24;

// Build a compact, privacy-conscious summary of the user's productivity data.
// We intentionally send aggregates + small samples rather than every raw task,
// to keep the AI prompt small, fast, and inexpensive.
function buildSummary(allData: DashboardData): AIInsightSummary {
  const completed = allData.allCompletedTasks || [];
  const active = allData.activeTasks || [];
  const projects = allData.projectData || [];
  const now = new Date();

  const mostProductiveDay = calculateMostProductiveDay(completed);
  const focusTimeRange = calculateMostProductiveTimeOfDay(completed);
  const dayOfWeek = calculateMostProductiveDayOfWeek(completed);
  const rates = calculateCompletionRates(completed);

  // Mirror the productivity score shown in the Insights panel so the AI's
  // narrative stays consistent with what the user sees on the dashboard.
  const productivityScore = Math.min(
    100,
    Math.round(
      rates.weeklyCompletionRate * 40 +
        rates.monthlyCompletionRate * 30 +
        ((mostProductiveDay?.count || 0) > 5 ? 30 : (mostProductiveDay?.count || 0) * 6)
    )
  );

  const topProjects = projects
    .filter((p) => p.name !== 'Inbox')
    .map((p) => ({
      name: p.name,
      completedTasks: completed.filter((t) => t.project_id === p.id).length,
    }))
    .sort((a, b) => b.completedTasks - a.completedTasks)
    .slice(0, 6);

  const recentCompletedSample = [...completed]
    .sort((a, b) => new Date(b.completed_at).getTime() - new Date(a.completed_at).getTime())
    .slice(0, 15)
    .map((t) => t.content);

  const neglectedActiveTasks = [...active]
    .filter((t) => Boolean(t.createdAt))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, 8)
    .map((t) => ({
      content: t.content,
      ageDays: Math.max(0, Math.floor((now.getTime() - new Date(t.createdAt).getTime()) / DAY_MS)),
    }));

  const last7DaysCompleted: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    const dayString = day.toDateString();
    last7DaysCompleted.push(
      completed.filter((t) => new Date(t.completed_at).toDateString() === dayString).length
    );
  }

  // Todoist API priority: 4 = highest (p1) ... 1 = lowest (p4).
  const tasksByPriority = { p1: 0, p2: 0, p3: 0, p4: 0 };
  for (const t of active) {
    if (t.priority === 4) tasksByPriority.p1 += 1;
    else if (t.priority === 3) tasksByPriority.p2 += 1;
    else if (t.priority === 2) tasksByPriority.p3 += 1;
    else tasksByPriority.p4 += 1;
  }

  return {
    generatedAt: now.toISOString(),
    totalCompletedTasks: completed.length,
    activeTaskCount: active.length,
    projectCount: projects.length,
    karma: allData.karma || 0,
    karmaTrend: allData.karmaTrend || 'none',
    dailyGoal: allData.dailyGoal || 0,
    weeklyGoal: allData.weeklyGoal || 0,
    productivityScore,
    mostProductiveDay,
    focusTimeRange,
    bestDayOfWeek: dayOfWeek
      ? { day: getDayOfWeekName(dayOfWeek.dayOfWeek), averageCount: Math.round(dayOfWeek.averageCount) }
      : null,
    completionRates: {
      daily: Math.round(rates.dailyCompletionRate),
      weekly: Math.round(rates.weeklyCompletionRate),
      monthly: Math.round(rates.monthlyCompletionRate),
    },
    last7DaysCompleted,
    topProjects,
    recentCompletedSample,
    neglectedActiveTasks,
    tasksByPriority,
  };
}

// Style the AI's Markdown output to fit the dark dashboard theme.
const markdownComponents: Components = {
  h1: ({ children }) => <h3 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h3>,
  h2: ({ children }) => <h3 className="text-lg font-semibold text-white mt-4 mb-2">{children}</h3>,
  h3: ({ children }) => <h4 className="text-base font-semibold text-white mt-3 mb-1">{children}</h4>,
  p: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 mb-3 text-gray-300">{children}</ul>,
  ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 mb-3 text-gray-300">{children}</ol>,
  li: ({ children }) => <li className="text-gray-300 leading-relaxed">{children}</li>,
  strong: ({ children }) => <strong className="text-white font-semibold">{children}</strong>,
  em: ({ children }) => <em className="italic">{children}</em>,
  a: ({ children, href }) => (
    <a href={href} target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">
      {children}
    </a>
  ),
};

interface AICoachProps {
  allData: DashboardData;
}

const AICoach: React.FC<AICoachProps> = ({ allData }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    setError(null);
    setIsGenerating(true);
    try {
      const summary = buildSummary(allData);
      const response = await fetch('/api/ai-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ summary }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.details || data?.error || `Request failed (${response.status})`);
      }
      setInsight(typeof data.insight === 'string' ? data.insight : null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while contacting the AI.');
    } finally {
      setIsGenerating(false);
    }
  }, [allData]);

  const hasData =
    (allData.allCompletedTasks?.length || 0) > 0 || (allData.activeTasks?.length || 0) > 0;

  return (
    <div className="bg-gray-800 rounded-xl p-4 sm:p-6 shadow-lg border border-gray-700/50">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            ✨ AI Productivity Coach
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            A personalized analysis of your tasks, powered by Claude.
          </p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !hasData}
          className="shrink-0 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm text-white"
        >
          {isGenerating ? 'Analyzing…' : insight ? '↻ Regenerate' : '✨ Analyze with AI'}
        </button>
      </div>

      {!hasData && (
        <p className="text-gray-400 text-sm">
          No task data yet. Once your Todoist tasks load, you can generate an AI analysis.
        </p>
      )}

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-800/40 rounded-lg text-sm text-red-300">
          {error}
        </div>
      )}

      {isGenerating && (
        <div className="flex items-center gap-3 text-gray-400 py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500" />
          <span>Claude is analyzing your productivity…</span>
        </div>
      )}

      {!isGenerating && !insight && !error && hasData && (
        <p className="text-gray-400 text-sm">
          Click <span className="text-gray-300 font-medium">&ldquo;Analyze with AI&rdquo;</span> to get
          a short, personalized read on how you&apos;re doing and what to focus on next.
        </p>
      )}

      {!isGenerating && insight && (
        <div className="mt-2">
          <ReactMarkdown components={markdownComponents}>{insight}</ReactMarkdown>
          <p className="text-[11px] text-gray-600 mt-4 pt-3 border-t border-gray-700/50">
            Generated by AI from your Todoist data — use your own judgment.
          </p>
        </div>
      )}
    </div>
  );
};

export default memo(AICoach);
