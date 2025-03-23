import natural from 'natural';
import path from 'path';
import fs from 'fs';

interface DocumentData {
  content: string;
  metadata: {
    fileName: string;
    lastModified: Date;
  };
}

export class DocumentProcessor {
  private documentsPath: string;
  private documentsData: DocumentData[] = [];
  private tfidf: natural.TfIdf;

  constructor() {
    this.documentsPath = path.join(process.cwd(), 'documents');
    this.loadDocuments();
    this.tfidf = new natural.TfIdf();
    this.buildTFIDF();
  }

  private loadDocuments() {
    if (!fs.existsSync(this.documentsPath)) {
      fs.mkdirSync(this.documentsPath);
    }

    const files = fs.readdirSync(this.documentsPath);
    
    this.documentsData = files
      .filter(file => file.endsWith('.txt'))
      .map(file => {
        const filePath = path.join(this.documentsPath, file);
        return {
          content: fs.readFileSync(filePath, 'utf-8'),
          metadata: {
            fileName: file,
            lastModified: fs.statSync(filePath).mtime
          }
        };
      });
  }

  private buildTFIDF() {
    console.log("Building TF-IDF with documents:", this.documentsData.length);
    this.documentsData.forEach((doc, index) => {
      console.log(`Adding document ${index + 1}:`, doc.metadata.fileName);
      this.tfidf.addDocument(doc.content);
    });
  }
  
  public getRelevantContent(query: string): string {
    let results: { content: string; score: number }[] = [];
  
    this.tfidf.tfidfs(query, (index, score) => {
      if (score > 0) {
        results.push({ content: this.documentsData[index].content, score });
      }
    });
  
    // Sắp xếp theo điểm số giảm dần và lấy tối đa 3 đoạn có liên quan
    results.sort((a, b) => b.score - a.score);
    const topResults = results.slice(0, 3).map(r => r.content);
  
    return topResults.join("\n\n") || "Không tìm thấy thông tin liên quan.";
  }
  
  
}
