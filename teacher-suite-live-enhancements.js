(() => {
  'use strict';

  let timerInterval = null;
  let decorateTimer = null;
  let timerQueryRunning = false;

  const sb = () => window.GCSE_AUTH?.client || null;
  const uid = () => window.GCSE_AUTH?.getSession?.()?.user?.id || '';

  function addStudentActivityRefresh(){
    const panel=document.querySelector('[data-student-live-classroom]');
    const active=panel?.querySelector('.student-live-active');
    const joinForm=panel?.querySelector('[data-live-student-join]');
    if(!active||!joinForm||active.querySelector('[data-live-student-refresh]'))return;
    const button=document.createElement('button');
    button.type='button';
    button.dataset.liveStudentRefresh='true';
    button.className='student-live-refresh';
    button.textContent='Refresh activity';
    button.addEventListener('click',()=>joinForm.requestSubmit());
    const note=document.createElement('small');
    note.className='student-live-refresh-note';
    note.textContent='Refresh when your teacher sends the next check or question.';
    active.append(button,note);
  }

  function formatRemaining(end){
    if(!end)return 'No timer';
    const ms=new Date(end).getTime()-Date.now();
    if(ms<=0)return 'Timer finished';
    const minutes=Math.floor(ms/60000);
    const seconds=Math.floor((ms%60000)/1000);
    return `${minutes}:${String(seconds).padStart(2,'0')}`;
  }

  function startClock(node,end){
    if(timerInterval)clearInterval(timerInterval);
    const tick=()=>{
      if(!node.isConnected){clearInterval(timerInterval);timerInterval=null;return;}
      node.textContent=formatRemaining(end);
      if(end&&new Date(end).getTime()<=Date.now()){clearInterval(timerInterval);timerInterval=null;}
    };
    tick();
    if(end&&new Date(end).getTime()>Date.now())timerInterval=setInterval(tick,1000);
  }

  async function syncPresentationTimer(){
    const node=document.querySelector('#gcseTeacherSuiteModal [data-present-timer]');
    if(!node||node.dataset.liveClock==='true'||timerQueryRunning)return;
    const client=sb(),userId=uid();if(!client||!userId)return;
    node.dataset.liveClock='true';timerQueryRunning=true;
    try{
      const {data,error}=await client.from('gcse_presentation_sessions').select('timer_ends_at').eq('teacher_id',userId).eq('status','live').order('started_at',{ascending:false}).limit(1).maybeSingle();
      if(error){node.dataset.liveClock='';return;}
      startClock(node,data?.timer_ends_at||null);
    }finally{timerQueryRunning=false;}
  }

  function decorate(){
    clearTimeout(decorateTimer);
    decorateTimer=setTimeout(()=>{addStudentActivityRefresh();syncPresentationTimer();},40);
  }

  function boot(){
    decorate();
    window.addEventListener('gcse-auth-account-rendered',decorate);
    window.addEventListener('gcse-auth-changed',decorate);
    const observer=new MutationObserver(records=>{
      const relevant=records.some(r=>[...r.addedNodes].some(n=>n.nodeType===1&&(
        n.matches?.('[data-student-live-classroom],.student-live-active,[data-present-timer]')||
        n.querySelector?.('[data-student-live-classroom],.student-live-active,[data-present-timer]')
      )));
      if(relevant)decorate();
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();