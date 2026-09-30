import { CodeTemplate, SupportedLanguage } from "../types";

export const STARTER_TEMPLATES: Record<SupportedLanguage, string> = {
  javascript: `// ✨ Welcome to IncogTalk Code Studio!
// Run your code with Ctrl + Enter or click "Run Code"

function calculateStats(numbers) {
  if (!numbers.length) return { sum: 0, avg: 0 };
  const sum = numbers.reduce((acc, n) => acc + n, 0);
  const avg = Number((sum / numbers.length).toFixed(2));
  return { sum, avg, max: Math.max(...numbers), min: Math.min(...numbers) };
}

const scores = [88, 92, 79, 95, 100, 84];
console.log("📊 Student Performance Stats:", calculateStats(scores));
`,

  typescript: `// ⚡ TypeScript Playground
interface UserSession {
  id: string;
  username: string;
  role: "admin" | "contributor" | "guest";
  xp: number;
  badges: string[];
}

function summarizeUser<T extends UserSession>(user: T): string {
  return \`User \${user.username} (\${user.role}) has \${user.xp} XP with \${user.badges.length} badges.\`;
}

const activeUser: UserSession = {
  id: "usr_99",
  username: "CyberDev",
  role: "contributor",
  xp: 1420,
  badges: ["Bug Hunter", "Fast Painter", "Algorithm Pro"],
};

console.log(summarizeUser(activeUser));
`,

  python: `# 🐍 Python Practice Sandbox
def sieve_of_eratosthenes(limit: int) -> list[int]:
    """Returns all prime numbers up to limit."""
    is_prime = [True] * (limit + 1)
    is_prime[0] = is_prime[1] = False
    
    for p in range(2, int(limit**0.5) + 1):
        if is_prime[p]:
            for i in range(p * p, limit + 1, p):
                is_prime[i] = False
                
    return [num for num, prime in enumerate(is_prime) if prime]

primes = sieve_of_eratosthenes(50)
print(f"Primes up to 50: {primes}")
print(f"Total count: {len(primes)}")
`,

  html: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Cyber Glass Card</title>
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at 50% 50%, #1e1b4b, #0f172a, #030712);
      font-family: system-ui, -apple-system, sans-serif;
      color: #f8fafc;
    }
    .card {
      background: rgba(255, 255, 255, 0.06);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 24px;
      padding: 32px;
      width: 320px;
      text-align: center;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.2);
    }
    .badge {
      display: inline-block;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(99, 102, 241, 0.25);
      color: #818cf8;
      font-size: 12px;
      font-weight: 700;
      margin-bottom: 16px;
      border: 1px solid rgba(99, 102, 241, 0.4);
    }
    h2 { margin: 0 0 8px; font-size: 24px; }
    p { color: #94a3b8; font-size: 14px; margin: 0 0 24px; }
    button {
      background: linear-gradient(135deg, #6366f1, #a855f7);
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 15px;
      font-weight: 700;
      border-radius: 14px;
      cursor: pointer;
      box-shadow: 0 10px 25px rgba(99, 102, 241, 0.4);
      transition: all 0.2s;
    }
    button:hover { transform: scale(1.05); filter: brightness(1.1); }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">LIVE PREVIEW</div>
    <h2>Interactive Card</h2>
    <p>Tap below to see live JavaScript DOM updates in real-time.</p>
    <button id="counterBtn">Clicks: 0</button>
  </div>

  <script>
    let count = 0;
    const btn = document.getElementById('counterBtn');
    btn.addEventListener('click', () => {
      count++;
      btn.innerText = 'Clicks: ' + count;
      console.log('Button clicked! Total:', count);
    });
  </script>
</body>
</html>
`,

  css: `/* Modern Glassmorphic UI Card */
.glass-container {
  display: grid;
  place-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #090d16, #111827, #1f2937);
}

.glass-box {
  padding: 2.5rem;
  border-radius: 1.5rem;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
}
`,

  sql: `-- PostgreSQL / SQLite Schema Example
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  xp INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO users (username, email, xp) VALUES
  ('cyber_pilot', 'pilot@incogtalk.io', 3200),
  ('code_ninja', 'ninja@incogtalk.io', 4850);

SELECT username, xp, RANK() OVER (ORDER BY xp DESC) as rank FROM users;
`,

  json: `{
  "projectName": "IncogTalk Code Studio",
  "version": "1.0.0",
  "features": [
    "Multi-language code execution",
    "BYOK Multi-LLM Copilot",
    "Open Model auto-detection",
    "DSA Practice Challenges",
    "Instant Error Diagnostics"
  ],
  "settings": {
    "theme": "midnight-cyber",
    "tabSize": 2,
    "autoCloseBrackets": true
  }
}
`,

  cpp: `// C++ Competitive Programming Starter
#include <iostream>
#include <vector>
#include <numeric>
#include <algorithm>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);

    vector<int> nums = {4, 1, 8, 9, 2, 7};
    sort(nums.begin(), nums.end());

    cout << "Sorted Array: ";
    for (int n : nums) cout << n << " ";
    cout << "\\nSum: " << accumulate(nums.begin(), nums.end(), 0) << "\\n";

    return 0;
}
`,

  java: `// Java Code Starter
import java.util.*;

public class Main {
    public static void main(String[] args) {
        List<String> skills = Arrays.asList("Algorithms", "Web Development", "AI Engineering");
        
        System.out.println("🚀 IncogTalk Code Studio Ready!");
        for (int i = 0; i < skills.size(); i++) {
            System.out.println((i + 1) + ". " + skills.get(i));
        }
    }
}
`,
};

export const CODE_TEMPLATES: CodeTemplate[] = [
  {
    id: "js-stats",
    title: "Array Statistics",
    language: "javascript",
    category: "Math & Arrays",
    description: "Calculates sum, average, min, and max of a numbers array.",
    code: STARTER_TEMPLATES.javascript,
  },
  {
    id: "ts-session",
    title: "TypeScript Generics & Types",
    language: "typescript",
    category: "TypeScript",
    description: "Generic function with strict TypeScript interfaces.",
    code: STARTER_TEMPLATES.typescript,
  },
  {
    id: "py-primes",
    title: "Sieve of Eratosthenes",
    language: "python",
    category: "Algorithms",
    description: "Fast prime generator algorithm up to N.",
    code: STARTER_TEMPLATES.python,
  },
  {
    id: "html-glass",
    title: "Interactive Glass Card",
    language: "html",
    category: "Frontend UI",
    description: "Live HTML/CSS card with JavaScript click counter.",
    code: STARTER_TEMPLATES.html,
  },
];
