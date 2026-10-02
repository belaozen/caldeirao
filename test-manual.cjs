const fs=require('fs'),vm=require('vm'),assert=require('assert');const elements={},noop=()=>{};
const ctx=new Proxy({},{get:()=>noop,set:()=>true});
function el(id){return elements[id]??={innerHTML:'',textContent:'',style:{},open:false,events:{},classList:{add:noop,remove:noop},focus:noop,getContext:()=>ctx,addEventListener(k,fn){this.events[k]=fn;},showModal(){this.open=true;},close(){this.open=false;this.events.close?.();}};}
const box={document:{getElementById:el,activeElement:{tagName:'CANVAS'},addEventListener:noop,hidden:false},window:{addEventListener:noop},requestAnimationFrame:noop,Math};vm.createContext(box);vm.runInContext(fs.readFileSync('game.js','utf8'),box);const run=s=>vm.runInContext(s,box);
run("openManual()");assert.equal(run('state'),'menu');assert(run("$('manual').open"));run('closeManual()');assert.equal(run('state'),'menu');
run("start();players[0].potions=['11'];beginAim(players[0]);mouse.leftHeld=true;openManual();var beforeTime=time;update(5);onKeyDown({code:'KeyR',preventDefault(){}});onKeyDown({code:'KeyP',preventDefault(){}})");assert.equal(run('state'),'paused');assert.equal(run('time'),run('beforeTime'));assert.equal(run('players[0].aiming'),false);assert.equal(run('mouse.leftHeld'),false);assert.equal(run('players[0].potions.length'),1);run('closeManual()');assert.equal(run('state'),'playing');
run('pause();openManual();closeManual()');assert.equal(run('state'),'paused');
run("state='over';openManual();closeManual()");assert.equal(run('state'),'over');
run("state='playing';openManual();document.hidden=true;closeManual()");assert.equal(run('state'),'paused');
assert.equal((run("$('manual-recipes').innerHTML").match(/class="manual-potion"/g)||[]).length,6);
run("document.hidden=false;start();startArenaEvent('lava');openManual();update(20)");assert.equal(run('arenaEvent.remaining'),8);run('closeManual()');assert.equal(run('state'),'playing');
console.log('PASS: manual no menu, pausa da partida, bloqueio de atalhos, preservação de poções, retorno correto, aba oculta e seis receitas.');
