/* main.js — loads ai_model.csv and global_dc.csv via d3.csv() */

const TC = {Reasoning:"#378ADD", Text:"#03FFA5", Image:"#D85A30", Speech:"#a57cf7"};
const DC = {
  OpenAI:"#10A37F",         Meta:"#0082FB",           Google:"#4285F4",
  Microsoft:"#00A4EF",      HuggingFace:"#FFD21E",    Alibaba:"#FF6A00",
  DeepSeek:"#4D6BFE",       "Stability AI":"#C084FC", Cohere:"#39D3C3",
  "LG AI":"#A50034",        "Mistral AI":"#FA520F",   Salesforce:"#00A1E0",
  "01.AI":"#a57cf7",        "Allen AI":"#5DCAA5",     Tencent:"#07C160",
  "Zhipu AI":"#f07094",     "Swiss AI":"#E4002B",     "TII UAE":"#00732F",
  Community:"#888780"
};

const FALLBACK_GLOBAL = [
  {year:2024,total_twh:415,ai_twh:80,rest_twh:335,source:'fallback'},
  {year:2025,total_twh:448,ai_twh:93,rest_twh:355,source:'fallback'}
];

function showChartError(message){
  console.error(message);
  const el=document.getElementById('visualization');
  if(el){
    const banner=document.createElement('div');
    banner.style.background='#301f15';
    banner.style.color='#f8c8a3';
    banner.style.padding='12px 14px';
    banner.style.margin='0 0 14px';
    banner.style.border='1px solid #bc8f71';
    banner.textContent=message;
    el.prepend(banner);
  }
}


/* ─── CURSOR ─── */
(()=>{
  const c=document.getElementById('cur'), r=document.getElementById('cur-r');
  let mx=0,my=0,rx=0,ry=0;
  document.addEventListener('mousemove',e=>{
    mx=e.clientX; my=e.clientY;
    c.style.left=mx+'px'; c.style.top=my+'px';
  });
  (function loop(){
    rx+=(mx-rx)*.13; ry+=(my-ry)*.13;
    r.style.left=rx+'px'; r.style.top=ry+'px';
    requestAnimationFrame(loop);
  })();
})();

