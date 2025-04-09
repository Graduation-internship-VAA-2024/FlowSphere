import { NextResponse } from "next/server";
import axios from "axios";

// Sử dụng Google Generative AI API key
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Messages array is required" },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      console.error(
        "Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    // Chuyển đổi tin nhắn sang định dạng Gemini API
    // Gemini không sử dụng cùng định dạng role như OpenRouter/OpenAI
    // Chỉ giữ lại tin nhắn cuối cùng để gửi đến Gemini do model này không tốt trong việc xử lý lịch sử hội thoại
    const lastUserMessage = messages.filter((msg) => msg.role === "user").pop();

    // Nếu không tìm thấy tin nhắn người dùng, trả về lỗi
    if (!lastUserMessage) {
      return NextResponse.json(
        { error: "No user message found" },
        { status: 400 }
      );
    }

    // Sử dụng Gemini 2.0 API
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

    console.log(`Sending chat request to Gemini 2.0 Flash API`);

    const response = await axios.post(
      apiUrl,
      {
        contents: [
          {
            parts: [{ text: lastUserMessage.content }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Response status:", response.status);

    // Kiểm tra và xử lý phản hồi từ Gemini
    if (
      !response.data ||
      !response.data.candidates ||
      !response.data.candidates[0]
    ) {
      console.error(
        "Unexpected Gemini API response structure:",
        JSON.stringify(response.data, null, 2)
      );
      return NextResponse.json({
        response:
          "Rất tiếc, tôi không thể xử lý yêu cầu của bạn. Vui lòng thử lại sau hoặc kết thúc phân tích để sử dụng chatbot thông thường.",
      });
    }

    const responseContent = response.data.candidates[0].content.parts[0].text;
    console.log("Chat response received successfully");

    return NextResponse.json({
      response: responseContent,
    });
  } catch (error: any) {
    console.error("Gemini Chat Error:", error.response?.data || error);
    // Log chi tiết hơn để giúp debug
    if (error.response) {
      console.error("Error response status:", error.response.status);
      console.error("Error response data:", error.response.data);
    }
    return NextResponse.json(
      {
        error: "Failed to process chat message",
        message: error.message,
        response:
          "Rất tiếc, tôi không thể xử lý yêu cầu của bạn. Vui lòng thử lại sau hoặc kết thúc phân tích để sử dụng chatbot thông thường.",
      },
      { status: 500 }
    );
  }
}
