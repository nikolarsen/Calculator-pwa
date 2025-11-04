const screen = document.getElementById('screen');
const historyEl = document.getElementById('history');
const keys = document.getElementById('keys');

let expr = '';
let readyForNewInput = false;
let replaceLastNumber = false;
let calculationInProgress = false;

/* Отображение с доступностью */
function renderScreen() {
  const displayValue = expr || '0';
  screen.textContent = displayValue;
  screen.setAttribute('aria-label', `Экран: ${displayValue}`);
}

/* Добавление в историю */
function addHistoryItem(input, result) {
  const el = document.createElement('div');
  el.className = 'line';
  el.textContent = `${input} = ${result}`;
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', `Вычисление: ${input} равно ${result}. Нажмите чтобы использовать результат`);
  
  historyEl.prepend(el);

  // Ограничение истории
  while (historyEl.children.length > 30) {
    historyEl.removeChild(historyEl.lastChild);
  }
}

/* Подготовка выражения */
function sanitizeForCalc(displayExpr) {
  if (!displayExpr) return '';
  
  let s = displayExpr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\s/g, '');

  // Обработка процентов
  s = s.replace(/(\d+(?:\.\d+)?)([\+\-\*\/])(\d+(?:\.\d+)?)%/g, '($1$2($1*$3/100))');
  s = s.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
  s = s.replace(/[^0-9+\-*/().]/g, '');
  
  return s;
}

/* Безопасное вычисление */
function safeEval(displayExpr) {
  const jsExpr = sanitizeForCalc(displayExpr);
  
  if (!jsExpr) return '0';
  
  if (jsExpr.includes('()') || /[+\-*\/]$/.test(jsExpr)) {
    return 'Ошибка';
  }

  try {
    const result = Function('"use strict";return(' + jsExpr + ')')();
    
    if (typeof result !== 'number' || !isFinite(result)) {
      return result === Infinity ? 'Бесконечность' : 'Ошибка';
    }
    
    if (Number.isInteger(result)) {
      return result.toString();
    } else {
      return parseFloat(result.toFixed(10)).toString();
    }
  } catch (error) {
    console.error('Ошибка вычисления:', error);
    return 'Ошибка';
  }
}

/* Вставка символа */
function insertChar(ch) {
  const lastChar = expr.slice(-1);
  const ops = ['+', '−', '×', '÷'];
  
  if (readyForNewInput) {
    expr = '';
    readyForNewInput = false;
  }
  
  if (ops.includes(lastChar) && ops.includes(ch)) {
    expr = expr.slice(0, -1) + ch;
  } else {
    expr += ch;
  }
  
  replaceLastNumber = false;
  renderScreen();
}

