interface IntentAnalysis {
  type: 'create_workspace' | 'question' | 'unknown';
  confidence: number;
  context?: {
    purpose?: string;
    projectType?: string;
    teamSize?: string;
    suggestedName?: string;
  };
}

export class IntentAnalyzer {
  private workspaceKeywords = {
    direct: ['tạo workspace', 'tạo dự án', 'tạo project', 'workspace mới'],
    indirect: ['cần nơi làm việc', 'muốn quản lý', 'tìm chỗ', 'không gian làm việc'],
    projectTypes: ['phần mềm', 'marketing', 'thiết kế', 'kinh doanh', 'nghiên cứu'],
    actions: ['quản lý', 'tổ chức', 'làm việc', 'lưu trữ', 'theo dõi']
  };

  analyzeIntent(message: string): IntentAnalysis {
    const normalizedMessage = message.toLowerCase();
    let confidence = 0;
    let context = {};

    // Kiểm tra yêu cầu trực tiếp
    if (this.workspaceKeywords.direct.some(kw => normalizedMessage.includes(kw))) {
      confidence = 0.9;
    }
    // Kiểm tra yêu cầu gián tiếp
    else if (this.workspaceKeywords.indirect.some(kw => normalizedMessage.includes(kw))) {
      confidence = 0.7;
    }

    // Phân tích ngữ cảnh
    const projectType = this.workspaceKeywords.projectTypes.find(type => 
      normalizedMessage.includes(type)
    );
    const action = this.workspaceKeywords.actions.find(act => 
      normalizedMessage.includes(act)
    );

    if (projectType || action) {
      confidence = Math.max(confidence, 0.6);
      context = {
        projectType,
        purpose: action
      };
    }

    if (confidence > 0.5) {
      return {
        type: 'create_workspace',
        confidence,
        context
      };
    }

    return {
      type: 'unknown',
      confidence: 0
    };
  }

  generateResponse(analysis: IntentAnalysis): string {
    if (analysis.type === 'create_workspace') {
      const { context } = analysis;
      let response = 'Tôi hiểu bạn đang cần một workspace';
      
      if (context?.projectType) {
        response += ` cho dự án ${context.projectType}`;
      }
      if (context?.purpose) {
        response += ` để ${context.purpose}`;
      }

      response += `\n\nTôi có thể giúp bạn tạo workspace phù hợp với nhu cầu của bạn.`;
      
      // Nếu có đủ thông tin, đề xuất tên
      if (context?.projectType && context?.purpose) {
        const suggestedName = `${context.projectType}-${context.purpose}`.replace(/\s+/g, '-');
        response += `\n\nĐề xuất tên workspace: "${suggestedName}"`;
      }

      response += '\n\nBạn muốn đặt tên cho workspace là gì?';
      return response;
    }

    return '';
  }
}