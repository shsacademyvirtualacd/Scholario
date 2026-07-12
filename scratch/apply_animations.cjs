const fs = require('fs');
const path = require('path');

const directoryToSearch = [
  path.join(__dirname, '../src/pages'),
  path.join(__dirname, '../src/components')
];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Add interactive to classes containing 'btn', 'card', 'stat-card' unless it's already there
  // Using a regex with lookahead/lookbehind is tricky in JS, so we'll do simpler string replacements 
  // or a replacer function for className="..."
  
  content = content.replace(/className=(['"])(.*?)\1/g, (match, quote, classStr) => {
    let classes = classStr.split(' ');
    
    // Check if it's a button, card, or stat-card
    if (classes.includes('btn') || classes.includes('card') || classes.includes('stat-card')) {
      if (!classes.includes('interactive')) {
        classes.push('interactive');
      }
    }
    
    // For lists, if it has 'grid' or 'flex' and is mapping over items, 
    // it's too complex to detect list-fade-in automatically everywhere reliably.
    
    return `className=${quote}${classes.join(' ')}${quote}`;
  });

  // Specifically for buttons that might not have the 'btn' class
  // e.g., <button className="px-4 py-2 ...">
  content = content.replace(/<button([^>]*)className=(['"])(.*?)\2([^>]*)>/g, (match, p1, quote, classStr, p4) => {
    let classes = classStr.split(' ');
    if (!classes.includes('interactive') && !classes.includes('interactive-skip')) {
      // Don't add if it's explicitly skipping
      classes.push('interactive');
    }
    return `<button${p1}className=${quote}${classes.join(' ')}${quote}${p4}>`;
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated: ${filePath}`);
  }
}

function traverseDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
      processFile(fullPath);
    }
  }
}

directoryToSearch.forEach(dir => traverseDir(dir));
