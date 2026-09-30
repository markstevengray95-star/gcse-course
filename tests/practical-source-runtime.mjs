import fs from 'node:fs';
import vm from 'node:vm';

export function loadPracticalRuntime(){
  const storage=new Map();
  let clock=1000;
  const sandbox={
    console,Math,Date,JSON,
    performance:{now:()=>clock},
    setTimeout:()=>0,clearTimeout:()=>{},
    CustomEvent:class CustomEvent{constructor(type,init={}){this.type=type;this.detail=init.detail;}},
    localStorage:{
      getItem:key=>storage.has(key)?storage.get(key):null,
      setItem:(key,value)=>storage.set(key,String(value)),
      removeItem:key=>storage.delete(key)
    },
    document:{createElement:()=>({click(){}})},
    Blob:class Blob{},URL:{createObjectURL:()=>'',revokeObjectURL:()=>{}},
    dispatchEvent:()=>true,addEventListener:()=>{}
  };
  sandbox.window=sandbox;
  vm.createContext(sandbox);
  for(const file of ['course-data.js','physics-spec-detail.js','biology-spec-detail.js','chemistry-spec-detail.js','spec-practical-sync.js','practical-source-port.js','practical-source-fidelity.js','practical-source-mapping-fixes.js']){
    vm.runInContext(fs.readFileSync(new URL(`../${file}`,import.meta.url),'utf8'),sandbox,{filename:file});
  }
  return {sandbox,storage,DATA:sandbox.GCSE_COURSE_DATA,PORT:sandbox.GCSE_PRACTICAL_SOURCE_PORT,SYNC:sandbox.GCSE_SPEC_PRACTICAL_SYNC,FIDELITY:sandbox.GCSE_PRACTICAL_SOURCE_FIDELITY,setClock:value=>{clock=value;}};
}