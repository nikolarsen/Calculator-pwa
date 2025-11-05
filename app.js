const screen = document.getElementById('screen');
const historyEl = document.getElementById('history');
const keys = document.getElementById('keys');

// Элементы настроек
const settingsBtn = document.getElementById('settingsBtn');
const settingsModal = document.getElementById('settingsModal');
const themeSelect = document.getElementById('themeSelect');
const screenFontSize = document.getElementById('screenFontSize');
const historyFontSize = document.getElementById('historyFontSize');
const screenSizeValue = document.getElementById('screenSizeValue');
const historySizeValue = document.getElementById('historySizeValue');
const saveSettings = document.getElementById('saveSettings');
const closeSettings = document.getElementById('closeSettings');
const resetSettings = document.getElementById('resetSettings');

// Новые элементы настроек
const buttonShape = document.getElementById('buttonShape');
const buttonSize = document.getElementById('buttonSize');
const buttonOpacity = document.getElementById('buttonOpacity');
const opacityValue = document.getElementById('opacityValue');
const decimalPlaces = document.getElementById('decimalPlaces');
const keyboardSounds = document.getElementById('keyboardSounds');

let expr = '';
let readyForNewInput = false;
let replaceLastNumber = false;
let calculationInProgress = false;
let errorState = false;

// ФИКСАЦИЯ ПОРТРЕТНОЙ ОРИЕНТАЦИИ
function initializeOrientation() {
  // Проверяем ориентацию при загрузке
  if (window.innerHeight < window.innerWidth) {
    showLandscapeWarning();
  }
  
  // Слушаем изменения ориентации
  window.addEventListener('resize', handleOrientationChange);
  window.addEventListener('orientationchange', handleOrientationChange);
}

function handleOrientationChange() {
  if (window.innerHeight < window.innerWidth) {
    showLandscapeWarning();
  } else {
    hideLandscapeWarning();
  }
}

function showLandscapeWarning() {
  let warning = document.getElementById('landscape-warning');
  if (!warning) {
    warning = document.createElement('div');
    warning.id = 'landscape-warning';
    warning.innerHTML = `
      <div style="
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: var(--bg);
        color: var(--text);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        z-index: 10000;
        font-size: 24px;
        text-align: center;
        padding: 20px;
      ">
        <div style="font-size: 48px; margin-bottom: 20px;">📱</div>
        <div>Пожалуйста, поверните устройство в портретный режим</div>
        <div style="font-size: 16px; margin-top: 10px; opacity: 0.7;">
          Калькулятор работает только в портретной ориентации
        </div>
      </div>
    `;
    document.body.appendChild(warning);
  }
  warning.style.display = 'flex';
  
  document.querySelector('.calculator').style.display = 'none';
  document.querySelector('.settings-btn').style.display = 'none';
}

function hideLandscapeWarning() {
  const warning = document.getElementById('landscape-warning');
  if (warning) {
    warning.style.display = 'none';
  }
  
  document.querySelector('.calculator').style.display = 'flex';
  document.querySelector('.settings-btn').style.display = 'flex';
}

/* НАСТРОЙКИ - Загрузка и применение */
function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('calcSettings')) || {};
  
  if (settings.theme) {
    document.body.className = `theme-${settings.theme}`;
    themeSelect.value = settings.theme;
  }
  
  if (settings.screenFontSize) {
    screen.style.fontSize = `${settings.screenFontSize}px`;
    screenFontSize.value = settings.screenFontSize;
    screenSizeValue.textContent = `${settings.screenFontSize}px`;
  }
  
  if (settings.historyFontSize) {
    historyEl.style.fontSize = `${settings.historyFontSize}px`;
    historyFontSize.value = settings.historyFontSize;
    historySizeValue.textContent = `${settings.historyFontSize}px`;
  }
  
  if (settings.buttonShape) {
    buttonShape.value = settings.buttonShape;
    applyButtonShape(settings.buttonShape);
  }
  
  if (settings.buttonSize) {
    buttonSize.value = settings.buttonSize;
    applyButtonSize(settings.buttonSize);
  }
  
  if (settings.buttonOpacity) {
    buttonOpacity.value = settings.buttonOpacity;
    opacityValue.textContent = `${settings.buttonOpacity}%`;
    applyButtonOpacity(settings.buttonOpacity);
  }
  
  if (settings.decimalPlaces) {
    decimalPlaces.value = settings.decimalPlaces;
  }
  
  if (settings.keyboardSounds) {
    keyboardSounds.value = settings.keyboardSounds;
  }
}

