const fs = require('node:fs');
const path = require('node:path');

const targetFile = path.join(__dirname, 'assessment', 'beginner-questions.js');

if (!fs.existsSync(targetFile)) {
  console.error('File not found:', targetFile);
  process.exit(1);
}

let content = fs.readFileSync(targetFile, 'utf8');

// Replacement map for broken Mojibake strings
const replacements = [
  ['ðŸ”Œ', '🔌'],
  ['ðŸ”¬', '🔬'],
  ['âš¡', '⚡'],
  ['ðŸ’¡', '💡'],
  ['ðŸ”„', '🔄'],
  ['ðŸ”Š', '🔊'],
  ['ðŸ”¥', '🔥'],
  ['ðŸŒ€', '🌀'],
  ['ðŸ”‹', '🔋'],
  ['ðŸ”§', '🔧'],
  ['ðŸ”—', '🔗'],
  ['ðŸŒ🌟', '🌟'],
  ['ðŸŒŸ', '🌟'],
  ['ðŸ”½', '🔻'],
  ['ðŸ“¢', '📢'],
  ['ðŸ” ', '🔁'],
  ['ðŸ“¦', '📦'],
  ['ðŸ’¾', '💾'],
  ['ðŸ”€', '🔀'],
  ['ðŸ“ž', '📞'],
  ['ðŸ“‹', '📋'],
  ['ðŸ’¬', '💬'],
  ['ðŸ“ ', '📝'],
  ['ðŸ“Œ', '📌'],
  ['ðŸ“–', '📖'],
  ['ðŸ‘‚', '👂'],
  ['ðŸ’»', '💻'],
  ['ðŸ§©', '🧩'],
  ['ðŸ”•', '🔔'],
  ['ðŸ¤”', '🤔'],
  ['ðŸ’¥', '💥'],
  ['ðŸ˜´', '😴'],
  ['âœ✨', '✨'],
  ['âœ✨', '✨'],
  ['âœ', '✨'],
  ['Î©', 'Ω'],
  ['â¬œ â†’ ðŸ’¡', '⬜ → 💡'],
  ['â†’', '→']
];

for (const [bad, good] of replacements) {
  content = content.split(bad).join(good);
}

fs.writeFileSync(targetFile, content, 'utf8');
console.log('Successfully cleaned up emojis and characters in beginner-questions.js');
