const screen = document.getElementById('screen');
const historyEl = document.getElementById('history');
const keys = document.getElementById('keys');

let expr = '';
let lastResult = null;
let history = [];

function renderScreen(){ screen.textContent = expr || '0'; }

function addHistoryItem(input,result){
  history.unshift({input,result});
  const el=document.createElement('div');
  el.className='line';
  el.textContent=input+' = '+result;
  historyEl.prepend(el);
  while(historyEl.children.length>20) historyEl.removeChild(historyEl.lastChild);
}

function sanitizeForCalc(displayExpr){
  let s=displayExpr.replace(/×/g,'*').replace(/÷/g,'/').replace(/−/g,'-');
  s=s.replace(/(\d+(?:\.\d+)?)([\+\-\*\/])(\d+(?:\.\d+)?)%/g,'($1$2($1*$3/100))');
  s=s.replace(/(\d+(?:\.\d+)?)%/g,'($1/100)');
  s=s.replace(/[^0-9+\-*/().]/g,'');
  return s;
}

function safeEval(displayExpr){
  const jsExpr=sanitizeForCalc(displayExpr);
  if(!jsExpr) return '0';
  try{
    const result=Function('"use strict";return('+jsExpr+')')();
    if(typeof result!=='number'||!isFinite(result)) return '0';
    return Math.round((result+Number.EPSILON)*1e12)/1e12;
  }catch{return '0';}
}

function insertChar(ch){
  const last=expr.slice(-1);
  const ops=['+','−','×','÷','*','/'];
  if(ops.includes(last)&&ops.includes(ch)) expr=expr.slice(0,-1)+ch;
  else expr+=ch;
  renderScreen();
}

function handleEquals(){ if(!expr)return; const res=safeEval(expr); addHistoryItem(expr,res); expr=String(res).replace(/\*/g,'×').replace(/\//g,'÷').replace(/-/g,'−'); renderScreen(); lastResult=res; }
function handlePercent(){ const last=expr.slice(-1); if(last==='%' ){ expr=expr.slice(0,-1); renderScreen(); return;} if(['+','−','×','÷','(',')'].includes(last)) return; expr+='%'; renderScreen(); }
function handleParen(){ const open=(expr.match(/\(/g)||[]).length; const close=(expr.match(/\)/g)||[]).length; if(!expr||/[+−×÷]$/.test(expr)) expr+='('; else if(open>close) expr+=')'; else expr+='('; renderScreen();}
function handleDelete(){ expr=expr.slice(0,-1); renderScreen();}
function handleAllClear(long=false){ if(long){ historyEl.innerHTML=''; history=[];} expr=''; renderScreen();}

function vibrate(){ if(navigator.vibrate) navigator.vibrate(10); }

keys.addEventListener('click',e=>{
  const btn=e.target.closest('button[data-value],button[data-action]');
  if(!btn) return;
  vibrate();
  const val=btn.dataset.value;
  const action=btn.dataset.action;

  if(action==='all-clear'){ handleAllClear(false); return; }
  if(action==='delete'){ handleDelete(); return; }
  if(action==='equals'){ handleEquals(); return; }
  if(action==='percent'){ handlePercent(); return; }
  if(action==='paren'){ handleParen(); return; }

  if(val){
    if(/[0-9.]/.test(val)){
      const parts=expr.split(/[^0-9.]/);
      const lastNum=parts[parts.length-1]||'';
      if(val==='.' && lastNum.includes('.')) return;
      expr+=val; renderScreen();
    } else insertChar(val);
  }
});

// Анимация для сенсорных устройств
keys.addEventListener('touchstart', e=>{
  const btn=e.target.closest('button');
  if(!btn) return;
  btn.classList.add('active');
});
keys.addEventListener('touchend', e=>{
  const btn=e.target.closest('button');
  if(!btn) return;
  btn.classList.remove('active');
});

// Клик по истории
historyEl.addEventListener('click', e => {
  const line = e.target.closest('.line');
  if(!line) return;

  const parts = line.textContent.split(' = ');
  if(parts.length !== 2) return;

  let val = parts[1].replace(/\*/g,'×').replace(/\//g,'÷').replace(/-/g,'−');

  const lastChar = expr.slice(-1);
  const operators = ['+','−','×','÷'];

  if(!expr || operators.includes(lastChar)){
    // Если пусто или последний символ оператор — просто добавляем число
    expr += val;
  } else {
    // Последний символ не оператор — заменяем текущее число
    // Разделяем выражение на части по операторам
    const match = expr.match(/(.+?)([+\−×÷])?([0-9.]*)$/);
    if(match){
      // match[1] = всё до последнего числа
      // match[2] = последний оператор (если есть)
      expr = match[1] + (match[2] || '') + val;
    } else {
      expr = val; // на случай, если не удалось распознать
    }
  }

  renderScreen();
});

// Долгое нажатие AC
let acTimer=null;
document.querySelector('[data-action="all-clear"]').addEventListener('touchstart',()=>{
  acTimer=setTimeout(()=>handleAllClear(true),700);
});
document.querySelector('[data-action="all-clear"]').addEventListener('touchend',()=>{
  if(acTimer){clearTimeout(acTimer); acTimer=null;}
});

// Клавиатура
window.addEventListener('keydown', e=>{
  if(e.key==='Enter'){ e.preventDefault(); handleEquals(); return; }
  if(e.key==='Backspace'){ handleDelete(); return; }
  if(e.key==='Escape'){ handleAllClear(false); return; }
  if(/[0-9]/.test(e.key)){ expr+=e.key; renderScreen(); return; }
  if(e.key==='.') { const parts=expr.split(/[^0-9.]/); const lastNum=parts[parts.length-1]||''; if(!lastNum.includes('.')) expr+='.'; renderScreen(); return; }
  if(e.key==='+'||e.key==='-'){ insertChar(e.key==='-'?'−':'+'); return; }
  if(e.key==='*'||e.key==='x'){ insertChar('×'); return; }
  if(e.key==='/'){ insertChar('÷'); return; }
});

renderScreen();