function saveSettingsToStorage() {
  const settings = {
    theme: themeSelect.value,
    screenFontSize: parseInt(screenFontSize.value),
    historyFontSize: parseInt(historyFontSize.value),
    buttonShape: buttonShape.value,
    buttonSize: buttonSize.value,
    buttonOpacity: parseInt(buttonOpacity.value),
    decimalPlaces: decimalPlaces.value,
    keyboardSounds: keyboardSounds.value
  };
  
  localStorage.setItem('calcSettings', JSON.stringify(settings));
  applySettings();
}

function applySettings() {
  document.body.className = `theme-${themeSelect.value}`;
  
  screen.style.fontSize = `${screenFontSize.value}px`;
  screenSizeValue.textContent = `${screenFontSize.value}px`;
  
  historyEl.style.fontSize = `${historyFontSize.value}px`;
  historySizeValue.textContent = `${historyFontSize.value}px`;
  
  applyButtonShape(buttonShape.value);
  applyButtonSize(buttonSize.value);
  applyButtonOpacity(buttonOpacity.value);
}

function resetSettingsToDefault() {
  themeSelect.value = 'dark';
  screenFontSize.value = '52';
  historyFontSize.value = '22';
  buttonShape.value = 'rounded';
  buttonSize.value = 'standard';
  buttonOpacity.value = '85';
  decimalPlaces.value = '10';
  keyboardSounds.value = 'off';
  
  applySettings();
  localStorage.removeItem('calcSettings');
}

function applyButtonShape(shape) {
  const buttons = document.querySelectorAll('.btn:not(.settings-buttons .btn)');
  buttons.forEach(btn => {
    btn.classList.remove('btn-shape-rounded', 'btn-shape-square', 'btn-shape-circle');
    btn.classList.add(`btn-shape-${shape}`);
  });
}

function applyButtonSize(size) {
  const buttons = document.querySelectorAll('.btn:not(.settings-buttons .btn)');
  buttons.forEach(btn => {
    btn.classList.remove('btn-size-compact', 'btn-size-standard', 'btn-size-large');
    btn.classList.add(`btn-size-${size}`);
  });
}

function applyButtonOpacity(opacity) {
  const buttons = document.querySelectorAll('.btn:not(.settings-buttons .btn)');
  buttons.forEach(btn => {
    btn.style.opacity = `${opacity}%`;
  });
}

screenFontSize.addEventListener('input', function() {
  screenSizeValue.textContent = `${this.value}px`;
});

historyFontSize.addEventListener('input', function() {
  historySizeValue.textContent = `${this.value}px`;
});

buttonOpacity.addEventListener('input', function() {
  opacityValue.textContent = `${this.value}%`;
});

settingsBtn.addEventListener('click', () => {
  settingsModal.classList.add('active');
});

closeSettings.addEventListener('click', () => {
  settingsModal.classList.remove('active');
});

settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    settingsModal.classList.remove('active');
  }
});

saveSettings.addEventListener('click', () => {
  saveSettingsToStorage();
  settingsModal.classList.remove('active');
});

resetSettings.addEventListener('click', resetSettingsToDefault);

/* СОХРАНЕНИЕ И ЗАГРУЗКА ИСТОРИИ */
function saveHistory() {
  const historyItems = [];
  historyEl.querySelectorAll('.line').forEach(line => {
    historyItems.push(line.textContent);
  });
  localStorage.setItem('calcHistory', JSON.stringify(historyItems));
}

