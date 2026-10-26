import {TASKS,assess,DEFAULT_RULES,validateFollowup} from './decision-model.mjs';
import {validateReport,submitReport,respondReport,progressReport,closeReport} from './report-model.mjs';
export const SCENARIO_TASK=TASKS[0];
export function newScenario(){return {step:'overview',progressSaved:false,option:'split',update:{forecast:SCENARIO_TASK.baseline,remaining:12},report:null};}
export function scenarioRisk(s){return assess(SCENARIO_TASK,s.update,DEFAULT_RULES,'2026-10-26T17:00');}
export function updateScenarioProgress(s,d){
 if(s.step!=='overview')throw Error('請先回到工作進度。');
 const error=validateFollowup(SCENARIO_TASK,{...d,actual:'0',note:'進度更新'});if(error)throw Error(error);
 const next={...s,update:{forecast:d.forecast,remaining:Number(d.remaining),updated:'2026-10-26T12:00'}};
 const risk=scenarioRisk(next);return {...next,step:['yellow','red'].includes(risk.light)?'exception':'overview',progressSaved:risk.light==='green'};
}
export function reportScenario(s,d){
 if(s.step!=='exception')throw Error('請先更新進度並確認異常。');
 const input={...d,forecast:s.update.forecast,remaining:s.update.remaining};
 const error=validateReport(SCENARIO_TASK,input,'2026-10-26T12:00');if(error)throw Error(error);
 if(input.support==='不需支援')throw Error('此情境請選擇支援或加班需求。');
 return {...s,step:'report',progressSaved:true,option:input.support==='額外工時'?'extra':'split',report:submitReport(null,SCENARIO_TASK,input,'2026-10-26T12:00')};
}
export function decideScenario(s,option,reason){
 if(s.step!=='report')throw Error('請先取得完整的員工異常與需求。');const chosen=SCENARIO_TASK.options.find(o=>o.id===option);if(!chosen||!reason?.trim())throw Error('請選擇方案並補上判斷理由。');
 return {...s,step:'response',option,report:respondReport(s.report,{disposition:'adjust',optionTitle:chosen.title,owner:'林予安',followup:'2026-10-26T16:00',reason},'2026-10-26T13:00')};
}
export function executeScenario(s,d){
 if(s.step!=='response')throw Error('請先留下主管回應。');
 const error=validateFollowup(SCENARIO_TASK,d);if(error)throw Error(error);
 return {...s,step:'review',update:{forecast:d.forecast,remaining:Number(d.remaining),reason:d.note,updated:'2026-10-26T16:00'},actual:Number(d.actual),report:progressReport(s.report,{...d,result:'resolve'},'2026-10-26T16:00')};
}
export function finishScenario(s,note){if(s.step!=='review')throw Error('請先核對員工執行結果。');return {...s,step:'done',report:closeReport(s.report,scenarioRisk(s),note,'2026-10-26T17:00')};}
