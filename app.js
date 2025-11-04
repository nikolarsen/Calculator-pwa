const screen = document.getElementById('screen');
const historyEl = document.getElementById('history');
const keys = document.getElementById('keys');

let expr = '';
let lastResult = null;
let history = [];

// Отображение
function renderScreen() {
  screen.textContent = expr || '0';
}

// История
function addHistoryItem(input, result) {
  history.unshift({input, result});
  const el = document.createElement('div');
  el.className = 'line';
  el.textContent = input + ' = ' + result;
  historyEl.prepend(el);
  while (historyEl.children.length > 20) historyEl.removeChild(historyEl.lastChild);
}

// Проценты
function sanitizeForCalc(displayExpr) {
  let s = displayExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  s = s.replace(/(\d+(?:\.\d+)?)([\+\-\*\/])(\d+(?:\.\d+)?)%/g, '($1$2($1*$3/100))');
  s = s.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
  s = s.replace(/[^0-9+\-*/().]/g, '');
  return s;
}

// Вычисление
function safeEval(displayExpr) {
  const jsExpr = sanitizeForCalc(displayExpr);
  if (!jsExpr) return '0';
  try {
    const result = Function('"use strict"; return (' + jsExpr + ')')();
    if (typeof result !== 'number' || !isFinite(result)) return '0';
    return Math.round((result + Number.EPSILON) * 1e12) / 1e12;
  } catch {
    return '0';
  }
}

// Ввод символов
function insertChar(ch) {
  const last = expr.slice(-1);
  const ops = ['+', '−', '×', '÷', '*','/'];
  if (ops.includes(last) && ops.includes(ch)) {
    expr = expr.slice(0,-1)+ch;
  } else expr+=ch;
  renderScreen();
}

// =
function handleEquals() {
  if(!expr) return;
  const res = safeEval(expr);
  addHistoryItem(expr,res);
  expr = String(res).replace(/\*/g,'×').replace(/\//g,'÷').replace(/-/g,'−');
  renderScreen();
  lastResult=res;
}

// %
function handlePercent() {
  if(expr.slice(-1)==='%'){ expr=expr.slice(0,-1); renderScreen(); return; }
  const last=expr.slice(-1);
  if(['+','−','×','÷','(',')'].includes(last)) return;
  expr+='%'; renderScreen();
}

// Скобки
function handleParen() {
  const open=(expr.match(/\(/g)||[]).length;
  const close=(expr.match(/\)/g)||[]).length;
  if(!expr || /[+−×÷]$/.test(expr)) expr+='(';
  else if(open>close) expr+=')';
  else expr+='(';
  renderScreen();
}

// Удаление
function handleDelete() { expr=expr.slice(0,-1); renderScreen(); }

// Очистка
function handleAllClear(long=false){
  if(long){ historyEl.innerHTML=''; history=[]; }
  expr=''; renderScreen();
}

// Виброотклик
function vibrate(){ if(navigator.vibrate) navigator.vibrate(10); }

// Кнопки
keys.addEventListener('click', (e)=>{
  const btn = e.target.closest('button[data-value], button[data-action]');
  if(!btn) return;
  vibrate();
  const val = btn.dataset.value;
  const action = btn.dataset.action;

  if
