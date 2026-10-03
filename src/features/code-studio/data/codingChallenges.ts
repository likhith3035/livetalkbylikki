import { CodingChallenge } from "../types";

export const CODING_CHALLENGES: CodingChallenge[] = [
  {
    id: "two-sum",
    title: "1. Two Sum",
    difficulty: "beginner",
    category: "arrays",
    language: "javascript",
    functionName: "twoSum",
    tags: ["Array", "Hash Map", "DSA"],
    description: `Given an array of integers \`nums\` and an integer \`target\`, return indices of the two numbers such that they add up to \`target\`.

You may assume that each input would have exactly one solution, and you may not use the same element twice. You can return the answer in any order.

### Example 1:
\`\`\`js
Input: nums = [2, 7, 11, 15], target = 9
Output: [0, 1] // Because nums[0] + nums[1] == 9
\`\`\`

### Example 2:
\`\`\`js
Input: nums = [3, 2, 4], target = 6
Output: [1, 2]
\`\`\``,
    starterCode: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
function twoSum(nums, target) {
  // Write your code here
  
}
`,
    solutionCode: `function twoSum(nums, target) {
  const map = new Map();
  for (let i = 0; i < nums.length; i++) {
    const diff = target - nums[i];
    if (map.has(diff)) {
      return [map.get(diff), i];
    }
    map.set(nums[i], i);
  }
  return [];
}`,
    testCases: [
      { id: "tc-1", input: [[2, 7, 11, 15], 9], expected: [0, 1], description: "Standard match at front" },
      { id: "tc-2", input: [[3, 2, 4], 6], expected: [1, 2], description: "Match in middle and end" },
      { id: "tc-3", input: [[3, 3], 6], expected: [0, 1], description: "Duplicate values" },
      { id: "tc-4", input: [[-1, -2, -3, -4, -5], -8], expected: [2, 4], description: "Negative numbers" },
    ],
    hints: [
      "A brute force O(n²) approach loops through each pair. Can we do better with an O(n) hash map?",
      "As you iterate through the array, check if `target - currentNum` exists in your hash map.",
    ],
    solutionExplanation: `We iterate through the array once while maintaining a Map of number to index. For each number, we compute \`diff = target - num\`. If \`diff\` is already in our map, we've found our pair in O(1) lookup time.`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
  },
  {
    id: "valid-palindrome",
    title: "2. Valid Palindrome",
    difficulty: "beginner",
    category: "strings",
    language: "javascript",
    functionName: "isPalindrome",
    tags: ["String", "Two Pointers"],
    description: `A phrase is a **palindrome** if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string \`s\`, return \`true\` if it is a palindrome, or \`false\` otherwise.

### Example 1:
\`\`\`js
Input: s = "A man, a plan, a canal: Panama"
Output: true // "amanaplanacanalpanama" is a palindrome
\`\`\`

### Example 2:
\`\`\`js
Input: s = "race a car"
Output: false
\`\`\``,
    starterCode: `/**
 * @param {string} s
 * @return {boolean}
 */
function isPalindrome(s) {
  // Write your code here
  
}
`,
    solutionCode: `function isPalindrome(s) {
  const clean = s.toLowerCase().replace(/[^a-z0-9]/g, "");
  return clean === clean.split("").reverse().join("");
}`,
    testCases: [
      { id: "tc-1", input: ["A man, a plan, a canal: Panama"], expected: true, description: "Classic Panama palindrome" },
      { id: "tc-2", input: ["race a car"], expected: false, description: "Not a palindrome" },
      { id: "tc-3", input: [" "], expected: true, description: "Empty cleaned string" },
      { id: "tc-4", input: ["0P"], expected: false, description: "Different alphanumeric" },
    ],
    hints: [
      "First normalize the string by lowercasing and using regex `/[^a-z0-9]/g` to strip punctuation.",
      "Compare the characters from both ends using two pointers or string reversal.",
    ],
    solutionExplanation: `Strip non-alphanumeric characters with regex and lowercase. Either compare the string with its reverse, or step two pointers inward from left and right.`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
  },
  {
    id: "debounce",
    title: "3. Implement Debounce Function",
    difficulty: "intermediate",
    category: "javascript",
    language: "javascript",
    functionName: "testDebounce",
    tags: ["JavaScript", "Closures", "Web Dev"],
    description: `Create a **debounce** function that delays invoking a callback until after \`delay\` milliseconds have elapsed since the last time the debounced function was invoked.

In this test harness, \`testDebounce(callsCount, delayMs)\` returns whether the callback is properly deferred.`,
    starterCode: `/**
 * @param {Function} fn
 * @param {number} delay
 * @return {Function}
 */
function debounce(fn, delay) {
  // Write your debounce implementation here
  
}

// Test runner helper
function testDebounce(burstCount, delayMs) {
  let executedCount = 0;
  const debounced = debounce(() => {
    executedCount++;
  }, delayMs);

  for (let i = 0; i < burstCount; i++) {
    debounced();
  }
  // Immediately after synchronous burst, callback should NOT have run yet
  return executedCount === 0;
}
`,
    solutionCode: `function debounce(fn, delay) {
  let timerId = null;
  return function (...args) {
    if (timerId) clearTimeout(timerId);
    timerId = setTimeout(() => {
      fn.apply(this, args);
    }, delay);
  };
}

function testDebounce(burstCount, delayMs) {
  let executedCount = 0;
  const debounced = debounce(() => {
    executedCount++;
  }, delayMs);

  for (let i = 0; i < burstCount; i++) {
    debounced();
  }
  return executedCount === 0;
}`,
    testCases: [
      { id: "tc-1", input: [5, 100], expected: true, description: "5 rapid calls are queued and not executed synchronously" },
      { id: "tc-2", input: [20, 50], expected: true, description: "20 rapid calls do not fire prematurely" },
      { id: "tc-3", input: [1, 200], expected: true, description: "Single call is properly delayed" },
    ],
    hints: [
      "Store a `timerId` in the outer closure.",
      "Clear the existing timeout on each invocation and set a new one.",
    ],
    solutionExplanation: `Debounce stores the active timeout ID in a closure. Every new call cancels the pending timer with \`clearTimeout\`, guaranteeing that the target function only runs after user input settles.`,
    timeComplexity: "O(1)",
    spaceComplexity: "O(1)",
  },
  {
    id: "valid-parentheses",
    title: "4. Valid Parentheses (Stack)",
    difficulty: "intermediate",
    category: "algorithms",
    language: "javascript",
    functionName: "isValid",
    tags: ["Stack", "DSA", "Algorithms"],
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the same type of brackets.
2. Open brackets must be closed in the correct order.
3. Every close bracket has a corresponding open bracket of the same type.`,
    starterCode: `/**
 * @param {string} s
 * @return {boolean}
 */
function isValid(s) {
  // Write your code here
  
}
`,
    solutionCode: `function isValid(s) {
  const stack = [];
  const map = {
    ")": "(",
    "}": "{",
    "]": "[",
  };

  for (const char of s) {
    if (char === "(" || char === "{" || char === "[") {
      stack.push(char);
    } else if (map[char]) {
      if (stack.pop() !== map[char]) {
        return false;
      }
    }
  }

  return stack.length === 0;
}`,
    testCases: [
      { id: "tc-1", input: ["()"], expected: true, description: "Simple parentheses" },
      { id: "tc-2", input: ["()[]{}"], expected: true, description: "All three brackets in order" },
      { id: "tc-3", input: ["(]"], expected: false, description: "Mismatched bracket pair" },
      { id: "tc-4", input: ["([)]"], expected: false, description: "Incorrect nesting order" },
      { id: "tc-5", input: ["{[]}"], expected: true, description: "Properly nested brackets" },
    ],
    hints: [
      "Use a Last-In-First-Out (LIFO) stack to store opening brackets.",
      "When encountering a closing bracket, pop the top element from the stack and verify it matches.",
    ],
    solutionExplanation: `Iterate through the string. Push opening brackets to a stack. When a closing bracket is found, pop from the stack and check for a match. At the end, verify the stack is completely empty.`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
  },
  {
    id: "fibonacci",
    title: "5. Fibonacci Number (DP)",
    difficulty: "beginner",
    category: "algorithms",
    language: "javascript",
    functionName: "fib",
    tags: ["Math", "Recursion", "Dynamic Programming"],
    description: `The **Fibonacci numbers**, commonly denoted \`F(n)\`, form a sequence such that each number is the sum of the two preceding ones, starting from \`0\` and \`1\`. That is:
- \`F(0) = 0\`
- \`F(1) = 1\`
- \`F(n) = F(n - 1) + F(n - 2)\`, for \`n > 1\`.

Given \`n\`, calculate \`F(n)\`.`,
    starterCode: `/**
 * @param {number} n
 * @return {number}
 */
function fib(n) {
  // Write your code here
  
}
`,
    solutionCode: `function fib(n) {
  if (n <= 0) return 0;
  if (n === 1) return 1;

  let prev = 0;
  let curr = 1;
  for (let i = 2; i <= n; i++) {
    const next = prev + curr;
    prev = curr;
    curr = next;
  }
  return curr;
}`,
    testCases: [
      { id: "tc-1", input: [2], expected: 1, description: "F(2) = 1" },
      { id: "tc-2", input: [3], expected: 2, description: "F(3) = 2" },
      { id: "tc-3", input: [4], expected: 3, description: "F(4) = 3" },
      { id: "tc-4", input: [10], expected: 55, description: "F(10) = 55" },
      { id: "tc-5", input: [0], expected: 0, description: "F(0) base case" },
    ],
    hints: [
      "Naive recursion takes O(2ⁿ) time. Use iterative memoization with two variables for O(n) time and O(1) space.",
    ],
    solutionExplanation: `Instead of recomputing subproblems recursively, keep track of only the previous two Fibonacci values (\`prev\` and \`curr\`) in an iterative loop.`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
  },
  {
    id: "deep-clone",
    title: "6. Deep Clone Object",
    difficulty: "advanced",
    category: "javascript",
    language: "javascript",
    functionName: "deepClone",
    tags: ["JavaScript", "Recursion", "Objects"],
    description: `Implement a \`deepClone(obj)\` function that creates an independent deep copy of an object, handling nested objects, arrays, and primitive values without mutating the original.`,
    starterCode: `/**
 * @param {any} obj
 * @return {any}
 */
function deepClone(obj) {
  // Write your code here
  
}
`,
    solutionCode: `function deepClone(obj) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(deepClone);
  }

  const copy = {};
  for (const key of Object.keys(obj)) {
    copy[key] = deepClone(obj[key]);
  }
  return copy;
}`,
    testCases: [
      {
        id: "tc-1",
        input: [{ a: 1, b: { c: 2 } }],
        expected: { a: 1, b: { c: 2 } },
        description: "Nested object clone",
      },
      {
        id: "tc-2",
        input: [[1, [2, 3], { d: 4 }]],
        expected: [1, [2, 3], { d: 4 }],
        description: "Nested arrays and objects",
      },
      {
        id: "tc-3",
        input: ["simple string"],
        expected: "simple string",
        description: "Primitive value copy",
      },
    ],
    hints: [
      "Check for null and primitives first.",
      "Check `Array.isArray(obj)` to preserve arrays, otherwise iterate over `Object.keys()`.",
    ],
    solutionExplanation: `Recursively clone array items and object properties. Base case returns primitives and null directly.`,
    timeComplexity: "O(n)",
    spaceComplexity: "O(n)",
  },
];
