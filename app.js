const screen = document.getElementById('screen');
const historyEl = document.getElementById('history');
const keys = document.getElementById('keys');

let expr = '';
let lastResult = null;
let history = [];
let readyForNewInput = false; // новый ввод после =

// Отображение на экране
function renderScreen() {
  screen.textContent = expr || '0';
}

// Добавление в историю
function addHistoryItem(input, result) {
  history.unshift({input, result});
  const el = document.createElement('div');
  el.className = 'line';
  el.textContent = input + ' = ' + result;
  historyEl.prepend(el);
  while (historyEl.children.length > 20) historyEl.removeChild(historyEl.lastChild);
}

// Обработка процентов и формирование JS-выражения
function sanitizeForCalc(displayExpr) {
  let s = displayExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  s = s.replace(/(\d+(?:\.\d+)?)([\+\-\*\/])(\d+(?:\.\d+)?)%/g, '($1$2($1*$3/100))');
  s = s.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
  s = s.replace(/[^0-9+\-*/().]/g, '');
  return s;
}

// Вычисление выражения
function safeEval(displayExpr) {
  const jsExpr = sanitizeForCalc(displayExpr);
  if (!jsExpr) return '0';
  try {
    const result = Function('"use strict"; return (' + jsExpr + ')')();
    if (typeof result !== 'number' || !isFinite(result)) return '0';
    let rounded = Math.round((result + Number.EPSILON) * 1e12) / 1e12;
    return rounded.toString();
  } catch {
    return '0';
  }
}

// Ввод символов
function insertChar(ch) {
  const last = expr.slice(-1);
  const ops = ['+', '−', '×', '÷', '*','/'];
  if (ops.includes(last) && ops.includes(ch)) {
    expr = expr.slice(0, -1) + ch;
  } else {
    expr += ch;
  }
  readyForNewInput = false; // новый ввод продолжается
  renderScreen();
}

// Обработка =
function handleEquals() {
  if (!expr) return;
  const res = safeEval(expr);
  addHistoryItem(expr, res);
  expr = String(res).replace(/\*/g,'×').replace(/\//g,'÷').replace(/-/g,'−');
  renderScreen();
  lastResult = res;
  readyForNewInput = true; // включаем флаг для следующего ввода
}

// Процент
function handlePercent() {
  if (expr.slice(-1) === '%') {
    expr = expr.slice(0, -1);
    renderScreen();
    return;
  }
  const last = expr.slice(-1);
  const ops = ['+','−','×','÷','(',')'];
  if (ops.includes(last)) return;
  expr += '%';
  readyForNewInput = false;
  renderScreen();
}

// Скобки
function handleParen() {
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  if (!expr || /[+−×÷]$/.test(expr)) {
    expr += '(';
  } else if (open > close) {
    expr += ')';
  } else {
    expr += '(';
  }
  readyForNewInput = false;
  renderScreen();
}

// Удаление
function handleDelete() {
  expr = expr.slice(0, -1);
  readyForNewInput = false;
  renderScreen();
}

// Очистка
function handleAllClear(long=false) {
  if (long) {
    historyEl.innerHTML = '';
    history = [];
  }
  expr = '';
  readyForNewInput = false;
  renderScreen();
}

// --- Кнопки ---
keys.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-value], button[data-action]');
  if (!btn) return;
  const val = btn.dataset.value;
  const action = btn.dataset.action;

  // Виброотклик на iPhone
  if (navigator.vibrate) navigator.vibrate(10);

  if (action === 'all-clear') { handleAllClear(false); return; }
  if (action === 'delete') { handleDelete(); return; }
  if (action === 'equals') { handleEquals(); return; }
  if (action === 'percent') { handlePercent(); return; }
  if (action === 'paren') { handleParen(); return; }

  if (val) {
    if (/[0-9.]/.test(val)) {
      if (readyForNewInput) {
        expr = '';
        readyForNewInput = false;
      }
      const parts = expr.split(/[^0-9.]/);
      const lastNum = parts[parts.length-1] || '';
      if (val === '.' && lastNum.includes('.')) return;
      expr += val;
      renderScreen();
    } else {
      insertChar(val);
    }
  }
});

// Выбор из истории
historyEl.addEventListener('click', (e)=>{
  const line = e.target.closest('.line');
  if (!line) return;
  const text = line.textContent.split('=')[1].trim(); // берём результат
  const lastChar = expr.slice(-1);
  const ops = ['+','−','×','÷','(',')'];
  if (expr && !ops.includes(lastChar)) {
    // заменяем последнее число на выбранный результат
    expr = expr.replace(/([0-9.]+)$/, text);
  } else {
    expr += text;
  }
  readyForNewInput = false;
  renderScreen();
  if (navigator.vibrate) navigator.vibrate(10);
});

// Долгое нажатие AC для очистки истории
let acTimer = null;
document.querySelector('[data-action="all-clear"]').addEventListener('touchstart', ()=> {
  acTimer = setTimeout(()=> handleAllClear(true), 700);
});
document.querySelector('[data-action="all-clear"]').addEventListener('touchend', ()=> {
  if (acTimer) { clearTimeout(acTimer); acTimer = null; }
});

// --- Клавиатура ---
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); handleEquals(); return; }
  if (e.key === 'Backspace') { handleDelete(); return; }
  if (e.key === 'Escape') { handleAllClear(false); return; }
  if (/[0-9]/.test(e.key) || e.key === '.') {
    if (readyForNewInput) { expr = ''; readyForNewInput = false; }
    const parts = expr.split(/[^0-9.]/);
    const lastNum = parts[parts.length-1] || '';
    if (e.key === '.' && lastNum.includes('.')) return;
    expr += e.key;
    renderScreen();
    return;
  }
  if (e.key === '+' || e.key === '-') { insertChar(e.key === '-' ? '−' : '+'); return; }
  if (e.key === '*' || e.key === 'x') { insertChar('×'); return; }
  if (e.key === '/') { insertChar('÷'); return; }
});

// --- Инициализация ---
renderScreen();
