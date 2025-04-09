import { NextResponse } from "next/server";
import axios from "axios";

// Sử dụng Google Generative AI API key
const GEMINI_API_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

// Helper function to make API requests with retry logic
async function makeGeminiRequest(url: string, data: any, maxRetries = 2) {
  let lastError;
  let retryCount = 0;

  while (retryCount <= maxRetries) {
    try {
      if (retryCount > 0) {
        // Exponential backoff: wait longer between retries
        const backoffTime = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
        console.log(
          `Retry attempt ${retryCount}/${maxRetries}. Waiting ${backoffTime}ms before retry...`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffTime));
      }

      const response = await axios.post(url, data, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      return response;
    } catch (error: any) {
      lastError = error;

      // Only retry on specific errors that might benefit from retrying
      if (error.response && error.response.status === 503) {
        console.log(
          `Received 503 error from Gemini API on attempt ${retryCount + 1}/${
            maxRetries + 1
          }`
        );
        retryCount++;
      } else {
        // Don't retry for other errors
        break;
      }
    }
  }

  // If we get here, all retries failed or we hit a non-retryable error
  throw lastError;
}

export async function POST(req: Request) {
  const requestStartTime = Date.now();
  let analysisType = "unknown";
  let requestJSON: any = null;

  try {
    // Store the parsed request body so we don't need to parse it again in the catch block
    requestJSON = await req.json();
    const { contentType, contentUrl, fileName, taskTitle } = requestJSON;
    analysisType = contentType || "unknown";

    console.log(`[${new Date().toISOString()}] Starting content analysis:`, {
      type: contentType,
      fileName: fileName || "unnamed",
      taskTitle: taskTitle || "untitled",
      urlLength: contentUrl?.length || 0,
    });

    if (!contentUrl) {
      console.error("Missing contentUrl in request");
      return NextResponse.json(
        { error: "Content URL is required" },
        { status: 400 }
      );
    }

    if (!GEMINI_API_KEY) {
      console.error(
        "Missing GOOGLE_GENERATIVE_AI_API_KEY environment variable"
      );
      return NextResponse.json(
        {
          error: "Server configuration error",
          details: "API key not configured",
        },
        { status: 500 }
      );
    }

    // Tạo prompt dựa vào loại nội dung
    let prompt = "";

    if (contentType === "image") {
      prompt = `Phân tích chi tiết về hình ảnh này liên quan đến task "${
        taskTitle || "Untitled Task"
      }":

## Yêu cầu phân tích:

### 1. Mô tả tổng quan
- Mô tả chính xác các đối tượng và thành phần trong hình ảnh
- Vị trí và bố cục của các đối tượng

### 2. Phân tích chi tiết
- Màu sắc chính và bảng màu tổng thể
- Phong cách thiết kế (nếu áp dụng: tối giản, hiện đại, cổ điển, etc.)
- Quy mô, tỷ lệ và bố cục

### 3. Nội dung văn bản
- Trích xuất và hiển thị rõ ràng mọi văn bản có trong hình ảnh
- Phân tích ý nghĩa của văn bản trong ngữ cảnh

### 4. Liên quan đến task
- Mối liên hệ của hình ảnh đến task "${taskTitle || "Untitled Task"}"
- Cách hình ảnh này có thể hỗ trợ hoặc liên quan đến mục tiêu của task

### 5. Đề xuất và ý tưởng
- Đề xuất cách sử dụng hoặc cải thiện hình ảnh (nếu áp dụng)
- Ý tưởng liên quan dựa trên nội dung hình ảnh

Phân tích phải cụ thể và hữu ích. Định dạng kết quả bằng Markdown với các đề mục rõ ràng.`;

      // Sử dụng Gemini 2.0 Flash với v1beta API path
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

      console.log(`Sending request to Gemini 2.0 Flash API for image analysis`);

      // Xử lý URL hình ảnh - trích xuất base64 từ data URL
      let imageData;
      if (contentUrl.startsWith("data:image")) {
        imageData = contentUrl.split(",")[1]; // Lấy phần base64 sau dấu phẩy
      } else {
        console.error("Image URL is not in data URL format");
        return NextResponse.json({
          analysis:
            "Không thể phân tích hình ảnh. URL hình ảnh không đúng định dạng.",
          contentType,
        });
      }

      // Use the retry helper function instead of direct axios call
      const response = await makeGeminiRequest(apiUrl, {
        contents: [
          {
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "image/jpeg", data: imageData } },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1200,
          topK: 40,
          topP: 0.95,
        },
      });

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
          analysis:
            "Rất tiếc, tôi không thể phân tích hình ảnh này. Có vẻ như đã có lỗi với API phân tích.",
          contentType,
        });
      }

      const analysisContent = response.data.candidates[0].content.parts[0].text;
      console.log("Image analysis content received successfully");

      return NextResponse.json({
        analysis: analysisContent,
        contentType,
      });
    } else if (contentType === "file") {
      // Kiểm tra loại file thông qua fileName
      let fileContent = "";
      let fileType = "";

      if (fileName) {
        const extension = fileName.split(".").pop()?.toLowerCase();
        fileType = extension || "";
      }

      // Nếu là URL dạng data: (base64), trích xuất nội dung
      if (contentUrl.startsWith("data:")) {
        try {
          // Trích xuất mime type và nội dung từ data URL
          const parts = contentUrl.split(",");
          const mimeMatch = parts[0].match(/:(.*?);/);
          const mime = mimeMatch ? mimeMatch[1] : "";

          // Nếu là text
          if (
            mime.startsWith("text/") ||
            mime.includes("json") ||
            mime.includes("javascript") ||
            mime.includes("typescript") ||
            mime.includes("css") ||
            mime.includes("html")
          ) {
            // Giải mã base64 nếu cần
            if (parts[0].includes("base64")) {
              const base64Content = parts[1];
              const buffer = Buffer.from(base64Content, "base64");
              fileContent = buffer.toString("utf-8");
            } else {
              fileContent = decodeURIComponent(parts[1]);
            }
          } else {
            // File binary, chỉ lấy thông tin
            fileContent = `[Đây là file nhị phân với định dạng ${mime}]`;
          }
        } catch (error) {
          console.error("Error extracting content from data URL:", error);
          fileContent = "Không thể đọc nội dung file từ data URL.";
        }
      } else if (
        contentUrl.startsWith("http") ||
        contentUrl.startsWith("https")
      ) {
        // URL internet - thử fetch nội dung
        try {
          const response = await axios.get(contentUrl);
          if (typeof response.data === "string") {
            fileContent = response.data;
          } else if (response.data && typeof response.data === "object") {
            fileContent = JSON.stringify(response.data, null, 2);
          } else {
            fileContent = "Received non-text content from URL.";
          }

          // Giới hạn độ dài
          if (fileContent.length > 10000) {
            fileContent =
              fileContent.substring(0, 10000) +
              "\n\n... (nội dung còn lại bị cắt bớt) ...";
          }
        } catch (error) {
          console.error("Error fetching content from URL:", error);
          fileContent =
            "Không thể fetch nội dung từ URL do lỗi mạng hoặc quyền truy cập.";
        }
      } else {
        // URL khác - có thể là đường dẫn local hoặc blob URL
        try {
          // Thử tải nội dung từ URL
          console.log("Trying to fetch content from URL:", contentUrl);
          const response = await fetch(contentUrl, {
            headers: {
              Accept:
                "text/plain,application/json,application/octet-stream,*/*",
            },
            cache: "no-store", // Không sử dụng cache
          });

          if (response.ok) {
            try {
              // Thử đọc dưới dạng text trước
              const content = await response.text();
              fileContent = content;
              console.log(
                `Successfully fetched file content, length: ${content.length} characters`
              );
            } catch (textError) {
              console.error("Error reading content as text:", textError);

              // Nếu không đọc được text, thử đọc dưới dạng arrayBuffer và chuyển đổi
              try {
                const clonedResponse = await fetch(contentUrl, {
                  cache: "no-store",
                });
                const buffer = await clonedResponse.arrayBuffer();
                const decoder = new TextDecoder("utf-8");
                fileContent = decoder.decode(buffer);
                console.log(
                  `Read file content as binary, decoded length: ${fileContent.length}`
                );
              } catch (binaryError) {
                console.error("Error reading content as binary:", binaryError);
                fileContent = "Không thể đọc nội dung file từ URL đã cung cấp.";
              }
            }

            // Giới hạn độ dài
            if (fileContent.length > 10000) {
              // Extract more useful information from large files
              const beginning = fileContent.substring(0, 4000);
              const middle = fileContent.substring(
                fileContent.length / 2 - 1000,
                fileContent.length / 2 + 1000
              );
              const end = fileContent.substring(fileContent.length - 2000);

              fileContent = `${beginning}

... [Phần giữa của file đã được cắt bớt do quá dài] ...

${middle}

... [Phần giữa của file đã được cắt bớt do quá dài] ...

${end}`;
            }
          } else {
            console.error(`Failed to fetch URL. Status: ${response.status}`);
            fileContent = `Không thể truy cập nội dung file từ URL. Status: ${response.status}.`;
          }
        } catch (error) {
          console.error("Error accessing file:", error);
          fileContent =
            "Không thể truy cập nội dung file từ URL được cung cấp. Lỗi: " +
            (error instanceof Error ? error.message : String(error));
        }
      }

      // Attempt to better identify file type if not provided
      if (!fileType || fileType === "Không xác định") {
        // Try to detect based on filename extension
        if (fileName) {
          const extension = fileName.split(".").pop()?.toLowerCase();
          if (extension) {
            const extensionMap: Record<string, string> = {
              js: "JavaScript",
              jsx: "React JSX",
              ts: "TypeScript",
              tsx: "React TSX",
              py: "Python",
              java: "Java",
              c: "C",
              cpp: "C++",
              cs: "C#",
              go: "Go",
              rb: "Ruby",
              php: "PHP",
              html: "HTML",
              css: "CSS",
              scss: "SCSS",
              json: "JSON",
              md: "Markdown",
              txt: "Text",
              csv: "CSV",
              sql: "SQL",
              xml: "XML",
              yaml: "YAML",
              yml: "YAML",
              sh: "Shell Script",
              bat: "Batch Script",
              ps1: "PowerShell Script",
              vue: "Vue.js",
              svelte: "Svelte",
              rs: "Rust",
              swift: "Swift",
              kt: "Kotlin",
              dart: "Dart",
              ex: "Elixir",
            };

            fileType =
              extensionMap[extension] || `File ${extension.toUpperCase()}`;
          }
        }

        // If still not identified, try to detect from content
        if ((!fileType || fileType === "Không xác định") && fileContent) {
          if (
            fileContent.startsWith("<!DOCTYPE html>") ||
            fileContent.includes("<html")
          ) {
            fileType = "HTML";
          } else if (
            fileContent.includes("import React") ||
            fileContent.includes('from "react"')
          ) {
            fileType = "React";
          } else if (
            fileContent.includes("function") &&
            fileContent.includes("=>")
          ) {
            fileType = "JavaScript/TypeScript";
          } else if (
            fileContent.includes("class") &&
            fileContent.includes("extends")
          ) {
            fileType = "Object-Oriented Code";
          } else if (
            fileContent.includes("SELECT") &&
            fileContent.includes("FROM")
          ) {
            fileType = "SQL";
          } else if (fileContent.includes("<?php")) {
            fileType = "PHP";
          } else if (
            fileContent.includes("import ") &&
            fileContent.includes("def ")
          ) {
            fileType = "Python";
          } else if (
            fileContent.includes("<template>") &&
            fileContent.includes("<script>")
          ) {
            fileType = "Vue.js";
          } else if (fileContent.match(/\{[\s\n]*"[^"]+"\s*:/)) {
            fileType = "JSON";
          } else if (
            fileContent.includes("#include") &&
            (fileContent.includes("int main") ||
              fileContent.includes("void main"))
          ) {
            fileType = "C/C++";
          }
        }
      }

      // Kiểm tra nếu file content vẫn trống
      if (!fileContent || fileContent.trim() === "") {
        console.log("File content is empty or could not be retrieved");
        fileContent =
          "[Không thể đọc nội dung file. Có thể định dạng không được hỗ trợ hoặc file quá lớn.]";
      }

      prompt = `Phân tích nội dung file "${
        fileName || "Untitled File"
      }" thuộc task "${taskTitle || "Untitled Task"}".
      
Loại file: ${fileType || "Không xác định"}

Nội dung file:
\`\`\`
${fileContent}
\`\`\`

## Yêu cầu phân tích:

### 1. Mục đích của file
- Chức năng chính và vai trò của file này là gì?
- File này giải quyết vấn đề gì?

### 2. Cấu trúc và tổ chức
- Các thành phần hoặc phần chính của file
- Cách tổ chức code/nội dung (nếu áp dụng)

### 3. Các thành phần quan trọng
- Các hàm, lớp, hoặc phần quan trọng nhất
- Logic nổi bật hoặc thuật toán chính
- Các API hoặc dependencies được sử dụng

### 4. Mối quan hệ với task
- File này đóng góp thế nào vào task "${taskTitle || "Untitled Task"}"?
- Các tương tác với các file khác (nếu có thể xác định)

### 5. Đánh giá và đề xuất
- Các vấn đề tiềm ẩn trong code/nội dung
- Cách cải thiện hoặc tối ưu hóa

Định dạng phân tích bằng Markdown với các đề mục rõ ràng. Đảm bảo phân tích cụ thể, ngắn gọn và thiết thực.`;

      // Sử dụng Gemini 2.0 Flash với v1beta API path
      const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

      console.log(`Sending request to Gemini 2.0 Flash API for file analysis`);
      console.log(
        `File type: ${fileType}, Content length: ${fileContent.length} characters`
      );

      // Use the retry helper function instead of direct axios call
      const response = await makeGeminiRequest(apiUrl, {
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1500,
          topK: 40,
          topP: 0.95,
        },
      });

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
          analysis:
            "Rất tiếc, tôi không thể phân tích file này. Có vẻ như đã có lỗi với API phân tích.",
          contentType,
        });
      }

      const analysisContent = response.data.candidates[0].content.parts[0].text;
      console.log("File analysis content received successfully");

      return NextResponse.json({
        analysis: analysisContent,
        contentType,
      });
    } else {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      );
    }
  } catch (error: any) {
    const requestDuration = Date.now() - requestStartTime;
    console.error(
      `[${new Date().toISOString()}] Content Analysis Error (${analysisType}):`,
      error
    );
    console.error(`Request duration: ${requestDuration}ms before error`);

    // Use the already parsed request data instead of trying to clone and parse again
    let contentType = analysisType;
    if (requestJSON && requestJSON.contentType) {
      contentType = requestJSON.contentType;
    }

    // Enhanced error logging
    if (error.response) {
      console.error(`Error response status: ${error.response.status}`, {
        statusText: error.response.statusText,
        headers: Object.fromEntries(
          Object.entries(error.response.headers || {}).slice(0, 5)
        ),
      });

      console.error(
        "Error response data:",
        typeof error.response.data === "object"
          ? JSON.stringify(error.response.data).substring(0, 500)
          : String(error.response.data).substring(0, 500)
      );

      // Kiểm tra xem có phải lỗi API của Google không
      if (error.response.data && error.response.data.error) {
        console.error("Google API Error:", error.response.data.error.message);

        // Handle model overload error (status 503)
        if (
          error.response.status === 503 ||
          (error.response.data.error.message &&
            error.response.data.error.message.includes("overloaded"))
        ) {
          return NextResponse.json(
            {
              error: "Dịch vụ AI hiện đang quá tải",
              message: "Gemini API đang quá tải, vui lòng thử lại sau",
              details: "The model is overloaded. Please try again later.",
              action: "Vui lòng đợi một lúc và thử lại sau khoảng 1-2 phút",
              retryable: true,
              contentType,
            },
            { status: 503 }
          );
        }

        if (error.response.data.error.message.includes("API key")) {
          return NextResponse.json(
            {
              error: "API key không hợp lệ hoặc đã hết hạn",
              message: "Vui lòng kiểm tra lại API key của Gemini",
              details:
                "API key không được chấp nhận bởi Google Generative AI API",
              action:
                "Kiểm tra API key trong biến môi trường hoặc liên hệ quản trị viên hệ thống",
            },
            { status: 401 }
          );
        }

        if (error.response.data.error.message.includes("quota")) {
          return NextResponse.json(
            {
              error: "Đã vượt quá giới hạn quota",
              message: "Vui lòng thử lại sau hoặc sử dụng API key khác",
              details:
                "API key hiện tại đã sử dụng hết quota được cấp phát bởi Google",
              action: "Đợi 24 giờ hoặc sử dụng API key khác",
            },
            { status: 429 }
          );
        }

        if (
          error.response.data.error.message.includes("permission") ||
          error.response.status === 403
        ) {
          return NextResponse.json(
            {
              error: "Không có quyền truy cập",
              message:
                "API key không có quyền truy cập vào các mô hình AI cần thiết",
              details:
                "Kiểm tra cấu hình quyền của API key trên Google Cloud Console",
              action:
                "Cấu hình lại quyền truy cập cho API key hoặc liên hệ quản trị viên",
            },
            { status: 403 }
          );
        }
      }
    }

    return NextResponse.json(
      {
        error: "Lỗi phân tích nội dung",
        message: `Có lỗi xảy ra khi phân tích ${
          contentType === "image" ? "hình ảnh" : "file"
        }`,
        details: error.message || "Không có thông tin chi tiết",
        time: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
