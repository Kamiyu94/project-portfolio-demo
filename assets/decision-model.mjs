export const DEFAULT_RULES={delay:20,buffer:80};
export const SCENARIO_NOW='2026-10-26T12:00';
export const TASKS=[
 {id:'EV-01',title:'主視覺定稿與背板製作',owner:'林予安',done:'確認定稿檔、完成輸出並交付進場窗口。',dependency:'客戶確認主視覺 → 輸出 → 進場',start:'2026-10-26T12:00',baseline:'2026-10-27T12:00',deadline:'2026-10-28T08:00',forecast:'2026-10-27T18:00',remaining:12,updated:'2026-10-26T12:00',reason:'客戶定稿晚 6 小時，輸出時段受到壓縮。',impact:'若未追回緩衝，可能壓縮進場與定位時間。',options:[{id:'split',title:'先確認可先行製作範圍',detail:'由專案窗口取得部分定稿，廠商分批輸出；需客戶確認交付順序。',hours:0},{id:'support',title:'調整分工並支援校稿',detail:'由另一位設計支援校稿，協調原有任務優先順序。',hours:0},{id:'extra',title:'評估額外製作時段',detail:'範例：2 人 × 3 小時，共 6 人時；定稿與廠商時段確認後才可執行。',hours:6}]},
 {id:'EV-02',title:'活動結束後撤場',owner:'周映辰',done:'設備清點、場地復原並取得場地方確認。',dependency:'活動結束 → 撤場 → 場地交還',start:'2026-10-28T22:00',baseline:'2026-10-29T01:00',deadline:'2026-10-29T02:00',forecast:'2026-10-29T01:00',remaining:12,updated:'2026-10-26T12:00',reason:'撤場時段依場地安排，沒有進度延遲。',impact:'需事先確認夜間人力、交通與場地交接。',plannedExtra:true,options:[{id:'planned',title:'確認原訂晚間撤場安排',detail:'範例：4 人 × 3 小時，共 12 人時；屬計畫時段需求，仍需主管確認安排。',hours:12},{id:'vendor',title:'改由外部撤場支援',detail:'確認廠商可用時段、工作範圍與報價後再決定。',hours:0}]},
 {id:'EV-03',title:'展示設備到場與測試',owner:'江可寧',done:'設備到場、通電測試並完成備援確認。',dependency:'供應商配送 → 通電測試 → 開場',start:'2026-10-26T08:00',baseline:'2026-10-27T18:00',deadline:'2026-10-28T08:00',forecast:'2026-10-28T10:00',remaining:8,updated:'2026-10-26T12:00',reason:'供應商預估到場時間晚於最晚交付時間。',impact:'將影響開場前測試，需要確認替代設備。',options:[{id:'backup',title:'確認備援設備',detail:'優先確認現場可替代設備與功能限制。',hours:0},{id:'rescope',title:'協調展示範圍',detail:'由主管與客戶確認可調整的展示內容。',hours:0}]},
 {id:'EV-04',title:'現場接待人力排班',owner:'許若禾',done:'確認各時段人員、代理人與報到方式。',dependency:'工作需求確認 → 人員確認 → 班表發布',start:'2026-10-26T09:00',baseline:'2026-10-27T17:00',deadline:'2026-10-28T08:00',forecast:'',remaining:null,updated:'2026-10-26T12:00',reason:'兩個時段的支援人員尚未回覆，完成預估待補。',impact:'目前無法可靠判斷是否能按計畫完成。',options:[{id:'confirm',title:'確認人力與完成預估',detail:'由窗口確認支援名單與未回覆原因，再更新預估。',hours:0}]}
];
const stamp=v=>/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v||'')?Date.parse(v+':00Z'):NaN;
const hours=(a,b)=>(stamp(a)-stamp(b))/3600000;
export function assess(task,update={},rules=DEFAULT_RULES,now=SCENARIO_NOW){
 const t={...task,...update},duration=hours(task.baseline,task.start),slip=Math.max(0,hours(t.forecast,task.baseline)),buffer=hours(task.deadline,task.baseline),left=hours(task.deadline,t.forecast);
 const result={...t,baseline:task.baseline,start:task.start,deadline:task.deadline,slip:Number.isFinite(slip)?slip:null,delay:duration>0&&Number.isFinite(slip)?slip/duration*100:null,bufferUsed:buffer>0&&Number.isFinite(slip)?slip/buffer*100:null,left:Number.isFinite(left)?left:null};
 if(!Number.isFinite(stamp(t.forecast))||!Number.isFinite(t.remaining)||t.remaining<0||!Number.isFinite(stamp(t.updated))||hours(now,t.updated)>48)return {...result,light:'gray',label:'待確認',why:'預估／剩餘工時缺漏，或超過 48 小時未更新。'};
 if(left<0||stamp(now)>stamp(task.deadline))return {...result,light:'red',label:'交付風險',why:'預估超出最晚交付時間，或最晚交付已過且未確認完成。'};
 if(result.delay>=rules.delay||(result.bufferUsed!==null&&result.bufferUsed>=rules.buffer)||(left===0&&t.remaining>0))return {...result,light:'yellow',label:'需提出方案',why:'預估延遲或緩衝消耗達示範門檻，仍需確認補救方案。'};
 return {...result,light:'green',label:'按計畫追蹤',why:'預估仍在交付界線內，未達示範預警門檻。'};
}
export function validateDecision(task,input,now){
 if(!task.options.some(o=>o.id===input.option))return '請選擇一個處理方案。';
 if(!input.owner?.trim()||!input.reason?.trim())return '請填寫負責人與判斷理由。';
 if(!Number.isFinite(stamp(input.followup))||stamp(input.followup)<=stamp(now))return '追蹤時間必須晚於模擬現在。';
 return '';
}
export function validateFollowup(task,input){
 if(!Number.isFinite(stamp(input.forecast))||stamp(input.forecast)<stamp(task.start))return '請填寫不早於任務開始的完成預估。';
 if(input.remaining===''||!Number.isFinite(Number(input.remaining))||Number(input.remaining)<0)return '剩餘工時必須為 0 或正數。';
 if(input.actual===''||!Number.isFinite(Number(input.actual))||Number(input.actual)<0)return '請填寫本次實際額外人時，沒有則填 0。';
 if(!input.note?.trim())return '請說明執行結果與判斷依據。';
 return '';
}
