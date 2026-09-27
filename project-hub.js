(() => {
  const EXAM_APP_URL='https://gcse-exam-questions.vercel.app';
  const main=document.querySelector('main.main');
  const topbar=document.querySelector('.topbar');
  if(!main||!topbar||typeof topics==='undefined') return;

  const projectState={view:'course',practicalSubject:'all',practicalSearch:'',examSubject:'all',examPaper:'all'};
  const subjectInfo=id=>DATA.subjects.find(s=>s.id===id)||{name:id,icon:'•'};
  const examCountFor=topic=>window.GCSE_RICH_CONTENT?.guides?.[topic.id]?.exam?.length||0;
  const visibleProjectTopics=()=>topics.filter(t=>state.mode==='triple'||t.scope!=='triple');

  function buildPracticalItems(){
    const seen=new Set();
    return topics.flatMap(topic=>(topic.practicals||[]).map((title,index)=>({
      id:`${topic.id}-${index}`,
      title,
      topicId:topic.id,
      topicCode:topic.code,
      topicTitle:topic.title,
      subject:topic.subject,
      paper:topic.paper,
      separate:/\bonly\b/i.test(title)||topic.scope==='triple'
    }))).filter(item=>{
      const key=`${item.topicId}|${item.title}`;
      if(seen.has(key)) return false;
      seen.add(key); return true;
    });
  }
  const practicalItems=buildPracticalItems();

  function ensurePrimaryNav(){
    if(document.getElementById('coursePrimaryNav')) return;
    const nav=document.createElement('nav');
    nav.id='coursePrimaryNav';
    nav.className='course-primary-nav wrap';
    nav.setAttribute('aria-label','Main course navigation');
    nav.innerHTML=`
      <button type="button" data-main-view="course" class="active"><span>⌂</span><strong>Learn</strong><small>Course & topics</small></button>
      <button type="button" data-main-view="exam"><span>✎</span><strong>Exam Questions</strong><small>Marker & mocks</small></button>
      <button type="button" data-main-view="practical"><span>⚗</span><strong>Practical Lab</strong><small>Practicals & sims</small></button>
      <button type="button" data-main-view="revision"><span>↻</span><strong>Revision</strong><small>Mixed practice</small></button>`;
    topbar.appendChild(nav);
    nav.querySelectorAll('[data-main-view]').forEach(btn=>btn.addEventListener('click',()=>goTo(btn.dataset.mainView)));
  }

  function ensureQuickLaunch(){
    const home=document.getElementById('homeView');
    if(!home||document.getElementById('courseQuickLaunch')) return;
    const section=document.createElement('section');
    section.id='courseQuickLaunch';
    section.className='course-quick-launch';
    section.innerHTML=`
      <button type="button" data-quick-view="course"><span class="quick-icon">📚</span><span><strong>Learn the course</strong><small>Lessons, textbook and terminology</small></span><b>→</b></button>
      <button type="button" data-quick-view="exam"><span class="quick-icon">📝</span><span><strong>Exam questions</strong><small>Full marker, mocks and examiner practice</small></span><b>→</b></button>
      <button type="button" data-quick-view="practical"><span class="quick-icon">🔬</span><span><strong>Practical lab</strong><small>Required practicals, simulations and graph skills</small></span><b>→</b></button>
      <button type="button" data-quick-view="revision"><span class="quick-icon">🎯</span><span><strong>Mixed revision</strong><small>Adaptive questions across the course</small></span><b>→</b></button>`;
    const controls=home.querySelector('.control-panel');
    home.insertBefore(section,controls||home.children[1]||null);
    section.querySelectorAll('[data-quick-view]').forEach(btn=>btn.addEventListener('click',()=>goTo(btn.dataset.quickView)));
  }

  function ensureExamHub(){
    if(document.getElementById('examHubView')) return;
    const view=document.createElement('section');
    view.id='examHubView'; view.className='project-hub-view'; view.hidden=true;
    view.innerHTML=`
      <section class="project-hero exam-project-hero panel">
        <div><span class="eyebrow">Integrated project · GCSE Exam Questions</span><h1>Exam practice and marking</h1><p>Your dedicated GCSE exam-marker project is now part of the course navigation. Use quick practice here, or open the full marker for timed mocks, examiner training, calculations, image answers and detailed marking.</p></div>
        <div class="project-hero-actions"><button class="button primary" id="loadExamProject" type="button">Open exam marker here</button><a class="button" href="${EXAM_APP_URL}" target="_blank" rel="noopener">Open full screen ↗</a></div>
      </section>
      <section class="project-feature-grid">
        <article class="panel"><span>01</span><strong>Targeted practice</strong><p>Biology, Chemistry and Physics questions organised by topic, paper and course mode.</p></article>
        <article class="panel"><span>02</span><strong>Mock builder</strong><p>Foundation/Higher filtering, timed practice and whole-exam workflows from your exam-marker project.</p></article>
        <article class="panel"><span>03</span><strong>Mark & improve</strong><p>Use the full project for AI marking with offline fallback, follow-up questions and mistake review.</p></article>
        <article class="panel"><span>04</span><strong>Examiner skills</strong><p>Practise command words, calculations, required-practical questions and extended responses.</p></article>
      </section>
      <section class="panel project-filter-panel">
        <div><span class="eyebrow">Quick course practice</span><h2>Jump straight to exam questions</h2><p>These launch the matching topic's in-course exam-practice section.</p></div>
        <div class="project-filter-controls"><select id="examHubSubject" aria-label="Exam practice subject"><option value="all">All subjects</option><option value="biology">Biology</option><option value="chemistry">Chemistry</option><option value="physics">Physics</option></select><select id="examHubPaper" aria-label="Exam practice paper"><option value="all">Both papers</option><option value="1">Paper 1</option><option value="2">Paper 2</option></select></div>
      </section>
      <section id="examTopicLaunchers" class="project-launch-grid"></section>
      <section id="examEmbedShell" class="exam-embed-shell panel" hidden><div class="embed-head"><div><span class="eyebrow">Full project</span><h2>GCSE Science Exam Marker</h2></div><div><button class="button" id="closeExamEmbed" type="button">Close embedded app</button><a class="button primary" href="${EXAM_APP_URL}" target="_blank" rel="noopener">Open full screen ↗</a></div></div><iframe id="examProjectFrame" title="GCSE Science Exam Marker" loading="lazy" allow="clipboard-write"></iframe><p class="embed-fallback">If your browser blocks the embedded app, use <strong>Open full screen</strong>.</p></section>`;
    main.appendChild(view);
    document.getElementById('examHubSubject').addEventListener('change',e=>{projectState.examSubject=e.target.value;renderExamLaunchers();});
    document.getElementById('examHubPaper').addEventListener('change',e=>{projectState.examPaper=e.target.value;renderExamLaunchers();});
    document.getElementById('loadExamProject').addEventListener('click',()=>{
      const shell=document.getElementById('examEmbedShell'),frame=document.getElementById('examProjectFrame');
      if(!frame.src) frame.src=EXAM_APP_URL;
      shell.hidden=false; shell.scrollIntoView({behavior:'smooth',block:'start'});
    });
    document.getElementById('closeExamEmbed').addEventListener('click',()=>{document.getElementById('examEmbedShell').hidden=true;});
    renderExamLaunchers();
  }

  function renderExamLaunchers(){
    const box=document.getElementById('examTopicLaunchers'); if(!box) return;
    const list=visibleProjectTopics().filter(t=>(projectState.examSubject==='all'||t.subject===projectState.examSubject)&&(projectState.examPaper==='all'||String(t.paper)===projectState.examPaper));
    box.innerHTML=list.map(topic=>{
      const s=subjectInfo(topic.subject),count=examCountFor(topic);
      return `<article class="project-launch-card ${topic.subject}"><div class="project-card-top"><span>${s.icon} ${s.name}</span><small>Paper ${topic.paper}</small></div><h3>${topic.code} · ${escapeHtml(topic.title)}</h3><p>${count} in-course exam-practice questions plus the larger dedicated marker bank.</p><button class="button primary" type="button" data-open-exam-topic="${topic.id}">Practise ${topic.code} →</button></article>`;
    }).join('')||'<div class="empty-state panel">No topics match these filters.</div>';
    box.querySelectorAll('[data-open-exam-topic]').forEach(btn=>btn.addEventListener('click',()=>openTopicTab(btn.dataset.openExamTopic,'exam')));
  }

  function ensurePracticalHub(){
    if(document.getElementById('practicalHubView')) return;
    const view=document.createElement('section');
    view.id='practicalHubView'; view.className='project-hub-view'; view.hidden=true;
    view.innerHTML=`
      <section class="project-hero practical-project-hero panel"><div><span class="eyebrow">Integrated project · Practical Sim</span><h1>Required practicals and simulations</h1><p>This course area brings the practical-sim workflow into the main app: check the apparatus and variables, run or review the model, repeat measurements, then analyse graphs, uncertainty and evaluation.</p></div><div class="project-stat-stack"><div><strong>26</strong><span>practical topics in the original project</span></div><div><strong>36</strong><span>investigation modes in the original project</span></div></div></section>
      <section class="lab-workflow panel"><div><span class="workflow-number">1</span><strong>Set up</strong><small>Identify apparatus, IV/DV and controls.</small></div><i>→</i><div><span class="workflow-number">2</span><strong>Run</strong><small>Change one setting and make a measurement.</small></div><i>→</i><div><span class="workflow-number">3</span><strong>Repeat</strong><small>Repeat readings and calculate a mean/half-range.</small></div><i>→</i><div><span class="workflow-number">4</span><strong>Analyse</strong><small>Choose a graph, interpret trends and evaluate.</small></div></section>
      <section class="project-feature-grid practical-skills-grid">
        <article class="panel"><span>🔧</span><strong>Apparatus checks</strong><p>Start by recognising equipment and deciding what must be kept constant.</p></article>
        <article class="panel"><span>📊</span><strong>Graphs & uncertainty</strong><p>Practise choosing graph types, using units, repeats, means and half-ranges.</p></article>
        <article class="panel"><span>🔁</span><strong>Repeat measurements</strong><p>Build the habit of repeatability rather than trusting one reading.</p></article>
        <article class="panel"><span>🧠</span><strong>Method evaluation</strong><p>Connect validity, accuracy, uncertainty, anomalies and realistic improvements.</p></article>
      </section>
      <section class="panel project-filter-panel"><div><span class="eyebrow">Practical launcher</span><h2>Choose a practical</h2><p>Open the detailed practical guide or the related topic simulation without leaving the course.</p></div><div class="project-filter-controls"><select id="practicalHubSubject" aria-label="Practical subject"><option value="all">All subjects</option><option value="biology">Biology</option><option value="chemistry">Chemistry</option><option value="physics">Physics</option></select><input id="practicalHubSearch" type="search" placeholder="Search practicals…" aria-label="Search practicals"></div></section>
      <section id="practicalLaunchers" class="project-launch-grid practical-launch-grid"></section>`;
    main.appendChild(view);
    document.getElementById('practicalHubSubject').addEventListener('change',e=>{projectState.practicalSubject=e.target.value;renderPracticalLaunchers();});
    document.getElementById('practicalHubSearch').addEventListener('input',e=>{projectState.practicalSearch=e.target.value;renderPracticalLaunchers();});
    renderPracticalLaunchers();
  }

  function renderPracticalLaunchers(){
    const box=document.getElementById('practicalLaunchers'); if(!box) return;
    const q=projectState.practicalSearch.trim().toLowerCase();
    const list=practicalItems.filter(item=>{
      if(state.mode!=='triple'&&item.separate) return false;
      if(projectState.practicalSubject!=='all'&&item.subject!==projectState.practicalSubject) return false;
      if(q&&!`${item.title} ${item.topicCode} ${item.topicTitle}`.toLowerCase().includes(q)) return false;
      return true;
    });
    box.innerHTML=list.map((item,index)=>{
      const s=subjectInfo(item.subject);
      return `<article class="project-launch-card practical-card ${item.subject}"><div class="project-card-top"><span>${s.icon} ${s.name}</span><small>${item.topicCode} · Paper ${item.paper}</small></div><div class="practical-index">${String(index+1).padStart(2,'0')}</div><h3>${escapeHtml(item.title.replace(/\s*\([^)]*only[^)]*\)\s*/i,'').trim())}</h3><p>${escapeHtml(item.topicTitle)}${item.separate?' · Separate Science':''}</p><div class="project-card-actions"><button class="button primary" type="button" data-open-practical-topic="${item.topicId}">Practical guide</button><button class="button" type="button" data-open-practical-sim="${item.topicId}">Topic simulation</button></div></article>`;
    }).join('')||'<div class="empty-state panel"><strong>No practicals found.</strong><p>Try a different subject or search term.</p></div>';
    box.querySelectorAll('[data-open-practical-topic]').forEach(btn=>btn.addEventListener('click',()=>openTopicTab(btn.dataset.openPracticalTopic,'practicals')));
    box.querySelectorAll('[data-open-practical-sim]').forEach(btn=>btn.addEventListener('click',()=>openTopicTab(btn.dataset.openPracticalSim,'simulation')));
  }

  function hideProjectViews(){
    ['examHubView','practicalHubView'].forEach(id=>{const el=document.getElementById(id);if(el)el.hidden=true;});
  }

  function syncPrimaryNav(view){
    document.querySelectorAll('[data-main-view]').forEach(btn=>btn.classList.toggle('active',btn.dataset.mainView===view));
  }

  function showCourseHome(){
    hideProjectViews();
    document.getElementById('homeView').hidden=false;
    document.getElementById('topicView').hidden=true;
    projectState.view='course'; syncPrimaryNav('course');
    if(typeof renderHome==='function') renderHome();
    const url=new URL(location.href);url.searchParams.delete('hub');history.replaceState({},'',url);
  }

  function showProjectView(id,viewName){
    hideProjectViews();
    document.getElementById('homeView').hidden=true;
    document.getElementById('topicView').hidden=true;
    const view=document.getElementById(id); if(view)view.hidden=false;
    projectState.view=viewName; syncPrimaryNav(viewName);
    const url=new URL(location.href);url.searchParams.set('hub',viewName);url.searchParams.delete('topic');history.replaceState({},'',url);
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function goTo(view){
    if(view==='exam'){showProjectView('examHubView','exam');renderExamLaunchers();return;}
    if(view==='practical'){showProjectView('practicalHubView','practical');renderPracticalLaunchers();return;}
    if(view==='revision'){
      showCourseHome(); syncPrimaryNav('revision');
      const button=document.getElementById('mixedRevisionButton');
      if(button) button.click(); else document.getElementById('randomQuestionButton')?.click();
      return;
    }
    showCourseHome();
  }

  function openTopicTab(topicId,tab){
    hideProjectViews();
    if(typeof openTopic==='function') openTopic(topicId);
    state.activeTab=tab;
    if(typeof renderTopic==='function') renderTopic();
    projectState.view='course'; syncPrimaryNav('course');
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function decorateTopicNavigation(){
    const topicView=document.getElementById('topicView'); if(!topicView||topicView.hidden) return;
    let breadcrumb=document.getElementById('topicBreadcrumb');
    const topic=topics.find(t=>t.id===state.activeTopicId); if(!topic) return;
    const subject=subjectInfo(topic.subject);
    if(!breadcrumb){breadcrumb=document.createElement('div');breadcrumb.id='topicBreadcrumb';breadcrumb.className='topic-breadcrumb';topicView.insertBefore(breadcrumb,topicView.querySelector('.topic-toolbar'));}
    breadcrumb.innerHTML=`<button type="button" data-crumb-home>Course</button><span>›</span><button type="button" data-crumb-subject="${topic.subject}">${subject.name}</button><span>›</span><strong>${topic.code} · ${escapeHtml(topic.title)}</strong>`;
    breadcrumb.querySelector('[data-crumb-home]').addEventListener('click',showCourseHome);
    breadcrumb.querySelector('[data-crumb-subject]').addEventListener('click',()=>{showCourseHome();state.subject=topic.subject;renderHome();document.getElementById('topicGrid')?.scrollIntoView({behavior:'smooth'});});

    let quick=document.getElementById('topicQuickNav');
    const tabs=document.getElementById('contentTabs');
    if(!quick){
      quick=document.createElement('nav');quick.id='topicQuickNav';quick.className='topic-quick-nav';quick.setAttribute('aria-label','Quick topic navigation');
      quick.innerHTML=`<button type="button" data-topic-quick="lessons"><span>📖</span><strong>Learn</strong><small>Lessons & textbook</small></button><button type="button" data-topic-quick="practicals"><span>🔬</span><strong>Practicals</strong><small>Methods & simulations</small></button><button type="button" data-topic-quick="exam"><span>✍️</span><strong>Practice</strong><small>Exam & retrieval</small></button><button type="button" data-topic-quick="coach"><span>🎯</span><strong>Revise</strong><small>Maths & progress</small></button>`;
      tabs.parentNode.insertBefore(quick,tabs);
      quick.querySelectorAll('[data-topic-quick]').forEach(btn=>btn.addEventListener('click',()=>{state.activeTab=btn.dataset.topicQuick;renderTopic();}));
    }
    const category= ['overview','lessons','textbook'].includes(state.activeTab)?'lessons':['practicals','simulation'].includes(state.activeTab)?'practicals':['activities','exam','quiz'].includes(state.activeTab)?'exam':'coach';
    quick.querySelectorAll('[data-topic-quick]').forEach(btn=>btn.classList.toggle('active',btn.dataset.topicQuick===category));
    tabs.classList.add('secondary-topic-tabs');
  }

  ensurePrimaryNav();
  ensureQuickLaunch();
  ensureExamHub();
  ensurePracticalHub();

  const baseRenderHome=typeof renderHome==='function'?renderHome:null;
  if(baseRenderHome){renderHome=function(){baseRenderHome();ensureQuickLaunch();renderPracticalLaunchers();renderExamLaunchers();};}
  const baseRenderTopic=typeof renderTopic==='function'?renderTopic:null;
  if(baseRenderTopic){renderTopic=function(){baseRenderTopic();decorateTopicNavigation();};}

  document.getElementById('homeButton')?.addEventListener('click',()=>showCourseHome());
  document.getElementById('backButton')?.addEventListener('click',()=>showCourseHome());
  const params=new URL(location.href).searchParams;
  const initialHub=params.get('hub');
  if(initialHub==='exam') goTo('exam'); else if(initialHub==='practical') goTo('practical'); else {syncPrimaryNav('course');ensureQuickLaunch();}
  if(!document.getElementById('topicView').hidden) decorateTopicNavigation();

  window.GCSE_PROJECT_HUB={goTo,openTopicTab,practicalItems,EXAM_APP_URL};
})();