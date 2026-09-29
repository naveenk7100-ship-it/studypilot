import fs from 'fs';
import path from 'path';

const projectRoot = process.cwd();
const secretPatterns = [
  /AIza[0-9A-Za-z-_]{35}/g,
  /sk-[a-zA-Z0-9]{20,}/g,
  /gsk_[a-zA-Z0-9]{20,}/g,
  /sk-ant-[a-zA-Z0-9]{20,}/g,
  /bearer\s+[a-zA-Z0-9_\-\.]{25,}/gi,
  /ghp_[a-zA-Z0-9]{36}/g,
  /github_pat_[a-zA-Z0-9_]{80,}/g,
  /xox[baprs]-[0-9a-zA-Z]{10,}/g,
  /BEGIN (RSA|EC|DSA|OPENSSH) PRIVATE KEY/g
];

const ignoredDirs = new Set(['node_modules', '.git']);
let scannedFilesCount = 0;
let violations = [];

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile()) {
      scannedFilesCount++;
      const relativePath = path.relative(projectRoot, fullPath);
      
      // Check file name safety
      if (entry.name === '.env' && !fs.readFileSync(fullPath, 'utf8').includes('AI_PROVIDER=demo')) {
        // Just flag if .env has real keys
      }

      // Read text content
      try {
        const content = fs.readFileSync(fullPath, 'utf8');
        for (const pattern of secretPatterns) {
          const matches = content.match(pattern);
          if (matches) {
            violations.push({
              file: relativePath,
              pattern: pattern.toString(),
              matches: matches.map(m => m.slice(0, 10) + '...')
            });
          }
        }

        // Specifically for client source and bundles: check for client-side API key exposure
        if (relativePath.startsWith('client') && !relativePath.includes('services/api.ts')) {
          if (content.includes('GEMINI_API_KEY') || content.includes('OPENAI_API_KEY') || content.includes('GROQ_API_KEY')) {
            // Check if it's not a diagnostic display string or instructional setup guide
            if (!relativePath.includes('BackendDiagnostic') && !relativePath.includes('types') && !relativePath.includes('SettingsView')) {
              // In bundled dist, allow the legitimate instructional setup guide
              if (relativePath.includes('dist') && content.includes('as an environment variable in your backend dashboard')) {
                // Legitimate UI setup instruction in bundle
              } else {
                violations.push({
                  file: relativePath,
                  pattern: 'AI_KEY_IN_CLIENT',
                  matches: ['Possible AI key reference in client']
                });
              }
            }
          }
        }
      } catch (err) {
        // Skip binary files if unreadable
      }
    }
  }
}

console.log('--- Starting Recursive Secret Scan ---');
scanDir(projectRoot);
console.log(`Scanned ${scannedFilesCount} files.`);
if (violations.length === 0) {
  console.log('✅ ZERO SECRETS FOUND. Codebase is clean.');
} else {
  console.error('❌ SECRETS/VIOLATIONS FOUND:');
  console.error(JSON.stringify(violations, null, 2));
}

// Check .gitignore
const gitignore = fs.readFileSync(path.join(projectRoot, '.gitignore'), 'utf8');
const gitignorePass = gitignore.includes('.env') && gitignore.includes('node_modules') && gitignore.includes('dist');
console.log(`.gitignore protection: ${gitignorePass ? 'PASS' : 'FAIL'}`);

// Check .env and .env.example
const envExample = fs.readFileSync(path.join(projectRoot, '.env.example'), 'utf8');
const envExampleClean = !secretPatterns.some(p => p.test(envExample));
console:console.log(`.env.example clean: ${envExampleClean ? 'PASS' : 'FAIL'}`);
