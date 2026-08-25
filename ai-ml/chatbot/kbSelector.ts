import fs from "node:fs";
import path from "node:path";
import { KnowledgeFileScore } from "./types.js";

const MIN_SCORE_THRESHOLD = 1;

const STOPWORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "to", "of", "in", "on", "for", "and", "or", "but", "with", "at", "by",
  "from", "up", "about", "into", "through", "during", "how", "what",
  "when", "where", "why", "which", "who", "whom", "this", "that", "these",
  "those", "i", "you", "he", "she", "it", "we", "they", "do", "does",
  "did", "can", "could", "should", "would", "will", "shall", "may",
  "might", "must", "my", "your", "his", "her", "its", "our", "their",
]);

function kbDir(): string {
  return process.env.KB_DIR || path.join(process.cwd(), "kb");
}

function tokenize(text: string): string[] {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)
    .filter((tok) => tok.length > 1 && !STOPWORDS.has(tok));
}

function listKbFiles(): string[] {
  const directory = kbDir();
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory)
    .filter((fileName) => {
      const fullPath = path.join(directory, fileName);
      return fs.statSync(fullPath).isFile() && /\.(md|txt)$/i.test(fileName);
    });
}

function scoreFiles(query: string): KnowledgeFileScore[] {
  const directory = kbDir();
  const files = listKbFiles();
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  return files.map((fileName) => {
    const content = fs.readFileSync(path.join(directory, fileName), "utf-8");
    const contentTokens = tokenize(content);
    const frequencies = new Map<string, number>();
    for (const token of contentTokens) frequencies.set(token, (frequencies.get(token) || 0) + 1);

    let score = 0;
    for (const token of queryTokens) {
      score += frequencies.get(token) || 0;
      if (fileName.toLowerCase().includes(token)) score += 3;
    }
    return { fileName, score };
  }).sort((a, b) => b.score - a.score);
}

export function selectBestKbFile(query: string): { fileName: string | null; content: string | null } {
  const ranked = scoreFiles(query);
  if (ranked.length === 0 || ranked[0].score < MIN_SCORE_THRESHOLD) {
    return { fileName: null, content: null };
  }
  const best = ranked[0];
  return {
    fileName: best.fileName,
    content: fs.readFileSync(path.join(kbDir(), best.fileName), "utf-8"),
  };
}
