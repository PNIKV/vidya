# py/ — STEM Quest Scripts

All utility scripts are stored here for easy access.

## compile-test-results.js

Parses all student CSV test files and compiles a single `leaderboard-data.json`.

**Run from the project root:**
```powershell
node py/compile-test-results.js
```

**Or run from this folder:**
```powershell
cd py
node compile-test-results.js
```

### When to run it
- After adding **new student CSV files** to `assessment/data/tests/`
- Output is written to `assessment/data/leaderboard-data.json`
- The Teacher Dashboard reads this file automatically on login

### Supported CSV Formats
| Format | Description |
|---|---|
| Multi-row detailed | One row per question: Student Name, Grade, School, Q#, Type, ... |
| Wide single-row (50 cols) | Name, Grade, School/College, Q1 to Q50, Total, % |
| App export format | Similar to multi-row with extra Question ID column |
