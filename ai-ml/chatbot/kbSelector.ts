import fs from "fs";
import path from "path";
import { KnowledgeFileScore } from "./types";

const KB_DIR = path.join(process.cwd(), "kb");

// Minimum overlap score required to consider a file "relevant enough".
// Tune this if you find it's too strict/loose for your KB content.
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

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((tok) => tok.length > 1 && !STOPWORDS.has(tok));
}

function listKbFiles(): string[] {
  if (!fs.existsSync(KB_DIR)) {
    return [];
  }
  return fs
    .readdirSync(KB_DIR)
    .filter((f) => fs.statSync(path.join(KB_DIR, f)).isFile());
}

/**
 * Scores every file in kb/ against the query using simple term-overlap
 * frequency counting. No embeddings, no vector math — just token matching.
 *
 * Swap this function's internals later if you ever want an LLM-based
 * or embedding-based selector; the rest of the router doesn't care how
 * the file is picked.
 */
function scoreFiles(query: string): KnowledgeFileScore[] {
  const files = listKbFiles();
  const queryTokens = tokenize(query);

  if (queryTokens.length === 0) {
    return [];
  }

  const scores: KnowledgeFileScore[] = files.map((fileName) => {
    const content = fs.readFileSync(path.join(KB_DIR, fileName), "utf-8");
    const contentTokens = tokenize(content);
    const contentTokenSet = new Set(contentTokens);

    let score = 0;
    for (const qTok of queryTokens) {
      if (contentTokenSet.has(qTok)) {
        // Count actual occurrences for a slightly weighted score,
        // rather than a flat +1 per matched unique token.
        score += contentTokens.filter((t) => t === qTok).length;
      }
      // Bonus if the filename itself matches the query term (e.g. "checkout.md")
      if (fileName.toLowerCase().includes(qTok)) {
        score += 3;
      }
    }

    return { fileName, score };
  });

  return scores.sort((a, b) => b.score - a.score);
}

export function selectBestKbFile(query: string): {
  fileName: string | null;
  content: string | null;
} {
  const ranked = scoreFiles(query);

  if (ranked.length === 0 || ranked[0].score < MIN_SCORE_THRESHOLD) {
    return { fileName: null, content: null };
  }

  const best = ranked[0];
  const content = fs.readFileSync(path.join(KB_DIR, best.fileName), "utf-8");

  return { fileName: best.fileName, content };
}
