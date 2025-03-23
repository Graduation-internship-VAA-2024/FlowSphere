// Description: This file is responsible for creating a worker that calculates the TF-IDF values for the documents.
// Thay vì dùng webworker-threads, mình có thể tận dụng worker_threads, một API gốc của Node.js.
// Hiện tại chưa fix được nên để đây, nữa fix
// worker_threads có thể giúp chatbot phản hồi nhanh hơn
import { parentPort, workerData } from 'worker_threads';
import * as natural from 'natural';
import { EventEmitter } from 'events';

const { documents } = workerData;
const tfidf = new natural.TfIdf();

documents.forEach((doc: string) => {
  tfidf.addDocument(doc);
});

parentPort?.postMessage(tfidf);
