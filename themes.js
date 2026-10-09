(function(root){
'use strict';
const THEMES=[
{id:'great-wall',name:'萬里長城',place:'中國',kind:'實景改編',rule:'fish',count:1,requirement:'養 1 條魚'},
{id:'petra',name:'佩特拉古城',place:'約旦',kind:'實景改編',rule:'fish',count:2,requirement:'養 2 條魚'},
{id:'christ',name:'里約基督像',place:'巴西',kind:'實景改編',rule:'fish',count:3,requirement:'養 3 條魚'},
{id:'machu',name:'馬丘比丘',place:'秘魯',kind:'實景改編',rule:'fish',count:4,requirement:'養 4 條魚'},
{id:'chichen',name:'奇琴伊察',place:'墨西哥',kind:'實景改編',rule:'fish',count:5,requirement:'養 5 條魚'},
{id:'colosseum',name:'羅馬競技場',place:'義大利',kind:'實景改編',rule:'fish',count:6,requirement:'養 6 條魚'},
{id:'taj',name:'泰姬瑪哈陵',place:'印度',kind:'實景改編',rule:'fish',count:7,requirement:'養 7 條魚'},
{id:'giza',name:'吉薩大金字塔',place:'埃及',kind:'實景改編',rule:'fish',count:8,requirement:'養 8 條魚'},
{id:'gardens',name:'巴比倫空中花園',place:'古代奇觀',kind:'想像重建',rule:'adult',count:2,requirement:'養大 2 條成魚'},
{id:'zeus',name:'奧林匹亞宙斯神像',place:'古希臘',kind:'想像重建',rule:'adult',count:4,requirement:'養大 4 條成魚'},
{id:'artemis',name:'以弗所阿耳忒彌斯神廟',place:'古代奇觀',kind:'想像重建',rule:'education',level:1,count:1,requirement:'1 條魚完成幼兒園'},
{id:'mausoleum',name:'哈利卡納蘇斯摩索拉斯王陵墓',place:'古代奇觀',kind:'想像重建',rule:'education',level:2,count:2,requirement:'2 條魚完成小學'},
{id:'colossus',name:'羅得島太陽神銅像',place:'古代奇觀',kind:'想像重建',rule:'education',level:3,count:2,requirement:'2 條魚完成國中'},
{id:'lighthouse',name:'亞歷山大燈塔',place:'古埃及',kind:'想像重建',rule:'education',level:5,count:1,requirement:'1 條魚完成學院'}
];
const byId=new Map(THEMES.map(t=>[t.id,t]));
const ART={'great-wall':'great-wall-underwater-v23',petra:'petra-underwater-v23',christ:'christ-underwater-v23',machu:'machu-underwater-v23',gardens:'gardens-underwater-v23',colossus:'colossus-underwater-v23',lighthouse:'lighthouse-underwater-v23',chichen:'chichen-underwater-v21',taj:'taj-underwater-v22'};
const PROFILES={zeus:'golden',artemis:'ornate',mausoleum:'ornate',giza:'warm'};
function artwork(id){return byId.has(id)?{src:'assets/themes/'+(ART[id]||id)+'.png',profile:PROFILES[id]||'calm'}:null;}
function eligible(s,t){if(t.rule==='fish')return s.fish.length>=t.count;if(t.rule==='adult')return s.fish.filter(f=>f.education>=5).length>=t.count;return s.fish.filter(f=>f.education>=t.level).length>=t.count;}
function prepare(s,now=Date.now()){
 const old=s.themes&&typeof s.themes==='object'?s.themes:{};
 const unlocked=Array.isArray(old.unlocked)?[...new Set(old.unlocked.filter(id=>byId.has(id)))]:[];
 const added=THEMES.filter(t=>!unlocked.includes(t.id)&&eligible(s,t)).map(t=>t.id);unlocked.push(...added);
 const current=unlocked.includes(old.current)?old.current:null;
 s.themes={unlocked,current,rotationVersion:2,nextChange:old.rotationVersion===2&&Number.isFinite(old.nextChange)?old.nextChange:current?now+600000:now};return added;
}
function choose(s,now=Date.now(),random=Math.random,force=false){prepare(s,now);const data=s.themes;if(!data.unlocked.length){data.current=null;data.nextChange=now+600000;return null;}
 if(!force&&data.current&&now<data.nextChange)return byId.get(data.current);
 const choices=data.unlocked.filter(id=>id!==data.current);data.current=(choices.length?choices:data.unlocked)[Math.min((choices.length||data.unlocked.length)-1,Math.max(0,Math.floor(random()*(choices.length||data.unlocked.length))))];data.nextChange=now+600000;return byId.get(data.current);
}
function label(t){return t?`${t.name} · ${t.kind}`:'寧靜海底 · 尚未解鎖奇觀佈景';}
const api={THEMES,artwork,eligible,prepare,choose,label};if(typeof module!=='undefined')module.exports=api;else root.WonderThemes=api;
})(typeof window!=='undefined'?window:globalThis);
