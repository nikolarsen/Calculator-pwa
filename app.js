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

// Звуковая система - ПРОСТАЯ И РАБОЧАЯ
let soundEnabled = false;

function playSound() {
    if (!soundEnabled) return;
    
    try {
        // Создаем простой звук через Web Audio API
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 600;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.1);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
        console.log('Audio error:', error);
    }
}

let expr = '';
let readyForNewInput = false;
let replaceLastNumber = false;
let calculationInProgress = false;
let errorState = false;

// Создаем элемент подсказки для истории
const historyHint = document.createElement('div');
historyHint.className = 'history-hint';
historyHint.textContent = 'Подсказка: Удерживайте AC для очистки истории';
historyHint.setAttribute('aria-label', 'Подсказка: Удерживайте AC для очистки истории');

/* ===== НАСТРОЙКИ - Загрузка и применение ===== */
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('calcSettings')) || {};
    
    // Устанавливаем значения по умолчанию если их нет в настройках
    if (!settings.theme) settings.theme = 'dark';
    if (!settings.screenFontSize) settings.screenFontSize = 52;
    if (!settings.historyFontSize) settings.historyFontSize = 22;
    if (!settings.buttonShape) settings.buttonShape = 'rounded';
    if (!settings.buttonSize) settings.buttonSize = 'standard';
    if (!settings.buttonOpacity) settings.buttonOpacity = 85;
    if (!settings.decimalPlaces) settings.decimalPlaces = '10';
    if (!settings.keyboardSounds) settings.keyboardSounds = 'off';
    
    // Применяем настройки
    themeSelect.value = settings.theme;
    screenFontSize.value = settings.screenFontSize;
    historyFontSize.value = settings.historyFontSize;
    buttonShape.value = settings.buttonShape;
    buttonSize.value = settings.buttonSize;
    buttonOpacity.value = settings.buttonOpacity;
    decimalPlaces.value = settings.decimalPlaces;
    keyboardSounds.value = settings.keyboardSounds;
    
    applySettings();
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
    
    soundEnabled = keyboardSounds.value === 'on';
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

/* ===== УПРАВЛЕНИЕ ПОДСКАЗКОЙ ИСТОРИИ ===== */
function updateHistoryHint() {
    const hasHistory = historyEl.querySelectorAll('.line').length > 0;
    
    if (hasHistory) {
        if (historyEl.contains(historyHint)) {
            historyHint.style.display = 'none';
        }
    } else {
        if (!historyEl.contains(historyHint)) {
            historyEl.appendChild(historyHint);
        }
        historyHint.style.display = 'flex';
    }
}

// Обработчики изменений настроек в реальном времени
screenFontSize.addEventListener('input', function() {
    screenSizeValue.textContent = `${this.value}px`;
});

historyFontSize.addEventListener('input', function() {
    historySizeValue.textContent = `${this.value}px`;
});

buttonOpacity.addEventListener('input', function() {
    opacityValue.textContent = `${this.value}%`;
});

/* ===== УПРАВЛЕНИЕ МОДАЛЬНЫМ ОКНОМ ===== */
settingsBtn.addEventListener('click', () => {
    settingsModal.classList.add('active');
    playSound();
});

closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    playSound();
});

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('active');
    }
});

saveSettings.addEventListener('click', () => {
    saveSettingsToStorage();
    settingsModal.classList.remove('active');
    playSound();
});

resetSettings.addEventListener('click', () => {
    resetSettingsToDefault();
    playSound();
});

/* ===== СОХРАНЕНИЕ И ЗАГРУЗКА ИСТОРИИ ===== */
function saveHistory() {
    const historyItems = [];
    historyEl.querySelectorAll('.line').forEach(line => {
        historyItems.push(line.textContent);
    });
    localStorage.setItem('calcHistory', JSON.stringify(historyItems));
    updateHistoryHint();
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
    updateHistoryHint();
}

/* ===== УМНОЕ ФОРМАТИРОВАНИЕ ЧИСЕЛ ===== */
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

/* ===== ОТОБРАЖЕНИЕ ЭКРАНА ===== */
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

function showError() {
    errorState = true;
    screen.style.color = 'var(--danger)';
}

function hideError() {
    errorState = false;
    screen.style.color = '';
}

/* ===== ДОБАВЛЕНИЕ В ИСТОРИЮ ===== */
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
    updateHistoryHint();
}

