import {tick} from '../engine/timeEngine.js';
import {create} from 'zustand';
import {createJSONStorage,persist} from 'zustand/middleware';
export const useGameStore=create(persist((set,get)=>({
  screen:'Main Menu',section:'',player:{name:'Arjun Verma',age:28,gender:'Male',state:'Maharashtra',city:'Nanded',origin:'Student Leader',skin:2,portrait:'B11',partyId:'NONE',career:'Citizen'},
  settings:{volume:65, sound:true, reducedMotion:false}, slots:[null,null,null], notifications:[
    {id:1,type:'Important',title:'Welcome to NATION',body:'Your political journey begins here.',time:'Just now',read:false},
    {id:2,type:'Policy',title:'National briefing available',body:'Review the current national situation.',time:'Today',read:false}
  ],tutorial:{complete:false,step:0},party:{joined:false,created:null},turn:1,started:false,
  setScreen:(screen,section='')=>set({screen,section}),
  setPlayer:(patch)=>set(s=>({player:{...s.player,...patch}})),
  setSetting:(key,value)=>set(s=>({settings:{...s.settings,[key]:value}})),
  startGame:()=>set({started:true,screen:'Dashboard',section:'Overview'}),
  endTurn:()=>set(s=>{const next=tick(s,1);return {...next,notifications:[{id:Date.now(),type:'Events',title:`Month ${next.turn} begins`,body:'A new month has started. Review your political priorities.',time:'Now',read:false},...s.notifications]};}),
  markAllRead:()=>set(s=>({notifications:s.notifications.map(n=>({...n,read:true}))})),
  completeTutorial:()=>set(s=>({tutorial:{...s.tutorial,complete:true}})),
  joinParty:(id)=>set(s=>({party:{...s.party,joined:true,partyId:id},player:{...s.player,partyId:id}})),
  createParty:(party)=>set({party:{joined:true,created:party,partyId:'PLAYER_CUSTOM'},player:{...get().player,partyId:'PLAYER_CUSTOM'}}),
  saveSlot:(i)=>set(s=>({slots:s.slots.map((v,j)=>j===i?{savedAt:new Date().toISOString(),snapshot:{player:s.player,turn:s.turn,party:s.party,started:s.started}}:v)})),
  loadSlot:(i)=>{const v=get().slots[i];if(v?.snapshot)set({...v.snapshot,screen:'Dashboard',section:'Overview'});}
}),{name:'nation-local-v1',version:1,storage:createJSONStorage(()=>localStorage),partialize:s=>({player:s.player,settings:s.settings,slots:s.slots,notifications:s.notifications,tutorial:s.tutorial,party:s.party,turn:s.turn,started:s.started})}));
