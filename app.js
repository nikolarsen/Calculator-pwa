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

/* Показать ошибку */
function showError() {
  errorState = true;
  screen.style.color = 'var(--danger)';
}

/* Скрыть ошибку */
function hideError() {
  errorState = false;
  screen.style.color = '';
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

/* Проверка синтаксиса */
function validateExpression(displayExpr) {
  if (!displayExpr) return false;
  
  // Нельзя начинать с × или ÷
  if (displayExpr.startsWith('×') || displayExpr.startsWith('÷')) {
    return false;
  }
  
  // Проверка на деление на ноль
  if (displayExpr.includes('÷0') && !displayExpr.includes('÷0.')) {
    // Разрешаем ÷0.5 но запрещаем ÷0
    const parts = displayExpr.split('÷0');
    if (parts.length > 1) {
      const afterZero = parts[1];
      if (!afterZero || afterZero.startsWith(')') || /[+−×÷]/.test(afterZero[0])) {
        return false;
      }
    }
  }
  
  // Проверка на двойные операторы в конце
  if (/[+−×÷]=?$/.test(displayExpr)) {
    return false;
  }
  
  // Проверка на пустые скобки
  if (displayExpr.includes('()')) {
    return false;
  }
  
  return true;
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
  if (!validateExpression(displayExpr)) {
    return null;
  }
  
  const jsExpr = sanitizeForCalc(displayExpr);
  if (!jsExpr) return null;

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
      return parseFloat(result.toFixed(10));
    }
  } catch (error) {
    return null;
  }
}

/* Вставка символа с проверками */
function insertChar(ch) {
  if (errorState) {
    hideError();
  }
  
  // Автоматическое упрощение чисел вида 0.0, 5.0 перед оператором
  if (['+', '−', '×', '÷'].includes(ch)) {
    // Ищем последнее число в выражении
    const numbers = expr.match(/(\d+\.\d*0*)$/);
    if (numbers) {
      const lastNum = numbers[1];
      // Если число заканчивается на .0 или .00 и т.д., упрощаем его
      if (lastNum.includes('.') && /\.0+$/.test(lastNum)) {
        const simplifiedNum = lastNum.replace(/\.0+$/, '');
        expr = expr.slice(0, -lastNum.length) + simplifiedNum;
      }
    }
  }
  
  const lastChar = expr.slice(-1);
  const ops = ['+', '−', '×', '÷'];
  
  // Запрет начала с × или ÷
  if (!expr && (ch === '×' || ch === '÷')) {
    return;
  }
  
  // Запрет двойных операторов
  if (ops.includes(lastChar) && ops.includes(ch)) {
    expr = expr.slice(0, -1) + ch;
  } 
  // Добавление оператора после результата
  else if (readyForNewInput && ops.includes(ch)) {
    expr += ch;
    readyForNewInput = false;
  }
  else {
    expr += ch;
  }
  
  replaceLastNumber = false;
  renderScreen();
}

/* Обработка чисел с проверками */
function insertNumber(val) {
  if (errorState) {
    hideError();
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
  
  // Запрет множественных точек
  if (val === '.' && lastNum.includes('.')) return;
  
  // Автодобавление 0 перед точкой если нужно
  if (val === '.' && (!lastNum || /[+−×÷(]$/.test(expr))) {
    expr += '0.';
  } else {
    expr += val;
  }
  
  renderScreen();
}

/* Обработка равно */
function handleEquals() {
  if (calculationInProgress || !expr || errorState) return;
  
  calculationInProgress = true;
  
  try {
    const result = safeEval(expr);
    
    if (result === null) {
      showError();
      
      // Автоматически убираем ноль при делении на ноль
      if (expr.includes('÷0') && !expr.includes('÷0.')) {
        expr = expr.replace(/÷0$/, '÷').replace(/÷0([+−×÷)])/, '÷$1');
      }
      
      renderScreen();
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
    showError();
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
    hideError();
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
    hideError();
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
  hideError();
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
      insertNumber(val);
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

/* Обработка клавиатуры */
document.addEventListener('keydown', (e) => {
  const key = e.key;
  const keyActions = {
    'Enter': 'equals',
    '=': 'equals',
    'Escape': 'all-clear',
    'Delete': 'all-clear',
    'Backspace': 'delete',
    '%': 'percent',
    '(': 'paren',
    ')': 'paren'
  };
  
  const action = keyActions[key];
  let btn = null;
  
  if (action) {
    btn = document.querySelector(`[data-action="${action}"]`);
  } else if (/[0-9\.+\-*/]/.test(key)) {
    const displayKey = key.replace('*', '×').replace('/', '÷').replace('-', '−');
    btn = document.querySelector(`[data-value="${displayKey}"]`);
  }
  
  if (btn) {
    btn.click();
    e.preventDefault();
  }
});

/* Инициализация */
renderScreen();
