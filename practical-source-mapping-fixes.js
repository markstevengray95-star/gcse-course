(() => {
  const PORT=window.GCSE_PRACTICAL_SOURCE_PORT;
  if(!PORT)return;
  const base=PORT.matchCoursePractical.bind(PORT);
  PORT.matchCoursePractical=(text='',subject='')=>{
    const value=String(text);
    // AQA Chemistry RP5 uses "gas-volume" and "colour/turbidity" wording rather
    // than the shorter practical-sim title "rates of reaction".
    if(/concentration.*affects? rate|gas[- ]volume.*(?:colour|turbidity)|colour\/turbidity/i.test(value))return 'rates-of-reaction';
    return base(value,subject);
  };
  window.GCSE_PRACTICAL_SOURCE_MAPPING_FIXES={version:1};
})();