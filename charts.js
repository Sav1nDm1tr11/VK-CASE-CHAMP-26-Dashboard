/* Small, dependency-free SVG charts. All amounts are supplied by the finance engine. */
(()=>{
const colors=['#1688e8','#19b978','#bd43e7','#ff9b19','#67b5ef','#87d6b5','#8493ab','#ffbd64'];
const n=(v,d=1)=>Finance.nf(v,d);
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;').replaceAll("'",'&#39;');
const dot=c=>`<i class="legend-dot" style="background:${c}"></i>`;
function line(series,{label='Денежный поток',unit='млн ₽',pay=null,limit=null}={}){
 const W=typeof window!=='undefined'&&window.innerWidth<700?Math.max(300,window.innerWidth-66):720,H=260,L=52,R=15,T=22,B=32,all=series.flatMap(s=>s.values);if(limit!==null)all.push(limit);
 let low=Math.min(0,...all),high=Math.max(0,...all);const pad=Math.max(.1,(high-low)*.13);low-=pad;high+=pad;
 const count=Math.max(2,series[0].values.length),X=i=>L+(W-L-R)*i/(count-1),Y=v=>T+(H-T-B)*(high-v)/(high-low);
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}"><defs><linearGradient id="area-${label.replace(/[^a-z]/gi,'')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${series[0].color}" stop-opacity=".16"/><stop offset="1" stop-color="${series[0].color}" stop-opacity=".01"/></linearGradient></defs>`;
 for(let i=0;i<=4;i++){const v=high-(high-low)*i/4;svg+=`<line x1="${L}" y1="${Y(v)}" x2="${W-R}" y2="${Y(v)}" stroke="#edf1f6"/><text x="${L-12}" y="${Y(v)+4}" text-anchor="end" fill="#9daaba" font-size="10">${n(v,Math.abs(high)<2?2:1)}</text>`;}
 svg+=`<line x1="${L}" y1="${Y(0)}" x2="${W-R}" y2="${Y(0)}" stroke="#cbd5e1" stroke-dasharray="4 4"/>`;
 if(limit!==null)svg+=`<line x1="${L}" y1="${Y(limit)}" x2="${W-R}" y2="${Y(limit)}" stroke="#ff9b19" stroke-dasharray="5 4"/><text x="${W-R}" y="${Y(limit)-7}" text-anchor="end" font-size="10" fill="#bb802d">Ориентир ${n(limit,0)} ${esc(unit)}</text>`;
 series.forEach((s,j)=>{const path=s.values.map((v,i)=>`${i?'L':'M'}${X(i).toFixed(2)},${Y(v).toFixed(2)}`).join(' ');
 if(j===0&&series.length===1)svg+=`<path d="${path} L${X(count-1)},${Y(0)} L${X(0)},${Y(0)} Z" fill="url(#area-${label.replace(/[^a-z]/gi,'')})"/>`;
 svg+=`<path d="${path}" fill="none" stroke="${s.color}" stroke-width="2.7" stroke-linejoin="round" stroke-linecap="round"/>`;
 s.values.forEach((v,i)=>{svg+=`<circle cx="${X(i)}" cy="${Y(v)}" r="${i%(count>15?3:2)===0?3:0}" fill="white" stroke="${s.color}" stroke-width="2"/><circle cx="${X(i)}" cy="${Y(v)}" r="9" fill="transparent" tabindex="0" data-tip="${esc(`${s.name}\nМесяц ${i}: ${n(v,2)} ${unit}`)}"><title>${esc(s.name)} · ${i} мес.: ${n(v,2)} ${esc(unit)}</title></circle>`;});});
 if(pay!==null&&pay<count){svg+=`<line x1="${X(pay)}" y1="${T}" x2="${X(pay)}" y2="${H-B}" stroke="#19b978" stroke-dasharray="4 4" opacity=".7"/><rect x="${Math.max(L,Math.min(W-138,X(pay)-60))}" y="${H-B-24}" width="122" height="20" rx="4" fill="#e9f8f1"/><text x="${Math.max(L,Math.min(W-138,X(pay)-60))+61}" y="${H-B-10}" text-anchor="middle" font-size="9" fill="#15996a">Окупаемость · ${pay} мес.</text>`;}
 for(let i=0;i<count;i+=count>15?(W<500?6:3):(W<500?3:2))svg+=`<text x="${X(i)}" y="${H-7}" text-anchor="middle" font-size="10" fill="#9aa8ba">${i===0?'Старт':i+' мес.'}</text>`;
 return `<div class="chart">${svg}</svg></div>`;
}
function stacked(rows,series,{label='Динамика вклада',unit='млн ₽',divisor=1e6}={}){
 const W=typeof window!=='undefined'&&window.innerWidth<700?Math.max(300,window.innerWidth-66):720,H=240,L=45,R=12,T=18,B=30;
 const positive=rows.map(r=>series.reduce((a,s)=>a+Math.max(0,r[s.key]||0),0)/divisor);
 const negative=rows.map(r=>series.reduce((a,s)=>a+Math.min(0,r[s.key]||0),0)/divisor);
 const high=Math.max(.01,...positive)*1.15,low=Math.min(0,...negative)*1.15,span=high-low;
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">`;
 const plot=H-T-B,Y=v=>T+plot*(high-v)/span,slot=(W-L-R)/rows.length,bw=Math.min(22,slot*.6);
 for(let i=0;i<=3;i++){const v=low+span*i/3;svg+=`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="#edf1f6"/><text x="${L-11}" y="${Y(v)+4}" font-size="10" text-anchor="end" fill="#9aa8ba">${n(v,1)}</text>`;}
 svg+=`<line x1="${L}" x2="${W-R}" y1="${Y(0)}" y2="${Y(0)}" stroke="#ced8e4"/>`;
 rows.forEach((r,i)=>{let pos=0,neg=0;series.forEach(s=>{const v=(r[s.key]||0)/divisor,start=v>=0?pos:neg,end=start+v;svg+=`<rect x="${L+slot*i+(slot-bw)/2}" y="${Y(Math.max(start,end))}" width="${bw}" height="${Math.abs(v)/span*plot}" rx="2" fill="${s.color}" tabindex="0" data-tip="${esc(`Месяц ${r.m} · ${s.name}\n${n(v,3)} ${unit}`)}"><title>${esc(s.name)} · ${r.m} мес.: ${n(v,3)} ${esc(unit)}</title></rect>`;if(v>=0)pos+=v;else neg+=v;});if(r.m===1||r.m%(W<500?6:3)===0)svg+=`<text x="${L+slot*(i+.5)}" y="${H-8}" text-anchor="middle" fill="#9aa8ba" font-size="10">${r.m}</text>`;});
 return `<div class="chart">${svg}</svg></div>`;
}
function donut(parts,{caption='Вклад за период',totalLabel=null}={}){
 if(parts.some(p=>p.value<0)&&!totalLabel)caption='Положительный вклад';
 const positive=parts.filter(p=>p.value>0),total=positive.reduce((a,p)=>a+p.value,0);if(!total)return '<div class="empty">Нет положительного вклада.<br>Включите источники монетизации.</div>';
 let offset=0;const rings=positive.map(p=>{const share=p.value/total*100,el=`<circle cx="100" cy="100" r="77" pathLength="100" fill="none" stroke="${p.color}" stroke-width="22" stroke-dasharray="${Math.max(0,share-.75)} ${100-Math.max(0,share-.75)}" stroke-dashoffset="${-offset}" tabindex="0" data-tip="${esc(`${p.name}\n${Finance.money(p.value)} · ${n(share,1)}%`)}"><title>${esc(p.name)}: ${Finance.money(p.value)}</title></circle>`;offset+=share;return el;}).join('');
 return `<div class="donut-wrap"><svg viewBox="0 0 200 200" role="img" aria-label="${esc(caption)}"><circle cx="100" cy="100" r="77" stroke="#f0f4f9" stroke-width="22" fill="none"/>${rings}</svg><div class="donut-center"><strong>${totalLabel||n(total/1e6,2)}<span style="font-size:13px;font-weight:500"> ${totalLabel?'':'млн ₽'}</span></strong><small>${esc(caption)}</small></div></div><div class="donut-legend">${parts.map(p=>`<div class="donut-legend-row"><span>${dot(p.color)}${esc(p.name)}</span><b>${Finance.money(p.value)}<em>${p.value<0?'—':n(total>0?p.value/total*100:0,0)+'%'}</em></b></div>`).join('')}</div>`;
}
function bars(parts){const max=Math.max(1,...parts.map(p=>Math.abs(p.value)));return `<div class="hbars">${parts.map((p,i)=>`<div><div class="hbar-label"><span>${esc(p.name)}</span><strong>${Finance.money(p.value)}</strong></div><div class="track"><i style="width:${Math.abs(p.value)/max*100}%;background:${p.color||colors[i%colors.length]}"></i></div></div>`).join('')}</div>`;}
function spark(values,color='#1688e8'){const min=Math.min(...values),max=Math.max(...values),d=max-min||1;return `<svg viewBox="0 0 70 26" aria-hidden="true"><path d="${values.map((v,i)=>`${i?'L':'M'}${i/(values.length-1)*70},${24-(v-min)/d*21}`).join(' ')}" fill="none" stroke="${color}" stroke-width="1.7" stroke-linecap="round"/></svg>`;}
globalThis.Charts={line,stacked,donut,bars,spark,dot,esc,colors};
})();
