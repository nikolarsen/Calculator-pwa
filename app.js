const screen = document.getElementById('screen');
const historyEl = document.getElementById('history');
const keys = document.getElementById('keys');

let expr = '';
let readyForNewInput = false;
let replaceLastNumber = false;

/* Отображение */
function renderScreen() {
  screen.textContent = expr || '0';
}

/* Добавление в историю */
function addHistoryItem(input, result) {
  const el = document.createElement('div');
  el.className = 'line';
  el.textContent = `${input} = ${result}`;
  historyEl.prepend(el);
  while (historyEl.children.length > 30) historyEl.removeChild(historyEl.lastChild);
}

/* Подготовка выражения */
function sanitizeForCalc(displayExpr) {
  let s = displayExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  s = s.replace(/(\d+(?:\.\d+)?)([\+\-\*\/])(\d+(?:\.\d+)?)%/g, '($1$2($1*$3/100))');
  s = s.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
  s = s.replace(/[^0-9+\-*/().]/g, '');
  return s;
}

/* Безопасное вычисление */
function safeEval(displayExpr) {
  const jsExpr = sanitizeForCalc(displayExpr);
  if (!jsExpr) return '0';
  try {
    const result = Function('"use strict";return(' + jsExpr + ')')();
    if (typeof result !== 'number' || !isFinite(result)) return '0';
    return (Math.round((result + Number.EPSILON) * 1e12) / 1e12).toString();
  } catch {
    return '0';
  }
}

/* Символы */
function insertChar(ch) {
  const last = expr.slice(-1);
  const ops = ['+', '−', '×', '÷'];
  if (ops.includes(last) && ops.includes(ch)) expr = expr.slice(0, -1) + ch;
  else expr += ch;
  readyForNewInput = false;
  replaceLastNumber = false;
  renderScreen();
}

/* Равно */
function handleEquals() {
  if (!expr) return;
  const res = safeEval(expr);
  addHistoryItem(expr, res);
  expr = String(res).replace(/\*/g,'×').replace(/\//g,'÷').replace(/-/g,'−');
  renderScreen();
  readyForNewInput = true;
}

/* Проценты */
function handlePercent() {
  const last = expr.slice(-1);
  if (!expr || ['+','−','×','÷','('].includes(last)) return;
  expr += '%';
  renderScreen();
}

/* Скобки */
function handleParen() {
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  if (!expr || /[+−×÷]$/.test(expr)) expr += '(';
  else if (open > close) expr += ')';
  else expr += '(';
  renderScreen();
}

/* Удалить */
function handleDelete() {
  expr = expr.slice(0, -1);
  renderScreen();
}

/* Очистить */
function handleAllClear(long=false) {
  if (long) historyEl.innerHTML = '';
  expr = '';
  renderScreen();
}

/* Обработка кликов */
keys.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-value], button[data-action]');
  if (!btn) return;
  const val = btn.dataset.value;
  const action = btn.dataset.action;

  if (navigator.vibrate) navigator.vibrate(10);

  if (action) {
    if (action === 'all-clear') return handleAllClear(false);
    if (action === 'delete') return handleDelete();
    if (action === 'equals') return handleEquals();
    if (action === 'percent') return handlePercent();
    if (action === 'paren') return handleParen();
  }

  if (val) {
    if (/[0-9.]/.test(val)) {
      if (readyForNewInput) expr = '';
      else if (replaceLastNumber) expr = expr.replace(/([0-9.]+)$/, '');
      const parts = expr.split(/[^0-9.]/);
      const lastNum = parts[parts.length-1] || '';
      if (val === '.' && lastNum.includes('.')) return;
      expr += val;
      renderScreen();
    } else insertChar(val);
  }
});

/* История — выбор результата */
historyEl.addEventListener('click', (e)=>{
  const line = e.target.closest('.line');
  if (!line) return;
  const text = line.textContent.split('=')[1].trim();
  const lastChar = expr.slice(-1);
  const ops = ['+','−','×','÷','(',')'];
  if (expr && !ops.includes(lastChar))
    expr = expr.replace(/([0-9.]+)$/, text);
  else expr += text;
  replaceLastNumber = true;
  renderScreen();
  if (navigator.vibrate) navigator.vibrate(10);
});

/* Долгое нажатие AC — очистить всё */
let acTimer = null;
const acBtn = document.querySelector('[data-action="all-clear"]');
acBtn.addEventListener('touchstart', ()=> {
  acTimer = setTimeout(()=> handleAllClear(true), 700);
});
acBtn.addEventListener('touchend', ()=> clearTimeout(acTimer));

/* Анимация кнопок */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('touchstart', () => btn.classList.add('pressed'));
  btn.addEventListener('touchend', () => setTimeout(() => btn.classList.remove('pressed'), 120));
  btn.addEventListener('mousedown', () => btn.classList.add('pressed'));
  btn.addEventListener('mouseup', () => setTimeout(() => btn.classList.remove('pressed'), 120));
});

renderScreen();
