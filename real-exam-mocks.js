(() => {
  'use strict';

  const DATA = window.GCSE_COURSE_DATA;
  const RICH = window.GCSE_RICH_CONTENT;
  if (!DATA?.topics?.length) return;

  const DRAFT_KEY = 'gcse-real-exam-active-v1';
  const HISTORY_KEY = 'gcse-real-exam-history-v1';
  const SPECS = { combined:'8464', biology:'8461', chemistry:'8462', physics:'8463' };
  const SUBJECT_NAMES = { biology:'Biology', chemistry:'Chemistry', physics:'Physics' };
  const FORMAT = {
    combined:{marks:70,minutes:75,label:'Combined Science: Trilogy'},
    separate:{marks:100,minutes:105,label:'Separate Science'}
  };
  const PHYSICS_EQUATIONS = [
    'kinetic energy = 0.5 × mass × speed²','elastic potential energy = 0.5 × spring constant × extension²',
    'gravitational potential energy = mass × gravitational field strength × height','change in thermal energy = mass × specific heat capacity × temperature change',
    'power = energy transferred ÷ time','power = work done ÷ time','efficiency = useful output ÷ total input',
    'charge flow = current × time','potential difference = current × resistance','power = potential difference × current',
    'power = current² × resistance','energy transferred = power × time','energy transferred = charge flow × potential difference',
    'density = mass ÷ volume','weight = mass × gravitational field strength','work done = force × distance',
    'force = spring constant × extension','distance = speed × time','acceleration = change in velocity ÷ time',
    'resultant force = mass × acceleration','momentum = mass × velocity','wave speed = frequency × wavelength',
    'thermal energy for a change of state = mass × specific latent heat','moment = force × perpendicular distance',
    'pressure = force ÷ area','pressure in a liquid = height × density × gravitational field strength',
    'final velocity² − initial velocity² = 2 × acceleration × distance','force = change in momentum ÷ time',
    'period = 1 ÷ frequency','magnification = image height ÷ object height','force on conductor = magnetic flux density × current × length',
    'primary pd ÷ secondary pd = primary turns ÷ secondary turns','primary pd × primary current = secondary pd × secondary current','for gases: pressure × volume = constant'
  ];

  let shell = null;
  let current = null;
  let lastResult = null;
  let timer = null;

  const parse = (v,f) => { try { return JSON.parse(v) ?? f; } catch { return f; } };
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const clamp = (n,min,max) => Math.max(min,Math.min(max,Number(n)||0));
  const normalise = s => String(s||'').toLowerCase().replace(/[^a-z0-9.\-\s/]/g,' ').replace(/\s+/g,' ').trim();
  const formatClock = s => `${String(Math.floor(Math.max(0,s)/60)).padStart(2,'0')}:${String(Math.max(0,s)%60).padStart(2,'0')}`;
  const specCode = (qualification,subject) => qualification==='combined' ? SPECS.combined : SPECS[subject];
  const planAllowed = () => Boolean(window.GCSE_ACCESS?.can?.('exam_tools'));
  const requireAccess = () => {
    if (planAllowed()) return true;
    window.GCSE_ACCESS?.showUpgrade?.('exam_tools','Full timed mock exam papers');
    return false;
  };
  const saveDraft = () => current && localStorage.setItem(DRAFT_KEY,JSON.stringify(current));
  const clearDraft = () => localStorage.removeItem(DRAFT_KEY);

  function hash(text) {
    let h=2166136261; for(const ch of String(text)){h^=ch.charCodeAt(0);h=Math.imul(h,16777619);} return (h>>>0).toString(36);
  }
  function rng(seed) {
    let x = Number.parseInt(hash(seed),36) || 123456789;
    return () => { x ^= x<<13; x ^= x>>>17; x ^= x<<5; return ((x>>>0)%100000)/100000; };
  }
  function shuffle(list,seed) {
    const out=[...list],r=rng(seed); for(let i=out.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[out[i],out[j]]=[out[j],out[i]];} return out;
  }
  function marking(value) {
    if(Array.isArray(value)) return value.flat().map(String).map(x=>x.trim()).filter(Boolean);
    if(value && typeof value==='object') return Object.values(value).flat().map(String).map(x=>x.trim()).filter(Boolean);
    return value ? [String(value)] : [];
  }
  function qObject(topic,prompt,marks,points,source,index,modelAnswer='') {
    const clean=String(prompt||'').trim(); if(!clean) return null;
    return {id:`exam-${topic.id}-${hash(`${source}|${index}|${clean}`)}`,topicId:topic.id,topicCode:topic.code,topicTitle:topic.title,subject:topic.subject,paper:Number(topic.paper),prompt:clean,marks:clamp(marks,1,6),marking:marking(points),modelAnswer:String(modelAnswer||''),source,type:'written'};
  }

  function poolFor(options) {
    const topics=DATA.topics.filter(t=>t.subject===options.subject && Number(t.paper)===Number(options.paper));
    const out=[];
    topics.forEach(topic=>{
      const guide=RICH?.guides?.[topic.id];
      (guide?.exam||[]).forEach((q,i)=>{const item=qObject(topic,Array.isArray(q)?q[0]:q?.prompt,Array.isArray(q)?q[1]:q?.marks,Array.isArray(q)?q[2]:(q?.marking||q?.points),'exam',i);if(item)out.push(item);});
      (topic.quiz||[]).forEach((q,i)=>{const item=qObject(topic,q?.[0],1,[q?.[1]],'quiz',i,q?.[1]);if(item){item.type='short';out.push(item);}});
      (topic.lessons||[]).forEach(([title,scope],lessonIndex)=>{
        if(options.qualification==='combined' && scope==='triple') return;
        const lesson=RICH?.getLesson?.(topic,title,lessonIndex);
        (lesson?.terms||[]).slice(0,4).forEach((term,i)=>{
          if(!term?.[0]||!term?.[1])return;
          const item=qObject(topic,`State what is meant by the term “${term[0]}”.`,1,[term[1]],'definition',lessonIndex*10+i,term[1]);
          if(item){item.type='short';out.push(item);}
        });
        if(lesson?.worked?.question && lesson?.worked?.steps?.length){
          const item=qObject(topic,lesson.worked.question,Math.min(4,Math.max(2,lesson.worked.steps.length)),lesson.worked.steps,'worked',lessonIndex,lesson.worked.steps.join(' '));
          if(item)out.push(item);
        }
      });
    });
    const unique=new Map(); out.forEach(q=>unique.set(normalise(q.prompt),q));
    return [...unique.values()];
  }

  function makeMcq(question,pool,seed) {
    if(question.marks!==1 || !question.modelAnswer || question.modelAnswer.length>70) return question;
    const others=shuffle(pool.filter(q=>q.id!==question.id && q.marks===1 && q.modelAnswer && q.modelAnswer.length<70),seed).map(q=>q.modelAnswer).filter((v,i,a)=>a.indexOf(v)===i && normalise(v)!==normalise(question.modelAnswer)).slice(0,3);
    if(others.length<3) return question;
    const options=shuffle([question.modelAnswer,...others],`${seed}-options`);
    return {...question,type:'mcq',options,correct:question.modelAnswer};
  }

  function buildPaper(options) {
    const settings=FORMAT[options.qualification];
    const seed=`${options.qualification}-${options.subject}-${options.paper}-${options.tier}-${Date.now()}`;
    let pool=poolFor(options);
    if(options.tier==='foundation') pool.sort((a,b)=>a.marks-b.marks);
    else pool.sort((a,b)=>b.marks-a.marks);
    pool=shuffle(pool,seed);
    const selected=[],used=new Set();
    const topicIds=DATA.topics.filter(t=>t.subject===options.subject&&Number(t.paper)===Number(options.paper)).map(t=>t.id);
    let remaining=settings.marks;

    // Ensure broad topic coverage first.
    topicIds.forEach((topicId,idx)=>{
      const candidates=pool.filter(q=>q.topicId===topicId&&!used.has(q.id)&&q.marks<=remaining);
      const preferred=candidates.find(q=>q.marks>=2&&q.marks<=5)||candidates[0];
      if(preferred){selected.push(preferred);used.add(preferred.id);remaining-=preferred.marks;}
      const second=candidates.find(q=>!used.has(q.id)&&q.marks<=remaining&&q.marks<=3);
      if(second&&remaining>0){selected.push(second);used.add(second.id);remaining-=second.marks;}
    });

    // Fill exactly to 70/100 marks. The lesson-definition items guarantee 1-mark fillers.
    let guard=0;
    while(remaining>0 && guard<2000){
      guard++;
      const candidate=pool.find(q=>!used.has(q.id)&&q.marks<=remaining);
      if(!candidate) break;
      selected.push(candidate);used.add(candidate.id);remaining-=candidate.marks;
    }
    if(remaining>0){
      const fallbackTopics=DATA.topics.filter(t=>topicIds.includes(t.id));
      for(let i=0;i<remaining;i++){
        const topic=fallbackTopics[i%fallbackTopics.length];
        selected.push(qObject(topic,`State one key scientific idea from ${topic.title}.`,1,[topic.summary.split(/[,.]/)[0]],'fallback',i,topic.summary.split(/[,.]/)[0]));
      }
      remaining=0;
    }

    const selectedPool=[...selected];
    let mcqCount=0;
    const questions=selected.map((q,i)=>{
      if(q.marks===1 && mcqCount<Math.max(3,Math.floor(settings.marks/20)) && i%3===0){mcqCount++;return makeMcq(q,selectedPool,`${seed}-${i}`);} return q;
    });

    const byTopic=new Map(); questions.forEach(q=>{if(!byTopic.has(q.topicId))byTopic.set(q.topicId,[]);byTopic.get(q.topicId).push(q);});
    const groups=[];
    [...byTopic.entries()].forEach(([topicId,qs])=>{
      let chunk=[],marks=0;
      qs.forEach(q=>{
        if(chunk.length && marks+q.marks>12){groups.push({topicId,questions:chunk});chunk=[];marks=0;}
        chunk.push(q);marks+=q.marks;
      });
      if(chunk.length)groups.push({topicId,questions:chunk});
    });
    let questionNumber=1;
    groups.forEach(group=>{
      group.number=questionNumber++;
      group.questions.forEach((q,i)=>{q.number=`${String(group.number).padStart(2,'0')}.${i+1}`;});
    });

    const startedAt=Date.now();
    return {id:`paper-${hash(seed)}`,version:2,qualification:options.qualification,subject:options.subject,paper:Number(options.paper),tier:options.tier,totalMarks:settings.marks,durationMinutes:settings.minutes,spec:specCode(options.qualification,options.subject),startedAt,endAt:startedAt+settings.minutes*60000,groups,questions,answers:{},candidateName:'',status:'active'};
  }

  function pointMatch(answer,point) {
    const a=normalise(answer),p=normalise(point); if(!a||!p)return false;
    const nums=p.match(/-?\d+(?:\.\d+)?/g); if(nums?.some(n=>a.includes(n)))return true;
    if(a.includes(p))return true;
    const words=p.split(' ').filter(w=>w.length>3&&!['with','from','that','this','into','than','same','more','less','both','when','because','using'].includes(w));
    if(!words.length)return false;
    const hits=words.filter(w=>a.includes(w)).length;
    return hits>=Math.max(1,Math.ceil(words.length*.55));
  }
  function autoMark(q,answer) {
    if(q.type==='mcq') return {score:normalise(answer)===normalise(q.correct)?1:0,matched:normalise(answer)===normalise(q.correct)?[q.correct]:[],missing:normalise(answer)===normalise(q.correct)?[]:[q.correct],confidence:'high'};
    const points=marking(q.marking); if(!String(answer||'').trim())return{score:0,matched:[],missing:points,confidence:'high'};
    const matched=points.filter(p=>pointMatch(answer,p));
    const score=points.length?clamp(Math.round((matched.length/points.length)*q.marks),0,q.marks):0;
    return {score,matched,missing:points.filter(p=>!matched.includes(p)),confidence:q.marks<=2?'high':'indicative'};
  }

  function ensureShell() {
    if(shell)return shell;
    shell=document.createElement('div'); shell.className='real-exam-shell'; shell.hidden=true;
    shell.innerHTML=`<div class="real-exam-backdrop"></div><section class="real-exam-workspace" role="dialog" aria-modal="true"><header class="real-exam-global-head"><div><span>GCSE Science</span><strong>Full Exam Paper Simulator</strong></div><button type="button" data-real-exam-close aria-label="Close">×</button></header><div data-real-exam-body class="real-exam-body"></div></section>`;
    document.body.appendChild(shell);
    shell.querySelector('[data-real-exam-close]').addEventListener('click',closeShell);
    return shell;
  }
  function body(){return ensureShell().querySelector('[data-real-exam-body]');}
  function openShell(){if(!requireAccess())return;document.querySelector('.revision-shell')?.setAttribute('hidden','');ensureShell().hidden=false;document.body.classList.add('real-exam-open');renderSetup();}
  function closeShell(){ensureShell().hidden=true;document.body.classList.remove('real-exam-open');}

  function renderSetup() {
    stopTimer();
    const draft=parse(localStorage.getItem(DRAFT_KEY),null);
    const history=parse(localStorage.getItem(HISTORY_KEY),[]);
    body().innerHTML=`
      <div class="real-exam-setup">
        <div class="real-exam-intro"><span class="eyebrow">Exam conditions</span><h2>Full timed GCSE Science papers</h2><p>Original practice papers built to the current AQA assessment length and mark totals. The mark scheme is locked until the paper is submitted.</p></div>
        ${draft?.status==='active'?`<div class="real-exam-resume"><div><strong>Timed paper in progress</strong><span>${esc(SUBJECT_NAMES[draft.subject])} Paper ${draft.paper} · ${draft.totalMarks} marks</span></div><button type="button" data-resume-paper>Resume paper</button><button type="button" data-discard-paper>Discard</button></div>`:''}
        <form class="real-exam-builder" data-real-exam-builder>
          <label>Qualification<select name="qualification"><option value="combined">AQA Combined Science: Trilogy</option><option value="separate">AQA Separate Science</option></select></label>
          <label>Subject<select name="subject"><option value="biology">Biology</option><option value="chemistry">Chemistry</option><option value="physics">Physics</option></select></label>
          <label>Paper<select name="paper"><option value="1">Paper 1</option><option value="2">Paper 2</option></select></label>
          <label>Tier<select name="tier"><option value="higher">Higher Tier</option><option value="foundation">Foundation Tier</option></select></label>
          <div class="real-exam-format" data-format-preview></div>
          <button class="real-exam-primary" type="submit">Generate and start timed paper</button>
        </form>
        <div class="real-exam-history"><h3>Recent full papers</h3>${history.length?history.slice(0,6).map(h=>`<article><strong>${esc(SUBJECT_NAMES[h.subject])} Paper ${h.paper}</strong><span>${esc(h.tier)} · ${h.qualification==='combined'?'Combined':'Separate'}</span><b>${h.score}/${h.totalMarks} · ${Math.round(h.score/h.totalMarks*100)}%</b></article>`).join(''):'<p>No full papers completed yet.</p>'}</div>
      </div>`;
    const form=body().querySelector('[data-real-exam-builder]');
    const preview=()=>{const q=form.elements.qualification.value,c=FORMAT[q];body().querySelector('[data-format-preview]').innerHTML=`<strong>${c.marks} marks</strong><span>${Math.floor(c.minutes/60)} hour${c.minutes>=120?'s':''}${c.minutes%60?` ${c.minutes%60} minutes`:''}</span><small>Timed continuously · automatic submission at 00:00</small>`;};
    form.addEventListener('change',preview);preview();
    form.addEventListener('submit',e=>{e.preventDefault();current=buildPaper({qualification:form.elements.qualification.value,subject:form.elements.subject.value,paper:Number(form.elements.paper.value),tier:form.elements.tier.value});saveDraft();renderPaper();startTimer();});
    body().querySelector('[data-resume-paper]')?.addEventListener('click',()=>{current=draft;renderPaper();if(Date.now()>=current.endAt)finishPaper(true);else startTimer();});
    body().querySelector('[data-discard-paper]')?.addEventListener('click',()=>{clearDraft();renderSetup();});
  }

  function coverHtml() {
    const cfg=FORMAT[current.qualification],topicNames=DATA.topics.filter(t=>t.subject===current.subject&&Number(t.paper)===current.paper).map(t=>t.title).join('; ');
    return `<section class="exam-paper-cover" id="realExamCover"><div class="exam-cover-top"><span>GCSE</span><strong>SCIENCE PRACTICE EXAMINATION</strong></div><h1>${esc(SUBJECT_NAMES[current.subject])} Paper ${current.paper}</h1><h2>${current.qualification==='combined'?'Combined Science: Trilogy':'Separate Science'} · ${esc(current.tier==='higher'?'Higher Tier':'Foundation Tier')}</h2><div class="exam-cover-grid"><div><b>Specification</b><span>${current.spec}</span></div><div><b>Time allowed</b><span>${cfg.minutes===75?'1 hour 15 minutes':'1 hour 45 minutes'}</span></div><div><b>Total marks</b><span>${cfg.marks}</span></div></div><label class="candidate-name">Candidate name <input type="text" data-candidate-name value="${esc(current.candidateName||'')}"></label><div class="exam-instructions"><h3>Instructions</h3><ul><li>Answer every question.</li><li>Show working for calculations and include units where appropriate.</li><li>A calculator may be used.</li>${current.subject==='physics'?'<li>A physics equation sheet is available from the exam toolbar.</li>':''}<li>The timer runs continuously and the paper submits automatically when time reaches zero.</li></ul></div><div class="exam-cover-note">This is an original practice paper designed to mirror the assessment structure. It is not an official AQA question paper.</div><button type="button" class="real-exam-primary" data-jump-first>Go to Question 01</button></section>`;
  }
  function answerHtml(q) {
    if(q.type==='mcq')return `<div class="exam-mcq">${q.options.map((o,i)=>`<label><input type="radio" name="answer-${q.id}" value="${esc(o)}" ${current.answers[q.id]===o?'checked':''}><span>${String.fromCharCode(65+i)} ${esc(o)}</span></label>`).join('')}</div>`;
    const rows=q.marks>=4?8:q.marks>=2?5:3;
    return `<textarea rows="${rows}" data-exam-answer="${q.id}" aria-label="Answer to question ${q.number}">${esc(current.answers[q.id]||'')}</textarea>`;
  }
  function questionGroupsHtml() {
    return current.groups.map(group=>{
      const topic=DATA.topics.find(t=>t.id===group.topicId);
      return `<section class="exam-question-group" id="exam-group-${group.number}"><header><span class="exam-question-number">${String(group.number).padStart(2,'0')}</span><div><strong>This question is about ${esc(topic?.title||'science')}.</strong><small>${esc(topic?.code||'')}</small></div></header>${group.questions.map(q=>`<div class="exam-subquestion"><div class="exam-subquestion-head"><b>${q.number}</b><span>[${q.marks} mark${q.marks===1?'':'s'}]</span></div><p>${esc(q.prompt)}</p>${answerHtml(q)}</div>`).join('')}</section>`;
    }).join('');
  }
  function renderPaper() {
    body().innerHTML=`<div class="real-exam-session"><div class="real-exam-timerbar"><div><strong>${esc(SUBJECT_NAMES[current.subject])} Paper ${current.paper}</strong><span>${current.totalMarks} marks · ${esc(current.tier==='higher'?'Higher':'Foundation')}</span></div><div class="exam-timer"><small>Time remaining</small><b data-exam-timer>--:--</b></div><div class="exam-toolbar-actions">${current.subject==='physics'?'<button type="button" data-equation-sheet>Equation sheet</button>':''}<button type="button" data-fullscreen>Full screen</button><button type="button" data-submit-exam>Submit paper</button></div></div><div class="real-exam-layout"><aside class="exam-question-nav"><button data-nav-cover>Front</button>${current.groups.map(g=>`<button data-nav-group="${g.number}">${String(g.number).padStart(2,'0')}</button>`).join('')}</aside><main class="exam-paper">${coverHtml()}${questionGroupsHtml()}<section class="exam-end-page"><strong>END OF QUESTIONS</strong><p>Check your answers before submitting.</p><button type="button" class="real-exam-primary" data-submit-exam>Submit paper</button></section></main></div></div>`;
    const saveAnswer=(id,value)=>{current.answers[id]=value;saveDraft();markAnsweredNav();};
    body().querySelectorAll('[data-exam-answer]').forEach(el=>el.addEventListener('input',()=>saveAnswer(el.dataset.examAnswer,el.value)));
    body().querySelectorAll('.exam-mcq input').forEach(el=>el.addEventListener('change',()=>{const id=el.name.replace('answer-','');saveAnswer(id,el.value);}));
    body().querySelector('[data-candidate-name]')?.addEventListener('input',e=>{current.candidateName=e.target.value;saveDraft();});
    body().querySelector('[data-jump-first]')?.addEventListener('click',()=>body().querySelector('#exam-group-1')?.scrollIntoView({behavior:'smooth'}));
    body().querySelector('[data-nav-cover]')?.addEventListener('click',()=>body().querySelector('#realExamCover')?.scrollIntoView({behavior:'smooth'}));
    body().querySelectorAll('[data-nav-group]').forEach(btn=>btn.addEventListener('click',()=>body().querySelector(`#exam-group-${btn.dataset.navGroup}`)?.scrollIntoView({behavior:'smooth'})));
    body().querySelectorAll('[data-submit-exam]').forEach(btn=>btn.addEventListener('click',()=>{if(confirm('Submit this paper now? You will not be able to change your answers afterwards.'))finishPaper(false);}));
    body().querySelector('[data-equation-sheet]')?.addEventListener('click',showEquationSheet);
    body().querySelector('[data-fullscreen]')?.addEventListener('click',()=>document.documentElement.requestFullscreen?.());
    markAnsweredNav();
  }
  function markAnsweredNav(){current.groups.forEach(g=>{const answered=g.questions.filter(q=>String(current.answers[q.id]||'').trim()).length;body().querySelector(`[data-nav-group="${g.number}"]`)?.classList.toggle('answered',answered===g.questions.length);});}
  function showEquationSheet(){
    let panel=body().querySelector('.exam-equation-sheet'); if(panel){panel.remove();return;}
    panel=document.createElement('aside');panel.className='exam-equation-sheet';panel.innerHTML=`<header><strong>Physics Equations Sheet</strong><button type="button">×</button></header><p>Use these equations during this practice paper.</p><ul>${PHYSICS_EQUATIONS.map(e=>`<li>${esc(e)}</li>`).join('')}</ul>`;body().appendChild(panel);panel.querySelector('button').addEventListener('click',()=>panel.remove());
  }
  function startTimer(){stopTimer();const tick=()=>{if(!current||current.status!=='active')return;const seconds=Math.max(0,Math.ceil((current.endAt-Date.now())/1000));const el=body().querySelector('[data-exam-timer]');if(el){el.textContent=formatClock(seconds);el.classList.toggle('urgent',seconds<=600);}if(seconds<=0)finishPaper(true);};tick();timer=setInterval(tick,1000);}
  function stopTimer(){if(timer)clearInterval(timer);timer=null;}

  function finishPaper(timedOut) {
    if(!current||current.status!=='active')return;
    stopTimer();current.status='submitted';current.finishedAt=Date.now();current.timedOut=Boolean(timedOut);
    const results=current.questions.map(q=>({q,answer:current.answers[q.id]||'',...autoMark(q,current.answers[q.id]||'')}));
    current.score=results.reduce((n,r)=>n+r.score,0);current.results=results.map(r=>({id:r.q.id,score:r.score,max:r.q.marks,answer:r.answer,matched:r.matched,missing:r.missing}));
    const history=parse(localStorage.getItem(HISTORY_KEY),[]);history.unshift({id:current.id,subject:current.subject,paper:current.paper,tier:current.tier,qualification:current.qualification,score:current.score,totalMarks:current.totalMarks,finishedAt:current.finishedAt,timedOut});localStorage.setItem(HISTORY_KEY,JSON.stringify(history.slice(0,30)));clearDraft();
    results.forEach(r=>window.dispatchEvent(new CustomEvent('gcse-performance-record',{detail:{topicId:r.q.topicId,subject:r.q.subject,paper:r.q.paper,score:r.score,maxMarks:r.q.marks,source:'full-timed-exam',question:{id:r.q.id,prompt:r.q.prompt,marking:r.q.marking,modelAnswer:r.q.modelAnswer},answer:r.answer}})));
    lastResult={paper:current,results};renderResults();
  }
  function topicBreakdown(results){const map=new Map();results.forEach(r=>{const x=map.get(r.q.topicId)||{earned:0,possible:0,title:r.q.topicTitle,code:r.q.topicCode};x.earned+=r.score;x.possible+=r.q.marks;map.set(r.q.topicId,x);});return[...map.values()];}
  function renderResults(){
    const {paper,results}=lastResult,pct=Math.round(paper.score/paper.totalMarks*100),breakdown=topicBreakdown(results);
    body().innerHTML=`<div class="real-exam-results"><div class="exam-result-hero"><span class="eyebrow">Paper submitted${paper.timedOut?' · time expired':''}</span><h2>${esc(SUBJECT_NAMES[paper.subject])} Paper ${paper.paper}</h2><div><strong>${paper.score} / ${paper.totalMarks}</strong><b>${pct}%</b></div><p>This is an automated practice mark. Extended written answers are marked from the original indicative points and may still benefit from teacher review.</p></div><div class="exam-result-topics">${breakdown.map(x=>`<article><span>${esc(x.code)}</span><strong>${esc(x.title)}</strong><b>${x.earned}/${x.possible}</b></article>`).join('')}</div><div class="exam-result-actions"><button class="real-exam-primary" data-show-markscheme>Open full mark scheme</button><button data-review-answers>Review my answers</button><button data-new-paper>Start another paper</button></div></div>`;
    body().querySelector('[data-show-markscheme]').addEventListener('click',renderMarkScheme);body().querySelector('[data-review-answers]').addEventListener('click',renderReview);body().querySelector('[data-new-paper]').addEventListener('click',renderSetup);
  }
  function renderMarkScheme(){
    const {paper,results}=lastResult;
    body().innerHTML=`<div class="exam-markscheme"><div class="markscheme-cover"><span>ORIGINAL PRACTICE MARK SCHEME</span><h2>${esc(SUBJECT_NAMES[paper.subject])} Paper ${paper.paper}</h2><p>${paper.qualification==='combined'?'Combined Science: Trilogy':'Separate Science'} · ${esc(paper.tier==='higher'?'Higher Tier':'Foundation Tier')} · ${paper.totalMarks} marks</p><div><button data-back-results>← Results</button><button data-print-markscheme>Print mark scheme</button></div></div><table><thead><tr><th>Question</th><th>Indicative marking content</th><th>Marks</th><th>Auto award</th></tr></thead><tbody>${results.map(r=>`<tr><td><strong>${esc(r.q.number)}</strong></td><td><p>${esc(r.q.prompt)}</p>${r.q.type==='mcq'?`<ul><li>${esc(r.q.correct)}</li></ul>`:`<ul>${marking(r.q.marking).map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`}</td><td>${r.q.marks}</td><td>${r.score}</td></tr>`).join('')}</tbody></table><div class="markscheme-note">This mark scheme belongs to the original practice paper generated by this app and is not an official AQA mark scheme.</div></div>`;
    body().querySelector('[data-back-results]').addEventListener('click',renderResults);body().querySelector('[data-print-markscheme]').addEventListener('click',()=>{document.body.dataset.examPrint='markscheme';window.print();setTimeout(()=>delete document.body.dataset.examPrint,250);});
  }
  function renderReview(){
    const {results}=lastResult;
    body().innerHTML=`<div class="exam-review"><header><button data-back-results>← Results</button><h2>Answer review</h2></header>${results.map(r=>`<article class="${r.score<r.q.marks?'lost-marks':''}"><div><strong>${esc(r.q.number)}</strong><span>${r.score}/${r.q.marks}</span></div><h3>${esc(r.q.prompt)}</h3><h4>Your answer</h4><p>${esc(r.answer||'No answer')}</p><h4>Marking points</h4><ul>${marking(r.q.marking).map(p=>`<li class="${r.matched.includes(p)?'matched':'missing'}">${esc(p)}</li>`).join('')}</ul></article>`).join('')}</div>`;
    body().querySelector('[data-back-results]').addEventListener('click',renderResults);
  }

  function upgradeLabels(){
    const card=document.querySelector('[data-open-revision="mock"]');if(card){card.querySelector('strong')&&(card.querySelector('strong').textContent='Full Timed Exam Papers');card.querySelector('small')&&(card.querySelector('small').textContent='Full 70/100-mark papers, real timings, auto-marking and mark schemes.');card.querySelector('b')&&(card.querySelector('b').textContent='Sit a full paper →');}
    document.querySelector('[data-revision-tab="mock"]')?.replaceChildren(document.createTextNode('Full Exam Paper'));
  }
  function patchLegacy(){if(window.GCSE_REVISION_INTELLIGENCE)window.GCSE_REVISION_INTELLIGENCE.openMock=openShell;upgradeLabels();}

  document.addEventListener('click',event=>{
    const trigger=event.target.closest?.('[data-open-revision="mock"], [data-revision-tab="mock"]');if(!trigger)return;
    event.preventDefault();event.stopPropagation();event.stopImmediatePropagation();openShell();
  },true);
  window.addEventListener('gcse-home-rendered',()=>setTimeout(upgradeLabels,0));
  window.addEventListener('gcse-access-changed',patchLegacy);
  window.addEventListener('beforeunload',()=>{if(current?.status==='active')saveDraft();});

  window.GCSE_REAL_EXAMS={open:openShell,buildPaper,autoMark,getDraft:()=>parse(localStorage.getItem(DRAFT_KEY),null),getHistory:()=>parse(localStorage.getItem(HISTORY_KEY),[])};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{patchLegacy();setTimeout(patchLegacy,250);},{once:true});else{patchLegacy();setTimeout(patchLegacy,250);}
})();
