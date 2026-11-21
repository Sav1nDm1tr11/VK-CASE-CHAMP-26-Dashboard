/* Calculation engine extracted from the supplied VK × Ozon dashboard. */
(()=>{

'use strict';

const CAP=500000;
const DEFAULT={scenario:'central',costPlan:'optimized',budgetMode:'minimum',sellers:43000,adoption12:70,adoption24:77,transact:65,orders:24,paid:85,kept:80,startMonth:3,checkoutLift:5,vkPerIncremental:0,capexM:8.02,discount:20,fixOpex:200000,fteDev:.15,fteData:.10,fteQa:.10,ftePartner:.10,infraFixed:17500,varOrder:.10,varViewK:.5,phase2Fixed:75000,phase2CapexM:1.5,hybridOn:true,hybridMonth:6,hybridRampMonths:2,advertiseRate:10,skuPerAdvertiser:2,existingVkPerCampaign:220,views:30000,cpv:.04,viewLimit:4000,buyCount:30,buyBonus:140,buyLimit:16000,budgetSku:20000,vkShare:20,check:2000,margin:25,incrementality:70,refundCosts:0,adBaseRate:12,adActivation:15,adMonthlyBudget:5000,adUpsell:12,adNewMoney:70,adContributionMargin:35,adResponseLag:1,buyerFeeOn:false,buyerFeeRub:9,buyerFeeOptIn:15,buyerFeeCheckoutLoss:2,buyerFeeNetShare:75,buyerFeeVarCost:0.5,buyerFeeFixed:30000,buyerFeeStartMonth:7,buyerFeeCapexM:.75};
const RATE={fteDev:450000,fteData:400000,fteQa:300000,ftePartner:450000};
const COST_PLANS={
 baseline:{capexM:15.12,fteDev:.20,fteData:.15,fteQa:.10,ftePartner:.10,infraFixed:25000,varOrder:.10,varViewK:1,phase2Fixed:100000},
 optimized:{capexM:8.02,fteDev:.15,fteData:.10,fteQa:.10,ftePartner:.10,infraFixed:17500,varOrder:.10,varViewK:.5,phase2Fixed:75000}
};
const OPTIMIZED_WBS=[['Обследование',.55,'Только аудит готового API'],['Клиентский интерфейс',1.60,'Один сценарий покупки из клипа'],['Сервер, статусы и начисления',1.40,'Переиспользование Ozon'],['Данные и A/B',.70,'Готовые SDK, события, эксперименты'],['QA, безопасность, возвраты',.80,'Сохранить критические проверки'],['Мониторинг и эксплуатация',.32,'Общий мониторинг'],['Продукт и дизайн',1.046,'Одна точка входа, без новых кабинетов']];
const FTE_ROLES=[['fteDev','Инженер / поддержка интеграции'],['fteData','Аналитика / сверка'],['fteQa','QA / возвраты'],['ftePartner','Партнёрские операции']];
function fixedFromFTE(s){return s.infraFixed+Object.entries(RATE).reduce((sum,[k,v])=>sum+s[k]*v,0)}

const PRESETS={careful:{name:'Осторожный',desc:'Медленное внедрение, стандартный тариф',sellers:43000,adoption12:12,adoption24:20,transact:25,orders:8,startMonth:5,hybridMonth:15,hybridRampMonths:12,advertiseRate:3,skuPerAdvertiser:1,views:10000,buyCount:10,buyBonus:100,check:1039,margin:20,adBaseRate:10,adActivation:5,adMonthlyBudget:3000,adUpsell:6,adNewMoney:50,adContributionMargin:30},central:{name:'Наиболее вероятный*',desc:'Согласованная гипотеза · до 12 мес.',sellers:43000,adoption12:70,adoption24:77,transact:65,orders:24,startMonth:3,hybridMonth:6,hybridRampMonths:2,advertiseRate:10,skuPerAdvertiser:2,views:30000,buyCount:30,buyBonus:140,check:2000,margin:25,adBaseRate:12,adActivation:15,adMonthlyBudget:5000,adUpsell:12,adNewMoney:70,adContributionMargin:35},mass:{name:'Потенциал роста',desc:'Больше рекламодателей · высокая нагрузка',sellers:43000,adoption12:80,adoption24:85,transact:65,orders:24,startMonth:3,hybridMonth:6,hybridRampMonths:2,advertiseRate:15,skuPerAdvertiser:2,views:30000,buyCount:30,buyBonus:150,check:2000,margin:25,adBaseRate:15,adActivation:22,adMonthlyBudget:6500,adUpsell:18,adNewMoney:75,adContributionMargin:35}};
const WBS_MIN=[['Обследование',.68,1.75],['Клиентский интерфейс',1.8,5.25],['Сервер, статусы и начисления',1.35,3.75],['Данные и A/B',.80,1.95],['QA, безопасность, возвраты',.75,2],['Мониторинг и эксплуатация',.34,1.13],['Продукт и дизайн',.70,1.95]];
const WBS_ADD=[['Поверхности и варианты товара',1.8,4.5],['Партнёрские сессии',2.25,6],['Подробная сверка',.9,3],['Отчётность',.8,1.95],['Дополнительные проверки',.9,2.5],['Управление и дизайн',.7,1.95],['Эксплуатация',.45,1.5]];
const IN={buyerFeeRub:['Сбор с покупателя','₽/выкуп',0,49,1],buyerFeeOptIn:['Добровольно выбирают платный сервис','%',0,100,1],buyerFeeCheckoutLoss:['Потеря конверсии у выбравших сервис','%',0,40,.5],buyerFeeNetShare:['Доля сбора, остающаяся VK после налогов и договорных удержаний','%',0,100,1],buyerFeeVarCost:['Доп. обработка платного заказа','₽',0,5,.1],buyerFeeFixed:['Доп. фиксированный OPEX сбора','₽/мес.',0,150000,5000],buyerFeeStartMonth:['Запуск платной опции','месяц',3,24,1],buyerFeeCapexM:['Однократная доработка платной опции','млн ₽',0,5,.05],adoption12:['Используют к 12-му месяцу','%',0,100,1],sellers:['Потенциальная база продавцов','селл.',1000,750000,1000],phase2CapexM:['Резерв на разработку гибрида','млн ₽',0,8,.1],hybridRampMonths:['Выход гибрида на целевой охват','мес.',1,24,1],fteDev:['Инженер / SRE','FTE',0,1,.01],fteData:['Аналитика','FTE',0,1,.01],fteQa:['QA','FTE',0,1,.01],ftePartner:['Партнёрские операции','FTE',0,1,.01],adoption24:['Использование к 24-му месяцу','%',0,100,1],transact:['Селлеры с заказами среди использующих','%',0,100,1],orders:['Оформлений на продающего селлера / мес.','шт.',0,40,1],checkoutLift:['Относительный прирост выкупов','%',0,40,1],capexM:['Инвестиции в разработку','млн ₽',8.02,22.22,.01],discount:['Ставка дисконтирования','% год.',0,60,1],infraFixed:['Доп. инфраструктура и мониторинг','₽/мес.',0,150000,2500],varOrder:['Себестоимость оформления','₽/заказ',0,3,.01],varViewK:['Себестоимость проверки 1 000 просмотров','₽',0,10,.01],phase2Fixed:['Фиксированный OPEX этапа 2','₽/мес.',0,350000,10000],paid:['Доля оплаченных оформлений','%',0,100,1],kept:['Выкупы после возвратов','%',0,100,1],startMonth:['Месяц запуска этапа 1','месяц',1,18,1],hybridMonth:['Начало этапа 2','месяц',4,24,1],advertiseRate:['Селлеров с гибридной кампанией','%',0,25,.25],skuPerAdvertiser:['SKU-кампаний на рекламодателя','шт./мес.',0,5,.25],views:['Проверенные просмотры / SKU','',0,1000000,1000],cpv:['Ставка за просмотр','₽',0,1,.005],viewLimit:['Лимит просмотров','₽',0,20000,100],buyCount:['Учитываемые выкупы / SKU','',0,1000,1],buyBonus:['Бонус за выкуп','₽',0,500,5],buyLimit:['Лимит бонусов','₽',0,100000,100],budgetSku:['Бюджет SKU','₽',0,100000,500],vkShare:['Доля VK от расходов','%',0,100,1],check:['Средний чек','₽',100,10000,1],margin:['Маржа продавца до продвижения','%',0,80,1],incrementality:['Дополнительность выкупов кампании','%',0,100,1],refundCosts:['Отдельные возвратные потери / SKU','₽',0,100000,100],adBaseRate:['Уже используют обычную рекламу VK','%',0,60,1],adActivation:['Активация новых рекламодателей из увидевших эффект','%',0,40,1],adMonthlyBudget:['Средний бюджет обычной рекламы','₽/мес.',0,100000,250],adUpsell:['Прирост бюджета действующих рекламодателей','%',0,100,1],adNewMoney:['Доля действительно новых рекламных расходов','%',0,100,1],adContributionMargin:['Вклад VK после затрат на показ рекламы','%',0,100,1],adResponseLag:['Задержка после подтверждения эффекта','мес.',0,6,1]};
const nf=(x,n=0)=>Number(x).toLocaleString('ru-RU',{minimumFractionDigits:n,maximumFractionDigits:n});
const money=x=>{if(x===null||!Number.isFinite(x))return '—';const v=Math.abs(x);if(v>=1e9)return nf(x/1e9,2)+' млрд ₽';if(v>=1e6)return nf(x/1e6,2)+' млн ₽';if(v>=1000)return nf(x/1000,1)+' тыс. ₽';return nf(x,0)+' ₽'};
const unitCount=x=>x===null||!Number.isFinite(x)?'—':nf(x>=10000?Math.round(x):x,0);
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const isKnown=x=>x!==null&&x!==''&&Number.isFinite(Number(x));
const cRate=s=>Math.pow(1+s.discount/100,1/12)-1;
function hybrid(s){const viewSpend=Math.min(s.views*s.cpv,s.viewLimit,s.budgetSku),buySpend=Math.min(s.buyCount*s.buyBonus,s.buyLimit,Math.max(0,s.budgetSku-viewSpend));const spend=viewSpend+buySpend;const vk=spend*s.vkShare/100;return{viewSpend,buySpend,spend,vk,author:spend-vk,unused:Math.max(0,s.budgetSku-spend),seller:s.buyCount*s.incrementality/100*s.check*s.margin/100-spend-s.refundCosts}};
function model(s){
 const hy=hybrid(s),a=[{m:0,using:0,selling:0,baselinePlaced:0,baselineSaved:0,extraSaved:0,ordersPlaced:0,verifiedViews:0,campaigns:0,baseFixed:0,hybridFixed:0,orderCost:0,viewCost:0,hybridGross:0,hybridExisting:0,stage1:null,stage2:null,adExisting:0,adNew:0,adHybridBuyers:0,adResponders:0,adBaselineUsers:0,adRegularUsers:0,adAdditionalGross:0,adGrossNew:0,adGrossUpsell:0,adMoney:0,adContribution:0,feeGross:0,feeNet:0,feePaidOrders:0,feeLostOrders:0,feeFixed:0,feeCapex:0,phase2Capex:0,opex:0,net:null,cum:null}];
 let cumulative=-s.capexM*1e6;
 for(let m=1;m<=24;m++){
  let adoption=0;
  if(m>=s.startMonth){
   if(m<=12){const d=Math.max(1,13-s.startMonth);adoption=s.adoption12/100*Math.pow(clamp((m-s.startMonth+1)/d,0,1),1.15)}
   else if(m<=24){const d=clamp((m-12)/12,0,1);adoption=(s.adoption12+(s.adoption24-s.adoption12)*d)/100}
  }
  const using=s.sellers*adoption,selling=using*s.transact/100;
  const baselinePlaced=selling*s.orders,baselineSaved=baselinePlaced*s.paid/100*s.kept/100;
  const feeEnabled=s.buyerFeeOn&&m>=s.buyerFeeStartMonth;
   const savedBeforeFee=baselineSaved*(1+s.checkoutLift/100);
   const feeIntended=feeEnabled?savedBeforeFee*s.buyerFeeOptIn/100:0;
   const feePaidOrders=feeIntended*(1-s.buyerFeeCheckoutLoss/100);
   const feeLostOrders=feeIntended-feePaidOrders;
   const extraSaved=savedBeforeFee-feeLostOrders-baselineSaved;
   const ordersPlaced=Math.max(0,baselinePlaced*(1+s.checkoutLift/100)-feeLostOrders/Math.max(.01,s.paid*s.kept/10000));
   // Сбор начисляется только на покупки после возвратов; уже возвращённые заказы исключены.
   const feeGross=feePaidOrders*s.buyerFeeRub;
   const feeNet=feeGross*s.buyerFeeNetShare/100-feePaidOrders*s.buyerFeeVarCost;
   const feeFixed=feeEnabled?s.buyerFeeFixed:0;
   const feeCapex=feeEnabled&&m===s.buyerFeeStartMonth?s.buyerFeeCapexM*1e6:0;
  const hybridOn=s.hybridOn&&m>=s.hybridMonth;
  const ramp=hybridOn?clamp((m-s.hybridMonth+1)/Math.max(1,s.hybridRampMonths),0,1):0;
  const campaigns=hybridOn?using*s.advertiseRate/100*s.skuPerAdvertiser*ramp:0;
  const effectiveBuys=s.buyCount*(feeEnabled?1-s.buyerFeeOptIn*s.buyerFeeCheckoutLoss/10000:1);
   const hyAtMonth=hybrid({...s,buyCount:effectiveBuys});
   const hybridGross=campaigns*hyAtMonth.vk;
  const hybridExisting=isKnown(s.existingVkPerCampaign)?campaigns*Number(s.existingVkPerCampaign):0;
  const verifiedViews=campaigns*s.views;
  const stage1=isKnown(s.vkPerIncremental)?extraSaved*Number(s.vkPerIncremental):null;
  const stage2=hybridOn?(isKnown(s.existingVkPerCampaign)?hybridGross-hybridExisting:null):0;
   // Рекламный эффект от успешного опыта покупки. Действующая реклама не является новой выручкой.
   // Доля продавцов с >=1 дополнительным выкупом — иллюстративное Poisson-допущение.
   const lag=Math.max(0,Math.round(s.adResponseLag));
   const evidenceMonth=m-lag;
   const evidence=evidenceMonth>=s.startMonth?(lag===0?{selling,extraSaved}:a[evidenceMonth]):null;
   const evidSelling=evidence?evidence.selling:0;
   const evidExtra=evidence?evidence.extraSaved:0;
   const hitChance=evidSelling>0?1-Math.exp(-Math.max(0,evidExtra)/evidSelling):0;
   const adResponders=Math.min(selling,evidSelling*hitChance);
   const adBaselineUsers=selling*s.adBaseRate/100;
   const adExisting=Math.min(adBaselineUsers,adResponders*s.adBaseRate/100);
   // Исключаем гибридных рекламодателей из пула новых VK Ads, не монетизируем их второй раз.
   const adHybridBuyers=hybridOn&&s.skuPerAdvertiser>0?campaigns/s.skuPerAdvertiser:0;
   const adEligible=Math.max(0,adResponders-adExisting-adHybridBuyers);
   const adNew=adEligible*s.adActivation/100;
   const adRegularUsers=adBaselineUsers+adNew;
   const adGrossNew=adNew*s.adMonthlyBudget;
   const adGrossUpsell=adExisting*s.adMonthlyBudget*s.adUpsell/100;
   const adAdditionalGross=adGrossNew+adGrossUpsell;
   const adMoney=adAdditionalGross*s.adNewMoney/100;
   const adContribution=adMoney*s.adContributionMargin/100;
  const baseFixed=m>=s.startMonth?s.fixOpex:0,hybridFixed=hybridOn?s.phase2Fixed:0;
  const orderCost=m>=s.startMonth?ordersPlaced*s.varOrder:0,viewCost=(verifiedViews/1000)*s.varViewK;
  const opex=baseFixed+hybridFixed+feeFixed+orderCost+viewCost;
  const phase2Capex=hybridOn&&m===s.hybridMonth?s.phase2CapexM*1e6:0;
  const complete=stage1!==null&&stage2!==null;
  const net=complete?stage1+stage2+adContribution+feeNet-opex-phase2Capex-feeCapex:null;
  if(complete)cumulative+=net;else cumulative=null;
  a.push({m,using,selling,baselinePlaced,baselineSaved,extraSaved,ordersPlaced,verifiedViews,campaigns,baseFixed,hybridFixed,orderCost,viewCost,hybridGross,hybridExisting,stage1,stage2,adExisting,adNew,adHybridBuyers,adResponders,adBaselineUsers,adRegularUsers,adAdditionalGross,adGrossNew,adGrossUpsell,adMoney,adContribution,feeGross,feeNet,feePaidOrders,feeLostOrders,feeFixed,feeCapex,phase2Capex,opex,net,cum:cumulative});
 }
 a[0].net=-s.capexM*1e6;a[0].cum=-s.capexM*1e6;
 return a;
}
function npv(arr,discount){const r=Math.pow(1+discount/100,1/12)-1;return arr.reduce((z,x)=>z+x.net/Math.pow(1+r,x.m),0)}
function irr(arr){const terms=arr.map(x=>x.net);if(terms.some(x=>x===null)||!terms.some(x=>x>0)||!terms.some(x=>x<0))return null;const f=r=>terms.reduce((v,x,i)=>v+x/Math.pow(1+r,i),0);let a=-.9,b=.1,fa=f(a),fb=f(b);for(let i=0;i<60&&fa*fb>0;i++){b=b*1.65+.02;fb=f(b);if(!Number.isFinite(fb))break}if(!Number.isFinite(fa)||!Number.isFinite(fb)||fa*fb>0)return null;for(let j=0;j<95;j++){const mid=(a+b)/2,fi=f(mid);if(fa*fi<=0){b=mid;fb=fi}else{a=mid;fa=fi}}const monthly=(a+b)/2;return (Math.pow(1+monthly,12)-1)*100}
function metrics(rows,s){const complete=rows.every(x=>x.net!==null);const peak=Math.max(...rows.slice(1).map(x=>x.opex));const breach=rows.find(x=>x.m>0&&x.opex>CAP)?.m??null;return {complete,peak,breach,npv:complete?npv(rows,s.discount):null,irr:complete?irr(rows):null,pay:complete?(rows.find(x=>x.m>0&&x.cum>=0)?.m??null):null}}


// WBS weights from the supplied concept. Reserve is 25% of work cost (20% of CAPEX).
// Category allocations scale proportionally when the user changes the total.
function budget(s) {
 const work=s.capexM*1e6/1.25;
 const total=WBS_MIN.reduce((sum,r)=>sum+r[1],0);
 return [...WBS_MIN.map(r=>({name:r[0],value:work*r[1]/total})),{name:'Резерв · 25% к работам',value:s.capexM*1e6-work}];
}
globalThis.Finance={DEFAULT,RATE,COST_PLANS,PRESETS,IN,WBS_MIN,model,hybrid,metrics,npv,irr,fixedFromFTE,budget,nf,money};

})();
