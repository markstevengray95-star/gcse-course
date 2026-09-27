(() => {
  const data=window.GCSE_COURSE_DATA;
  if(!data?.topics) return;
  const maps=[window.GCSE_BIOLOGY_SPEC_DETAIL,window.GCSE_CHEMISTRY_SPEC_DETAIL,window.GCSE_PHYSICS_SPEC_DETAIL].filter(Boolean);
  let total=0;
  for(const map of maps){
    for(const [topicId,spec] of Object.entries(map.topics||{})){
      const topic=data.topics.find(t=>t.id===topicId); if(!topic) continue;
      const practicals=spec.sections.flatMap(s=>s.lessons).map(l=>l.practical).filter(Boolean);
      topic.practicals=[...new Set(practicals)];
      total+=topic.practicals.length;
    }
  }
  window.GCSE_SPEC_PRACTICAL_SYNC={total,counts:Object.fromEntries(['biology','chemistry','physics'].map(subject=>[subject,data.topics.filter(t=>t.subject===subject).reduce((n,t)=>n+(t.practicals?.length||0),0)]))};
})();