/* ─── GLOBE ─── */
function initGlobe(devs){
  const wrap=document.getElementById('sphere-wrap');
  const bubLayer=document.getElementById('bubble-layer');
  const tt=document.getElementById('globe-tt');
  if(!devs||!devs.length||!wrap) return;

  wrap.innerHTML='';

  const maxModels=Math.max(...devs.map(d=>d.models));
  const maxCo2=Math.max(...devs.map(d=>d.maxCo2))||1;
  const maxWh1k=Math.max(...devs.map(d=>d.maxWh1k))||1;

  // Fibonacci sphere
  function fibSphere(n){
    const pts=[], golden=Math.PI*(3-Math.sqrt(5));
    for(let i=0;i<n;i++){
      const y=1-(i/(n-1))*2, r=Math.sqrt(1-y*y), theta=golden*i;
      pts.push({x:Math.cos(theta)*r,y,z:Math.sin(theta)*r});
    }
    return pts;
  }
  const pts=fibSphere(devs.length);

  function getR(){ return Math.min(wrap.clientWidth,wrap.clientHeight)/2; }
  function getSR(){ return getR()*0.53; }
  function getCX(){ return wrap.clientWidth/2; }
  function getCY(){ return wrap.clientHeight*0.38; }

  let rotX=0.3, rotY=0, velX=0, velY=0.003;
  let dragging=false, lastMX=0, lastMY=0;

  const tags=[];
  devs.forEach((d,i)=>{
    const [r,g,b]=d.rgb;
    const intensity=0.45+0.55*(d.maxCo2/maxCo2);
    const fsize=Math.round(11+(d.models/maxModels)*14);
    const el=document.createElement('div');
    el.className='globe-tag';
    el.textContent=d.name;
    el.style.fontSize=fsize+'px';
    wrap.appendChild(el);

    el.addEventListener('mouseenter',e=>{
      spawnBubbles(e,d,[r,g,b]);
      const rank=[...devs].sort((a,b2)=>b2.maxCo2-a.maxCo2).findIndex(x=>x.name===d.name)+1;
      tt.innerHTML=`<div class="gtt-name"><span class="gtt-dot" style="background:rgb(${r},${g},${b})"></span>${d.name}</div>
        <div class="gtt-row"><span class="gtt-label">Models on leaderboard</span><span class="gtt-val">${d.models}</span></div>
        <div class="gtt-row"><span class="gtt-label">Max Wh / 1,000 queries</span><span class="gtt-val">${d.maxWh1k.toFixed(4)} Wh</span></div>
        <div class="gtt-row"><span class="gtt-label">Max CO₂ / 1,000 queries</span><span class="gtt-val">${(d.maxCo2*10).toFixed(4)} g</span></div>
        <div class="gtt-row"><span class="gtt-label">CO₂ rank</span><span class="gtt-val">#${rank} / ${devs.length}</span></div>`;
      const rect=el.getBoundingClientRect();
      let tx=rect.right+10, ty=rect.top-10;
      if(tx+200>window.innerWidth) tx=rect.left-210;
      if(ty+110>window.innerHeight) ty=window.innerHeight-120;
      if(ty<10) ty=10;
      tt.style.left=tx+'px'; tt.style.top=ty+'px';
      tt.classList.add('on');
    });
    el.addEventListener('mouseleave',()=>tt.classList.remove('on'));
    tags.push({el,p:{...pts[i]},color:[r,g,b],intensity});
  });

  function spawnBubbles(e,dev,rgb){
    const bx=e.clientX, by=e.clientY;
    const [r,g,b]=rgb;
    // count driven by model count (4–16), size driven by maxWh1k (5–22px)
    const count=Math.round(4+(dev.models/maxModels)*12);
    const szBase=5+(dev.maxWh1k/maxWh1k)*17;
    for(let i=0;i<count;i++){
      const bub=document.createElement('div');
      bub.className='globe-bub';
      const sz=szBase*(0.6+Math.random()*0.8);
      const angle=(-Math.PI/2)+(Math.random()-.5)*Math.PI;
      const dist=80+Math.random()*120;
      const tx=Math.cos(angle)*dist, ty=Math.sin(angle)*dist-80;
      const dur=1+Math.random()*1.5;
      const alpha=(0.15+Math.random()*.35).toFixed(2);
      bub.style.cssText=`left:${bx-sz/2}px;top:${by-sz/2}px;width:${sz}px;height:${sz}px;`+
        `background:rgba(${r},${g},${b},${alpha});border:1px solid rgba(${r},${g},${b},.5);`+
        `--tx:${tx.toFixed(0)}px;--ty:${ty.toFixed(0)}px;--dur:${dur.toFixed(2)}s;`+
        `animation-delay:${(Math.random()*.4).toFixed(2)}s`;
      bubLayer.appendChild(bub);
      setTimeout(()=>bub.remove(),(dur+0.5)*1000);
    }
  }

  function rotate(p,ax,ay){
    const cosY=Math.cos(ay),sinY=Math.sin(ay);
    const x1=p.x*cosY+p.z*sinY, z1=-p.x*sinY+p.z*cosY;
    const cosX=Math.cos(ax),sinX=Math.sin(ax);
    return{x:x1, y:p.y*cosX-z1*sinX, z:p.y*sinX+z1*cosX};
  }

  function frame(){
    if(!dragging){
      rotY+=velY; rotX+=velX;
      velX*=0.98; velY*=0.998;
      if(Math.abs(velY)<0.002) velY=0.002;
    }
    const sr=getSR(), cxv=getCX(), cyv=getCY();
    tags.forEach(({el,p,color,intensity})=>{
      const rp=rotate(p,rotX,rotY);
      const scale=(rp.z+1.5)/2.5;
      const screenX=cxv+rp.x*sr, screenY=cyv+rp.y*sr;
      el.style.left=(screenX-el.offsetWidth/2)+'px';
      el.style.top=(screenY-el.offsetHeight/2)+'px';
      el.style.zIndex=Math.round(rp.z*100+200);
      const alpha=rp.z>0?0.55+0.45*rp.z:0.08+0.25*(rp.z+1);
      const [r,g,b]=color;
      const bright=Math.round(140+intensity*115);
      el.style.color=`rgba(${Math.min(r+bright-140,255)},${Math.min(g+bright-140,255)},${Math.min(b+bright-140,255)},${alpha.toFixed(2)})`;
      el.style.transform=`scale(${(0.6+0.4*scale).toFixed(3)})`;
      el.style.textShadow=rp.z>0.3?`0 0 ${Math.round(rp.z*14)}px rgba(${r},${g},${b},.55)`:'none';
      el.style.fontWeight=rp.z>0.5?'600':rp.z>0?'500':'400';
    });
    requestAnimationFrame(frame);
  }
  frame();

  wrap.addEventListener('mousedown',e=>{ dragging=true;lastMX=e.clientX;lastMY=e.clientY;velX=0;velY=0; });
  window.addEventListener('mousemove',e=>{
    if(!dragging)return;
    const dx=e.clientX-lastMX,dy=e.clientY-lastMY;
    velY=dx*.01;velX=dy*.01;rotY+=dx*.006;rotX+=dy*.006;
    lastMX=e.clientX;lastMY=e.clientY;
  });
  window.addEventListener('mouseup',()=>dragging=false);
  wrap.addEventListener('touchstart',e=>{ dragging=true;lastMX=e.touches[0].clientX;lastMY=e.touches[0].clientY;velX=0;velY=0; },{passive:true});
  window.addEventListener('touchmove',e=>{
    if(!dragging)return;
    const dx=e.touches[0].clientX-lastMX,dy=e.touches[0].clientY-lastMY;
    velY=dx*.01;velX=dy*.01;rotY+=dx*.006;rotX+=dy*.006;
    lastMX=e.touches[0].clientX;lastMY=e.touches[0].clientY;
  },{passive:true});
  window.addEventListener('touchend',()=>dragging=false);
}

