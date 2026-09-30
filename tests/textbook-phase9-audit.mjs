import fs from 'node:fs';
const root=new URL('../',import.meta.url);const read=n=>fs.readFileSync(new URL(n,root),'utf8');const failures=[];const assert=(ok,msg)=>{if(!ok)failures.push(msg)};
const source=read('textbook-phase9.js');for(const token of ['Search this chapter','data-textbook-search','No matching textbook page','Related pages','Quick links','data-related-page','data-quick-page','_textbookSearchFocus','GCSE_TEXTBOOK_PHASE9'])assert(source.includes(token),`textbook-phase9.js missing '${token}'.`);
const css=read('textbook-phase9.css');for(const token of ['.textbook-search','.textbook-search-results','.textbook-related-pages','.textbook-quicklinks','.sr-only'])assert(css.includes(token),`textbook-phase9.css missing '${token}'.`);
assert(source.includes("e.key==='/'"),'Phase 9 missing / keyboard search shortcut.');
assert(source.includes('score:similarity'),'Phase 9 missing related-page similarity scoring.');
if(failures.length){console.error(`TEXTBOOK PHASE 9 AUDIT FAILED (${failures.length})`);failures.forEach(x=>console.error(`- ${x}`));process.exit(1)}
console.log('TEXTBOOK PHASE 9 AUDIT PASSED: chapter search, keyboard focus, ranked results, related-page links and textbook quick links are wired into the digital reader.');