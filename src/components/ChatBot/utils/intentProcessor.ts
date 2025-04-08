import { IntentAnalyzer } from "./intentAnalyzer";

interface IntentMatch {
  intent: string;
  confidence: number;
  entities?: {
    name?: string;
    type?: string;
    description?: string;
  };
}

export class IntentProcessor {
  private intentAnalyzer: IntentAnalyzer;
  private commonPhrases = {
    workspace: {
      create: [
        "tạo workspace",
        "tạo một workspace",
        "create workspace",
        "tạo không gian làm việc",
        "thiết lập workspace",
        "muốn có workspace",
        "cần workspace",
        "workspace mới",
      ],
      name: [
        "tên là",
        "đặt tên",
        "gọi là",
        "named",
        "called",
        "có tên",
        "tên workspace",
        "workspace name",
      ],
    },
    project: {
      create: [
        "tạo project",
        "tạo một project",
        "create project",
        "tạo dự án",
        "thiết lập project",
        "project mới",
        "muốn có project",
        "cần project",
      ],
      name: [
        "tên project là",
        "đặt tên project",
        "project tên là",
        "project name",
        "tên dự án",
      ],
    },
  };

  constructor() {
    this.intentAnalyzer = new IntentAnalyzer();
  }

  processIntent(message: string): IntentMatch {
    const normalizedMessage = message.toLowerCase();

    // Xử lý ý định tạo workspace
    const workspaceMatch = this.processWorkspaceIntent(normalizedMessage);
    if (workspaceMatch.confidence > 0.6) {
      return workspaceMatch;
    }

    // Xử lý ý định tạo project
    const projectMatch = this.processProjectIntent(normalizedMessage);
    if (projectMatch.confidence > 0.6) {
      return projectMatch;
    }

    // Xử lý các trường hợp đặt tên
    const namingMatch = this.processNamingIntent(normalizedMessage);
    if (namingMatch.confidence > 0.6) {
      return namingMatch;
    }

    // Trả về ý định không xác định
    return {
      intent: "unknown",
      confidence: 0,
    };
  }

  private processWorkspaceIntent(message: string): IntentMatch {
    let confidence = 0;
    let name: string | undefined;

    // Kiểm tra các cụm từ tạo workspace
    for (const phrase of this.commonPhrases.workspace.create) {
      if (message.includes(phrase)) {
        confidence += 0.4;
        break;
      }
    }

    // Tìm tên workspace nếu có
    for (const namePhrase of this.commonPhrases.workspace.name) {
      const index = message.indexOf(namePhrase);
      if (index !== -1) {
        const possibleName = message.slice(index + namePhrase.length).trim();
        if (possibleName && possibleName.length > 0) {
          name = possibleName;
          confidence += 0.3;
        }
      }
    }

    // Phân tích ngữ cảnh bổ sung
    if (
      message.includes("workspace") ||
      message.includes("không gian làm việc")
    ) {
      confidence += 0.2;
    }

    return {
      intent: "create_workspace",
      confidence,
      entities: name ? { name } : undefined,
    };
  }

  private processProjectIntent(message: string): IntentMatch {
    let confidence = 0;
    let name: string | undefined;

    // Kiểm tra các cụm từ tạo project
    for (const phrase of this.commonPhrases.project.create) {
      if (message.includes(phrase)) {
        confidence += 0.4;
        break;
      }
    }

    // Tìm tên project nếu có
    for (const namePhrase of this.commonPhrases.project.name) {
      const index = message.indexOf(namePhrase);
      if (index !== -1) {
        const possibleName = message.slice(index + namePhrase.length).trim();
        if (possibleName && possibleName.length > 0) {
          name = possibleName;
          confidence += 0.3;
        }
      }
    }

    // Phân tích ngữ cảnh bổ sung
    if (message.includes("project") || message.includes("dự án")) {
      confidence += 0.2;
    }

    return {
      intent: "create_project",
      confidence,
      entities: name ? { name } : undefined,
    };
  }

  private processNamingIntent(message: string): IntentMatch {
    const namePatterns = [
      /(?:tên là|đặt tên|gọi là|named|called|có tên)\s+["']?([^"']+)["']?/i,
      /["']([^"']+)["']\s+(?:là tên|is the name)/i,
    ];

    for (const pattern of namePatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        return {
          intent: "set_name",
          confidence: 0.8,
          entities: {
            name: match[1].trim(),
          },
        };
      }
    }

    // Nếu tin nhắn ngắn và không có từ khóa đặc biệt, có thể là tên
    if (message.split(" ").length <= 3 && !/[<>\/\\]/.test(message)) {
      return {
        intent: "set_name",
        confidence: 0.6,
        entities: {
          name: message.trim(),
        },
      };
    }

    return {
      intent: "unknown",
      confidence: 0,
    };
  }
}
