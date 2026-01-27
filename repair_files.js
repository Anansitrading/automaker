
const fs = require('fs');
const path = require('path');

const files = [
    'apps/server/src/index.ts',
    'apps/server/src/lib/auth.ts',
    'apps/ui/src/lib/http-api-client.ts',
    'apps/ui/vite.simple.config.ts',
    'vite.proxy.config.ts',
    'vite.simple.config.ts'
];

files.forEach(file => {
    const filePath = path.resolve(process.cwd(), file);
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }

    const buffer = fs.readFileSync(filePath);
    // Find where the garbage starts. 
    // The garbage was appended. It likely starts with a sequence of nulls or just the boundaries.
    // Since I know I appended to the end, and the previous content was valid text.
    // I will scan from the end backwards until I find a valid closing character (For TS files: '}' or ';') 
    // AND a newline, then assume everything after is garbage.

    // Better: Convert to string, look for the corruption.
    let content = buffer.toString('utf8');

    // The corruption shown in the log was: / / ... f o r c e
    // This looks like nulls were interpreted as spaces or just garbage.

    // Strategy:
    // 1. Remove all null bytes \0.
    // 2. Remove the string "// force-fix" (and variants like "/ / f o r c e ...")
    // 3. Trim end.
    // 4. Append clean "// force-fix"

    // But wait, if I remove null bytes, I might merge chars?
    // "f\0o\0r\0c\0e" -> "force".
    // So if I can recover "force-fix" from the garbage, I can just remove it.

    // However, I want to remove the garbage line entirely.
    // So I'll just trim until the last '}' or ';'.

    let trimmed = content;
    // Remove known garbage pattern "force-fix" with wide chars
    // It seems to be formatted as space-char-space-char in the error log.

    // Let's just find the last occurrence of "}" or ";" and keep everything up to it?
    // But there might be comments after.

    // Reliable method:
    // Identify the appended part. It was added by "echo ... >> file".
    // It's at the very end.

    // I'll regex replace /[\s\S]*force-fix[\s\S]*$/ assuming "force-fix" is identifiable.
    // If not, I'll search for the utf-16 BOM or similar if present?

    // Let's rely on the fact that I know the files ended with valid code.
    // I will look for the last non-whitespace character that is '}' or ';'.
    // Then keep up to that.

    let lastIdx = -1;
    const validEndings = ['}', ';'];

    for (let i = trimmed.length - 1; i >= 0; i--) {
        const char = trimmed[i];
        if (validEndings.includes(char)) {
            lastIdx = i;
            break;
        }
    }

    if (lastIdx !== -1) {
        // Check if we are cutting off too much?
        // The garbage is definitely AFTER the last valid code char (since I appended).
        // So cutting at lastIdx + 1 is safe.
        trimmed = trimmed.substring(0, lastIdx + 1);

        // Add correct comment
        const newContent = trimmed + '\n// force-fix\n';
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Repaired ${file}`);
    } else {
        console.error(`Could not find valid ending in ${file}`);
    }
});
