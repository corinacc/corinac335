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
  if(!c || !r) return;
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
  const maxWh1k=Math.max(...devs.map(d=>d.maxWh1k))||1;

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
        <div class="gtt-row"><span class="gtt-label">Models Number</span><span class="gtt-val">${d.models}</span></div>
        <div class="gtt-row"><span class="gtt-label">Wh/1,000 queries</span><span class="gtt-val">${d.maxWh1k.toFixed(4)} Wh</span></div>
        <div class="gtt-row"><span class="gtt-label">CO₂/1,000 queries</span><span class="gtt-val">${(d.maxCo2*10).toFixed(4)} g</span></div>
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
    tags.push({el,p:{...pts[i]},color:[r,g,b]});
  });

  function spawnBubbles(e,dev,rgb){
    const bx=e.clientX, by=e.clientY;
    const [r,g,b]=rgb;
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
    tags.forEach(({el,p,color})=>{
      const rp=rotate(p,rotX,rotY);
      const scale=(rp.z+1.5)/2.5;
      const screenX=cxv+rp.x*sr, screenY=cyv+rp.y*sr;
      el.style.left=(screenX-el.offsetWidth/2)+'px';
      el.style.top=(screenY-el.offsetHeight/2)+'px';
      el.style.zIndex=Math.round(rp.z*100+200);
      const alpha=rp.z>0?0.55+0.45*rp.z:0.08+0.25*(rp.z+1);
      const [r,g,b]=color;
      const bright=220;
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
function initVega(models, global){
  console.log('initVega models',models?.length,'global',global?.length);
  
  const cfg={view:{stroke:null},font:"Roboto Mono"};

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
  
  // 2024 饼图
  vegaEmbed('#pie-2024',{
    $schema:"https://vega.github.io/schema/vega-lite/v5.json",
    title: {
      text: `2024 GLOBAL TOTAL: ${g2024.total_twh} TWH`,
      anchor: "middle",
      color: "rgba(255,255,255,0.742)",  
      fontSize: 16,
      font: "Roboto Mono",
      letterSpacing: 0.2,
      offset: 20,
      frame: "group"
    },
    data:{values:[
      {c:"AI share", v:g2024.ai_twh, percentage:(g2024.ai_twh/g2024.total_twh*100).toFixed(0)+'%'},
      {c:"Rest", v:g2024.rest_twh, percentage:(g2024.rest_twh/g2024.total_twh*100).toFixed(0)+'%'}
    ]},
    width:pieWidth, 
    height:190, 
    background:"transparent",
    mark:{type:"arc", innerRadius:52, outerRadius:88, padAngle:.03},
    encoding:{
      theta:{field:"v", type:"quantitative"},
      color:{field:"c", type:"nominal", scale:{range:["#03FFA5","#111e16"]}, legend:null},
      tooltip:[
        {field:"c", title:"source"},
        {field:"v", title:"TWh"},
        {field:"percentage", title:"percentage"}
      ]
    },
    config:cfg
  },{actions:false});

  // 2025 饼图
  vegaEmbed('#pie-2025',{
    $schema:"https://vega.github.io/schema/vega-lite/v5.json",
    title: {
      text: `2025 GLOBAL TOTAL: ${g2025.total_twh} TWH`,
      anchor: "middle",
      color: "rgba(255,255,255,0.742)",  
      font: "Roboto Mono",
      fontSize: 16,
      fontFamily: "Roboto Mono",
      letterSpacing: 0.2,
      offset: 20,
      frame: "group"
    },
    data:{values:[
      {c:"AI servers", v:g2025.ai_twh, pct:(g2025.ai_twh/g2025.total_twh*100).toFixed(0)+'%'},
      {c:"Rest", v:g2025.rest_twh, pct:(g2025.rest_twh/g2025.total_twh*100).toFixed(0)+'%'}
    ]},
    width:pieWidth, height:190, background:"transparent",
    mark:{type:"arc", innerRadius:52, outerRadius:88, padAngle:.03},
    encoding:{
      theta:{field:"v", type:"quantitative"},
      color:{field:"c", type:"nominal", scale:{range:["#03FFA5","#111e16"]}, legend:null},
      tooltip:[
        {field:"c", title:"source"},
        {field:"v", title:"TWh"},
        {field:"pct", title:""}
      ]
    },
    config:cfg
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

  let activeDev=null;
  vegaEmbed('#bar-top10-dev',{
    $schema:"https://vega.github.io/schema/vega-lite/v5.json",
    data:{values:top10Dev},
    width:chartWidth, height:340, background:"transparent", autosize:{type:"fit",contains:"padding"}, padding:{right:1},
    mark:{type:"bar", cornerRadiusEnd:2, size:26, cursor:"pointer"},
    encoding:{
      x:{
        field:"total_wh1k",
        type:"quantitative",
        title:"Total Wh per 1000 queries",
        scale:{domain:[0,devMaxDomain], nice:false},
        axis:{
          labelColor:'rgba(255,255,255,0.742)',
          titleColor:'rgba(255,255,255,0.742)',
          labelFontSize:12,
          titleFontSize:14,        
          titleFontWeight:400, 
          titlePadding:12,
          tickColor:'rgba(255,255,255,0.8)',
          gridColor:'rgba(3,255,165,0.05)'
        }
      },
      y:{
        field:"dev",
        type:"nominal",
        sort:null,
        title:null,
        axis:{
          labelColor:'rgba(255,255,255,0.742)',
          labelFontSize:12,
          labelFont:"Roboto Mono"
        }
      },
      color:{
        field:"isTop3",
        type:"nominal",
        scale:{domain:[true,false], range:["#03FFA5","#2a4a3f"]},
        legend:null
      },
      tooltip:[
        {field:"total_wh1k", title:"Total Wh/1000", format:".2f"},
        {field:"count", title:"Models"}
      ]
    },
    config:cfg
  },{actions:false}).then(result=>{
    result.view.addEventListener('click',(_,item)=>{
      if(!item||!item.datum) return;
      const d=item.datum;
      if(!d.isTop3) return;
      const drill=document.getElementById('dev-drill');
      const label=document.getElementById('dev-drill-label');
      if(activeDev===d.dev){ activeDev=null; drill.style.display='none'; return; }
      activeDev=d.dev;
      const devModelsRaw=models.filter(m=>m.dev===d.dev);
      const devModels=devModelsRaw;
      const modelMax2=Math.ceil(Math.max(...devModels.map(m=>m.wh1k)));
      const drillWidth=Math.min(chartWidth, document.getElementById('bar-top10-dev').clientWidth||chartWidth);
      label.textContent=`↳ ${d.dev} — all models · Wh per 1,000 queries  (click again to close)`;
      label.style.fontFamily="Roboto Mono";
      label.style.fontSize="12px";
      label.style.letterSpacing="0.04em";
      drill.style.display='block';

      vegaEmbed('#dev-drill-chart',{
        $schema:"https://vega.github.io/schema/vega-lite/v5.json",
        data:{values:devModels},
        width:drillWidth, background:"transparent", autosize:{type:"fit",contains:"padding"}, padding:{right:1},
        mark:{type:"bar", cornerRadiusEnd:3, size:18},
        encoding:{
          x:{
            field:"wh1k",
            type:"quantitative",
            title:"Wh per 1,000 queries",
            scale:{domain:[0,modelMax2 + 1], nice:false},
            axis:{
              labelColor:'rgba(255,255,255,0.742)',
              titleColor:'rgba(255,255,255,0.742)',
              labelFontSize:12,
              titleFontSize:14,      
              titleFontWeight:400,
              titlePadding:10,
              tickColor:'rgba(255,255,255,0.6)',
              tickCount:10,
              format:".0f",
              gridColor:'rgba(3,255,165,0.05)'
            }
          },
          y:{
            field:"model",
            type:"nominal",
            sort:"-x",
            title:null,
            axis:{
              labelColor:'rgba(255,255,255,0.742)',
              labelFontSize:12,
              labelFont:"Roboto Mono"
            }
          },
          color:{
            field:"type",
            type:"nominal",
            scale:{domain:typeDomain, range:typeColors},
            legend:{
              title:null,
              orient:"top",
              labelColor:'rgba(255,255,255,0.742)',
              labelFontSize:12,
              labelFont:"Roboto Mono"
            }
          },
          tooltip:[
            {field:"model"},
            {field:"type"},
            {field:"wh1k", title:"Wh/1000 queries", format:".4f"}
          ]
        },
        config:cfg
      },{actions:false});
    });
  });

  // Top 10 model chart (deduplicate by model name, keep max wh1k)
  const modelMap={};
  models.forEach(m=>{ if(!modelMap[m.model]||m.wh1k>modelMap[m.model].wh1k) modelMap[m.model]=m; });
  const top10e=Object.values(modelMap).sort((a,b)=>b.wh1k-a.wh1k).slice(0,10).map((d,i)=>({...d,rank:i+1,isTop3:i<3}));
  
  vegaEmbed('#bar-top10',{
    $schema:"https://vega.github.io/schema/vega-lite/v5.json",
    data:{values:top10e},
    width:modelChartWidth, height:340, background:"transparent", autosize:{type:"fit",contains:"padding"}, padding:{right:1},
    mark:{type:"bar", cornerRadiusEnd:2, size:26},
    encoding:{
      x:{
        field:"wh1k",
        type:"quantitative",
        title:"Wh per 1000 queries",
        scale:{domain:[0,20], nice:false},
        axis:{
          labelColor:'rgba(255,255,255,0.742)',
          titleColor:'rgba(255,255,255,0.742)',
          labelFontSize:12,
          titleFontSize:14,        
          titleFontWeight:400,
          titlePadding:12,
          tickColor:'rgba(255,255,255,0.8)',
          tickCount:10,
          format:".0f",
          gridColor:'rgba(3,255,165,0.05)'
        }
      },
      y:{
        field:"model",
        type:"nominal",
        sort:null,
        title:null,
        axis:{
          labelColor:'rgba(255,255,255,0.742)',
          labelFontSize:12,
          labelFont:"Roboto Mono" 
        }
      },
      color:{
        field:"isTop3",
        type:"nominal",
        scale:{domain:[true,false], range:["#03FFA5","#2a4a3f"]},
        legend:null
      },
      tooltip:[
        {field:"dev"},
        {field:"wh1k", title:"Wh/1000", format:".2f"}
      ]
    },
    config:cfg
  },{actions:false});
}

/* ─── LOLLIPOP (1000 queries) ─── */
function initLollipop(models){
  const wrap=document.getElementById('lollipop-chart');
  const top20=[...models].sort((a,b)=>b.wh1k-a.wh1k).slice(0,20);
  const W=wrap.clientWidth, H=880, ML=200, MR=80, MT=32, MB=70;
  const svg=d3.select(wrap).append('svg').attr('width',W).attr('height',H).style('background','transparent');

  // Legend - 排除 Speech
  const legendItems=Object.entries(TC).filter(([type]) => type !== "Speech");
  const lg=svg.append('g').attr('transform',`translate(${ML},8)`);
  legendItems.forEach(([type,color],i)=>{
    const g=lg.append('g').attr('transform',`translate(${i*110},0)`);
    g.append('circle').attr('r',5).attr('cx',0).attr('cy',0).attr('fill',color);
    g.append('text').attr('x',10).attr('y',4).attr('fill','#aaa').attr('font-size',12).attr('font-family','Roboto Mono').text(type);
  });
  
  const x=d3.scaleLinear().domain([0,d3.max(top20,d=>d.wh1k)*1.08]).range([ML,W-MR]);
  const y=d3.scaleBand().domain(top20.map(d=>d.model)).range([MT,H-MB]).padding(.32);

  svg.selectAll('.g').data(x.ticks(5)).join('line')
    .attr('x1',d=>x(d)).attr('x2',d=>x(d)).attr('y1',MT).attr('y2',H-MB)
    .attr('stroke','rgba(3,255,165,0.05)').attr('stroke-width',1);
  svg.append('text')
    .attr('x',(ML+W-MR)/2).attr('y',H-20)
    .attr('text-anchor','middle').attr('fill','rgba(255,255,255,0.742)')
    .attr('font-size',14).attr('font-family','Roboto Mono')
    .text('Wh per 1000 queries');
  svg.append('g').attr('transform',`translate(0,${H-MB})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(d=>d.toFixed(2)+' Wh'))
    .call(g=>g.select('.domain').attr('stroke','rgba(255,255,255,0.3)'))
    .call(g=>g.selectAll('text').attr('fill','rgba(255,255,255,0.742)').attr('font-family','Roboto Mono').attr('font-size',12))
    .call(g=>g.selectAll('.tick line').attr('stroke','rgba(255,255,255,0.15)'));
  svg.selectAll('.yl').data(top20).join('text')
    .attr('x',ML-10).attr('y',d=>y(d.model)+y.bandwidth()/2+4)
    .attr('text-anchor','end').attr('font-size',12).attr('fill','rgba(255,255,255,0.742)').attr('font-family','Roboto Mono')
    .text(d=>d.model);
  svg.selectAll('.stem').data(top20).join('line')
    .attr('x1',x(0)).attr('x2',d=>x(d.wh1k))
    .attr('y1',d=>y(d.model)+y.bandwidth()/2).attr('y2',d=>y(d.model)+y.bandwidth()/2)
    .attr('stroke',d=>TC[d.type]+'66').attr('stroke-width',1.5);
  const tip=document.getElementById('gtip');
  const countdowns={};
  svg.selectAll('.dot').data(top20).join('circle')
    .attr('cx',d=>x(d.wh1k)).attr('cy',d=>y(d.model)+y.bandwidth()/2)
    .attr('r',6).attr('fill','#555').attr('stroke','#888').attr('stroke-width',1.5)
    .style('cursor','pointer')
    .on('click',(e,d)=>{
      const secs=Math.round(d.wh1k/10*3600);
      const key=d.model;
      if(countdowns[key]){ clearInterval(countdowns[key].timer); countdowns[key].label.remove(); delete countdowns[key]; }
      d3.select(e.currentTarget).attr('fill',TC[d.type]).attr('stroke',TC[d.type]);
      const cx=+d3.select(e.currentTarget).attr('cx');
      const cy=+d3.select(e.currentTarget).attr('cy');
      let remaining=secs;
      const label=svg.append('text')
        .attr('x',cx+12).attr('y',cy+4)
        .attr('fill',TC[d.type]).attr('font-size',10).attr('font-family','Roboto Mono')
        .text(`${remaining}s`);
      countdowns[key]={el:e.currentTarget, label,
        timer:setInterval(()=>{
          remaining--;
          label.text(`${remaining}s`);
          if(remaining<=0){
            clearInterval(countdowns[key].timer);
            label.remove();
            delete countdowns[key];
            d3.select(e.currentTarget).attr('fill','#333').attr('stroke','#555');
          }
        },1000)
      };
    })
    .on('mouseover',(e,d)=>{
      const secs=Math.round(d.wh1k/10*3600);
      tip.style.opacity=1; tip.style.left=(e.clientX+14)+'px'; tip.style.top=(e.clientY-10)+'px';
      tip.innerHTML=`<span style="color:#fff">💡 ${secs}s</span>`;
    })
    .on('mouseleave',()=>{ tip.style.opacity=0; });
}

/* ─── SCATTER PLOT (1000 queries) ─── */
function initScatter(models){
  const top100=[...models].sort((a,b)=>b.co2_1000-a.co2_1000).slice(0,50);
  const devs=['all',...new Set(top100.map(d=>d.dev).sort())];
  const sel=document.getElementById('scatter-dev-filter');
  devs.forEach(d=>{ if(d==='all') return; const o=document.createElement('option'); o.value=d; o.textContent=d; sel.appendChild(o); });

  function render(filterDev){
    const data=filterDev==='all'?top100:top100.filter(m=>m.dev===filterDev);
    const chartWidth=document.getElementById('scatter-chart').clientWidth||800;
    const ySort=["Reasoning","Text","Image","Speech"];
    const colScale={domain:ySort,range:["#378ADD","#03FFA5","#D85A30","#a57cf7"]};
    
    const xAxisCfg={
      labelColor:"rgba(255,255,255,0.742)",
      titleColor:"rgba(255,255,255,0.742)",
      titleFont:"Roboto Mono",
      titleFontSize:14,
      titleFontWeight:400,
      titlePadding:20,
      labelFont:"Roboto Mono",
      labelFontSize:12,
      labelPadding:10,
      gridColor:"rgba(3,255,165,0.05)",
      domainColor:"rgba(255,255,255,0.3)",
      tickColor:"rgba(255,255,255,0.15)",
      tickSize:6,
      format:".2f"
    };

    const yAxisCfg={
      labelColor:"rgba(255,255,255,0.742)",
      labelFont:"Roboto Mono",
      labelFontSize:12,
      title:null,
      domainColor:"rgba(255,255,255,0.3)",
      tickColor:"rgba(255,255,255,0.15)"
    };

    vegaEmbed('#scatter-chart',{
      $schema:"https://vega.github.io/schema/vega-lite/v5.json",
      width:chartWidth,
      height:460,
      background:"transparent",
      autosize:{type:"fit",contains:"padding"},
      padding:{bottom:40},
      layer:[
        {
          data:{values:data},
          transform:[{calculate:"random()",as:"jitter"}],
          mark:{type:"point",size:55,filled:true,opacity:0.75,clip:true},
          encoding:{
            x:{
              field:"co2_1000",
              type:"quantitative",
              title:"CO₂ per 1000 queries (g)",
              scale:{type:"linear",domainMax:6.5},
              axis:xAxisCfg
            },
            y:{
              field:"type",
              type:"nominal",
              sort:ySort,
              scale:{domain:ySort,paddingInner:0.2,paddingOuter:0.1},
              axis:yAxisCfg
            },
            yOffset:{field:"jitter",type:"quantitative",scale:{domain:[0,1],range:[20,75]}},
            color:{field:"type",type:"nominal",scale:colScale,legend:null},
            tooltip:[{field:"model"},{field:"dev"},{field:"co2_1000",title:"CO₂/1000q (g)",format:".4f"}]
          }
        }
      ],
      resolve:{axis:{x:"independent",y:"independent"}},
      config:{view:{stroke:null}}
    },{actions:false});
  }

  render('all');
  sel.addEventListener('change',e=>render(e.target.value));
}

/* ─── EXPLORE BUBBLE ─── */
const EXP_COLORS=['#03FFA5','#378ADD','#D85A30','#a57cf7','#FFD21E','#4D6BFE','#C084FC','#39D3C3','#f07094','#FA520F'];
let expIdx=0, expBubbles=[], expRaf=null;
let EXP_DATA=[];

function initExplore(models){
  EXP_DATA=[...models].sort((a,b)=>b.co2_100-a.co2_100).slice(0,10);
  
  const exploreSection = document.getElementById('explore');
  const inner = exploreSection.querySelector('.inner');
  const expWrap = document.getElementById('exp-wrap');
  
  expWrap.innerHTML = '';
  
  if (!document.getElementById('exp-total-chart')) {
    const chartDiv = document.createElement('div');
    chartDiv.id = 'exp-total-chart';
    chartDiv.innerHTML = `
      <div class="chart-left">
        <span class="chart-label">Total CO₂ Emissions</span>
        <span id="exp-total-value" class="chart-value">0.000 g</span>
      </div>
      <div class="chart-right">
        <span id="exp-bubble-count" class="bubble-count">0 queries</span>
        <div class="progress-wrap">
          <div id="exp-total-bar" class="progress-bar"></div>
        </div>
        <span class="max-label">MAX 10g</span>
      </div>
    `;
    inner.insertBefore(chartDiv, expWrap);
  }

  expWrap.innerHTML = `
    <div id="exp-cv-wrap">
      <canvas id="exp-cv"></canvas>
    </div>
    
    <div class="exp-controls-area">
      <div class="exp-controls-fixed">
        <button id="exp-prev" class="exp-arrow" aria-label="Previous">←</button>
        
        <div class="exp-model-card-fixed" id="exp-card-center">
          <div class="exp-card-name" id="exp-card-name">--</div>
          <div class="exp-card-dev" id="exp-card-dev">--</div>
          <div class="exp-card-co2" id="exp-card-co2">--</div>
        </div>
        
        <button id="exp-next" class="exp-arrow" aria-label="Next">→</button>
      </div>
      
      <div class="exp-dots" id="exp-dots"></div>
      
      <div class="exp-query-row">
        <button class="qbtn" data-q="1">1</button>
        <button class="qbtn" data-q="10">10</button>
        <button class="qbtn" data-q="100">100</button>
        <button class="qbtn" data-q="1000">1,000</button>
        <button id="exp-reset" class="exp-reset-btn">RESET</button>
      </div>
      
      <p class="exp-hint">choose queries · click to fire from center model · reset to clear</p>
    </div>
  `;

  const cv = document.getElementById('exp-cv');
  const wr = document.getElementById('exp-cv-wrap');
  const resizeCanvas = () => {
    cv.width = wr.clientWidth;
    cv.height = wr.clientHeight;
  };
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  updateExpModel();
  updateTotalChart();

  document.getElementById('exp-prev').addEventListener('click', () => {
    expIdx = (expIdx - 1 + EXP_DATA.length) % EXP_DATA.length;
    updateExpModel();
  });
  
  document.getElementById('exp-next').addEventListener('click', () => {
    expIdx = (expIdx + 1) % EXP_DATA.length;
    updateExpModel();
  });
  
  document.getElementById('exp-reset').addEventListener('click', () => {
    expBubbles = [];
    updateTotalChart();
  });

  document.querySelectorAll('.qbtn').forEach(btn => {
    btn.addEventListener('click', function() {
      expFireBubbles(expIdx, parseInt(this.dataset.q));
    });
  });

  if (!expRaf) expAnimLoop();
}

function updateExpModel(){
  const m = EXP_DATA[expIdx];
  const color = EXP_COLORS[expIdx % EXP_COLORS.length];
  
  document.getElementById('exp-card-name').textContent = m.model;
  document.getElementById('exp-card-dev').textContent = m.dev;
  
  const co2PerQuery = m.co2_100 / 100;
  document.getElementById('exp-card-co2').textContent = co2PerQuery.toFixed(4) + ' g CO₂ / query';
  
  const card = document.getElementById('exp-card-center');
  const nameEl = document.getElementById('exp-card-name');
  
  nameEl.style.color = color;
  card.style.borderColor = color;
  card.style.boxShadow = `0 0 30px ${color}33, 0 4px 20px rgba(0,0,0,0.5)`;
  
  updateIndicators();
}

function updateIndicators() {
  const dots = document.getElementById('exp-dots');
  if (!dots) return;
  
  dots.innerHTML = EXP_DATA.map((_, i) => {
    const isActive = i === expIdx;
    const color = EXP_COLORS[i % EXP_COLORS.length];
    return `<span class="exp-dot ${isActive ? 'active' : ''}" 
      style="${isActive ? `background:${color};box-shadow:0 0 10px ${color}` : ''}"></span>`;
  }).join('');
}

function expFireBubbles(idx, queryCount){
  const cv = document.getElementById('exp-cv');
  const W = cv.width, H = cv.height;
  const m = EXP_DATA[idx];
  const color = EXP_COLORS[idx % EXP_COLORS.length];
  const co2PerQuery = m.co2_100 / 100;
  const MAXB = queryCount <= 10 ? queryCount : queryCount <= 100 ? Math.min(queryCount, 60) : 80;
  const queriesPerBubble = queryCount / MAXB;
  const co2PerBubble = co2PerQuery * queriesPerBubble;
  const maxCo2 = Math.max(...EXP_DATA.map(d => d.co2_100 / 100)) * 10;
  const rS = d3.scaleSqrt().domain([0, maxCo2]).range([5, 36]);
  const r = Math.max(5, rS(co2PerBubble));

  const emitX = W / 2;
  const emitY = H - 20;

  for (let k = 0; k < MAXB; k++) {
    const spreadX = (Math.random() - 0.5) * 40;
    expBubbles.push({
      x: emitX + spreadX,
      y: emitY - Math.random() * 10,
      vx: (Math.random() - 0.5) * 1.5,
      vy: -(2 + Math.random() * 2.5),
      r: r,
      color: color,
      co2: co2PerBubble,
      co2Unit: co2PerQuery,
      alpha: 0,
      born: Date.now() + k * 35
    });
  }
  
  updateTotalChart();
}

function updateTotalChart() {
  const totalCO2 = expBubbles.reduce((sum, b) => sum + b.co2, 0);
  const count = expBubbles.reduce((sum, b) => sum + (b.co2 / b.co2Unit), 0);
  
  const totalEl = document.getElementById('exp-total-value');
  const barEl = document.getElementById('exp-total-bar');
  const countEl = document.getElementById('exp-bubble-count');
  
  if (totalEl) totalEl.textContent = totalCO2.toFixed(3) + ' g';
  if (countEl) countEl.textContent = Math.round(count) + ' queries';
  if (barEl) {
    const pct = Math.min((totalCO2 / 10) * 100, 100);
    barEl.style.width = pct + '%';
    barEl.style.background = pct > 80 ? '#ff6b6b' : pct > 50 ? '#ffd93d' : 'var(--g)';
  }
}

function expAnimLoop(){
  expRaf = requestAnimationFrame(expAnimLoop);
  const cv = document.getElementById('exp-cv');
  if (!cv) return;
  
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  ctx.clearRect(0, 0, W, H);
  const now = Date.now();
  
  ctx.strokeStyle = 'rgba(3, 255, 165, 0.06)';
  ctx.beginPath();
  ctx.moveTo(W/2, 0);
  ctx.lineTo(W/2, H);
  ctx.stroke();
  
  expBubbles.forEach(b => {
    if (now < b.born) return;
    
    b.vy -= 0.008;
    b.vx *= 0.998;
    b.vy *= 0.998;
    b.x += b.vx;
    b.y += b.vy;
    b.alpha = Math.min(1, (now - b.born) / 400);
    
    if (b.x - b.r < 0) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.55; }
    if (b.x + b.r > W) { b.x = W - b.r; b.vx = -Math.abs(b.vx) * 0.55; }
    if (b.y - b.r < 0) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.45; }
    if (b.y + b.r > H) { b.y = H - b.r; b.vy = -Math.abs(b.vy) * 0.55; }
    
    expBubbles.forEach(b2 => {
      if (b === b2 || now < b2.born) return;
      const dx = b.x - b2.x, dy = b.y - b2.y;
      const dist = Math.hypot(dx, dy);
      const md = b.r + b2.r + 2;
      if (dist < md && dist > 0) {
        const f = (md - dist) / md * 0.05;
        b.vx += (dx / dist) * f;
        b.vy += (dy / dist) * f;
      }
    });
    
    ctx.save();
    ctx.globalAlpha = b.alpha * 0.85;
    const gd = ctx.createRadialGradient(b.x - b.r*0.3, b.y - b.r*0.3, b.r*0.05, b.x, b.y, b.r);
    gd.addColorStop(0, b.color + '2a');
    gd.addColorStop(0.65, b.color + '0d');
    gd.addColorStop(1, b.color + '04');
    ctx.fillStyle = gd;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.fill();
    
    ctx.strokeStyle = b.color + '88';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r, 0, Math.PI*2);
    ctx.stroke();
    
    ctx.globalAlpha = b.alpha * 0.18;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(b.x - b.r*0.28, b.y - b.r*0.3, b.r*0.17, 0, Math.PI*2);
    ctx.fill();
    
    if (b.r > 13) {
      ctx.globalAlpha = b.alpha * 0.8;
      ctx.fillStyle = b.color;
      ctx.font = `400 ${Math.max(7, b.r*0.27)}px Roboto Mono,monospace`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.co2Unit < 0.001 ? b.co2Unit.toExponential(1) : b.co2Unit.toFixed(3)+'g', b.x, b.y);
    }
    ctx.restore();
  });
  
  updateTotalChart();
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

/* ─── BOOT ─── */
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
    })).sort((a,b)=>b.models-a.models).slice(0,30);
    initGlobe(globeDevs);
    initExplore(models);
    initLollipop(models);
    const ck=setInterval(()=>{
      if(typeof vegaEmbed!=='undefined'){ clearInterval(ck); initVega(models, global); initScatter(models); }
    },80);
  }).catch(err=>{
    showChartError('CSV load error: '+err+' (this often happens with file:// paths, use a local http:// server).');
    const ck=setInterval(()=>{
      if(typeof vegaEmbed!=='undefined'){ clearInterval(ck); initVega([], FALLBACK_GLOBAL); }
    },80);
  });
});