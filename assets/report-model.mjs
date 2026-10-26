import {validateFollowup} from './decision-model.mjs';
export const REPORT_STATUS={pending:'待主管回應',replied:'主管已回應',needs_info:'待員工補充',in_progress:'執行中',review:'待確認解除',resolved:'異常已解除'};
export const SUPPORT=['跨部門／客戶協調','人力支援','廠商協助','額外工時','不需支援'];
export const RESPONSES={accept:'同意所提支援／安排',adjust:'調整處理方案',decline:'不採支援，改依回覆處理',needs_info:'請員工補充資料'};
const validTime=v=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v||'')&&Number.isFinite(Date.parse(v));
export function validateReport(task,d,now){
 for(const key of ['problem','impact','plan','supportDetail'])if(!d[key]?.trim())return '請完整說明異常、影響、處理方案及支援判斷。';
 if(!SUPPORT.includes(d.support))return '請選擇支援類型。';
 if(!validTime(d.resolveBy)||d.resolveBy<=now||!validTime(d.respondBy)||d.respondBy<=now)return '預計解決與希望回應時間必須晚於模擬現在。';
 const error=validateFollowup(task,{forecast:d.forecast,remaining:d.remaining,actual:'0',note:d.problem});if(error)return error;
 if(d.support==='額外工時'&&(d.requestedHours===''||!Number.isFinite(Number(d.requestedHours))||Number(d.requestedHours)<=0))return '額外工時需求請填寫預估人時（大於 0）。';
 return '';
}
export function submitReport(previous,task,d,at){return {...d,task:task.id,reporter:task.owner,remaining:Number(d.remaining),requestedHours:d.support==='額外工時'?Number(d.requestedHours):0,status:'pending',response:null,events:[...(previous?.events||[]),{kind:'員工提出回報',at,text:`${d.problem}\n影響：${d.impact}\n處理：${d.plan}\n支援：${d.support}；${d.supportDetail}\n預計解決：${d.resolveBy}；希望回應：${d.respondBy}`,actor:task.owner}]};}
export function respondReport(report,d,at){
 if(!report)throw Error('請先取得員工回報。');if(report.status==='resolved')throw Error('此異常已解除；新問題請由員工重新提出。');if(!RESPONSES[d.disposition]||!d.reason?.trim()||!d.owner?.trim()||!validTime(d.followup)||d.followup<=at)throw Error('請填寫回應、負責人及未來追蹤時間。');
 return {...report,status:d.disposition==='needs_info'?'needs_info':'replied',response:{...d,at},events:[...report.events,{kind:'主管回應',at,text:`${RESPONSES[d.disposition]}\n${d.reason}\n負責人：${d.owner}；追蹤：${d.followup}`,actor:'示範主管'}]};
}
export function progressReport(report,d,at){
 if(!['replied','in_progress','review'].includes(report?.status))throw Error('請先取得主管回應，或補充資料後重新送出。');
 if(!['continue','resolve'].includes(d.result)||!d.note?.trim())throw Error('請填寫執行結果。');
 return {...report,status:d.result==='resolve'?'review':'in_progress',events:[...report.events,{kind:d.result==='resolve'?'員工提請確認解除':'員工更新執行結果',actor:report.reporter,at,text:`${d.note}\n完成預估：${d.forecast}；剩餘 ${d.remaining} 人時；本次額外 ${d.actual} 人時`}]};
}
export function closeReport(report,assessment,note,at){
 if(report?.status!=='review')throw Error('請先由員工提出解除確認。');
 if(assessment.light!=='green')throw Error('目前仍有風險或資料待確認，請先確認執行預估。');
 if(!note?.trim())throw Error('請填寫解除確認依據。');
 return {...report,status:'resolved',events:[...report.events,{kind:'主管確認異常解除',actor:'示範主管',at,text:note}]};
}
