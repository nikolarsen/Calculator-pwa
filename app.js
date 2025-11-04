// Рабочая логика калькулятора: корректное вычисление выражений с приоритетами, %, скобками и история.
const screen = document.getElementById('screen');
const historyEl = document.getElementById('history');
const keys = document.getElementById('keys');

let expr = ''; // отображаемое выражение (с символами ×÷−)
let lastResult = null;
let history = [];

function renderScreen() {
  screen.textContent = expr || '0';
}

function addHistoryItem(input, result) {
  history.unshift({input, result});
  const el = document.createElement('div');
  el.className = 'line';
  el.textContent = input + ' = ' + result;
  historyEl.prepend(el);
  // limit history length
  while (historyEl.children.length > 20) historyEl.removeChild(historyEl.lastChild);
}

function sanitizeForCalc(displayExpr) {
  // Заменяем визуальные символы на JS выражение
  let s = displayExpr.replace(/×/g, '*').replace(/÷/g, '/').replace(/−/g, '-');
  // Заменяем проценты: для простоты интерпретируем N% как (N/100)
  // Например "50%" -> "(50/100)"
  s = s.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
  // Удаляем лишние символы
  s = s.replace(/[^0-9+\-*/().]/g, '');
  return s;
}

function safeEval(displayExpr) {
  const jsExpr = sanitizeForCalc(displayExpr);
  if (!jsExpr) return '0';
  try {
    // Используем Function для вычисления в строгом контексте
    const result = Function('"use strict"; return (' + jsExpr + ')')();
    if (typeof result === 'number' && !isFinite(result)) return 'Ошибка';
    // Округлим до 12 знаков чтобы не было длинных плавающих дробей
    if (typeof result === 'number') {
      const rounded = Math.round((result + Number.EPSILON) * 1e12) / 1e12;
      return rounded;
    }
    return result;
  } catch (e) {
    return 'Ошибка';
  }
}

function insertChar(ch) {
  // Предотвращаем подряд несколько операторов (кроме минуса для отрицательных)
  const last = expr.slice(-1);
  const ops = ['+', '−', '×', '÷', '/','*'];
  if (ops.includes(last) && ops.includes(ch)) {
    // заменяем последний оператор на новый
    expr = expr.slice(0, -1) + ch;
  } else {
    expr += ch;
  }
  renderScreen();
}

function handleEquals() {
  if (!expr) return;
  const res = safeEval(expr);
  addHistoryItem(expr, res);
  expr = String(res).replace(/\*/g,'×').replace(/\//g,'÷').replace(/-/g,'−');
  renderScreen();
  lastResult = res;
}

function handlePercent() {
  // Добавляет % к последнему числу; если нет числа — игнорируем
  // Если последний символ — % убираем его
  if (expr.slice(-1) === '%') {
    expr = expr.slice(0, -1);
    renderScreen();
    return;
  }
  // Если последний символ — оператор — проигнорировать
  const last = expr.slice(-1);
  const ops = ['+','−','×','÷','(',')'];
  if (ops.includes(last)) return;
  expr += '%';
  renderScreen();
}

function handleParen() {
  // Простая логика: если открытых меньше закрытых — добавим '(' иначе ')'
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  if (!expr || /[+−×÷]$/.test(expr) ) {
    expr += '(';
  } else if (open > close) {
    expr += ')';
  } else {
    expr += '(';
  }
  renderScreen();
}

function handleDelete() {
  expr = expr.slice(0, -1);
  renderScreen();
}

function handleAllClear(long=false) {
  if (long) {
    // долгим нажатием — чистим историю
    historyEl.innerHTML = '';
    history = [];
  }
  expr = '';
  renderScreen();
}

// Обработка кликов по кнопкам
keys.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-value], button[data-action]');
  if (!btn) return;
  const val = btn.dataset.value;
  const action = btn.dataset.action;
  if (action === 'all-clear') {
    handleAllClear(false);
    return;
  }
  if (action === 'delete') {
    handleDelete(); return;
  }
  if (action === 'equals') { handleEquals(); return; }
  if (action === 'percent') { handlePercent(); return; }
  if (action === 'paren') { handleParen(); return; }
  if (val) {
    // цифры и точки и операторы
    if (/[0-9.]/.test(val)) {
      // предотвратить лишние точки в одном числе
      const parts = expr.split(/[^0-9.]/);
      const lastNum = parts[parts.length-1] || '';
      if (val === '.' && lastNum.includes('.')) return;
      expr += val;
      renderScreen();
    } else {
      // операторы: + - × ÷
      insertChar(val);
    }
  }
});

// Долгое нажатие на AC для очистки истории
let acTimer = null;
document.querySelector('[data-action="all-clear"]').addEventListener('touchstart', ()=> {
  acTimer = setTimeout(()=> handleAllClear(true), 700);
});
document.querySelector('[data-action="all-clear"]').addEventListener('touchend', ()=> {
  if (acTimer) { clearTimeout(acTimer); acTimer = null; }
});

// Клавиатура: поддержка цифровых клавиш / Enter / Backspace
window.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); handleEquals(); return; }
  if (e.key === 'Backspace') { handleDelete(); return; }
  if (e.key === 'Escape') { handleAllClear(false); return; }
  if (/[0-9]/.test(e.key)) { expr += e.key; renderScreen(); return; }
  if (e.key === '.') { expr += '.'; renderScreen(); return; }
  if (e.key === '+' || e.key === '-') { insertChar(e.key === '-' ? '−' : '+'); return; }
  if (e.key === '*' || e.key === 'x') { insertChar('×'); return; }
  if (e.key === '/') { insertChar('÷'); return; }
});

// Инициализация
renderScreen();
