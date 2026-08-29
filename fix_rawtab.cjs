const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/AdminTestsPage.tsx', 'utf8');

const updated = content.replace(
  "      : rawTab === 'student-results' || rawTab === 'results'\n      ? 'student-results'\n      : 'class-test';",
  "      : rawTab === 'student-results' || rawTab === 'results'\n      ? 'student-results'\n      : rawTab === 'create-test'\n      ? 'create-test'\n      : 'class-test';"
);

fs.writeFileSync('src/pages/admin/AdminTestsPage.tsx', updated);
