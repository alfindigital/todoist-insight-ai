import React, { useState, useEffect } from 'react';
import { DashboardData } from '../types';
import { calculateCompletionRates } from '../utils/calculateCompletionRates';
import { BsQuestionCircle, BsStars } from 'react-icons/bs';
import { Tooltip } from 'react-tooltip';

interface AIInsight {
  type: string;
  title: string;
  description: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
}

interface AIRecommendation {
  title: string;
  description: string;
  icon: string;
  category: 'time_management' | 'focus' | 'organization' | 'motivation';
}

interface AIPrediction {
  title: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
}

interface AIResponse {
  insights: AIInsight[];
  recommendations: AIRecommendation[];
  predictions: AIPrediction[];
}

interface AIInsightsProps {
  allData: DashboardData | null;
  isLoading: boolean;
}

const AIInsights: React.FC<AIInsightsProps> = ({ allData, isLoading }) => {
  const [aiData, setAiData] = useState<AIResponse | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateAIInsights = async () => {
    if (!allData || loadingAI) return;

    setLoadingAI(true);
    setError(null);

    try {
      // Calculate productivity score
      const completionRates = calculateCompletionRates(allData.allCompletedTasks);
      const productivityScore = Math.min(
        100,
        Math.round(
          completionRates.weeklyCompletionRate * 40 +
          completionRates.monthlyCompletionRate * 30 +
          (allData.allCompletedTasks.length > 50 ? 30 : (allData.allCompletedTasks.length / 50) * 30)
        )
      );

      const taskData = {
        activeTasks: allData.activeTasks || [],
        completedTasks: allData.allCompletedTasks || [],
        projectData: allData.projectData || [],
        karma: allData.karma || 0,
        productivityScore,
        completionRates
      };

      const response = await fetch('/api/gemini-insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ taskData }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate insights: ${response.statusText}`);
      }

      const aiResponse: AIResponse = await response.json();
      setAiData(aiResponse);
    } catch (err) {
      console.error('Error generating AI insights:', err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan saat menganalisis data');
    } finally {
      setLoadingAI(false);
    }
  };

  useEffect(() => {
    if (allData && !isLoading) {
      generateAIInsights();
    }
  }, [allData, isLoading]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-500/10';
      case 'medium': return 'border-yellow-500 bg-yellow-500/10';
      case 'low': return 'border-green-500 bg-green-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'time_management': return 'border-blue-500 bg-blue-500/10';
      case 'focus': return 'border-purple-500 bg-purple-500/10';
      case 'organization': return 'border-green-500 bg-green-500/10';
      case 'motivation': return 'border-orange-500 bg-orange-500/10';
      default: return 'border-gray-500 bg-gray-500/10';
    }
  };

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (!allData) {
    return (
      <div className="w-full h-96 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading AI insights...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-6 ${isLoading ? 'opacity-50' : ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BsStars className="text-2xl text-blue-400" />
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            AI Insights
          </h2>
          <BsQuestionCircle
            className="text-gray-400 hover:text-gray-300 cursor-help"
            data-tooltip-id="ai-insights-tooltip"
            data-tooltip-content="Insight AI yang dihasilkan oleh Gemini berdasarkan analisis data tugas Todoist Anda"
          />
        </div>
        <button
          onClick={generateAIInsights}
          disabled={loadingAI}
          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg transition-colors flex items-center space-x-2"
        >
          {loadingAI ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
              <span>Menganalisis...</span>
            </>
          ) : (
            <>
              <BsStars className="text-sm" />
              <span>Refresh AI</span>
            </>
          )}
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
          <h3 className="text-red-400 font-semibold mb-2">Error</h3>
          <p className="text-gray-300">{error}</p>
          <button
            onClick={generateAIInsights}
            className="mt-3 px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm transition-colors"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Loading State */}
      {loadingAI && (
        <div className="bg-gray-800 rounded-lg p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">AI sedang menganalisis data tugas Anda...</p>
        </div>
      )}

      {/* AI Data Display */}
      {aiData && !loadingAI && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Insights */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              📊 Insights
              <BsQuestionCircle
                className="ml-2 text-gray-400 hover:text-gray-300 cursor-help"
                data-tooltip-id="ai-insights-tooltip"
                data-tooltip-content="Wawasan berdasarkan analisis pola produktivitas Anda"
              />
            </h3>
            <div className="space-y-4">
              {aiData.insights.map((insight, index) => (
                <div
                  key={index}
                  className={`border-l-4 p-4 rounded-r-lg ${getPriorityColor(insight.priority)}`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{insight.icon}</span>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-300">{insight.description}</p>
                      <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
                        insight.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                        insight.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                        'bg-green-500/20 text-green-300'
                      }`}>
                        {insight.priority === 'high' ? 'Prioritas Tinggi' :
                         insight.priority === 'medium' ? 'Prioritas Sedang' :
                         'Prioritas Rendah'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              💡 Rekomendasi
              <BsQuestionCircle
                className="ml-2 text-gray-400 hover:text-gray-300 cursor-help"
                data-tooltip-id="ai-insights-tooltip"
                data-tooltip-content="Saran actionable untuk meningkatkan produktivitas"
              />
            </h3>
            <div className="space-y-4">
              {aiData.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className={`border-l-4 p-4 rounded-r-lg ${getCategoryColor(rec.category)}`}
                >
                  <div className="flex items-start space-x-3">
                    <span className="text-2xl">{rec.icon}</span>
                    <div>
                      <h4 className="font-semibold text-white mb-1">{rec.title}</h4>
                      <p className="text-sm text-gray-300">{rec.description}</p>
                      <span className={`text-xs px-2 py-1 rounded mt-2 inline-block ${
                        rec.category === 'time_management' ? 'bg-blue-500/20 text-blue-300' :
                        rec.category === 'focus' ? 'bg-purple-500/20 text-purple-300' :
                        rec.category === 'organization' ? 'bg-green-500/20 text-green-300' :
                        'bg-orange-500/20 text-orange-300'
                      }`}>
                        {rec.category === 'time_management' ? 'Manajemen Waktu' :
                         rec.category === 'focus' ? 'Fokus' :
                         rec.category === 'organization' ? 'Organisasi' :
                         'Motivasi'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Predictions */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold mb-4 flex items-center">
              🔮 Prediksi
              <BsQuestionCircle
                className="ml-2 text-gray-400 hover:text-gray-300 cursor-help"
                data-tooltip-id="ai-insights-tooltip"
                data-tooltip-content="Prediksi berdasarkan pola dan tren data Anda"
              />
            </h3>
            <div className="space-y-4">
              {aiData.predictions.length > 0 ? aiData.predictions.map((pred, index) => (
                <div
                  key={index}
                  className="border border-gray-600 p-4 rounded-lg bg-gray-700/50"
                >
                  <h4 className="font-semibold text-white mb-1">{pred.title}</h4>
                  <p className="text-sm text-gray-300 mb-2">{pred.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">Tingkat Kepercayaan:</span>
                    <span className={`text-xs font-semibold ${getConfidenceColor(pred.confidence)}`}>
                      {pred.confidence === 'high' ? 'Tinggi' :
                       pred.confidence === 'medium' ? 'Sedang' :
                       'Rendah'}
                    </span>
                  </div>
                </div>
              )) : (
                <div className="text-center text-gray-400 py-8">
                  <span className="text-4xl mb-4 block">🔮</span>
                  <p>Belum ada prediksi yang tersedia.</p>
                  <p className="text-sm">Kumpulkan lebih banyak data untuk mendapatkan prediksi AI.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Tooltip
        id="ai-insights-tooltip"
        place="top"
        className="max-w-xs text-center"
      />
    </div>
  );
};

export default AIInsights;