const screen = document.getElementById('screen');
const historyEl = document.getElementById('history');
const keys = document.getElementById('keys');

let expr = '';
let readyForNewInput = false;
let replaceLastNumber = false;
let calculationInProgress = false;
let errorState = false;

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

/* Безопасное вычисление с улучшенной логикой ошибок */
function safeEval(displayExpr) {
  const jsExpr = sanitizeForCalc(displayExpr);
  
  if (!jsExpr) return null;
  
  // Проверка на пустые выражения и синтаксические ошибки
  if (jsExpr.includes('()') || /[+\-*\/]$/.test(jsExpr)) {
    return null;
  }

  try {
    const result = Function('"use strict";return(' + jsExpr + ')')();
    
    if (typeof result !== 'number' || !isFinite(result)) {
      return null;
    }
    
    // Обработка очень больших/маленьких чисел
    if (Math.abs(result) > 1e15) return null;
    if (Math.abs(result) < 1e-15 && result !== 0) return 0;
    
    if (Number.isInteger(result)) {
      return result;
    } else {
      // Округление до 10 знаков с удалением лишних нулей
      return parseFloat(result.toFixed(10));
    }
  } catch (error) {
    return null;
  }
}

/* Обработка ошибки */
function handleError() {
  errorState = true;
  expr = '';
  screen.style.color = 'var(--danger)';
  setTimeout(() => {
    screen.style.color = '';
    errorState = false;
  }, 300);
}

/* Вставка символа */
function insertChar(ch) {
  if (errorState) {
    expr = '';
    errorState = false;
    screen.style.color = '';
  }
  
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
  if (calculationInProgress || !expr || errorState) return;
  
  calculationInProgress = true;
  
  try {
    const result = safeEval(expr);
    
    if (result === null) {
      handleError();
    } else {
      // Форматирование результата
      let displayResult;
      if (Number.isInteger(result)) {
        displayResult = result.toString();
      } else {
        displayResult = parseFloat(result.toFixed(10)).toString();
      }
      
      addHistoryItem(expr, displayResult);
      expr = displayResult
        .replace(/\*/g, '×')
        .replace(/\//g, '÷')
        .replace(/-/g, '−');
      
      renderScreen();
      readyForNewInput = true;
    }
    
  } catch (error) {
    handleError();
  } finally {
    setTimeout(() => {
      calculationInProgress = false;
    }, 100);
  }
}

/* Проценты */
function handlePercent() {
  if (errorState) return;
  
  const lastChar = expr.slice(-1);
  if (!expr || ['+', '−', '×', '÷', '('].includes(lastChar)) return;
  
  expr += '%';
  renderScreen();
}

/* Скобки */
function handleParen() {
  if (errorState) {
    expr = '';
    errorState = false;
    screen.style.color = '';
  }
  
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
  if (errorState) {
    expr = '';
    errorState = false;
    screen.style.color = '';
    renderScreen();
    return;
  }
  
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
  errorState = false;
  screen.style.color = '';
  renderScreen();
}

/* Обработка кликов по кнопкам */
keys.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-value], button[data-action]');
  if (!btn) return;
  
  const val = btn.dataset.value;
  const action = btn.dataset.action;

  // Вибрация если поддерживается
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
      if (errorState) {
        expr = '';
        errorState = false;
        screen.style.color = '';
      }
      
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
  if (errorState) return;
  
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
    // Ничего не делаем при ошибке выбора из истории
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
