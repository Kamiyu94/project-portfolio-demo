import {TASKS,assess,DEFAULT_RULES,validateFollowup} from './decision-model.mjs';
import {respondReport,progressReport,closeReport} from './report-model.mjs';
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
 const problem=d.problem?.trim(),supportDetail=d.supportDetail?.trim();
 if(!problem||!supportDetail)throw Error('請填寫異常原因與需要的協助。');
 if(problem.length>600||supportDetail.length>600)throw Error('每個欄位請保持在 600 字以內。');
 // Preserve employee text. Do not infer support classification, hours or approval from prose.
 const report={task:SCENARIO_TASK.id,reporter:SCENARIO_TASK.owner,problem,supportDetail,forecast:s.update.forecast,remaining:s.update.remaining,status:'pending',response:null,events:[{kind:'員工提出回報',at:'2026-10-26T12:00',actor:SCENARIO_TASK.owner,text:`原因：${problem}\n需要協助：${supportDetail}\n完成預估：${s.update.forecast}；剩餘 ${s.update.remaining} 人時`}]};
 return {...s,step:'report',progressSaved:true,option:'split',report};
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
