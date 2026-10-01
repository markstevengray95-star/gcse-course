(() => {
  'use strict';
  let busy=false, last=0;
  const eligible=()=>Boolean(window.GCSE_AUTH?.getProfile?.()?.is_admin || window.GCSE_ACCESS?.can?.('teacher_tools'));
  async function sync(){
    const modal=document.getElementById('gcseTeacherPlatformModal');
    if(!eligible() || !modal || modal.hidden || !document.querySelector('[data-phase2-dashboard]') || busy || Date.now()-last<30000) return;
    busy=true;
    try{
      await window.GCSE_TEACHER_HOMEWORK?.refresh?.();
      last=Date.now();
      const cards=document.querySelectorAll('[data-phase2-dashboard] .teacher-work-cards article');
      if(cards[1]?.querySelector('span')) cards[1].querySelector('span').textContent='Published assignments';
    }catch(error){console.warn('[Teacher Homework] dashboard sync failed',error);}
    finally{busy=false;}
  }
  function boot(){
    const observer=new MutationObserver(()=>sync());
    observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    window.addEventListener('gcse-auth-changed',()=>{last=0;sync();});
    window.addEventListener('gcse-access-changed',()=>{last=0;sync();});
    sync();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot,{once:true}); else boot();
})();