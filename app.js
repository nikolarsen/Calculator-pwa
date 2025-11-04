const screen = document.getElementById('screen');
const historyEl = document.getElementById('history');
const keys = document.getElementById('keys');

let expr = '';
let lastResult = null;
let readyForNewInput = false;
let replaceLastNumber = false;

/* Обновление экрана */
function renderScreen() {
  screen.textContent = expr || '0';
}

/* Добавление записи в историю */
function addHistoryItem(input, result) {
  const el = document.createElement('div');
  el.className = 'line';
  el.textContent = `${input} = ${result}`;
  historyEl.prepend(el);
  while (historyEl.children.length > 20) historyEl.removeChild(historyEl.lastChild);
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
    const result = Function('"use strict"; return (' + jsExpr + ')')();
    if (typeof result !== 'number' || !isFinite(result)) return '0';
    return (Math.round((result + Number.EPSILON) * 1e12) / 1e12).toString();
  } catch {
    return '0';
  }
}

/* Вставка символа */
function insertChar(ch) {
  const last = expr.slice(-1);
  const ops = ['+', '−', '×', '÷', '*', '/'];
  if (ops.includes(last) && ops.includes(ch)) expr = expr.slice(0, -1) + ch;
  else expr += ch;
  readyForNewInput = false;
  replaceLastNumber = false;
  renderScreen();
}

/* Обработка "=" */
function handleEquals() {
  if (!expr) return;
  const res = safeEval(expr);
  addHistoryItem(expr, res);
  expr = String(res).replace(/\*/g,'×').replace(/\//g,'÷').replace(/-/g,'−');
  renderScreen();
  lastResult = res;
  readyForNewInput = true;
}

/* Процент */
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

/* Удаление символа */
function handleDelete() {
  expr = expr.slice(0, -1);
  renderScreen();
}

/* Очистка */
function handleAllClear(long=false) {
  if (long) historyEl.innerHTML = '';
  expr = '';
  renderScreen();
}

/* Нажатие кнопок */
keys.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-value], button[data-action]');
  if (!btn) return;
  const val = btn.dataset.value;
  const action = btn.dataset.action;

  // Виброотклик (работает на iPhone)
  if (navigator.vibrate) navigator.vibrate(10);

  switch(action) {
    case 'all-clear': return handleAllClear(false);
    case 'delete': return handleDelete();
    case 'equals': return handleEquals();
    case 'percent': return handlePercent();
    case 'paren': return handleParen();
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

/* Выбор из истории */
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

/* Долгое нажатие AC для очистки истории */
let acTimer = null;
const acBtn = document.querySelector('[data-action="all-clear"]');
acBtn.addEventListener('touchstart', ()=> {
  acTimer = setTimeout(()=> handleAllClear(true), 700);
});
acBtn.addEventListener('touchend', ()=> {
  clearTimeout(acTimer);
});

/* Анимация кнопок (универсально для всех) */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('touchstart', () => btn.classList.add('pressed'));
  btn.addEventListener('touchend', () => setTimeout(() => btn.classList.remove('pressed'), 150));
  btn.addEventListener('mousedown', () => btn.classList.add('pressed'));
  btn.addEventListener('mouseup', () => setTimeout(() => btn.classList.remove('pressed'), 150));
});

/* Инициализация */
renderScreen();
