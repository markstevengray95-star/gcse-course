(() => {
  const PORT=window.GCSE_PRACTICAL_SOURCE_PORT;
  if(!PORT)return;
  const base=PORT.matchCoursePractical.bind(PORT);

  // Resolve the synced AQA wording before the older broad practical-sim aliases.
  // This prevents substrings such as "ph" in photosynthesis/chromatography and
  // "i-v"-like character sequences in "investigate" from selecting the wrong lab.
  PORT.matchCoursePractical=(text='',subject='')=>{
    const value=String(text);

    // Biology
    if(/light intensity.*photosynthesis|photosynthesis.*(?:rate|light intensity)/i.test(value))return 'photosynthesis';

    // Chemistry
    if(/paper chromatography|chromatograph.*(?:separate|rf)|\brf values?\b/i.test(value))return 'chromatography';
    if(/concentration.*affects? rate|gas[- ]volume.*(?:colour|turbidity)|colour\/turbidity/i.test(value))return 'rates-of-reaction';

    // Physics
    if(/thermal insulation|insulat(?:ion|ing).*thermal|cooling.*insulat/i.test(value))return 'insulation';
    if(/determine densit(?:y|ies)|densit(?:y|ies).*(?:solid|liquid)|regular and irregular solids/i.test(value))return 'density';
    if(/force and extension|extension.*spring|spring.*extension/i.test(value))return 'hookes-law';
    if(/force,? mass and acceleration|mass.*acceleration|newton(?:'s)? second/i.test(value))return 'acceleration';
    if(/infrared.*(?:absorption|radiation)|radiation.*different surfaces|surface.*infrared/i.test(value))return 'radiation';
    if(/\bi\s*[-–]?\s*v\b.*characteristics?|current[- ]potential.*characteristics?/i.test(value))return 'iv-characteristics';

    return base(value,subject);
  };
  window.GCSE_PRACTICAL_SOURCE_MAPPING_FIXES={version:2};
})();