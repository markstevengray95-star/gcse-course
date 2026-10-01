(() => {
  if(typeof lessonKey!=='function'||!window.GCSE_COURSE_DATA) return;
  const stableKey=(topicId,title)=>`lesson:${topicId}:${encodeURIComponent(title||'untitled')}`;
  const lessonsForMode=(topic,mode)=>topic.lessons.filter(([,scope])=>mode==='triple'||scope!=='triple');

  let migrated=false;
  for(const topic of window.GCSE_COURSE_DATA.topics){
    for(const mode of ['combined','triple']){
      lessonsForMode(topic,mode).forEach(([title],index)=>{
        const oldKey=`${mode}:${topic.id}:${index}`;
        const newKey=stableKey(topic.id,title);
        if(lessonProgress?.[oldKey]&&!lessonProgress[newKey]){lessonProgress[newKey]=true;migrated=true;}
      });
    }
  }
  if(migrated&&typeof saveLessons==='function') saveLessons();

  lessonKey=function(topicId,index){
    const topic=window.GCSE_COURSE_DATA.topics.find(t=>t.id===topicId);
    const entry=topic?visibleLessons(topic)[index]:null;
    return entry?stableKey(topic.id,entry[0]):`lesson:${topicId}:index:${index}`;
  };

  window.GCSE_COURSE_AUDIT_FIXES={stableKey,lessonsForMode,migratedLegacyProgress:migrated};
  if(typeof renderHome==='function'&&document.getElementById('homeView')&&!document.getElementById('homeView').hidden) renderHome();
  if(typeof renderTopic==='function'&&document.getElementById('topicView')&&!document.getElementById('topicView').hidden) renderTopic();

  const addStyle=(marker,href)=>{
    if(document.querySelector(`link[${marker}]`)) return;
    const style=document.createElement('link');style.rel='stylesheet';style.href=href;style.setAttribute(marker,'true');document.head.appendChild(style);
  };
  const addScript=(marker,src,onload)=>{
    if(document.querySelector(`script[${marker}]`)){if(onload)onload();return;}
    const script=document.createElement('script');script.src=src;script.setAttribute(marker,'true');if(onload)script.onload=onload;document.body.appendChild(script);
  };

  addStyle('data-gcse-plans-paper-style','plans-paper-guide.css');
  addScript('data-gcse-plans-paper-script','plans-paper-guide.js');
  addStyle('data-gcse-auth-style','gcse-auth.css');
  addStyle('data-gcse-billing-style','gcse-billing-ui.css');
  addStyle('data-gcse-access-style','gcse-access-control.css');
  addStyle('data-gcse-revision-intelligence-style','revision-intelligence.css');
  addStyle('data-gcse-real-exam-style','real-exam-mocks.css');
  addStyle('data-gcse-teacher-platform-style','teacher-platform.css');
  addStyle('data-gcse-teacher-dashboard-style','teacher-dashboard-phase2.css');
  addStyle('data-gcse-teacher-homework-style','teacher-homework.css');
  addStyle('data-gcse-teacher-assessment-style','teacher-assessments.css');
  addStyle('data-gcse-teacher-assessment-analytics-style','teacher-assessment-analytics.css');
  addStyle('data-gcse-teacher-interventions-style','teacher-interventions.css');
  addScript('data-gcse-billing-script','gcse-billing-ui.js');
  addScript('data-gcse-access-script','gcse-access-control.js');
  addScript('data-gcse-revision-intelligence-script','revision-intelligence.js',()=>addScript('data-gcse-real-exam-script','real-exam-mocks.js'));
  addScript('data-gcse-exam-revision-bridge','exam-studio-revision-bridge.js');
  addScript('data-gcse-teacher-platform-script','teacher-platform.js',()=>{
    addScript('data-gcse-teacher-dashboard-script','teacher-dashboard-phase2.js');
    addScript('data-gcse-teacher-homework-script','teacher-homework.js',()=>addScript('data-gcse-teacher-homework-sync','teacher-homework-autoload.js'));
    addScript('data-gcse-teacher-assessment-script','teacher-assessments.js',()=>{
      addScript('data-gcse-teacher-assessment-revision-bridge','teacher-assessment-revision-bridge.js');
      addScript('data-gcse-teacher-assessment-analytics-script','teacher-assessment-analytics.js',()=>{
        addScript('data-gcse-teacher-interventions-script','teacher-interventions.js');
      });
    });
  });

  const loadCloudSync=()=>addScript('data-gcse-cloud-sync','gcse-cloud-sync.js');
  const loadAuth=()=>{
    if(document.querySelector('script[data-gcse-auth-script]')){if(window.GCSE_AUTH)loadCloudSync();return;}
    addScript('data-gcse-auth-script','gcse-auth.js',loadCloudSync);
  };

  if(window.supabase?.createClient){
    loadAuth();
  }else if(!document.querySelector('script[data-gcse-supabase]')){
    const supabaseScript=document.createElement('script');
    supabaseScript.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.117.1/dist/umd/supabase.min.js';
    supabaseScript.dataset.gcseSupabase='true';
    supabaseScript.onload=loadAuth;
    supabaseScript.onerror=()=>console.error('[GCSE Auth] Could not load the authentication library.');
    document.body.appendChild(supabaseScript);
  }
})();