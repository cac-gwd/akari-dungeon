import test from 'node:test';
import assert from 'node:assert/strict';
import {createLayout,distances,SIZE,LAYOUTS} from '../dungeon.js';
import {createGame,generate,validSave} from '../engine.js';
function seeded(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296}}
test('600 seeded layouts: connected floors, distant stairs, closed border and varied exit quadrants',()=>{
 for(const kind of Object.keys(LAYOUTS)){
  const quadrants=new Set,starts=new Set,shapes=new Set;
  for(let seed=1;seed<=200;seed++){
   const {map,start,stairs}=createLayout(null,seeded(seed),kind),steps=distances(map,start);
   assert.ok(map.filter(Boolean).length>=100,`${kind} ${seed}: floor area`);
   assert.equal(steps.filter(n=>n>=0).length,map.filter(Boolean).length,`${kind} ${seed}: connected`);
   assert.ok(steps[stairs.y*SIZE+stairs.x]>=12,`${kind} ${seed}: staircase distance`);
   for(let n=0;n<SIZE;n++){assert.equal(map[n],0);assert.equal(map[(SIZE-1)*SIZE+n],0);assert.equal(map[n*SIZE],0);assert.equal(map[n*SIZE+SIZE-1],0)}
   assert.ok(map.filter((v,k)=>v&&Math.max(Math.abs(k%SIZE-start.x),Math.abs(Math.floor(k/SIZE)-start.y))>3).length>=39);
   quadrants.add(`${stairs.x<15},${stairs.y<15}`);starts.add(`${start.x<15},${start.y<15}`);shapes.add(map.join(''));
  }
  assert.equal(quadrants.size,4,`${kind}: exits use all quadrants`);assert.equal(starts.size,4,`${kind}: starts use all quadrants`);assert.ok(shapes.size>190);
 }
});
test('new floors alternate types and preserve character and inventory',()=>{
 const s=createGame();s.bag=['warp'];s.p.hp=19;const previousPlayer={...s.p};
 for(let floor=2;floor<=10;floor++){const previous=s.layout;s.floor=floor;generate(s);assert.notEqual(s.layout,previous);assert.deepEqual(s.bag,['warp']);for(const key of ['hp','maxHp','xp','level','food','weapon','armor'])assert.equal(s.p[key],previousPlayer[key]);assert.ok(validSave(s))}
});
test('older saves without layout metadata still load and advance',()=>{
 const s=createGame();delete s.layout;const restored=JSON.parse(JSON.stringify(s));assert.ok(validSave(restored));generate(restored);assert.ok(LAYOUTS[restored.layout]);assert.ok(validSave(restored));
});
