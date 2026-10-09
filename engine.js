(function(root){
'use strict';
const SPECIES=[{id:'clown',name:'小丑魚',price:100,color:'#ffad5c',gem:'暖陽橙晶',desc:'橘白條紋、圓潤的小冒險家。',shape:'round'},{id:'guppy',name:'孔雀魚',price:140,color:'#97a2ff',gem:'紫霧晶',desc:'扇形大尾巴，像一朵游動的花。',shape:'tail'},{id:'gold',name:'金魚',price:180,color:'#ffc778',gem:'蜜金晶',desc:'飄逸的尾鰭，溫柔又愛交朋友。',shape:'tail'},{id:'angel',name:'神仙魚',price:220,color:'#7ee1d3',gem:'海藍晶',desc:'優雅的三角形身姿，好奇心滿滿。',shape:'angel'},{id:'betta',name:'鬥魚',price:260,color:'#fa97b3',gem:'玫瑰晶',desc:'長長的裙擺尾鰭，游泳像跳舞。',shape:'tail'}];
SPECIES.push(
{id:'neon',name:'霓虹燈魚',price:80,color:'#72d9ed',gem:'霓光晶',desc:'藍紅亮帶的小小閃光。',shape:'slim',pattern:'neon'},
{id:'zebra',name:'斑馬魚',price:110,color:'#b7c4e5',gem:'銀紋晶',desc:'俐落橫紋，游起來精神十足。',shape:'slim',pattern:'zebra'},
{id:'discus',name:'七彩神仙魚',price:240,color:'#f5a68e',gem:'晚霞晶',desc:'圓盤身形，帶著彩色波紋。',shape:'disc',pattern:'discus'},
{id:'salmon',name:'鮭魚',price:320,color:'#b9c9cc',gem:'晨曦晶',desc:'銀色身體、粉紅側帶與點點斑紋。',shape:'slim',pattern:'salmon'},
{id:'shark',name:'鯊魚',price:300,color:'#8ea9bd',gem:'海霧晶',desc:'三角背鰭與叉形尾巴，化身可愛的海底夥伴。',shape:'shark',pattern:'shark'},
{id:'koi',name:'錦鯉',price:280,color:'#f5e4ce',gem:'錦霞晶',desc:'紅白花斑，像水中的畫。',shape:'tail',pattern:'koi'},
{id:'pearl',name:'珍珠馬甲魚',price:200,color:'#d1b9e4',gem:'珍珠晶',desc:'點點珍珠花紋與細長腹鰭。',shape:'round',pattern:'pearl'},
{id:'cory',name:'熊貓鼠魚',price:160,color:'#e8d9b2',gem:'琥珀晶',desc:'黑色眼斑，戴著熊貓眼罩。',shape:'round',pattern:'cory'},
{id:'sword',name:'紅劍尾魚',price:190,color:'#f58f7a',gem:'紅曜晶',desc:'尾巴下緣帶著一把小寶劍。',shape:'slim',pattern:'sword'},
{id:'puffer',name:'河豚',price:340,color:'#bed893',gem:'青芽晶',desc:'圓鼓鼓的身形，配上小斑點。',shape:'disc',pattern:'puffer'});
SPECIES.push({id:'mermaid',name:'美人魚',price:2000,color:'#f6a9ca',gem:'人魚粉晶',desc:'粉紅長髮、青綠金飾上衣與紅白長魚尾，溫柔地悠游。',shape:'mermaid'});
const MAX_FISH=15;
const STAGES=['魚苗','幼魚','少年魚','青年魚','成魚'];
const GEM_INTERVALS=[600,1200,1800,2400,3600];
const COURSES=[{name:'珊瑚幼兒園',cost:20,seconds:168*3600},{name:'海草小學',cost:45,seconds:720*3600},{name:'海風國中',cost:80,seconds:1440*3600},{name:'星灣高中',cost:80,seconds:2160*3600},{name:'藍海學院',cost:80,seconds:2880*3600}];
const FOODS=[{id:'free',name:'免費飼料',cost:0,factor:1},{id:'premium',name:'高級飼料',cost:100,factor:.5},{id:'deluxe',name:'特級飼料',cost:200,factor:.1}];
const HUNGER_THRESHOLD=10,HUNGER_DECAY=90/(8*3600);
const LEGACY_SPECIES={blueTang:'salmon',yellowTang:'shark'};
function speciesId(id){return LEGACY_SPECIES[id]||id;}
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,8);
function create(name,now=Date.now()){return {version:1,gemScheduleVersion:2,courseGrowthVersion:1,schoolCapacityVersion:1,name,coins:500,fish:[],gems:[],decor:[],last:now,created:now,total:0,muted:false,motion:true,motionChoice:true};}
function stage(f){return [0,1,2,3,3,4][f.education];}
function food(f){return FOODS.find(x=>x.id===f.foodGrade)||FOODS[0];}
function gemInterval(f){return GEM_INTERVALS[stage(f)]*food(f).factor;}
function setFood(f,grade){const before=gemInterval(f);f.foodGrade=grade;f.gemClock=f.gemClock/before*gemInterval(f);}
function gemCount(s){return s.gems.reduce((sum,g)=>sum+(g.count||1),0);}
function mergeGem(s,gem,count=1){const existing=s.gems.find(g=>g.fish===gem.fish&&g.name===gem.name&&g.value===gem.value&&g.quality===gem.quality&&g.color===gem.color);if(existing)existing.count=(existing.count||1)+count;else s.gems.push({...gem,id:uid(),count});}
function compactGems(s){const grouped=new Map();for(const g of s.gems){const key=JSON.stringify([g.fish,g.name,g.value,g.quality,g.color]);const old=grouped.get(key);if(old)old.count=(old.count||1)+(g.count||1);else grouped.set(key,{...g,count:g.count||1});}s.gems=[...grouped.values()];}
function migrateGems(s){
 if(s.courseGrowthVersion===1&&s.gemScheduleVersion===2)return;
 for(const f of s.fish){
  const oldInterval=s.gemScheduleVersion===2?GEM_INTERVALS[Math.min(4,Math.floor(f.growth/120))]:45;
  f.gemClock=Math.min(.999999,Math.max(0,f.gemClock/oldInterval))*gemInterval(f);
  f.growth=stage(f)*120;
 }
 s.gemScheduleVersion=2;s.courseGrowthVersion=1;
}
const COLORS=[{color:'#f7a6a0',name:'珊瑚粉'},{color:'#f4cd83',name:'蜜金黃'},{color:'#9fd6b0',name:'薄荷綠'},{color:'#8ecbdc',name:'海天藍'},{color:'#ada9ed',name:'薰衣紫'},{color:'#e6add6',name:'櫻花粉'},{color:'#d3dded',name:'珍珠銀'},{color:'#edb58b',name:'杏桃橙'}];
const SKIN_PATTERNS=['bands','spots','waves','diamonds'];
const MERMAID_VARIANTS={coral:'捲髮・珊瑚花髮飾・波浪尾紋',pearl:'直髮・珍珠髮飾・珍珠尾飾',star:'捲髮・星星髮飾・星光尾紋'};
const nameKey=name=>name.normalize('NFKC').replace(/\s+/g,'').toLocaleLowerCase();
function nameUsed(s,name){const key=nameKey(name);return [...(s.usedNames||[]),...s.fish.map(f=>f.name)].some(n=>nameKey(n)===key);}
function skinValid(a){return !!a&&['body','tail','ink'].every(k=>COLORS.some(c=>c.color===a[k]))&&SKIN_PATTERNS.includes(a.pattern);}
function appearanceLabel(f){if(f.species==='mermaid')return MERMAID_VARIANTS[f.mermaidVariant]||'粉紅長髮・紅白魚尾';if(!f.appearance)return '原生花色';const a=f.appearance;return COLORS.find(c=>c.color===a.body).name+'・'+({bands:'條紋',spots:'斑點',waves:'波紋',diamonds:'菱紋'}[a.pattern]);}
function curlyVariant(previousCurly,random=Math.random){return previousCurly==='coral'?'star':previousCurly==='star'?'coral':(random()<.5?'coral':'star');}
function nextMermaidVariant(previous,previousCurly,random=Math.random){return previous==='pearl'?curlyVariant(previousCurly,random):'pearl';}
function newMermaidVariant(s,random=Math.random){const fish=[...s.fish].reverse().filter(f=>f.species==='mermaid');const previous=fish[0]?.mermaidVariant;const previousCurly=fish.find(f=>f.mermaidVariant==='coral'||f.mermaidVariant==='star')?.mermaidVariant;if(!previous)return curlyVariant(undefined,random);return nextMermaidVariant(previous,previousCurly,random);}
function migrateMermaidVariants(s,random=Math.random){let previous=null,previousCurly=null;for(const f of s.fish){if(f.species!=='mermaid')continue;const valid=Object.prototype.hasOwnProperty.call(MERMAID_VARIANTS,f.mermaidVariant);if(!valid||(previous&&((previous==='pearl')===(f.mermaidVariant==='pearl')))){f.mermaidVariant=previous?nextMermaidVariant(previous,previousCurly,random):curlyVariant(undefined,random);}previous=f.mermaidVariant;if(previous!=='pearl')previousCurly=previous;}}
function newAppearance(s,id,random=Math.random){
 const previous=s.fish.at(-1),same=[...s.fish].reverse().find(f=>speciesId(f.species)===id);
 const bodyOf=f=>f?.appearance?.body||SPECIES.find(sp=>sp.id===speciesId(f?.species))?.color;
 const choose=choices=>choices[Math.min(choices.length-1,Math.max(0,Math.floor(random()*choices.length)))];
 const body=choose(COLORS.map(c=>c.color).filter(c=>c!==bodyOf(previous)&&c!==bodyOf(same)));
 const tail=choose(COLORS.map(c=>c.color).filter(c=>c!==body&&c!==same?.appearance?.tail));
 const ink=choose(COLORS.map(c=>c.color).filter(c=>c!==body&&c!==same?.appearance?.ink));
 const pattern=choose(SKIN_PATTERNS.filter(p=>p!==same?.appearance?.pattern));
 return {body,tail,ink,pattern};
}
function buy(s,id,name,now=Date.now(),random=Math.random){
 const sp=SPECIES.find(x=>x.id===id),n=name.trim();if(!sp||s.coins<sp.price||s.fish.length>=MAX_FISH||!n||n.length>24||nameUsed(s,n))return false;
 const appearance=id==='mermaid'?undefined:newAppearance(s,id,random),mermaidVariant=id==='mermaid'?newMermaidVariant(s,random):undefined;s.coins-=sp.price;s.usedNames=[...new Set([...(s.usedNames||[]),...s.fish.map(f=>f.name),n])];
 const fish={id:uid(),species:id,name:n,born:now,growth:0,hunger:90,education:0,school:null,gemClock:0,appearance};if(mermaidVariant)fish.mermaidVariant=mermaidVariant;s.fish.push(fish);return true;
}
function release(s,id){const index=s.fish.findIndex(f=>f.id===id);if(index<0)return false;s.usedNames=[...new Set([...(s.usedNames||[]),...s.fish.map(f=>f.name)])];s.fish.splice(index,1);return true;}
function feedQuote(s,id,grade='free'){
 const chosen=FOODS.find(x=>x.id===grade);
 if(!chosen)return {count:0,cost:0,fish:[],affordable:false};
 const fish=s.fish.filter(f=>(!id||f.id===id)&&(!id?!f.school:true)&&(f.hunger<100||food(f).id!==grade));
 const cost=fish.length*chosen.cost;
 return {count:fish.length,cost,fish,affordable:s.coins>=cost};
}
function feed(s,id,grade='free'){
 const quote=feedQuote(s,id,grade);if(!quote.count||!quote.affordable)return 0;
 s.coins-=quote.cost;for(const f of quote.fish){setFood(f,grade);f.hunger=100;}return quote.count;
}
function courseOccupant(s,course,now=Date.now()){return s.fish.find(f=>f.education===course&&f.school&&f.school.started<=now&&f.school.ends>now)||null;}
function enroll(s,id,now=Date.now()){const f=s.fish.find(x=>x.id===id);if(!f||f.school||f.education>=COURSES.length||courseOccupant(s,f.education,now))return false;const c=COURSES[f.education];if(s.coins<c.cost)return false;const credit=f.courseCredit&&f.courseCredit.course===f.education?f.courseCredit.seconds:0;s.coins-=c.cost;f.school={started:now,ends:now+Math.max(1,c.seconds-credit)*1000,scheduleVersion:3};return true;}
function migrateCapacity(s,now,news){const interrupted=new Map();if(s.schoolCapacityVersion===1)return interrupted;
 for(let i=0;i<COURSES.length;i++){const enrolled=s.fish.filter(f=>f.education===i&&f.school&&f.school.ends>now).sort((a,b)=>a.school.started-b.school.started||a.id.localeCompare(b.id));
  for(const f of enrolled.slice(1)){const old=f.school;interrupted.set(f.id,old);const prior=f.courseCredit&&f.courseCredit.course===i?f.courseCredit.seconds:0;f.courseCredit={course:i,seconds:Math.min(COURSES[i].seconds-1,prior+Math.max(0,(now-old.started)/1000))};f.school=null;s.coins+=COURSES[i].cost;news.push(f.name+'等待課程席位，已保留修課時數並退還學費。');}}
 s.schoolCapacityVersion=1;return interrupted;
}
function advance(s,now=Date.now()){
 for(const f of s.fish)f.species=speciesId(f.species);migrateMermaidVariants(s);
 migrateGems(s);compactGems(s);const last=s.last,elapsed=Math.max(0,(now-last)/1000),dt=Math.min(28800,elapsed),news=[];
 for(const f of s.fish){
  if(f.school&&f.school.scheduleVersion!==3){const oldSeconds=f.school.scheduleVersion===2?[3600,10800,90][f.education]:[45,60,90][f.education];const started=Number.isFinite(f.school.started)?f.school.started:f.school.ends-oldSeconds*1000;f.school={started,ends:started+COURSES[f.education].seconds*1000,scheduleVersion:3};}
 }
 const interrupted=migrateCapacity(s,now,news);
 for(const f of s.fish){
  const school=f.school||interrupted.get(f.id),fed=Math.min(dt,Math.max(0,(f.hunger-HUNGER_THRESHOLD)/HUNGER_DECAY));let t=last,remaining=fed,completed=false;
  function finishSchool(){if(!school||completed)return;completed=true;f.school=null;delete f.courseCredit;const before=stage(f),interval=gemInterval(f);f.education=Math.min(COURSES.length,f.education+1);f.growth=stage(f)*120;f.gemClock=f.gemClock/interval*gemInterval(f);news.push(f.name+'放學了！'+(stage(f)!==before?'成長為'+STAGES[stage(f)]+'，':'已完成高中，接著完成學院即可成為成魚。')+'上課暫停產寶已結束。');}
  while(remaining>1e-7){
   if(school&&t>=school.ends)finishSchool();
   const level=stage(f),interval=gemInterval(f);
   const boundary=school?(t<school.started?school.started:t<school.ends?school.ends:Infinity):Infinity;
   const chunk=Math.min(remaining,Math.max(1e-7,(boundary-t)/1000));
   const inSchool=school&&t>=school.started&&t<school.ends;
   if(!inSchool){f.gemClock+=chunk;const count=Math.floor((f.gemClock+1e-8)/interval);f.gemClock=Math.max(0,f.gemClock-count*interval);if(count){const sp=SPECIES.find(x=>x.id===f.species);mergeGem(s,{fish:f.name,name:sp.gem,value:8+level*9+f.education*16,quality:level+f.education,color:sp.color},count);}}
   t+=chunk*1000;remaining-=chunk;
  }
  if(school&&now>=school.ends)finishSchool();
  f.hunger=Math.max(0,f.hunger-elapsed*HUNGER_DECAY);
  if(f.hunger<HUNGER_THRESHOLD&&food(f).id!=='free')setFood(f,'free');
 }
 s.last=now;return news;
}
function collect(s){const count=gemCount(s);const value=s.gems.reduce((a,g)=>a+g.value*(g.count||1),0);s.coins+=value;s.total+=count;s.gems=[];return {count,value};}
function applyMotion(s){
// Aquarium swimming is always active; keep compatibility with older pause fields.
s.motion=true;s.motionChoice=true;return true;
}
function valid(s){return !!s&&s.version===1&&(s.usedNames===undefined||(Array.isArray(s.usedNames)&&s.usedNames.every(n=>typeof n==='string'&&n.trim().length>0&&n.length<=24)))&&(s.courseGrowthVersion===undefined||s.courseGrowthVersion===1)&&(s.gemScheduleVersion===undefined||s.gemScheduleVersion===2)&&(s.motionChoice===undefined||s.motionChoice===null||typeof s.motionChoice==='boolean')&&typeof s.name==='string'&&s.name.length>0&&s.name.length<=24&&Number.isFinite(s.coins)&&s.coins>=0&&s.coins<=1e9&&Number.isFinite(s.last)&&Array.isArray(s.fish)&&s.fish.length<=MAX_FISH&&s.fish.every(f=>f&&typeof f.id==='string'&&/^[a-z0-9]+$/.test(f.id)&&typeof f.name==='string'&&f.name.trim().length>0&&f.name.length<=24&&SPECIES.some(x=>x.id===speciesId(f.species))&&(f.mermaidVariant===undefined||(f.species==='mermaid'&&Object.prototype.hasOwnProperty.call(MERMAID_VARIANTS,f.mermaidVariant)))&&['growth','hunger','education','gemClock','born'].every(k=>Number.isFinite(f[k])&&f[k]>=0)&&f.hunger<=100&&(f.appearance===undefined||skinValid(f.appearance))&&(f.foodGrade===undefined||FOODS.some(x=>x.id===f.foodGrade))&&f.education<=COURSES.length&&Number.isInteger(f.education)&&(!f.courseCredit||(f.courseCredit.course===f.education&&f.education<COURSES.length&&Number.isFinite(f.courseCredit.seconds)&&f.courseCredit.seconds>=0&&f.courseCredit.seconds<COURSES[f.education].seconds))&&(!f.school||(f.education<COURSES.length&&Number.isFinite(f.school.ends)&&((![2,3].includes(f.school.scheduleVersion))||(Number.isFinite(f.school.started)&&f.school.started<=f.school.ends)))))&&Array.isArray(s.gems)&&s.gems.every(g=>g&&typeof g.id==='string'&&typeof g.name==='string'&&Number.isFinite(g.value)&&g.value>=0&&g.value<=1000&&(g.count===undefined||(Number.isSafeInteger(g.count)&&g.count>0)))&&Array.isArray(s.decor)&&s.decor.every(x=>['grass','coral','castle'].includes(x))&&Number.isFinite(s.total)&&s.total>=0;}
const api={MAX_FISH,release,COLORS,SKIN_PATTERNS,MERMAID_VARIANTS,nameUsed,skinValid,newAppearance,newMermaidVariant,migrateMermaidVariants,appearanceLabel,gemCount,FOODS,food,feedQuote,HUNGER_THRESHOLD,HUNGER_DECAY,SPECIES,STAGES,COURSES,GEM_INTERVALS,gemInterval,courseOccupant,create,stage,buy,feed,enroll,advance,collect,valid,applyMotion};if(typeof module!=='undefined')module.exports=api;else root.Aquarium=api;
})(typeof window!=='undefined'?window:globalThis);
