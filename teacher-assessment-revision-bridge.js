(() => {
  'use strict';
  const KEY='gcse-assessment-ingested-v1';
  let busy=false;
  const sb=()=>window.GCSE_AUTH?.client||null;
  const session=()=>window.GCSE_AUTH?.getSession?.()||null;
  const teacherEligible=()=>Boolean(window.GCSE_AUTH?.getProfile?.()?.is_admin||window.GCSE_ACCESS?.can?.('teacher_tools'));
  const parse=(value,fallback)=>{try{return JSON.parse(value)??fallback;}catch{return fallback;}};
  const save=value=>{localStorage.setItem(KEY,JSON.stringify(value));window.dispatchEvent(new CustomEvent('gcse-learning-data-changed',{detail:{key:KEY}}));};

  async function ingestSubmitted(){
    if(busy||teacherEligible())return;
    const client=sb(),userId=session()?.user?.id;if(!client||!userId)return;
    busy=true;
    try{
      const {data,error}=await client.from('gcse_assessment_attempts')
        .select('id,assessment_id,status,submitted_at,review')
        .eq('student_id',userId).eq('status','submitted');
      if(error)throw error;
      const ingested=new Set(parse(localStorage.getItem(KEY),[]));
      let changed=false;
      for(const attempt of (data||[])){
        if(ingested.has(attempt.id))continue;
        const review=Array.isArray(attempt.review)?attempt.review:[];
        for(const row of review){
          if(!row?.topicId||!Number.isFinite(Number(row?.marks)))continue;
          window.dispatchEvent(new CustomEvent('gcse-performance-record',{detail:{
            topicId:String(row.topicId),
            score:Number(row.awarded||0),
            maxMarks:Number(row.marks||1),
            source:'teacher-assessment',
            answer:String(row.answer||''),
            question:{
              id:`teacher-assessment:${attempt.assessment_id}:${row.id||row.number||''}`,
              prompt:String(row.prompt||''),
              points:Array.isArray(row.markingPoints)?row.markingPoints:[],
              marking:Array.isArray(row.markingPoints)?row.markingPoints:[]
            }
          }}));
        }
        ingested.add(attempt.id);changed=true;
      }
      if(changed)save([...ingested].slice(-500));
    }catch(error){console.warn('[Teacher Assessments] revision sync failed',error);}
    finally{busy=false;}
  }

  window.addEventListener('gcse-assessment-submitted',()=>setTimeout(ingestSubmitted,50));
  window.addEventListener('gcse-auth-account-rendered',()=>setTimeout(ingestSubmitted,50));
  window.addEventListener('gcse-auth-changed',event=>{if(event.detail?.signedIn)setTimeout(ingestSubmitted,100);});
  window.GCSE_ASSESSMENT_REVISION_BRIDGE={sync:ingestSubmitted};
})();