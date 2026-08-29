const fs = require('fs');
const content = fs.readFileSync('src/pages/admin/AdminTestsPage.tsx', 'utf8');

// Update activeTab definition
let updated = content.replace(
  "const activeTab: 'class-test' | 'self-test' | 'question-bank' | 'student-results' =",
  "const activeTab: 'class-test' | 'self-test' | 'question-bank' | 'student-results' | 'create-test' ="
);

updated = updated.replace(
  "const setActiveTab = (tab: 'class-test' | 'self-test' | 'question-bank' | 'student-results') => {",
  "const setActiveTab = (tab: 'class-test' | 'self-test' | 'question-bank' | 'student-results' | 'create-test') => {"
);

// Add import
updated = updated.replace(
  "import StudentResultsView from '../../components/tests/StudentResultsView';",
  "import StudentResultsView from '../../components/tests/StudentResultsView';\nimport AdminCreateTestView from '../../components/admin/tests/AdminCreateTestView';"
);

// Add Create Test button after Class Test button
const classTestBtn = `        <button
          onClick={() => setActiveTab('class-test')}
          className={\`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer \${
            activeTab === 'class-test'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-[#525252] hover:text-[#111111] hover:bg-black/5'
          }\`}
        >
          <FileCheck2 size={15} className={activeTab === 'class-test' ? 'text-[#F4C430]' : 'text-[#737373]'} />
          <span>Class Test</span>
          <span
            className={\`px-2 py-0.5 rounded-full text-[10px] font-extrabold \${
              activeTab === 'class-test' ? 'bg-white/20 text-white' : 'bg-black/5 text-[#737373]'
            }\`}
          >
            {tests.length}
          </span>
        </button>`;

const createTestBtn = `

        <button
          onClick={() => setActiveTab('create-test')}
          className={\`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer \${
            activeTab === 'create-test'
              ? 'bg-[#111111] text-white shadow-xs'
              : 'text-[#525252] hover:text-[#111111] hover:bg-black/5'
          }\`}
        >
          <Plus size={15} className={activeTab === 'create-test' ? 'text-[#F4C430]' : 'text-[#737373]'} />
          <span>Create Test</span>
        </button>`;

updated = updated.replace(classTestBtn, classTestBtn + createTestBtn);

// Add view routing
const studentResultsCheck = "{activeTab === 'student-results' ? (";
const createTestCheck = "{activeTab === 'create-test' ? (\n        <AdminCreateTestView />\n      ) : activeTab === 'student-results' ? (";
updated = updated.replace(studentResultsCheck, createTestCheck);

fs.writeFileSync('src/pages/admin/AdminTestsPage.tsx', updated);
