import { NextResponse } from 'next/server';
import axios from 'axios';
import { DocumentProcessor } from '@/utils/documentProcessor';
import { IntentProcessor } from '@/components/ChatBot/utils/intentProcessor';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const documentProcessor = new DocumentProcessor();
const intentProcessor = new IntentProcessor();

export async function POST(req: Request) {
  try {
    const { messages, workspaceId } = await req.json();
    const userQuery = messages[messages.length - 1].content;

    // Phân tích ý định từ tin nhắn
    const intentMatch = intentProcessor.processIntent(userQuery);

    // Xử lý các ý định khác nhau
    switch (intentMatch.intent) {
      case 'create_workspace':
        if (intentMatch.entities?.name) {
          return NextResponse.json({
            response: `Tôi sẽ tạo workspace với tên "${intentMatch.entities.name}". Bạn xác nhận?`,
            intent: "confirm_workspace_creation",
            data: {
              name: intentMatch.entities.name
            }
          });
        }
        return NextResponse.json({
          response: "Bạn muốn đặt tên cho workspace là gì?",
          intent: "create_workspace"
        });

      case 'create_project':
        // 1. Kiểm tra workspace
        if (!workspaceId) {
          return NextResponse.json({
            response: `Để tạo project, bạn cần chọn một workspace trước.
            
Vui lòng thực hiện các bước sau:
1. Chọn workspace từ menu điều hướng
2. Hoặc tạo workspace mới nếu chưa có
3. Sau đó quay lại đây để tạo project`,
            intent: "require_workspace_selection",
            suggestedActions: ["select_workspace", "create_workspace"]
          });
        }

        // 2. Xử lý tên project
        if (intentMatch.entities?.name) {
          const projectName = intentMatch.entities.name;
          
          // Kiểm tra tên hợp lệ
          if (projectName.length < 3) {
            return NextResponse.json({
              response: `Tên project cần có ít nhất 3 ký tự. Vui lòng chọn tên khác.`,
              intent: "create_project",
              error: "invalid_name"
            });
          }

          // Kiểm tra ký tự đặc biệt
          if (!/^[a-zA-Z0-9-_ ]+$/.test(projectName)) {
            return NextResponse.json({
              response: `Tên project chỉ được chứa chữ cái, số, gạch ngang và gạch dưới.
              
Vui lòng chọn tên khác không có ký tự đặc biệt.`,
              intent: "create_project",
              error: "invalid_characters"
            });
          }

          return NextResponse.json({
            response: `Tôi sẽ tạo project với tên "${projectName}" trong workspace hiện tại.

Thông tin project:
• Tên: ${projectName}
• Workspace: ${workspaceId}

Bạn xác nhận tạo project này?`,
            intent: "confirm_project_creation",
            data: {
              name: projectName,
              workspaceId,
              timestamp: Date.now()
            }
          });
        }

        // 3. Yêu cầu tên nếu chưa có
        return NextResponse.json({
          response: `Bạn muốn đặt tên cho project là gì?

Gợi ý đặt tên:
• Ngắn gọn và dễ nhớ (ít nhất 3 ký tự)
• Phản ánh mục đích của project
• Chỉ sử dụng chữ cái, số, gạch ngang và gạch dưới
• Không dùng ký tự đặc biệt khác`,
          intent: "create_project",
          workspaceId
        });

      case 'set_name':
        // Xử lý đặt tên cho workspace hoặc project đang được tạo
        return NextResponse.json({
          response: `Xác nhận đặt tên "${intentMatch.entities?.name}"?`,
          intent: "confirm_name",
          data: {
            name: intentMatch.entities?.name
          }
        });

      default:
        // Tiếp tục xử lý các câu hỏi thông thường
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
    }

  } catch (error: any) {
    console.error('Chat API Error:', error.response?.data || error);
    return NextResponse.json(
      { error: 'Không thể xử lý yêu cầu' },
      { status: 500 }
    );
  }
}