function loadHistory() {
  const saved = localStorage.getItem('calcHistory');
  if (saved) {
    try {
      const historyItems = JSON.parse(saved);
      historyItems.forEach(item => {
        const el = document.createElement('div');
        el.className = 'line';
        el.textContent = item;
        el.setAttribute('role', 'button');
        el.setAttribute('tabindex', '0');
        el.setAttribute('aria-label', `Вычисление: ${item}. Нажмите чтобы использовать результат`);
        historyEl.appendChild(el);
      });
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    }
  }
}

/* Умное форматирование чисел для экрана */
function formatDisplayValue(value) {
  if (!value || value === '0') return '0';
  
  if (/[+−×÷()%]/.test(value)) {
    return value;
  }
  
  try {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    const absNum = Math.abs(num);
    const strNum = value.toString();
    
    if (strNum.length > 12) {
      if (absNum >= 1e12) {
        return num.toExponential(6).replace('e', 'E');
      }
      
      if (absNum > 0 && absNum < 1e-6) {
        return num.toExponential(6).replace('e', 'E');
      }
      
      if (strNum.includes('.')) {
        const [integer, decimal] = strNum.split('.');
        if (integer.length > 8) {
          return num.toExponential(6).replace('e', 'E');
        }
        if (decimal.length > 8) {
          return parseFloat(num.toFixed(8)).toString();
        }
      }
      
      return parseFloat(num.toFixed(10)).toString();
    }
    
    return value;
  } catch (error) {
    return value;
  }
}

/* Отображение с доступностью и авто-масштабированием */
function renderScreen() {
  let displayValue = expr || '0';
  
  displayValue = formatDisplayValue(displayValue);
  
  screen.className = 'screen';
  
  if (displayValue.length > 20) {
    screen.classList.add('extremely-long-number');
  } else if (displayValue.length > 15) {
    screen.classList.add('very-long-number');
  } else if (displayValue.length > 12) {
    screen.classList.add('long-number');
  }
  
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

  while (historyEl.children.length > 50) {
    historyEl.removeChild(historyEl.lastChild);
  }
  
  saveHistory();
}

/* Проверка синтаксиса - ПОЛНАЯ ЗАЩИТА */
function validateExpression(displayExpr) {
  if (!displayExpr) return false;
  
  // Нельзя начинать с × или ÷
  if (displayExpr.startsWith('×') || displayExpr.startsWith('÷')) {
    return false;
  }
  
  // Строгая проверка на деление на ноль
  if (displayExpr.match(/÷\s*-?\s*0/)) {
    const zeroDivisionMatches = displayExpr.match(/÷\s*(-?\s*0[^.]?)/g);
    if (zeroDivisionMatches) {
      for (const match of zeroDivisionMatches) {
        const afterZero = match.replace(/÷\s*(-?\s*0)/, '');
        if (afterZero && !afterZero.startsWith('.') && !/[)+×÷]/.test(afterZero[0])) {
          return false;
        }
      }
    }
    return false;
  }
  
  // Проверка на двойные операторы в конце
  if (/[+−×÷]=?$/.test(displayExpr)) {
    return false;
  }
  
  // Проверка на пустые скобки
  if (displayExpr.includes('()')) {
    return false;
  }
  
  // После ( нельзя ставить × или ÷
  if (displayExpr.includes('(×') || displayExpr.includes('(÷')) {
    return false;
  }
  
  // Проверка на незакрытые скобки
  const open = (displayExpr.match(/\(/g) || []).length;
  const close = (displayExpr.match(/\)/g) || []).length;
  if (open !== close) {
    return false;
  }
  
  // Запрет невалидных комбинаций операторов
  if (/([+×÷])\1/.test(displayExpr)) {
    return false;
  }
  
  if (/[×÷][+×÷]/.test(displayExpr)) {
    return false;
  }
  
  // Запрет тройных операторов
  if (/[+−×÷]{3,}/.test(displayExpr)) {
    return false;
  }
  
  // Запрет операторов в конце
  if (/[+×÷]$/.test(displayExpr)) {
    return false;
  }
  
  // Запрет конструкций типа /-6/-9
  if (/[×÷]-?\d+[×÷]/.test(displayExpr)) {
    return false;
  }
  
  // Запрет двух операторов деления/умножения с минусом между ними
  if (/[×÷]-[×÷]/.test(displayExpr)) {
    return false;
  }
  
  // Запрет бессмысленных выражений с множественными нулями
  if (/[×÷]-?0[×÷]-?0/.test(displayExpr)) {
    return false;
  }
  
  // Запрет множественных унарных минусов
  if (/−−\d/.test(displayExpr)) {
    return false;
  }
  
  // Запрет ведущих нулей
  if (/\D0\d/.test(displayExpr)) {
    return false;
  }
  
  return true;
}

