"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var worker_threads_1 = require("worker_threads");
var natural = require("natural");
var documents = worker_threads_1.workerData.documents;
var tfidf = new natural.TfIdf();
documents.forEach(function (doc) {
    tfidf.addDocument(doc);
});
worker_threads_1.parentPort === null || worker_threads_1.parentPort === void 0 ? void 0 : worker_threads_1.parentPort.postMessage(tfidf);