/* Обработка равно */
function handleEquals() {
  if (calculationInProgress || !expr) return;
  
  calculationInProgress = true;
  
  try {
    const res = safeEval(expr);
    
    if (res !== 'Ошибка' && res !== 'Бесконечность') {
      addHistoryItem(expr, res);
    }
    
    expr = String(res)
      .replace(/\*/g, '×')
      .replace(/\//g, '÷')
      .replace(/-/g, '−');
    
    renderScreen();
    readyForNewInput = true;
    
  } catch (error) {
    console.error('Ошибка в handleEquals:', error);
    expr = 'Ошибка';
    renderScreen();
  } finally {
    setTimeout(() => {
      calculationInProgress = false;
    }, 100);
  }
}

/* Проценты */
function handlePercent() {
  const lastChar = expr.slice(-1);
  if (!expr || ['+', '−', '×', '÷', '('].includes(lastChar)) return;
  
  expr += '%';
  renderScreen();
}

/* Скобки */
function handleParen() {
  const open = (expr.match(/\(/g) || []).length;
  const close = (expr.match(/\)/g) || []).length;
  
  if (readyForNewInput) {
    expr = '';
    readyForNewInput = false;
  }
  
  if (!expr || /[+−×÷(]$/.test(expr)) {
    expr += '(';
  } else if (open > close && !/[+−×÷(]$/.test(expr)) {
    expr += ')';
  } else {
    expr += '×(';
  }
  
  renderScreen();
}

/* Удаление */
function handleDelete() {
  if (expr.length > 0) {
    expr = expr.slice(0, -1);
    renderScreen();
  }
}

/* Очистка */
function handleAllClear(longPress = false) {
  if (longPress) {
    historyEl.innerHTML = '';
  }
  expr = '';
  readyForNewInput = false;
  replaceLastNumber = false;
  renderScreen();
}

/* Обработка кликов по кнопкам */
// Добавьте этот код в конец app.js вместо существующих обработчиков кнопок

/* НАДЕЖНАЯ АНИМАЦИЯ КНОПОК */
document.querySelectorAll('.btn').forEach(btn => {
  // Функция для нажатия
  const handlePress = () => {
    btn.classList.add('pressed');
    if (navigator.vibrate) navigator.vibrate(10);
  };
  
  // Функция для отпускания
  const handleRelease = () => {
    btn.classList.remove('pressed');
  };
  
  // Touch события
  btn.addEventListener('touchstart', handlePress, { passive: true });
  btn.addEventListener('touchend', handleRelease, { passive: true });
  btn.addEventListener('touchcancel', handleRelease, { passive: true });
  
  // Mouse события
  btn.addEventListener('mousedown', handlePress);
  btn.addEventListener('mouseup', handleRelease);
  btn.addEventListener('mouseleave', handleRelease);
});

// Гарантированное освобождение всех кнопок при клике вне кнопок
document.addEventListener('click', (e) => {
  if (!e.target.closest('.btn')) {
    document.querySelectorAll('.btn.pressed').forEach(btn => {
      btn.classList.remove('pressed');
    });
  }
}); // Вибрация если поддерживается
  if (navigator.vibrate) navigator.vibrate(10);

  if (action) {
    switch (action) {
      case 'all-clear':
        handleAllClear(false);
        break;
      case 'delete':
        handleDelete();
        break;
      case 'equals':
        handleEquals();
        break;
      case 'percent':
        handlePercent();
        break;
      case 'paren':
        handleParen();
        break;
    }
    return;
  }

  if (val) {
    if (/[0-9.]/.test(val)) {
      if (readyForNewInput) {
        expr = '';
        readyForNewInput = false;
      } else if (replaceLastNumber) {
        expr = expr.replace(/([0-9.]+)$/, '');
        replaceLastNumber = false;
      }
      
      const parts = expr.split(/[^0-9.]/);
      const lastNum = parts[parts.length - 1] || '';
      
      if (val === '.' && lastNum.includes('.')) return;
      
      if (val === '.' && (!lastNum || /[+−×÷(]$/.test(expr))) {
        expr += '0.';
      } else {
        expr += val;
      }
      
      renderScreen();
    } else {
      insertChar(val);
    }
  }
});

/* История — выбор результата */
historyEl.addEventListener('click', (e) => {
  const line = e.target.closest('.line');
  if (!line) return;
  
  try {
    const text = line.textContent.split('=')[1].trim();
    const lastChar = expr.slice(-1);
    const ops = ['+', '−', '×', '÷', '(', ')'];
    
    if (expr && !ops.includes(lastChar)) {
      expr = expr.replace(/([0-9.]+)$/, text);
    } else {
      expr += text;
    }
    
    replaceLastNumber = true;
    readyForNewInput = false;
    renderScreen();
    
    if (navigator.vibrate) navigator.vibrate(10);
  } catch (error) {
    console.error('Ошибка при выборе из истории:', error);
  }
});

/* Долгое нажатие AC */
let acTimer = null;
const acBtn = document.querySelector('[data-action="all-clear"]');

acBtn.addEventListener('touchstart', () => {
  acTimer = setTimeout(() => {
    handleAllClear(true);
    if (navigator.vibrate) navigator.vibrate(50);
  }, 700);
});

acBtn.addEventListener('touchend', () => {
  if (acTimer) {
    clearTimeout(acTimer);
    acTimer = null;
  }
});

/* Простая вибрация для кнопок */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('mousedown', () => {
    if (navigator.vibrate) navigator.vibrate(10);
  });
  
  btn.addEventListener('touchstart', () => {
    if (navigator.vibrate) navigator.vibrate(10);
  }, { passive: true });
});

/* Инициализация */
renderScreen();
