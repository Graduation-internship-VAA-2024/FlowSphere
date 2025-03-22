import { NextResponse } from 'next/server';
import axios from 'axios';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const response = await axios.post(
      API_URL,
      {
        model: 'mistralai/mixtral-8x7b-instruct',
        messages: [
          {
            role: 'system',
            content: 'Bạn là trợ lý AI của FlowSphere, một nền tảng quản lý workspace. Hãy trả lời ngắn gọn và hữu ích.'
          },
          ...messages
        ],
        temperature: 0.7,
        max_tokens: 200
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