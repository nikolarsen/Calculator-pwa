const screen = document.getElementById('screen');
const historyEl = document.getElementById('history');
const keys = document.getElementById('keys');

let expr = '';
let readyForNewInput = false;
let replaceLastNumber = false;
let calculationInProgress = false;

// Функции для управления состоянием кнопок
function setButtonPressed(btn) {
  btn.classList.add('pressed');
}

function setButtonReleased(btn) {
  btn.classList.remove('pressed');
}

function releaseAllButtons() {
  document.querySelectorAll('.btn.pressed').forEach(btn => {
    btn.classList.remove('pressed');
  });
}

/* Отображение с доступностью */
function renderScreen() {
  const displayValue = expr || '0';
  screen.textContent = displayValue;
  screen.setAttribute('aria-label', `Экран: ${displayValue}`);
}

/* Добавление в историю с анимацией */
function addHistoryItem(input, result) {
  const el = document.createElement('div');
  el.className = 'line';
  el.textContent = `${input} = ${result}`;
  el.setAttribute('role', 'button');
  el.setAttribute('tabindex', '0');
  el.setAttribute('aria-label', `Вычисление: ${input} равно ${result}. Нажмите чтобы использовать результат`);
  
  // Анимация появления
  el.style.opacity = '0';
  el.style.transform = 'translateY(-10px)';
  
  historyEl.prepend(el);
  
  // Запуск анимации
  requestAnimationFrame(() => {
    el.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  });

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

  // Обработка процентов: 50 + 10% -> 50 + (50 * 10 / 100)
  s = s.replace(/(\d+(?:\.\d+)?)([\+\-\*\/])(\d+(?:\.\d+)?)%/g, '($1$2($1*$3/100))');
  
  // Обработка одиночных процентов: 50% -> 0.5
  s = s.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
  
  // Удаление небезопасных символов
  s = s.replace(/[^0-9+\-*/().]/g, '');
  
  return s;
}

/* Безопасное вычисление с улучшенной обработкой ошибок */
function safeEval(displayExpr) {
  const jsExpr = sanitizeForCalc(displayExpr);
  
  if (!jsExpr) return '0';
  
  // Защита от пустых выражений и скобок
  if (jsExpr.includes('()') || /[+\-*\/]$/.test(jsExpr)) {
    return 'Ошибка';
  }

  try {
    // Используем Function для безопасного вычисления
    const result = Function('"use strict";return(' + jsExpr + ')')();
    
    if (typeof result !== 'number' || !isFinite(result)) {
      return result === Infinity ? 'Бесконечность' : 'Ошибка';
    }
    
    // Умное округление для избежания floating point ошибок
    if (Number.isInteger(result)) {
      return result.toString();
    } else {
      // Округляем до 10 знаков, но убираем лишние нули
      return parseFloat(result.toFixed(10)).toString();
    }
  } catch (error) {
    console.error('Ошибка вычисления:', error);
    return 'Ошибка';
  }
}

/* Вставка символа с улучшенной логикой */
function insertChar(ch) {
  const lastChar = expr.slice(-1);
  const ops = ['+', '−', '×', '÷'];
  
  if (readyForNewInput) {
    expr = '';
    readyForNewInput = false;
  }
  
  // Замена оператора, если последний символ - оператор
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

/* Обработка равно с защитой от множественных вычислений */
function handleEquals() {
  if (calculationInProgress || !expr) return;
  
  calculationInProgress = true;
  
  try {
    screen.setAttribute('aria-live', 'polite');
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
    
    // Визуальный feedback при ошибке
    if (res === 'Ошибка' || res === 'Бесконечность') {
      screen.style.color = 'var(--danger)';
      setTimeout(() => {
        screen.style.color = '';
      }, 1000);
    }
    
  } catch (error) {
    console.error('Ошибка в handleEquals:', error);
    expr = 'Ошибка';
    renderScreen();
  } finally {
    setTimeout(() => {
      calculationInProgress = false;
      screen.setAttribute('aria-live', 'off');
    }, 100);
  }
}

/* Проценты с улучшенной логикой */
function handlePercent() {
  const lastChar = expr.slice(-1);
  if (!expr || ['+', '−', '×', '÷', '('].includes(lastChar)) return;
  
  expr += '%';
  renderScreen();
}

/* Умные скобки */
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

/* Удаление с проверкой */
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
    // Анимация очистки истории
    historyEl.style.opacity = '0.5';
    setTimeout(() => {
      historyEl.style.opacity = '1';
      historyEl.style.transition = 'opacity 0.3s ease';
    }, 300);
  }
  expr = '';
  readyForNewInput = false;
  replaceLastNumber = false;
  renderScreen();
}