/* ─── VEGA CHARTS ─── */
function embedVega(selector,spec){
  const el=document.querySelector(selector);
  if(el){ el.textContent='Loading '+selector+' ...'; }
  return vegaEmbed(selector,spec,{actions:false}).catch(err=>{
    showChartError(selector+' embed error: '+err);
    console.error(selector+' embed error:',err);
  });
}


function initVega(models, global){
  console.log('initVega models',models?.length,'global',global?.length);
  const dark={labelColor:"#4a6356",titleColor:"#4a6356",gridColor:"rgba(3,255,165,0.05)",
    labelFont:"Roboto Mono",titleFont:"Roboto Mono",labelFontSize:9,titleFontSize:9};
  const nl={labelColor:"#c4d4cb",labelFont:"Roboto Mono",labelFontSize:10};
  const cfg={view:{stroke:null}};
  const typeColors=["#378ADD","#03FFA5","#D85A30","#a57cf7"];
  const typeDomain=["Reasoning","Text","Image","Speech"];

  let g2024 = global.find(g=>g.year===2024);
  let g2025 = global.find(g=>g.year===2025);
  if(!g2024 || !g2025){
    showChartError('Global TWh data for 2024/2025 not available from CSV; using fallback values.');
    g2024 = g2024 || FALLBACK_GLOBAL.find(g=>g.year===2024);
    g2025 = g2025 || FALLBACK_GLOBAL.find(g=>g.year===2025);
  }

  if(!g2024 || !g2025){
    showChartError('Critical: no 2024/2025 global data available; pie charts cannot be rendered.');
    return;
  }

  const pieWidth = Math.min(400, document.getElementById('pie-2024').clientWidth || 400);
  
  vegaEmbed('#pie-2024',{
    $schema:"https://vega.github.io/schema/vega-lite/v5.json",
    data:{values:[{c:"AI servers",v:g2024.ai_twh},{c:"Rest",v:g2024.rest_twh}]},
    width:pieWidth,height:190,background:"transparent",
    mark:{type:"arc",innerRadius:52,outerRadius:88,padAngle:.03},
    encoding:{theta:{field:"v",type:"quantitative"},
      color:{field:"c",type:"nominal",scale:{range:["#03FFA5","#111e16"]},legend:null},
      tooltip:[{field:"c"},{field:"v",title:"TWh"}]},config:cfg
  },{actions:false});

  vegaEmbed('#pie-2025',{
    $schema:"https://vega.github.io/schema/vega-lite/v5.json",
    data:{values:[{c:"AI servers",v:g2025.ai_twh},{c:"Rest",v:g2025.rest_twh}]},
    width:pieWidth,height:190,background:"transparent",
    mark:{type:"arc",innerRadius:52,outerRadius:88,padAngle:.03},
    encoding:{theta:{field:"v",type:"quantitative"},
      color:{field:"c",type:"nominal",scale:{range:["#03FFA5","#111e16"]},legend:null},
      tooltip:[{field:"c"},{field:"v",title:"TWh"}]},config:cfg
  },{actions:false});

  const chartWidth = Math.min(850, document.getElementById('bar-top10').clientWidth || 800);
  const modelChartWidth = Math.min(850, document.getElementById('bar-top10').clientWidth || 600);

  // Top 10 developer aggregated chart
  const devAgg={};
  models.forEach(m=>{
    if(!devAgg[m.dev]) devAgg[m.dev]={dev:m.dev,total_wh1k:0,count:0};
    devAgg[m.dev].total_wh1k+=m.wh1k; devAgg[m.dev].count+=1;
  });
  const top10Dev=Object.values(devAgg).sort((a,b)=>b.total_wh1k-a.total_wh1k).slice(0,10)
    .map((d,i)=>({...d,rank:i+1,isTop3:i<3}));
  const devMax = Math.max(0, ...top10Dev.map(d=>d.total_wh1k));
  const devMaxDomain = Math.max(devMax * 1.02, devMax + 0.01);

  vegaEmbed('#bar-top10-dev',{ 
    $schema:"https://vega.github.io/schema/vega-lite/v5.json",
    data:{values:top10Dev},
    width:chartWidth,height:240,background:"transparent",
    mark:{type:"bar",cornerRadiusEnd:2},
    encoding:{
      x:{field:"total_wh1k",type:"quantitative",title:"Total Wh per 1000 queries",scale:{domain:[0,devMaxDomain],nice:false},axis:{...dark,labelColor:'#fff',titleColor:'#fff',labelFontSize:12,titleFontSize:13,tickColor:'rgba(255,255,255,0.8)'}},
      y:{field:"dev",type:"nominal",sort:null,title:null,axis:{...nl,labelColor:'#fff',labelFontSize:12}},
      color:{field:"isTop3",type:"nominal",scale:{domain:[true,false],range:["#03FFA5","#2a4a3f"]},legend:null},
      tooltip:[{field:"total_wh1k",title:"Total Wh/1000",format:".2f"},{field:"count",title:"Models"}]
    },config:cfg
  },{actions:false});

  // Top 10 model chart (deduplicate by model name, keep max wh1k)
  const modelMap={};
  models.forEach(m=>{ if(!modelMap[m.model]||m.wh1k>modelMap[m.model].wh1k) modelMap[m.model]=m; });
  const top10e=Object.values(modelMap).sort((a,b)=>b.wh1k-a.wh1k).slice(0,10).map((d,i)=>({...d,rank:i+1,isTop3:i<3}));
  const modelMax = Math.max(0, ...top10e.map(d=>d.wh1k));
  const modelMaxDomain = Math.max(modelMax * 1.01, modelMax + 0.01);
  const vegaSpec={
    $schema:"https://vega.github.io/schema/vega-lite/v5.json",
    data:{values:top10e},
    width:modelChartWidth,height:240,background:"transparent",
    mark:{type:"bar",cornerRadiusEnd:2},
    encoding:{
      x:{field:"wh1k",type:"quantitative",title:"Wh per 1000 queries",scale:{domain:[0,modelMaxDomain],nice:false},axis:{...dark,labelColor:'#fff',titleColor:'#fff',labelFontSize:12,titleFontSize:13,tickColor:'rgba(255,255,255,0.8)'}},
      y:{field:"model",type:"nominal",sort:null,title:null,axis:{...nl,labelColor:'#fff',labelFontSize:12}},
      color:{field:"isTop3",type:"nominal",scale:{domain:[true,false],range:["#03FFA5","#2a4a3f"]},legend:null},
      tooltip:[{field:"dev"},{field:"wh1k",title:"Wh/1000",format:".2f"}]
    },config:cfg
  };
  
  vegaEmbed('#bar-top10', vegaSpec, {actions:false});



  const sv=models.map(d=>({...d,lc:Math.log10(d.co2_100)}));
  vegaEmbed('#strip-plot',{
    $schema:"https://vega.github.io/schema/vega-lite/v5.json",
    data:{values:sv},width:chartWidth,height:260,background:"transparent",
    mark:{type:"point",size:52,opacity:.78,filled:true},
    encoding:{
      x:{field:"lc",type:"quantitative",title:"CO₂ g/100q (log₁₀ scale)",axis:dark},
      y:{field:"type",type:"nominal",title:null,sort:typeDomain,axis:nl},
      color:{field:"type",type:"nominal",scale:{domain:typeDomain,range:typeColors},legend:null},
      yOffset:{field:"model",type:"nominal"},
      tooltip:[{field:"model"},{field:"dev"},{field:"type"},{field:"co2_100",title:"CO₂ g/100q",format:".6f"}]
    },config:cfg
  },{actions:false});
}

