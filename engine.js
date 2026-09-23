import{SIZE,createLayout}from './dungeon.js';
export{SIZE}from './dungeon.js';
export const ITEMS={herb:{name:'癒やし草',desc:'生命を24回復する',glyph:'✚',color:'#a2d6b6'},food:{name:'旅のおにぎり',desc:'満腹度を55回復する',glyph:'◆',color:'#e6ddbe'},scroll:{name:'雷の札',desc:'周囲6マスの敵すべてに18ダメージ',glyph:'▱',color:'#c0b2e5'},warp:{name:'風の石',desc:'同じ階の安全な場所へ移る',glyph:'◇',color:'#91cbd8'}};
const rand=(n)=>Math.floor(Math.random()*n);
const key=(x,y)=>y*SIZE+x;
export const distance=(a,b)=>Math.max(Math.abs(a.x-b.x),Math.abs(a.y-b.y));
export function note(s,t){s.logs.unshift(t);s.logs=s.logs.slice(0,30)}
export function createGame(){const s={version:1,floor:1,turn:0,p:{x:0,y:0,hp:36,maxHp:36,level:1,xp:0,food:100,weapon:0,armor:0},bag:['herb','herb','food','scroll'],logs:[],status:'playing',kills:0,gold:0};generate(s);note(s,'地下10階の「帰り灯」を探そう。');return s}
export function generate(s){
const layout=createLayout(s.layout);s.layout=layout.kind;s.map=layout.map;s.seen=Array(SIZE*SIZE).fill(false);s.enemies=[];s.items=[];s.traps=[];
s.p.x=layout.start.x;s.p.y=layout.start.y;s.stairs=layout.stairs;
const spots=[];for(let y=1;y<SIZE-1;y++)for(let x=1;x<SIZE-1;x++)if(s.map[key(x,y)]&&distance(s.p,{x,y})>3&&!(x===s.stairs.x&&y===s.stairs.y))spots.push({x,y});
for(let i=spots.length-1;i>0;i--){const j=rand(i+1);[spots[i],spots[j]]=[spots[j],spots[i]]}
const free=()=>{if(!spots.length)throw Error('No free tile');return spots.pop()};
for(let i=0;i<6+s.floor;i++){const type=s.floor>=4&&i%3===0?'鬼火':i%2?'迷い鼠':'苔精';s.enemies.push({...free(),type,hp:8+s.floor*3+(type==='鬼火'?3:0),attack:3+Math.floor(s.floor*.8),xp:4+s.floor*2})}
for(const type of ['food','food','food','herb','herb','scroll','warp','gold','weapon','armor'])s.items.push({...free(),type});for(let i=0;i<2+s.floor;i++)s.traps.push({...free(),revealed:false});reveal(s);note(s,`地下${s.floor}階へ。遠くに灯が揺れている。`);}
export function floorAt(s,x,y){return x>=0&&y>=0&&x<SIZE&&y<SIZE&&s.map[key(x,y)]===1}
export function canStep(s,x,y,dx,dy){return floorAt(s,x+dx,y+dy)&&(!(dx&&dy)||(floorAt(s,x+dx,y)&&floorAt(s,x,y+dy)))}
function sight(s,x,y){let x0=s.p.x,y0=s.p.y,dx=Math.abs(x-x0),dy=Math.abs(y-y0),sx=x0<x?1:-1,sy=y0<y?1:-1,err=dx-dy;while(x0!==x||y0!==y){const e=2*err;if(e>-dy){err-=dy;x0+=sx}if(e<dx){err+=dx;y0+=sy}if(x0===x&&y0===y)return true;if(!floorAt(s,x0,y0))return false}return true}
export function visible(s){const result=new Set;for(let y=Math.max(0,s.p.y-6);y<=Math.min(SIZE-1,s.p.y+6);y++)for(let x=Math.max(0,s.p.x-6);x<=Math.min(SIZE-1,s.p.x+6);x++)if(Math.hypot(x-s.p.x,y-s.p.y)<=6.5&&sight(s,x,y))result.add(key(x,y));return result}
export function reveal(s){for(const k of visible(s))s.seen[k]=true}
export function dropItem(s,index){
if(s.status!=='playing'||!Number.isInteger(index)||index<0||index>=s.bag.length)return false;
const type=s.bag[index],ground=s.items.find(i=>i.x===s.p.x&&i.y===s.p.y);
if(ground){
if(!ITEMS[ground.type]){note(s,'足元に道具を置けない。');return false}
const taken=ground.type;s.bag[index]=taken;ground.type=type;
note(s,`${ITEMS[type].name}を置き、${ITEMS[taken].name}を拾った。`);
}else{s.bag.splice(index,1);s.items.push({x:s.p.x,y:s.p.y,type});note(s,`${ITEMS[type].name}を足元に置いた。`)}
endTurn(s);return true;
}
function kill(s,e){s.enemies=s.enemies.filter(v=>v!==e);s.p.xp+=e.xp;s.kills++;note(s,`${e.type}を倒した。経験値 +${e.xp}`);while(s.p.xp>=s.p.level*12){s.p.xp-=s.p.level*12;s.p.level++;s.p.maxHp+=5;s.p.hp=Math.min(s.p.maxHp,s.p.hp+12);note(s,`レベル${s.p.level}に上がった！ 生命が回復。`)}}
function pickup(s){const item=s.items.find(i=>i.x===s.p.x&&i.y===s.p.y);if(!item)return;if(item.type==='gold'){s.gold+=10+s.floor*5;note(s,'古い銭を拾った。')}else if(item.type==='weapon'||item.type==='armor'){s.p[item.type]++;note(s,item.type==='weapon'?'刀を研いだ。攻撃力 +1。':'護符を重ねた。防御力 +1。')}else{if(s.bag.length>=12){note(s,'道具袋がいっぱいだ。道具は足元に残った。');return}s.bag.push(item.type);note(s,`${ITEMS[item.type].name}を拾った。`)}s.items=s.items.filter(i=>i!==item)}
function endTurn(s){s.turn++;if(s.turn%4===0)s.p.food=Math.max(0,s.p.food-1);if(s.p.food===0){s.p.hp--;note(s,'空腹で生命が減っていく…')}else if(s.turn%6===0)s.p.hp=Math.min(s.p.maxHp,s.p.hp+1);if(s.p.hp<=0){finish(s);return}for(const e of [...s.enemies]){if(distance(s.p,e)<=1&&canStep(s,e.x,e.y,s.p.x-e.x,s.p.y-e.y)){const damage=Math.max(1,e.attack-s.p.armor+rand(3));s.p.hp-=damage;note(s,`${e.type}の攻撃。${damage}ダメージ。`);if(s.p.hp<=0)break}else{let directions;if(distance(s.p,e)<8){directions=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(dx||dy)directions.push([dx,dy]);directions.sort((a,b)=>distance({x:e.x+a[0],y:e.y+a[1]},s.p)-distance({x:e.x+b[0],y:e.y+b[1]},s.p));}else directions=[[rand(3)-1,rand(3)-1]];for(const [dx,dy]of directions){const x=e.x+dx,y=e.y+dy;if(canStep(s,e.x,e.y,dx,dy)&&!(s.p.x===x&&s.p.y===y)&&!s.enemies.some(v=>v!==e&&v.x===x&&v.y===y)){e.x=x;e.y=y;break}}}}
finish(s);reveal(s)}
function finish(s){if(s.p.hp<=0){s.p.hp=0;s.status='dead';note(s,'灯が消えた。この冒険はここまで。')}}
export function move(s,dx,dy){if(s.status!=='playing'||!Number.isInteger(dx)||!Number.isInteger(dy)||Math.abs(dx)>1||Math.abs(dy)>1)return false;if(!dx&&!dy){note(s,'静かに一手、様子を見る。');pickup(s);endTurn(s);return true}if(!canStep(s,s.p.x,s.p.y,dx,dy)){note(s,'壁に阻まれている。');return false}const x=s.p.x+dx,y=s.p.y+dy,e=s.enemies.find(v=>v.x===x&&v.y===y);if(e){const damage=5+s.p.level*2+s.p.weapon+rand(3);e.hp-=damage;note(s,`${e.type}に${damage}ダメージ。`);if(e.hp<=0)kill(s,e)}else{s.p.x=x;s.p.y=y;pickup(s);const trap=s.traps.find(t=>t.x===x&&t.y===y);if(trap){trap.revealed=true;s.p.hp-=4+s.floor;note(s,`針の罠！ ${4+s.floor}ダメージ。`)}if(x===s.stairs.x&&y===s.stairs.y)note(s,s.floor===10?'帰り灯を見つけた。「灯を持ち帰る」で帰還。':'下へ続く階段だ。「階段を降りる」で進む。')}
endTurn(s);return true}
export function useItem(s,index){if(s.status!=='playing'||!Number.isInteger(index)||index<0||index>=s.bag.length)return false;const type=s.bag[index];if(type==='herb'){s.p.hp=Math.min(s.p.maxHp,s.p.hp+24);note(s,'癒やし草を使った。生命を24回復。')}if(type==='food'){s.p.food=Math.min(100,s.p.food+55);note(s,'おにぎりを食べた。満腹度 +55。')}if(type==='scroll'){note(s,'雷の札が光った！');for(const e of [...s.enemies])if(distance(s.p,e)<=6){e.hp-=18;if(e.hp<=0)kill(s,e)}}if(type==='warp'){const spots=[];for(let y=1;y<SIZE-1;y++)for(let x=1;x<SIZE-1;x++)if(floorAt(s,x,y)&&!s.enemies.some(e=>distance(e,{x,y})<3)&&!s.traps.some(t=>t.x===x&&t.y===y))spots.push({x,y});if(spots.length)Object.assign(s.p,spots[rand(spots.length)]);note(s,'風の石に導かれ、別の場所へ移った。')}
s.bag.splice(index,1);pickup(s);endTurn(s);return true}
export function descend(s){if(s.status!=='playing')return false;if(s.p.x!==s.stairs.x||s.p.y!==s.stairs.y){note(s,'階段の上に立つと先へ進める。');return false}if(s.floor===10){s.status='won';note(s,'帰り灯を手に、地上へ。迷宮を踏破した！')}else{s.floor++;generate(s)}return true}
export function validSave(s){return !!(s&&s.version===1&&Number.isFinite(s.kills)&&s.kills>=0&&Number.isFinite(s.gold)&&s.gold>=0&&Number.isInteger(s.floor)&&s.floor>=1&&s.floor<=10&&Number.isInteger(s.turn)&&s.turn>=0&&['playing','dead','won'].includes(s.status)&&s.p&&['x','y','hp','maxHp','level','xp','food','weapon','armor'].every(k=>Number.isFinite(s.p[k]))&&s.p.hp>=0&&s.p.maxHp>0&&s.p.level>=1&&Array.isArray(s.map)&&s.map.length===SIZE*SIZE&&s.map.every(v=>v===0||v===1)&&Array.isArray(s.seen)&&s.seen.length===SIZE*SIZE&&Array.isArray(s.bag)&&s.bag.length<=12&&s.bag.every(i=>ITEMS[i])&&Array.isArray(s.logs)&&s.logs.every(t=>typeof t==='string')&&Array.isArray(s.enemies)&&s.enemies.every(e=>e&&floorAt(s,e.x,e.y)&&Number.isFinite(e.hp)&&Number.isFinite(e.attack)&&Number.isFinite(e.xp)&&typeof e.type==='string')&&Array.isArray(s.items)&&s.items.every(i=>i&&floorAt(s,i.x,i.y)&&(ITEMS[i.type]||['gold','weapon','armor'].includes(i.type)))&&Array.isArray(s.traps)&&s.traps.every(t=>t&&floorAt(s,t.x,t.y))&&s.stairs&&floorAt(s,s.stairs.x,s.stairs.y)&&floorAt(s,s.p.x,s.p.y))}