/* Копирование результата */
function copyResult() {
  const result = screen.textContent;
  if (navigator.clipboard && result !== '0') {
    navigator.clipboard.writeText(result.replace(/[×÷−]/g, ch => {
      return { '×': '*', '÷': '/', '−': '-' }[ch] || ch;
    })).then(() => {
      // Визуальная обратная связь
      const originalColor = screen.style.color;
      screen.style.color = 'var(--accent)';
      setTimeout(() => {
        screen.style.color = originalColor;
      }, 500);
    }).catch(err => {
      console.error('Ошибка копирования:', err);
    });
  }
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
      
      // Добавление нуля перед точкой если нужно
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

// Поддержка клавиатуры для истории
historyEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    e.target.click();
  }
});

/* Долгое нажатие AC — очистить всё */
let acTimer = null;
const acBtn = document.querySelector('[data-action="all-clear"]');

function handleACLongPress() {
  acTimer = setTimeout(() => {
    handleAllClear(true);
    if (navigator.vibrate) navigator.vibrate(50);
  }, 700);
}

function cancelACLongPress() {
  if (acTimer) {
    clearTimeout(acTimer);
    acTimer = null;
  }
}

acBtn.addEventListener('touchstart', handleACLongPress);
acBtn.addEventListener('touchend', cancelACLongPress);
acBtn.addEventListener('touchcancel', cancelACLongPress);
acBtn.addEventListener('mousedown', handleACLongPress);
acBtn.addEventListener('mouseup', cancelACLongPress);
acBtn.addEventListener('mouseleave', cancelACLongPress);

/* НАДЕЖНАЯ АНИМАЦИЯ КНОПОК */
document.querySelectorAll('.btn').forEach(btn => {
  // Touch события
  btn.addEventListener('touchstart', (e) => {
    releaseAllButtons(); // Сначала сбрасываем все кнопки
    setButtonPressed(btn);
    if (navigator.vibrate) navigator.vibrate(10);
    e.preventDefault();
  }, { passive: false });
  
  btn.addEventListener('touchend', () => {
    setTimeout(() => setButtonReleased(btn), 150);
  });
  
  btn.addEventListener('touchcancel', () => {
    setButtonReleased(btn);
  });
  
  // Mouse события
  btn.addEventListener('mousedown', () => {
    releaseAllButtons(); // Сначала сбрасываем все кнопки
    setButtonPressed(btn);
    if (navigator.vibrate) navigator.vibrate(10);
  });
  
  btn.addEventListener('mouseup', () => {
    setTimeout(() => setButtonReleased(btn), 150);
  });
  
  btn.addEventListener('mouseleave', () => {
    setButtonReleased(btn);
  });
  
  // Отмена контекстного меню
  btn.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });
});

// Гарантированное освобождение всех кнопок при любом клике вне кнопок
document.addEventListener('click', (e) => {
  if (!e.target.closest('.btn')) {
    releaseAllButtons();
  }
});

// Освобождение кнопок при потере фокуса окном
window.addEventListener('blur', () => {
  releaseAllButtons();
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
    setButtonPressed(btn);
    btn.click();
    setTimeout(() => setButtonReleased(btn), 150);
    e.preventDefault();
  }
});

/* Двойной тап по экрану для копирования */
screen.addEventListener('dblclick', copyResult);

// Обработчик для доступности
screen.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    copyResult();
  }
});

/* Инициализация */
renderScreen();

// Установка заголовка для доступности
screen.setAttribute('role', 'status');
screen.setAttribute('aria-live', 'off');