/* Подготовка выражения - ПРОФЕССИОНАЛЬНЫЕ ПРОЦЕНТЫ */
function sanitizeForCalc(displayExpr) {
  if (!displayExpr) return '';
  
  let s = displayExpr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/\s/g, '');

  // ПРОФЕССИОНАЛЬНАЯ ЛОГИКА ПРОЦЕНТОВ
  // Для + и -: процент от предыдущего числа
  s = s.replace(/(\d+(?:\.\d+)?)([\+\-])(\d+(?:\.\d+)?)%/g, '($1$2($1*$3/100))');
  // Для × и ÷: процент как обычное число
  s = s.replace(/(\d+(?:\.\d+)?)([\*\/])(\d+(?:\.\d+)?)%/g, '($1$2($3/100))');
  // Одиночные проценты
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
    
    if (Math.abs(result) > 1e15) return null;
    if (Math.abs(result) < 1e-15 && result !== 0) return 0;
    
    const decimalPlacesValue = parseInt(decimalPlaces.value) || 10;
    
    if (Number.isInteger(result)) {
      return result;
    } else {
      return parseFloat(result.toFixed(decimalPlacesValue));
    }
  } catch (error) {
    return null;
  }
}

/* Вставка символа с ПРОФЕССИОНАЛЬНОЙ ПРОВЕРКОЙ */
function insertChar(ch) {
  if (errorState) {
    hideError();
  }
  
  // СТРОГИЙ ЗАПРЕТ: нельзя начинать выражение с × или ÷
  if (!expr && (ch === '×' || ch === '÷')) {
    return;
  }
  
  const lastChar = expr.slice(-1);
  const ops = ['+', '−', '×', '÷'];
  
  // После ( нельзя ставить × или ÷
  if (lastChar === '(' && (ch === '×' || ch === '÷')) {
    return;
  }
  
  // После унарного минуса нельзя ставить × или ÷
  if (lastChar === '−' && (ch === '×' || ch === '÷')) {
    return;
  }
  
  // ПРЕДВАРИТЕЛЬНАЯ ПРОВЕРКА ПРИ ВВОДЕ
  const potentialExpr = expr + ch;
  
  // Запрет деления на ноль при вводе
  if (potentialExpr.match(/÷\s*-?\s*0/) && !potentialExpr.match(/÷\s*-?\s*0\./)) {
    return;
  }
  
  // Запрет невалидных комбинаций операторов при вводе
  if (/([+×÷])\1/.test(potentialExpr)) {
    return;
  }
  
  if (/[×÷][+×÷]/.test(potentialExpr)) {
    return;
  }
  
  // Запрет конструкций типа /-6/-9 при вводе
  if (/[×÷]-?\d+[×÷]/.test(potentialExpr)) {
    return;
  }
  
  // Обработка операторов с разрешением унарных минусов
  if (ops.includes(lastChar) && ops.includes(ch)) {
    const operatorsMatch = expr.match(/[+−×÷]+$/);
    const currentOperators = operatorsMatch ? operatorsMatch[0] : '';
    const newSequence = currentOperators + ch;
    
    // Запрещаем последовательности из 3+ операторов
    if (newSequence.length >= 3) {
      return;
    }
    
    // Запрет множественных унарных минусов
    if (currentOperators.includes('−') && ch === '−') {
      return;
    }
    
    const validCombinations = ['+−', '−+', '×−', '÷−'];
    const currentCombination = lastChar + ch;
    
    if (validCombinations.includes(currentCombination)) {
      expr += ch;
    } else {
      expr = expr.slice(0, -1) + ch;
    }
  } 
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

/* Обработка чисел с ПРОФЕССИОНАЛЬНОЙ АВТОТОЧКОЙ */
function insertNumber(val) {
  if (errorState) {
    hideError();
  }
  
  // ЕСЛИ readyForNewInput И НЕТ ОПЕРАТОРА - очищаем выражение
  if (readyForNewInput && !/[+−×÷]$/.test(expr)) {
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
  
  // ПРОФЕССИОНАЛЬНАЯ АВТОТОЧКА ПОСЛЕ НУЛЯ
  if (val === '0' && lastNum === '0') {
    // Если уже есть один ноль и вводим еще ноль - добавляем точку
    expr += '.';
    renderScreen();
    return;
  }
  
  // Автодобавление 0 перед точкой если нужно
  if (val === '.' && (!lastNum || /[+−×÷(]$/.test(expr))) {
    expr += '0.';
  } else {
    expr += val;
  }
  
  readyForNewInput = false;
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
      
      if (expr.includes('÷0') && !expr.includes('÷0.')) {
        expr = expr.replace(/÷0$/, '÷').replace(/÷0([+−×÷)])/, '÷$1');
      }
      
      renderScreen();
    } else {
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

/* Очистка - ПРОФЕССИОНАЛЬНАЯ С ВИЗУАЛЬНОЙ ОБРАТНОЙ СВЯЗЬЮ */
function handleAllClear(longPress = false) {
  if (longPress) {
    // Визуальная обратная связь при очистке истории
    screen.textContent = 'История очищена';
    screen.style.color = 'var(--accent)';
    
    setTimeout(() => {
      historyEl.innerHTML = '';
      localStorage.removeItem('calcHistory');
      expr = '';
      hideError();
      renderScreen();
    }, 800);
  } else {
    expr = '';
    readyForNewInput = false;
    replaceLastNumber = false;
    hideError();
    renderScreen();
  }
}

/* Упрощенная вибрация для мобильных */
function vibrate() {
  if (navigator.vibrate && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
    navigator.vibrate(10);
  }
}

/* Обработка кликов по кнопкам */
keys.addEventListener('click', (e) => {
  const btn = e.target.closest('button[data-value], button[data-action]');
  if (!btn) return;
  
  const val = btn.dataset.value;
  const action = btn.dataset.action;

  vibrate();

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
    const ops = ['+', '−', '×', '÷'];
    
    if (!expr || ops.includes(lastChar) || lastChar === '(') {
      if (text.startsWith('−') && !expr) {
        expr = text;
      }
      else if (text.startsWith('−') && ops.includes(lastChar)) {
        expr += `(${text})`;
      }
      else {
        expr += text;
      }
    }
    else {
      if (text.startsWith('−')) {
        expr = expr.replace(/([0-9.]+)$/, `(${text})`);
      } else {
        expr = expr.replace(/([0-9.]+)$/, text);
      }
    }
    
    replaceLastNumber = true;
    readyForNewInput = false;
    renderScreen();
    
    vibrate();
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

/* Вибрация для кнопок */
document.querySelectorAll('.btn').forEach(btn => {
  btn.addEventListener('mousedown', () => {
    vibrate();
  });
  
  btn.addEventListener('touchstart', () => {
    vibrate();
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

/* Инициализация при загрузке */
document.addEventListener('DOMContentLoaded', () => {
  loadSettings();
  loadHistory();
  renderScreen();
  initializeOrientation();
});
