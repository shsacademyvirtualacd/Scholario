const fs = require('fs');
const txt = fs.readFileSync('src/data/grade9FbiseBank.json', 'utf8');
const parsed = JSON.parse(txt);
console.log("JSON parses correctly, length:", Object.keys(parsed).length);
