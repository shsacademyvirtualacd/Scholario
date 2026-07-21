const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');

async function run() {
  const files = fs.readdirSync(rootDir);
  const sqlFiles = files.filter(f => f.endsWith('.sql'));

  const results = [];

  for (const f of sqlFiles) {
    const filePath = path.join(rootDir, f);
    const content = fs.readFileSync(filePath, 'utf8');
    const stat = fs.statSync(filePath);

    // Extract first 5 lines
    const lines = content.split('\n');
    const header = lines.slice(0, 5).join('\n').trim();

    // Look for statements
    const creates = [];
    const alters = [];
    const drops = [];
    const inserts = [];

    const matches = content.matchAll(/\b(CREATE|ALTER|DROP|INSERT)\b\s+([A-Za-z0-9_]+(\s+[A-Za-z0-9_]+)?)/gi);
    for (const m of matches) {
      const type = m[1].toUpperCase();
      const obj = m[2].replace(/\s+/g, ' ').trim();
      const summary = `${type} ${obj}`;
      if (type === 'CREATE') {
        if (!creates.includes(summary)) creates.push(summary);
      } else if (type === 'ALTER') {
        if (!alters.includes(summary)) alters.push(summary);
      } else if (type === 'DROP') {
        if (!drops.includes(summary)) drops.push(summary);
      } else if (type === 'INSERT') {
        if (!inserts.includes(summary)) inserts.push(summary);
      }
    }

    results.push({
      filename: f,
      size: stat.size,
      mtime: stat.mtime.toISOString(),
      header,
      creates: creates.slice(0, 10),
      alters: alters.slice(0, 10),
      drops: drops.slice(0, 10),
      inserts: inserts.slice(0, 10)
    });
  }

  // Sort by modification time
  results.sort((a, b) => new Date(a.mtime) - new Date(b.mtime));

  fs.writeFileSync(
    path.join(__dirname, 'migrations_analysis.json'),
    JSON.stringify(results, null, 2),
    'utf8'
  );
  console.log(`Analyzed ${results.length} SQL files. Saved output to migrations_analysis.json`);
}

run().catch(console.error);
