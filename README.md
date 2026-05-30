# BrightSAT Trainer

Open-practice Digital SAT trainer. No login, no account, no ads. Opens straight into practice.

## Running locally

You need a static file server (required because browsers block `file://` imports for security).

**Option A — Python (built-in, no install):**
```bash
cd brightsat-trainer
python3 -m http.server 8080
```
Then open: http://localhost:8080

**Option B — Node / npx serve (no global install):**
```bash
cd brightsat-trainer
npx serve .
```
Then open the URL shown in the terminal (usually http://localhost:3000).

**Option C — VS Code Live Server extension:**
Right-click `index.html` → Open with Live Server.

## Project structure

```
brightsat-trainer/
├── index.html          Page shell — markup + <link>/<script> tags only
├── css/
│   └── styles.css      All styles
├── js/
│   ├── storage.js      localStorage wrapper (swap this to use a different store)
│   └── app.js          Engine: question flow, scoring, XP/streak, rendering
├── data/
│   ├── math.js         Static math questions + procedural generators
│   ├── reading.js      Information & Ideas + Craft & Structure questions
│   └── writing.js      Standard English Conventions + Expression of Ideas
├── assets/             (reserved for future icons/images)
├── tests/
│   └── verify_answers.js   Node.js test script — verifies all answer keys
└── README.md
```

## Running answer-key tests

```bash
node tests/verify_answers.js
```

Requires Node.js. No npm packages needed — pure Node. The script:
- Verifies every static question's answer index is in range
- Runs each math generator 200 times and re-solves the math independently
- Exits with code 0 on pass, 1 on any failure

## Adding questions

### Reading & Writing

Open `data/reading.js` or `data/writing.js` and add an object to the array:

```javascript
{
  id: "rw_ii_99",           // unique — use domain abbreviation + sequential number
  section: "rw",
  domain: "Information and Ideas",   // must match an existing domain string exactly
  skill: "Central Ideas and Details",
  type: "mc",
  passage: "Optional passage text here.",   // omit key entirely if no passage
  stem: "Which choice best states the main idea?",
  choices: ["Choice A", "Choice B", "Choice C", "Choice D"],
  answer: 1,                // 0-based index of the correct choice
  explanation: "Step-by-step rationale here."
}
```

Valid domains:
- `"Information and Ideas"`
- `"Craft and Structure"`
- `"Expression of Ideas"`
- `"Standard English Conventions"`

### Math (static)

Open `data/math.js`, find the `MATH_STATIC` array, and add:

```javascript
{
  id: "m_alg_99",
  section: "math",
  domain: "Algebra",        // Algebra | Advanced Math | Problem-Solving and Data Analysis | Geometry and Trigonometry
  skill: "Linear equations in one variable",
  type: "mc",               // or "grid" for student-produced responses
  stem: "What is the value of x if 3x + 7 = 22?",
  choices: ["3", "5", "7", "9"],
  answer: 1,                // index of correct choice (for mc)
  // answer: ["5"],         // array of accepted strings (for grid)
  explanation: "Subtract 7: 3x = 15. Divide: x = 5."
}
```

### Math generators

To add a new procedural generator, add a function inside the IIFE in `data/math.js` following the pattern of the existing generators, then add it to the `GEN_FUNCTIONS` array. Run `node tests/verify_answers.js` to verify it.

## Deployment

Drop the entire `brightsat-trainer/` folder onto any static host:
- **GitHub Pages** — push to a repo, enable Pages from the root of the branch
- **Netlify / Vercel** — drag the folder into the dashboard
- **Any web server** — serve the directory as-is; no build step needed
