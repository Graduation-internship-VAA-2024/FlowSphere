import { NextResponse } from 'next/server';
import axios from 'axios';
import { DocumentProcessor } from '@/utils/documentProcessor';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const documentProcessor = new DocumentProcessor();

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const userQuery = messages[messages.length - 1].content.toLowerCase();
    
    // Kiểm tra ý định tạo workspace
    if (userQuery.includes('tạo workspace') || userQuery.includes('tạo một workspace')) {
      return NextResponse.json({
        response: "Bạn muốn đặt tên cho workspace là gì?",
        intent: "create_workspace"
      });
    }

    // Lấy nội dung tài liệu liên quan
    const relevantContent = documentProcessor.getRelevantContent(userQuery);

    // Nếu không có nội dung phù hợp, phản hồi lại
    if (relevantContent === 'Không tìm thấy thông tin liên quan.') {
      return NextResponse.json({
        response: "Xin lỗi, tôi không có thông tin để trả lời câu hỏi này."
      });
    }

    const response = await axios.post(
      API_URL,
      {
        model: 'mistralai/mixtral-8x7b-instruct',
        messages: [
          {
            role: 'system',
            content: `Bạn là trợ lý AI của FlowSphere. Bạn chỉ được trả lời dựa trên tài liệu sau:\n\n${relevantContent}\n\nNếu không tìm thấy thông tin phù hợp, hãy trả lời: "Tôi không có thông tin để trả lời câu hỏi này."`
          },
          {
            role: 'user',
            content: userQuery
          }
        ],
        temperature: 0.3, // Giảm độ sáng tạo để tránh suy diễn
        max_tokens: 400 // Giới hạn số token tránh quá dài
      },
      {
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://flowsphere.vercel.app',
          'X-Title': 'FlowSphere Assistant'
        }
      }
    );

    return NextResponse.json({
      response: response.data.choices[0].message.content
    });

  } catch (error: any) {
    console.error('Chat API Error:', error.response?.data || error);
    return NextResponse.json(
      { error: 'Không thể xử lý yêu cầu' },
      { status: 500 }
    );
  }
}


