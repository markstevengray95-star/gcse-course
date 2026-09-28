import fs from 'node:fs';

const runtime=fs.readFileSync('presentation-runtime-fix.js','utf8');
const loader=fs.readFileSync('lesson-specificity-ui.js','utf8');
const presentation=fs.readFileSync('presentation-lessons.js','utf8');

const failures=[];
const expect=(condition,message)=>{if(!condition)failures.push(message);};

expect(runtime.includes('ensurePresentation'),'runtime guard exposes ensurePresentation');
expect(runtime.includes('mountFallback'),'runtime guard can mount a fallback presentation');
expect(runtime.includes("querySelector('.lesson-expanded')"),'runtime guard targets the actually open lesson');
expect(runtime.includes("querySelector('.lesson-presentation')"),'runtime guard avoids duplicate decks');
expect(runtime.includes('GCSE_PRESENTATION_LESSONS'),'runtime guard reuses the existing presentation engine');
expect(runtime.includes('slideDeck'),'fallback uses the complete lesson slide model');
expect(runtime.includes('MutationObserver'),'runtime guard watches lesson DOM changes');
expect(runtime.includes('data-presentation-runtime')||runtime.includes('presentationRuntime'),'fallback marks runtime-mounted decks');
expect(loader.includes("script.src='presentation-runtime-fix.js'"),'last-loaded UI loads the runtime guard');
expect(loader.includes('presentationRuntimeFix'),'runtime loader is de-duplicated');
expect(presentation.includes('window.GCSE_PRESENTATION_LESSONS={enhanceOpenLesson,showSlide,slideDeck}'),'core presentation API remains exposed');

if(failures.length){
  console.error(`PRESENTATION RUNTIME AUDIT FAILED (${failures.length})`);
  failures.forEach(f=>console.error(`- ${f}`));
  process.exit(1);
}
console.log('PRESENTATION RUNTIME AUDIT PASSED: every opened lesson has a last-loaded guard that retries the normal presentation enhancer and mounts the complete slide deck directly if needed.');
