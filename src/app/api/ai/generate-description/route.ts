import { NextResponse } from "next/server";
import axios from "axios";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MAX_DESCRIPTION_LENGTH = 2000; // Để lại buffer 48 ký tự

export async function POST(req: Request) {
  try {
    const { prompt, taskTitle } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const systemPrompt = `You are an AI assistant specialized in writing detailed task descriptions.
Your job is to create a clear, helpful description based on the user's input.
Format your response using Markdown, including:
- Bullet points for steps or key items
- Headers for sections where appropriate
- Code blocks if technical details are involved

IMPORTANT: Your response MUST be under ${MAX_DESCRIPTION_LENGTH} characters total. Keep your response concise.

Keep your response professional, focused only on the task description.
Do not include any meta-commentary about your role or the generation process.`;

    const response = await axios.post(
      API_URL,
      {
        model: "mistralai/mixtral-8x7b-instruct",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Task Title: ${
              taskTitle || "Untitled Task"
            }\n\nPlease create a detailed description for this task based on the following prompt: ${prompt}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 700, // Giảm số lượng token để đảm bảo không vượt quá giới hạn
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "HTTP-Referer": "https://flowsphere.vercel.app",
          "X-Title": "FlowSphere",
        },
      }
    );

    let description = response.data.choices[0].message.content;

    // Đảm bảo không vượt quá giới hạn ký tự
    if (description.length > MAX_DESCRIPTION_LENGTH) {
      description = description.substring(0, MAX_DESCRIPTION_LENGTH);
      // Tìm vị trí xuống dòng gần nhất để cắt cho đẹp
      const lastNewlinePos = description.lastIndexOf("\n");
      if (lastNewlinePos > MAX_DESCRIPTION_LENGTH * 0.8) {
        description = description.substring(0, lastNewlinePos);
      }
      description += "\n\n[Content truncated due to length limits]";
    }

    return NextResponse.json({
      description,
      truncated:
        description.length < response.data.choices[0].message.content.length,
    });
  } catch (error: any) {
    console.error(
      "AI Description Generation Error:",
      error.response?.data || error
    );
    return NextResponse.json(
      { error: "Failed to generate description" },
      { status: 500 }
    );
  }
}
