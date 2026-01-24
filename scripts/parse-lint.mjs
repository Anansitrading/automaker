import { readFileSync } from 'fs';
const data = JSON.parse(readFileSync('lint_results_ui_v8.json', 'utf8'));
const errors = data.flatMap((file) =>
  file.messages
    .filter((m) => m.severity === 2)
    .map((m) => ({
      ruleId: m.ruleId,
      message: m.message,
      file: file.filePath.replace(process.cwd(), ''),
      line: m.line,
    }))
);
console.log(JSON.stringify(errors, null, 2));