/* ===== УЛУЧШЕННАЯ ВАЛИДАЦИЯ ОПЕРАТОРОВ ===== */
function canAddOperator(char, currentExpr) {
    const lastChar = currentExpr ? currentExpr.slice(-1) : '';
    const operators = ['+', '−', '×', '÷'];
    
    // Разрешаем начинать выражение с унарного минуса
    if (!currentExpr && char === '−') {
        return true;
    }
    
    // Нельзя добавлять оператор если:
    // 1. Выражение пустое (кроме унарного минуса - уже обработано выше)
    if (!currentExpr) return false;
    
    // 2. Последний символ уже оператор (кроме унарного минуса)
    if (operators.includes(lastChar)) {
        return char === '−'; // Разрешаем только унарный минус после оператора
    }
    
    // 3. Последний символ открывающая скобка (кроме унарного минуса)
    if (lastChar === '(' && char !== '−') {
        return false;
    }
    
    // 4. После точки нельзя оператор (кроме унарного минуса)
    if (lastChar === '.' && char !== '−') {
        return false;
    }
    
    return true;
}

/* ===== ПРОВЕРКА СИНТАКСИСА - УСИЛЕННАЯ ВАЛИДАЦИЯ ===== */
function validateExpression(displayExpr) {
    if (!displayExpr) return false;
    
    const validations = [
        // Нельзя начинать с × или ÷ или + (но можно с унарного минуса)
        () => !/^[×÷+]/.test(displayExpr),
        
        // Строгая проверка на деление на ноль
        () => {
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
            return true;
        },
        
        // Проверка на двойные операторы в конце
        () => !/[+−×÷]=?$/.test(displayExpr),
        
        // Проверка на пустые скобки
        () => !displayExpr.includes('()'),
        
        // После ( нельзя ставить × или ÷ или + (но можно унарный минус)
        () => !displayExpr.includes('(×') && !displayExpr.includes('(÷') && !displayExpr.includes('(+'),
        
        // Проверка на незакрытые скобки
        () => {
            const open = (displayExpr.match(/\(/g) || []).length;
            const close = (displayExpr.match(/\)/g) || []).length;
            return open === close;
        },
        
        // ЗАПРЕТ: множественные операторы (кроме унарного минуса)
        () => !/([+×÷][+×÷])/.test(displayExpr),
        
        // ЗАПРЕТ: операторы в конце
        () => !/[+×÷]$/.test(displayExpr),
        
        // ЗАПРЕТ: два оператора деления/умножения подряд
        () => !/[×÷][×÷]/.test(displayExpr),
        
        // ЗАПРЕТ: оператор сразу после открывающей скобки (кроме унарного минуса)
        () => !/\([+×÷]/.test(displayExpr),
        
        // ЗАПРЕТ: бессмысленные выражения с множественными нулями
        () => !/[×÷]-?0[×÷]-?0/.test(displayExpr),
        
        // ЗАПРЕТ: множественные унарные минусы (больше одного подряд)
        () => !/−−\d/.test(displayExpr),
  // Запрещаем ведущие нули типа "05", но разрешаем "0.5" и "0.0004"
() => {
    // Разрешаем выражения с десятичными дробями
    if (displayExpr.includes('.')) return true;
    // Запрещаем только целые числа с ведущими нулями
    return !/\D0\d/.test(displayExpr);
}
    // Разрешаем выражения с десятичными дробями
    if (displayExpr.includes('.')) return true;
    // Запрещаем только целые числа с ведущими нулями
    return !/\D0\d/.test(displayExpr);
}
      
        // ЗАПРЕТ: деление сразу после деления
        () => !/÷\s*÷/.test(displayExpr),
        
        // ЗАПРЕТ: выражения, заканчивающиеся на оператор
        () => !/[+×÷−]$/.test(displayExpr),
        
        // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: нельзя два оператора подряд (кроме унарного минуса)
        () => !/([+×÷][+×÷])/.test(displayExpr),
        
        // ДОПОЛНИТЕЛЬНАЯ ПРОВЕРКА: оператор после точки
        () => !/\.[+×÷]/.test(displayExpr)
    ];
    
    return validations.every(validation => validation());
}

/* ===== ПОДГОТОВКА ВЫРАЖЕНИЯ - ПРОФЕССИОНАЛЬНЫЕ ПРОЦЕНТЫ ===== */
function sanitizeForCalc(displayExpr) {
    if (!displayExpr) return '';
    
    let s = displayExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\s/g, '');

    // ПРОФЕССИОНАЛЬНАЯ ЛОГИКА ПРОЦЕНТОВ
    s = s.replace(/(\d+(?:\.\d+)?)([\+\-])(\d+(?:\.\d+)?)%/g, '($1$2($1*$3/100))');
    s = s.replace(/(\d+(?:\.\d+)?)([\*\/])(\d+(?:\.\d+)?)%/g, '($1$2($3/100))');
    s = s.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
    
    s = s.replace(/[^0-9+\-*/().]/g, '');
    
    return s;
}

