import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getServerSession } from 'next-auth/next';

interface TaskData {
  activeTasks: any[];
  completedTasks: any[];
  projectData: any[];
  karma: number;
  productivityScore: number;
  completionRates: {
    dailyCompletionRate: number;
    weeklyCompletionRate: number;
    monthlyCompletionRate: number;
  };
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res, {});
    
    if (!session) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Gemini API key not configured' });
    }

    const { taskData }: { taskData: TaskData } = req.body;

    if (!taskData) {
      return res.status(400).json({ message: 'Task data required' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Prepare task data summary for AI analysis
    const taskSummary = {
      activeTasks: taskData.activeTasks?.length || 0,
      completedTasks: taskData.completedTasks?.length || 0,
      projects: taskData.projectData?.length || 0,
      karma: taskData.karma || 0,
      productivityScore: taskData.productivityScore || 0,
      completionRates: taskData.completionRates || {},
      topProjects: taskData.projectData?.slice(0, 5).map(p => ({
        name: p.name,
        activeTasksCount: taskData.activeTasks?.filter(t => t.projectId === p.id).length || 0
      })) || [],
      recentCompletedTasks: taskData.completedTasks?.slice(0, 10).map(t => ({
        content: t.content,
        completedAt: t.completed_at,
        projectId: t.project_id
      })) || [],
      overdueTasks: taskData.activeTasks?.filter(t => t.due && new Date(t.due.date) < new Date()).length || 0,
      highPriorityTasks: taskData.activeTasks?.filter(t => t.priority >= 3).length || 0
    };

    const prompt = `
    Anda adalah AI assistant untuk produktivitas yang akan menganalisis data tugas Todoist pengguna dan memberikan wawasan yang bermanfaat dalam bahasa Indonesia.

    Data Tugas Pengguna:
    - Tugas Aktif: ${taskSummary.activeTasks}
    - Tugas Selesai: ${taskSummary.completedTasks}
    - Jumlah Proyek: ${taskSummary.projects}
    - Karma Todoist: ${taskSummary.karma}
    - Skor Produktivitas: ${taskSummary.productivityScore}/100
    - Tingkat Penyelesaian Harian: ${taskSummary.completionRates.dailyCompletionRate?.toFixed(1)}%
    - Tingkat Penyelesaian Mingguan: ${taskSummary.completionRates.weeklyCompletionRate?.toFixed(1)}%
    - Tingkat Penyelesaian Bulanan: ${taskSummary.completionRates.monthlyCompletionRate?.toFixed(1)}%
    - Tugas Terlambat: ${taskSummary.overdueTasks}
    - Tugas Prioritas Tinggi: ${taskSummary.highPriorityTasks}

    Proyek Teratas:
    ${taskSummary.topProjects.map(p => `- ${p.name}: ${p.activeTasksCount} tugas aktif`).join('\n')}

    Tugas yang Baru Diselesaikan:
    ${taskSummary.recentCompletedTasks.slice(0, 5).map(t => `- ${t.content}`).join('\n')}

    Berikan analisis dalam format JSON dengan struktur berikut:
    {
      "insights": [
        {
          "type": "productivity",
          "title": "Judul Insight",
          "description": "Deskripsi detail",
          "icon": "📊",
          "priority": "high|medium|low"
        }
      ],
      "recommendations": [
        {
          "title": "Judul Rekomendasi",
          "description": "Deskripsi actionable",
          "icon": "💡",
          "category": "time_management|focus|organization|motivation"
        }
      ],
      "predictions": [
        {
          "title": "Prediksi",
          "description": "Prediksi berdasarkan pola",
          "confidence": "high|medium|low"
        }
      ]
    }

    Fokus pada:
    1. Analisis pola produktivitas
    2. Identifikasi area yang perlu diperbaiki
    3. Rekomendasi praktis untuk meningkatkan efisiensi
    4. Prediksi berdasarkan tren data
    5. Tips manajemen waktu yang personal

    Pastikan semua text dalam bahasa Indonesia dan berikan insights yang actionable dan relevan.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let aiInsights;
    try {
      // Clean the response text to extract JSON
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        aiInsights = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      // Fallback response
      aiInsights = {
        insights: [
          {
            type: "productivity",
            title: "Analisis Sedang Diproses",
            description: "Sistem AI sedang menganalisis data Anda. Silakan coba lagi dalam beberapa saat.",
            icon: "🔄",
            priority: "medium"
          }
        ],
        recommendations: [
          {
            title: "Coba Lagi Nanti",
            description: "Refresh halaman untuk mendapatkan insight AI yang baru.",
            icon: "🔄",
            category: "time_management"
          }
        ],
        predictions: []
      };
    }

    res.status(200).json(aiInsights);
  } catch (error) {
    console.error('Error generating AI insights:', error);
    res.status(500).json({ 
      message: 'Error generating insights',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}