/* ─── LOLLIPOP ─── */
function initLollipop(models){
  const wrap=document.getElementById('lollipop-chart');
  const top20=[...models].sort((a,b)=>b.wh100-a.wh100).slice(0,20);
  const W=wrap.clientWidth, H=540, ML=200, MR=80, MT=12, MB=36;
  const svg=d3.select(wrap).append('svg').attr('width',W).attr('height',H).style('background','transparent');
  const x=d3.scaleLinear().domain([0,d3.max(top20,d=>d.wh100)*1.08]).range([ML,W-MR]);
  const y=d3.scaleBand().domain(top20.map(d=>d.model)).range([MT,H-MB]).padding(.32);

  svg.selectAll('.g').data(x.ticks(5)).join('line')
    .attr('x1',d=>x(d)).attr('x2',d=>x(d)).attr('y1',MT).attr('y2',H-MB)
    .attr('stroke','rgba(3,255,165,0.05)').attr('stroke-width',1);
  svg.append('g').attr('transform',`translate(0,${H-MB})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d=>d.toFixed(2)+' Wh'))
    .call(g=>g.select('.domain').attr('stroke','rgba(3,255,165,0.18)'))
    .call(g=>g.selectAll('text').attr('fill','#4a6356').attr('font-family','Roboto Mono').attr('font-size',9))
    .call(g=>g.selectAll('.tick line').attr('stroke','rgba(3,255,165,0.08)'));
  svg.selectAll('.yl').data(top20).join('text')
    .attr('x',ML-10).attr('y',d=>y(d.model)+y.bandwidth()/2+4)
    .attr('text-anchor','end').attr('font-size',10).attr('fill','#4a6356').attr('font-family','Roboto Mono')
    .text(d=>d.model);
  svg.selectAll('.stem').data(top20).join('line')
    .attr('x1',x(0)).attr('x2',d=>x(d.wh100))
    .attr('y1',d=>y(d.model)+y.bandwidth()/2).attr('y2',d=>y(d.model)+y.bandwidth()/2)
    .attr('stroke',d=>TC[d.type]+'33').attr('stroke-width',1.5);
  const tip=document.getElementById('gtip');
  svg.selectAll('.dot').data(top20).join('circle')
    .attr('cx',d=>x(d.wh100)).attr('cy',d=>y(d.model)+y.bandwidth()/2)
    .attr('r',6).attr('fill',d=>TC[d.type]).attr('stroke','#060e09').attr('stroke-width',1.5)
    .style('cursor','pointer')
    .on('mousemove',(e,d)=>{
      tip.style.opacity=1; tip.style.left=(e.clientX+14)+'px'; tip.style.top=(e.clientY-10)+'px';
      tip.innerHTML=`<b>${d.model}</b><br>${d.dev} · ${d.type}<br>Wh/100q: ${d.wh100.toFixed(4)}<br>CO₂/100q: ${d.co2_100.toFixed(4)} g<br>💡 LED: ${(d.wh100/10*3600).toFixed(0)}s`;
    })
    .on('mouseleave',()=>tip.style.opacity=0);
}

/* ─── EXPLORE BUBBLE ─── */
let qMode='100', cidx=0, dragAxis=false, dsx=0, axOff=0;
let bubbles=[], fired=false, raf=null;
const IW=128;
let EXP_DATA=[];

function co2for(m){ return qMode==='10'?m.co2_10 : qMode==='1000'?m.co2_1000 : m.co2_100; }

function initExplore(models){
  EXP_DATA=[...models].sort((a,b)=>b.co2_100-a.co2_100).slice(0,10);
  buildAxis();
  const cv=document.getElementById('exp-cv');
  const wr=document.getElementById('exp-wrap');
  function rsz(){ cv.width=wr.clientWidth; cv.height=wr.clientHeight-72; }
  rsz(); window.addEventListener('resize',rsz);

  cv.addEventListener('click',()=>{ if(!dragAxis) fireBubbles(cidx); });
  cv.addEventListener('dblclick',e=>{
    const rc=cv.getBoundingClientRect();
    bubbles.forEach(b=>{ if(!b.popped&&Math.hypot(b.x-e.clientX+rc.left,b.y-e.clientY+rc.top)<b.r) b.popped=true; });
  });
  cv.addEventListener('mousemove',e=>{
    const rc=cv.getBoundingClientRect(), mx=e.clientX-rc.left, my=e.clientY-rc.top;
    const tip=document.getElementById('gtip');
    let h=null;
    bubbles.forEach(b=>{ b.hov=false; if(!b.popped&&Math.hypot(b.x-mx,b.y-my)<b.r){b.hov=true;h=b;} });
    if(h){
      tip.style.opacity=1; tip.style.left=(e.clientX+14)+'px'; tip.style.top=(e.clientY-10)+'px';
      tip.innerHTML=`<b style="color:#03FFA5">1 query</b><br>CO₂: ${h.co2<0.001?h.co2.toExponential(3):h.co2.toFixed(5)} g`;
    } else tip.style.opacity=0;
  });
  cv.addEventListener('mouseleave',()=>{ document.getElementById('gtip').style.opacity=0; });

  document.querySelectorAll('.qbtn').forEach(b=>{
    b.addEventListener('click',function(){
      document.querySelectorAll('.qbtn').forEach(x=>x.classList.remove('on'));
      this.classList.add('on'); qMode=this.dataset.q;
      resetB(); updateInfo(); updateHL();
    });
  });
  updateHL(); updateInfo();
  if(!raf) animLoop();
}

function buildAxis(){
  const ax=document.getElementById('m-axis'); ax.innerHTML='';
  const mc=Math.max(...EXP_DATA.map(m=>m.co2_100));
  EXP_DATA.forEach((m,i)=>{
    const el=document.createElement('div'); el.className='mi';
    el.innerHTML=`<div class="mn">${m.model}</div><div class="md">${m.dev}</div>
      <div class="mb"><div class="mbf" style="width:${(m.co2_100/mc*100).toFixed(1)}%"></div></div>`;
    el.addEventListener('click',()=>{ if(!dragAxis){ snapTo(i,false); setTimeout(()=>fireBubbles(i),380); } });
    ax.appendChild(el);
  });
  ax.addEventListener('mousedown',e=>{ dragAxis=false; dsx=e.clientX; });
  ax.addEventListener('mousemove',e=>{
    if(!(e.buttons&1)) return;
    if(Math.abs(e.clientX-dsx)>4) dragAxis=true;
    axOff+=e.movementX; clamp(); applyOff();
  });
  ax.addEventListener('mouseup',()=>{ setTimeout(()=>dragAxis=false,50); snap(); });
  ax.addEventListener('touchstart',e=>{ dsx=e.touches[0].clientX; dragAxis=false; },{passive:true});
  ax.addEventListener('touchmove',e=>{ dragAxis=true; axOff+=e.touches[0].clientX-dsx; dsx=e.touches[0].clientX; clamp(); applyOff(); },{passive:true});
  ax.addEventListener('touchend',()=>snap());
  snapTo(0,true);
}

function clamp(){
  const aw=document.getElementById('m-axis').parentElement.clientWidth;
  axOff=Math.max(aw/2-EXP_DATA.length*IW+IW/2, Math.min(aw/2-IW/2, axOff));
}
function applyOff(){
  const ax=document.getElementById('m-axis'); ax.style.transform=`translateX(${axOff}px)`;
  const aw=ax.parentElement.clientWidth;
  let best=0, bd=Infinity;
  EXP_DATA.forEach((_,i)=>{ const d=Math.abs(axOff+(i+.5)*IW-aw/2); if(d<bd){bd=d;best=i;} });
  if(best!==cidx){ cidx=best; updateHL(); updateInfo(); resetB(); }
}
function snap(){ snapTo(cidx,false); }
function snapTo(i,imm){
  const aw=document.getElementById('m-axis').parentElement.clientWidth;
  axOff=aw/2-(i+.5)*IW; clamp();
  const ax=document.getElementById('m-axis');
  if(imm){ ax.style.transform=`translateX(${axOff}px)`; }
  else { ax.style.transition='transform .32s cubic-bezier(.4,0,.2,1)'; ax.style.transform=`translateX(${axOff}px)`; setTimeout(()=>ax.style.transition='',340); }
  cidx=i; updateHL(); updateInfo();
}
function updateHL(){
  document.querySelectorAll('.mi').forEach((el,i)=>{
    el.classList.toggle('cen',i===cidx);
    el.style.opacity=Math.abs(i-cidx)>3?'0.28':i===cidx?'1':'0.55';
  });
  const cl=document.getElementById('clabel'); cl.textContent=EXP_DATA[cidx].model; cl.style.opacity='1';
}
function updateInfo(){
  const m=EXP_DATA[cidx], q=parseInt(qMode), co2=co2for(m);
  document.getElementById('q-info').textContent=`${m.model} · ${q} queries · CO₂: ${co2.toFixed(4)} g`;
}
function resetB(){ bubbles=[]; fired=false; document.getElementById('empty-st').style.opacity='1'; }
function fireBubbles(i){
  cidx=i; snapTo(i,false);
  const cv=document.getElementById('exp-cv'), W=cv.width, H=cv.height;
  const m=EXP_DATA[i], co2t=co2for(m), MAXB=Math.min(parseInt(qMode),100), co2b=co2t/MAXB;
  const rS=d3.scaleSqrt().domain([0,Math.max(...EXP_DATA.map(d=>co2for(d)))/MAXB]).range([4,32]);
  fired=true; document.getElementById('empty-st').style.opacity='0'; bubbles=[];
  for(let k=0;k<MAXB;k++){
    bubbles.push({x:W/2+(Math.random()-.5)*50, y:H+8, vx:(Math.random()-.5)*1.2, vy:-(1.7+Math.random()*1.8),
      r:Math.max(4,rS(co2b)), co2:co2b, alpha:0, born:Date.now()+k*50, popped:false, popT:0, hov:false});
  }
}
function animLoop(){
  raf=requestAnimationFrame(animLoop);
  const cv=document.getElementById('exp-cv'); if(!cv) return;
  const ctx=cv.getContext('2d'), W=cv.width, H=cv.height;
  ctx.clearRect(0,0,W,H);
  if(!fired) return;
  const now=Date.now();
  bubbles.forEach(b=>{
    if(now<b.born) return;
    if(b.popped){
      b.popT+=.07;
      if(b.popT<1){ ctx.save(); ctx.globalAlpha=(1-b.popT)*.5; ctx.strokeStyle='rgba(3,255,165,0.7)'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(b.x,b.y,b.r*(1+b.popT*.9),0,Math.PI*2); ctx.stroke(); ctx.restore(); }
      return;
    }
    b.x+=b.vx; b.y+=b.vy; b.vy-=.012; b.vx*=.999;
    b.alpha=Math.min(1,(now-b.born)/300);
    if(b.x-b.r<0){b.x=b.r;b.vx=Math.abs(b.vx)*.5;}
    if(b.x+b.r>W){b.x=W-b.r;b.vx=-Math.abs(b.vx)*.5;}
    if(b.y+b.r<-20){b.popped=true;return;}
    bubbles.forEach(b2=>{
      if(b===b2||b2.popped||now<b2.born) return;
      const dx=b.x-b2.x, dy=b.y-b2.y, d=Math.hypot(dx,dy), md=b.r+b2.r+2;
      if(d<md&&d>0){const f=(md-d)/md*.05; b.vx+=dx/d*f; b.vy+=dy/d*f;}
    });
    ctx.save(); ctx.globalAlpha=b.alpha*.82;
    const gd=ctx.createRadialGradient(b.x-b.r*.3,b.y-b.r*.3,b.r*.06,b.x,b.y,b.r);
    gd.addColorStop(0,'rgba(3,255,165,0.18)'); gd.addColorStop(.7,'rgba(3,255,165,0.05)'); gd.addColorStop(1,'rgba(3,255,165,0.01)');
    ctx.fillStyle=gd; ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle=b.hov?'rgba(3,255,165,0.9)':'rgba(3,255,165,0.38)'; ctx.lineWidth=b.hov?1.8:.8;
    ctx.beginPath(); ctx.arc(b.x,b.y,b.r,0,Math.PI*2); ctx.stroke();
    ctx.globalAlpha=b.alpha*.18; ctx.fillStyle='rgba(255,255,255,0.8)';
    ctx.beginPath(); ctx.arc(b.x-b.r*.3,b.y-b.r*.32,b.r*.18,0,Math.PI*2); ctx.fill();
    if(b.r>13){ctx.globalAlpha=b.alpha*.75; ctx.fillStyle='rgba(3,255,165,0.85)'; ctx.font=`400 ${Math.max(6,b.r*.26)}px Roboto Mono,monospace`; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(b.co2<0.001?b.co2.toExponential(1):b.co2.toFixed(3)+'g',b.x,b.y);}
    ctx.restore();
  });
}

/* ─── SCROLL + NAV ─── */
function initScroll(){
  const obs=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) e.target.classList.add('vis'); }),{threshold:.06});
  document.querySelectorAll('.fi').forEach(el=>obs.observe(el));
  const sObs=new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){
      document.querySelectorAll('.nav-links a').forEach(a=>a.classList.remove('on'));
      const lk=document.querySelector(`.nav-links a[href="#${e.target.id}"]`);
      if(lk) lk.classList.add('on');
    }});
  },{threshold:.2});
  document.querySelectorAll('section[id]').forEach(s=>sObs.observe(s));
  document.querySelectorAll('.nav-links a').forEach(a=>{
    a.addEventListener('click',e=>{
      e.preventDefault();
      const target=document.getElementById(a.getAttribute('href').replace('#',''));
      if(!target) return;
      window.scrollTo({top:target.getBoundingClientRect().top+window.scrollY-document.querySelector('nav').offsetHeight, behavior:'smooth'});
    });
  });
}

/* ─── BOOT: load both CSVs then init ─── */
window.addEventListener('DOMContentLoaded',()=>{
  initScroll();

  Promise.all([
    d3.csv('ai_model.csv', d=>({
      model:   d.model_name,
      dev:     d.developer,
      type:    d.model_type,
      wh100:   +d.wh_per_100_queries,
      wh1k:    +d.wh_per_1000_queries,
      co2_100: +d.co2_g_per_100_queries,
      co2_10:  +d.co2_g_per_100_queries / 10,
      co2_1000:+d.co2_g_per_1000_queries,
    })),
    d3.csv('global_dc.csv', d=>({
      year:     +d.year,
      total_twh:+d.total_twh,
      ai_twh:   +d.ai_twh,
      rest_twh: +d.rest_twh,
      source:   d.source,
    }))
  ]).then(([models, global])=>{
    // Build per-developer stats for globe
    const devMap={};
    models.forEach(m=>{
      if(!devMap[m.dev]) devMap[m.dev]={name:m.dev,models:0,maxCo2:0,maxWh1k:0};
      devMap[m.dev].models++;
      devMap[m.dev].maxCo2=Math.max(devMap[m.dev].maxCo2,m.co2_100);
      devMap[m.dev].maxWh1k=Math.max(devMap[m.dev].maxWh1k,m.wh1k);
    });
    function hexToRgbArr(hex){
      return [parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
    }
    const globeDevs=Object.values(devMap).map(d=>({
      ...d, rgb: DC[d.name] ? hexToRgbArr(DC[d.name]) : [160,200,175]
    }));
    initGlobe(globeDevs);
    initExplore(models);
    // initLollipop(models);
    const ck=setInterval(()=>{
      if(typeof vegaEmbed!=='undefined'){ clearInterval(ck); initVega(models, global); }
    },80);
  }).catch(err=>{
    showChartError('CSV load error: '+err+' (this often happens with file:// paths, use a local http:// server).');
    // Still render key global pie charts via fallback data
    const ck=setInterval(()=>{
      if(typeof vegaEmbed!=='undefined'){ clearInterval(ck); initVega([], FALLBACK_GLOBAL); }
    },80);
  });
});