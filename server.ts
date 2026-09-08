import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY is required in environment variables');
    }
    aiClient = new GoogleGenAI({ 
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API routes
  app.post("/api/analyze-expenses", async (req, res) => {
    try {
      const { expenses, timeRangeLabel } = req.body;
      if (!expenses || !Array.isArray(expenses) || expenses.length === 0) {
        return res.json({ analysis: "暂无消费数据可分析。" });
      }
      
      const periodLabel = timeRangeLabel || "该时间段";

      const prompt = `
作为专业财务顾问，请对以下【${periodLabel}】的消费记录进行极其简短、精炼的财务诊断。
要求：
1. 诊断问题：结合时间段跨度，直接指出不必要的劣质开支（如冲动消费、高频餐饮等）。
2. 提供建议：一句话说明改进方案及潜在的现金流释放量。
3. 保持客观：使用财务专业术语（如现金流漏损、非必要支出率），语言简明扼要（控制在150字以内）。
输出格式要求为无多余废话的 Markdown 列表。

消费记录：
${JSON.stringify(expenses, null, 2)}
`;

      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "分析请求失败，请检查服务器配置或稍后再试。" });
    }
  });

  app.post("/api/analyze-debts", async (req, res) => {
    try {
      const { debts } = req.body;
      if (!debts || !Array.isArray(debts) || debts.length === 0) {
        return res.json({ analysis: "暂无债务数据可分析。" });
      }

      const prompt = `
作为专业财务顾问，请对以下用户的负债情况进行极其简短、精炼的财务结构诊断。
要求：
1. 风险评估：直接指出高息或不良债务（如网贷、高息信用卡），简述流动性风险。
2. 优化建议：一句话给出债务重组或偿还优先级建议（如雪崩法、雪球法）。
3. 保持客观：使用财务专业术语（如债务成本、流动性压力、利息侵蚀），语言简明扼要（控制在150字以内）。
输出格式要求为无多余废话的 Markdown 列表。

债务记录：
${JSON.stringify(debts, null, 2)}
`;

      const ai = getAI();
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
      });

      res.json({ analysis: response.text });
    } catch (error: any) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: error.message || "分析请求失败，请检查服务器配置或稍后再试。" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
