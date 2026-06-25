import type { TriviaQuestion } from "../types";

interface OpenTdbResponse {
  response_code: number;
  results: Array<{
    category: string;
    type: string;
    difficulty: string;
    question: string;
    correct_answer: string;
    incorrect_answers: string[];
  }>;
}

function decodeHtml(html: string): string {
  const txt = typeof document !== "undefined" ? document.createElement("textarea") : null;
  if (!txt) return html.replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, "&");
  txt.innerHTML = html;
  return txt.value;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function fetchTriviaQuestion(
  category?: number,
  difficulty: "easy" | "medium" | "hard" = "medium"
): Promise<TriviaQuestion> {
  const params = new URLSearchParams({
    amount: "1",
    type: "multiple",
    difficulty,
  });
  if (category) params.set("category", String(category));

  const res = await fetch(`https://opentdb.com/api.php?${params}`);
  if (!res.ok) throw new Error("Trivia API unavailable");

  const data = (await res.json()) as OpenTdbResponse;
  if (data.response_code !== 0 || !data.results[0]) {
    throw new Error("No trivia questions returned");
  }

  const q = data.results[0];
  const correct = decodeHtml(q.correct_answer);
  const options = shuffle([
    correct,
    ...q.incorrect_answers.map(decodeHtml),
  ]);

  return {
    question: decodeHtml(q.question),
    correctAnswer: correct,
    options,
    category: decodeHtml(q.category),
    difficulty: q.difficulty,
  };
}