/* ===== НОРМАЛИЗАЦИЯ ВЫРАЖЕНИЯ ===== */
function normalizeExpression(expr) {
    let normalized = expr
        .replace(/([×÷+])−/g, '$1~')
        .replace(/^−/, '~')
        .replace(/\(−/g, '(~');
    
    return normalized;
}

/* ===== БЕЗОПАСНОЕ ВЫЧИСЛЕНИЕ ===== */
function safeEval(displayExpr) {
    if (!validateExpression(displayExpr)) {
        return null;
    }
    
    let jsExpr = sanitizeForCalc(displayExpr);
    if (!jsExpr) return null;

    jsExpr = normalizeExpression(jsExpr)
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/~/g, '-u')
        .replace(/-u/g, '-');

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

/* ===== ВСТАВКА СИМВОЛА - ИСПРАВЛЕННАЯ ВАЛИДАЦИЯ ОПЕРАТОРОВ ===== */
function insertChar(ch) {
    if (errorState) {
        hideError();
    }
    
    // Проверяем можно ли добавить оператор
    if (['+', '−', '×', '÷'].includes(ch)) {
        if (!canAddOperator(ch, expr)) {
            return;
        }
    }
    
    const lastChar = expr.slice(-1);
    const ops = ['+', '−', '×', '÷'];
    
    // СТРОГИЙ ЗАПРЕТ: нельзя начинать выражение с операторов ×÷+
    // НО разрешаем начинать с унарного минуса
    if (!expr && (ch === '×' || ch === '÷' || ch === '+')) {
        return;
    }
    
    // После ( нельзя ставить × или ÷ или + (но можно унарный минус)
    if (lastChar === '(' && (ch === '×' || ch === '÷' || ch === '+')) {
        return;
    }
    
    // Обработка операторов после операторов
    if (ops.includes(lastChar) && ops.includes(ch)) {
        // Разрешаем только унарный минус после других операторов
        if (ch === '−') {
            // Но запрещаем двойной унарный минус
            if (lastChar === '−') return;
            expr += ch;
        } else {
            // Заменяем предыдущий оператор на новый
            expr = expr.slice(0, -1) + ch;
        }
        renderScreen();
        return;
    }
    
    // Проверка всей комбинации при вводе
    const newExpr = expr + ch;
    
    // Запрет деления на ноль при вводе
    if (newExpr.includes('÷0') && !newExpr.includes('÷0.')) {
        return;
    }
    
    // Обработка readyForNewInput
    if (readyForNewInput && ops.includes(ch)) {
        expr += ch;
        readyForNewInput = false;
    } else {
        expr += ch;
    }
    
    replaceLastNumber = false;
    renderScreen();
}

/* ===== ОБРАБОТКА ЧИСЕЛ С ПРОФЕССИОНАЛЬНОЙ АВТОТОЧКОЙ ===== */
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
        expr += '.';
        renderScreen();
        return;
    }
    
    // Запрет ведущих нулей (кроме 0.xxx)
    if (val !== '.' && lastNum === '0' && !lastNum.includes('.')) {
        expr = expr.slice(0, -1) + val;
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

/* ===== ОСНОВНЫЕ ОПЕРАЦИИ ===== */
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

function handlePercent() {
    if (errorState) return;
    
    const lastChar = expr.slice(-1);
    if (!expr || ['+', '−', '×', '÷', '('].includes(lastChar)) return;
    
    expr += '%';
    renderScreen();
}

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

function handleDelete() {
    if (errorState) {
        hideError();
    }
    
    if (expr.length > 0) {
        expr = expr.slice(0, -1);
        renderScreen();
    }
}

function handleAllClear(longPress = false) {
    if (longPress) {
        screen.textContent = 'Удаление';
        screen.style.color = 'var(--accent)';
        
        setTimeout(() => {
            historyEl.innerHTML = '';
            localStorage.removeItem('calcHistory');
            expr = '';
            hideError();
            renderScreen();
            updateHistoryHint();
        }, 800);
    } else {
        expr = '';
        readyForNewInput = false;
        replaceLastNumber = false;
        hideError();
        renderScreen();
    }
}

/* ===== ВИБРАЦИЯ ===== */
function vibrate() {
    if (navigator.vibrate && /Android|iPhone|iPad/i.test(navigator.userAgent)) {
        navigator.vibrate(10);
    }
}

/* ===== ОБРАБОТКА КЛИКОВ ПО КНОПКАМ ===== */
keys.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-value], button[data-action]');
    if (!btn) return;
    
    const val = btn.dataset.value;
    const action = btn.dataset.action;

    vibrate();
    playSound();

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

/* ===== ИСТОРИЯ — ВЫБОР РЕЗУЛЬТАТА ===== */
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
        playSound();
    } catch (error) {
        // Ничего не делаем при ошибке выбора из истории
    }
});

/* ===== ДОЛГОЕ НАЖАТИЕ AC ===== */
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

/* ===== ОБРАБОТКА КЛАВИАТУРЫ ===== */
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

/* ===== ИНИЦИАЛИЗАЦИЯ ===== */
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadHistory();
    renderScreen();
    updateHistoryHint();
});
