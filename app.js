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
const appIcons = document.querySelectorAll('input[name="appIcon"]');

let expr = '';
let readyForNewInput = false;
let replaceLastNumber = false;
let calculationInProgress = false;
let errorState = false;

/* НАСТРОЙКИ - Загрузка и применение */
function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('calcSettings')) || {};
  
  // Применяем тему
  if (settings.theme) {
    document.body.className = `theme-${settings.theme}`;
    themeSelect.value = settings.theme;
  }
  
  // Применяем размер шрифта экрана
  if (settings.screenFontSize) {
    screen.style.fontSize = `${settings.screenFontSize}px`;
    screenFontSize.value = settings.screenFontSize;
    screenSizeValue.textContent = `${settings.screenFontSize}px`;
  }
  
  // Применяем размер шрифта истории
  if (settings.historyFontSize) {
    historyEl.style.fontSize = `${settings.historyFontSize}px`;
    historyFontSize.value = settings.historyFontSize;
    historySizeValue.textContent = `${settings.historyFontSize}px`;
  }
  
  // Новые настройки
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
  
  if (settings.appIcon) {
    document.querySelector(`input[name="appIcon"][value="${settings.appIcon}"]`).checked = true;
    applyAppIcon(settings.appIcon);
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
    keyboardSounds: keyboardSounds.value,
    appIcon: document.querySelector('input[name="appIcon"]:checked').value
  };
  
  localStorage.setItem('calcSettings', JSON.stringify(settings));
  applySettings();
}

function applySettings() {
  // Тема
  document.body.className = `theme-${themeSelect.value}`;
  
  // Размер шрифта экрана
  screen.style.fontSize = `${screenFontSize.value}px`;
  screenSizeValue.textContent = `${screenFontSize.value}px`;
  
  // Размер шрифта истории
  historyEl.style.fontSize = `${historyFontSize.value}px`;
  historySizeValue.textContent = `${historyFontSize.value}px`;
  
  // Новые настройки
  applyButtonShape(buttonShape.value);
  applyButtonSize(buttonSize.value);
  applyButtonOpacity(buttonOpacity.value);
  applyAppIcon(document.querySelector('input[name="appIcon"]:checked').value);
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
  document.querySelector('input[name="appIcon"][value="default"]').checked = true;
  
  applySettings();
  localStorage.removeItem('calcSettings');
}

// Новые функции для применения настроек
function applyButtonShape(shape) {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.classList.remove('btn-shape-rounded', 'btn-shape-square', 'btn-shape-circle');
    btn.classList.add(`btn-shape-${shape}`);
  });
}

function applyButtonSize(size) {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.classList.remove('btn-size-compact', 'btn-size-standard', 'btn-size-large');
    btn.classList.add(`btn-size-${size}`);
  });
}

function applyButtonOpacity(opacity) {
  const buttons = document.querySelectorAll('.btn');
  buttons.forEach(btn => {
    btn.style.opacity = `${opacity}%`;
  });
}

function applyAppIcon(icon) {
  const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
  link.type = 'image/x-icon';
  link.rel = 'shortcut icon';
  
  switch(icon) {
    case 'modern':
      link.href = './icons/icon-modern.png';
      break;
    case 'science':
      link.href = './icons/icon-science.png';
      break;
    case 'simple':
      link.href = './icons/icon-simple.png';
      break;
    default:
      link.href = './icons/icon-192.png';
  }
  
  document.head.appendChild(link);
}

// Обработчики событий для настроек
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
  
  // Если это не число (выражение), не форматируем
  if (/[+−×÷()%]/.test(value)) {
    return value;
  }
  
  try {
    const num = parseFloat(value);
    if (isNaN(num)) return value;
    
    const absNum = Math.abs(num);
    const strNum = value.toString();
    
    // Если число слишком длинное
    if (strNum.length > 12) {
      // Очень большие числа
      if (absNum >= 1e12) {
        return num.toExponential(6).replace('e', 'E');
      }
      
      // Очень маленькие числа
      if (absNum > 0 && absNum < 1e-6) {
        return num.toExponential(6).replace('e', 'E');
      }
      
      // Числа с длинной дробной частью
      if (strNum.includes('.')) {
        const [integer, decimal] = strNum.split('.');
        if (integer.length > 8) {
          return num.toExponential(6).replace('e', 'E');
        }
        // Ограничиваем дробную часть
        if (decimal.length > 8) {
          return parseFloat(num.toFixed(8)).toString();
        }
      }
      
      // Обычные длинные числа - округляем
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
  
  // Форматируем значение для отображения
  displayValue = formatDisplayValue(displayValue);
  
  // Убираем предыдущие классы размера
  screen.className = 'screen';
  
  // Динамически меняем размер шрифта в зависимости от длины
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

  // Ограничение истории
  while (historyEl.children.length > 50) {
    historyEl.removeChild(historyEl.lastChild);
  }
  
  // Сохраняем историю после добавления
  saveHistory();
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
    
    const decimalPlacesValue = parseInt(decimalPlaces.value) || 10;
    
    if (Number.isInteger(result)) {
      return result;
    } else {
      // Используем настройку пользователя для округления
      return parseFloat(result.toFixed(decimalPlacesValue));
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
    localStorage.removeItem('calcHistory');
  }
  expr = '';
  readyForNewInput = false;
  replaceLastNumber = false;
  hideError();
  renderScreen();
}

/* Функция для воспроизведения звука */
function playKeySound() {
  try {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (error) {
    console.log('Audio not supported');
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
  
  // Звук если включен
  if (keyboardSounds.value === 'on') {
    playKeySound();
  }

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

/* Проверка обновлений */
function checkForUpdates() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then(registration => {
      registration.active.postMessage({ type: 'CHECK_UPDATES' });
    });
  }
}

/* Уведомление об обновлении */
function showUpdateNotification() {
  if (confirm('Доступна новая версия калькулятора. Обновить?')) {
    window.location.reload();
  }
}

/* Слушаем сообщения от Service Worker */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', event => {
    if (event.data.type === 'UPDATE_AVAILABLE') {
      showUpdateNotification();
    }
  });
}

/* Инициализация */
renderScreen();
loadHistory();
loadSettings();

/* Проверяем обновления при загрузке и раз в день */
checkForUpdates();
setInterval(checkForUpdates, 24 * 60 * 60 * 1000);
