import fs from 'node:fs';

const js=fs.readFileSync('real-exam-mocks.js','utf8');
const css=fs.readFileSync('real-exam-mocks.css','utf8');
const loader=fs.readFileSync('course-audit-fixes.js','utf8');
const must=(c,m)=>{if(!c)throw new Error(m)};

for(const token of [
  "combined:{marks:70,minutes:75",
  "separate:{marks:100,minutes:105",
  "Foundation Tier",
  "Higher Tier",
  "automatic submission at 00:00",
  "function finishPaper(timedOut)",
  "function autoMark(q,answer)",
  "Open full mark scheme",
  "ORIGINAL PRACTICE MARK SCHEME",
  "data-equation-sheet",
  "source:'full-timed-exam'",
  "window.dispatchEvent(new CustomEvent('gcse-performance-record'",
  "window.GCSE_REAL_EXAMS"
]) must(js.includes(token),`Missing full exam behavior: ${token}`);

must(js.includes("SPECS = { combined:'8464', biology:'8461', chemistry:'8462', physics:'8463' }"),'AQA specification codes missing.');
must(js.includes("current.endAt=startedAt+settings.minutes*60000") || js.includes("endAt:startedAt+settings.minutes*60000"),'Persistent end time missing.');
must(js.includes("if(seconds<=0)finishPaper(true)"),'Timer does not auto-submit at zero.');
must(js.includes("marking(r.q.marking)"),'Mark scheme content missing.');
must(js.includes("It is not an official AQA question paper"),'Original-paper copyright/status notice missing.');
must(js.includes("not an official AQA mark scheme"),'Original mark-scheme notice missing.');
must(css.includes('.exam-paper-cover'),'Exam paper cover styling missing.');
must(css.includes('.exam-question-group'),'Structured question styling missing.');
must(css.includes('.exam-markscheme'),'Mark scheme styling missing.');
must(css.includes('.exam-timer'),'Timed exam styling missing.');
for(const file of ['real-exam-mocks.css','real-exam-mocks.js'])must(loader.includes(file),`Loader missing ${file}`);

console.log('REAL EXAM MOCK AUDIT PASSED: Combined 70m/75min and Separate 100m/105min papers, Foundation/Higher selection, persistent timer, auto-submit, auto-marking, physics equation sheet, answer review and post-submission mark scheme are present.');
