(() => {
  if(typeof lessonKey!=='function'||!window.GCSE_COURSE_DATA) return;
  const stableKey=(topicId,title)=>`lesson:${topicId}:${encodeURIComponent(title||'untitled')}`;
  const lessonsForMode=(topic,mode)=>topic.lessons.filter(([,scope])=>mode==='triple'||scope!=='triple');

  // Migrate legacy mode/index progress before replacing lessonKey.
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

  // All future completion checks now resolve the visible index back to the stable lesson title.
  lessonKey=function(topicId,index){
    const topic=window.GCSE_COURSE_DATA.topics.find(t=>t.id===topicId);
    const entry=topic?visibleLessons(topic)[index]:null;
    return entry?stableKey(topicId,entry[0]):`lesson:${topicId}:index:${index}`;
  };

  window.GCSE_COURSE_AUDIT_FIXES={stableKey,lessonsForMode,migratedLegacyProgress:migrated};
  if(typeof renderHome==='function'&&document.getElementById('homeView')&&!document.getElementById('homeView').hidden) renderHome();
  if(typeof renderTopic==='function'&&document.getElementById('topicView')&&!document.getElementById('topicView').hidden) renderTopic();

  // Load the account system without changing the main course boot order.
  if(!document.querySelector('link[data-gcse-auth-style]')){
    const style=document.createElement('link');
    style.rel='stylesheet';
    style.href='gcse-auth.css';
    style.dataset.gcseAuthStyle='true';
    document.head.appendChild(style);
  }
  const loadAuth=()=>{
    if(document.querySelector('script[data-gcse-auth-script]')) return;
    const script=document.createElement('script');
    script.src='gcse-auth.js';
    script.dataset.gcseAuthScript='true';
    document.body.appendChild(script);
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