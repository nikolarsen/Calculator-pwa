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
const buttonOpacity = document.getElementById('buttonOpacity');
const opacityValue = document.getElementById('opacityValue');
const decimalPlaces = document.getElementById('decimalPlaces');

// ЗВУКОВАЯ СИСТЕМА - Web Audio API
let audioContext = null;
let clickBuffer = null;

function initAudio() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Создаем приятный щелчок (заменить весь этот блок)
        const duration = 0.08; // Короче
        const sampleRate = audioContext.sampleRate;
        const frameCount = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, frameCount, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Мягкий синусоидальный звук вместо белого шума
        for (let i = 0; i < frameCount; i++) {
            const t = i / sampleRate;
            const frequency = 600; // Более низкий и приятный тон
            const envelope = Math.exp(-t * 40); // Быстрое затухание
            data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.3; // Тише
        }
        
        clickBuffer = buffer;
    } catch (e) {
        console.log('Audio not supported');
    }
}

function playSound() {
    try {
        if (!audioContext) {
            initAudio();
        }
        
        if (audioContext && clickBuffer) {
            const source = audioContext.createBufferSource();
            source.buffer = clickBuffer;
            
            const gainNode = audioContext.createGain();
            gainNode.gain.setValueAtTime(0.08, audioContext.currentTime); // ЕЩЕ ТИШЕ
            gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.08);
            
            source.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            source.start();
        }
    } catch (error) {
        // Игнорируем ошибки
    }
}

// ВИБРАЦИЯ
function playVibration() {
    try {
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    } catch (error) {
        // Игнорируем ошибки вибрации
    }
}

function handleButtonClick() {
    playSound();
    playVibration();
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
    if (!settings.buttonOpacity) settings.buttonOpacity = 85;
    if (!settings.decimalPlaces) settings.decimalPlaces = '10';
    
    // Применяем настройки
    themeSelect.value = settings.theme;
    screenFontSize.value = settings.screenFontSize;
    historyFontSize.value = settings.historyFontSize;
    buttonShape.value = settings.buttonShape;
    buttonOpacity.value = settings.buttonOpacity;
    decimalPlaces.value = settings.decimalPlaces;
    
    applySettings();
}

function saveSettingsToStorage() {
    const settings = {
        theme: themeSelect.value,
        screenFontSize: parseInt(screenFontSize.value),
        historyFontSize: parseInt(historyFontSize.value),
        buttonShape: buttonShape.value,
        buttonOpacity: parseInt(buttonOpacity.value),
        decimalPlaces: decimalPlaces.value
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
    applyButtonOpacity(buttonOpacity.value);
}

function resetSettingsToDefault() {
    themeSelect.value = 'dark';
    screenFontSize.value = '52';
    historyFontSize.value = '22';
    buttonShape.value = 'rounded';
    buttonOpacity.value = '85';
    decimalPlaces.value = '10';
    
    applySettings();
    localStorage.removeItem('calcSettings');
}

function applyButtonShape(shape) {
    const buttons = document.querySelectorAll('.btn:not(.settings-buttons .btn)');
    buttons.forEach(btn => {
        btn.classList.remove('btn-shape-rounded', 'btn-shape-square');
        btn.classList.add(`btn-shape-${shape}`);
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
    handleButtonClick();
});

closeSettings.addEventListener('click', () => {
    settingsModal.classList.remove('active');
    handleButtonClick();
});

settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) {
        settingsModal.classList.remove('active');
    }
});

saveSettings.addEventListener('click', () => {
    saveSettingsToStorage();
    settingsModal.classList.remove('active');
    handleButtonClick();
});

resetSettings.addEventListener('click', () => {
    resetSettingsToDefault();
    handleButtonClick();
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

/* ===== ОБРАБОТКА КЛИКОВ ПО КНОПКАМ ===== */
keys.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-value], button[data-action]');
    if (!btn) return;
    
    const val = btn.dataset.value;
    const action = btn.dataset.action;

    handleButtonClick();

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
        
        handleButtonClick();
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

// ==== БЛОКИРОВКА МАСШТАБИРОВАНИЯ В PWA ====
function disableZoom() {
    document.addEventListener('touchstart', function(event) {
        if (event.touches.length > 1) {
            event.preventDefault();
        }
    });
    
    document.addEventListener('gesturestart', function(event) {
        event.preventDefault();
    });
    
    document.addEventListener('gesturechange', function(event) {
        event.preventDefault();
    });
    
    document.addEventListener('gestureend', function(event) {
        event.preventDefault();
    });
}

// Запускаем блокировку масштабирования
disableZoom();

/* ===== ИНИЦИАЛИЗАЦИЯ ===== */
document.addEventListener('DOMContentLoaded', () => {
    loadSettings();
    loadHistory();
    renderScreen();
    updateHistoryHint();
    setTimeout(initAudio, 1000);
// ==== PWA УСТАНОВКА ====
let deferredPrompt = null;
const installButton = document.createElement('button');

function showInstallButton() {
    installButton.innerHTML = '📱 Установить приложение';
    installButton.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: var(--accent);
        color: white;
        border: none;
        padding: 12px 16px;
        border-radius: 25px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        z-index: 1000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
        font-family: inherit;
    `;
    
    installButton.onclick = async () => {
        if (deferredPrompt) {
            // Android/Chrome - стандартная установка
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log('Установка:', outcome);
            hideInstallButton();
            deferredPrompt = null;
        } else {
            // iOS/другие браузеры - показать инструкцию
            showInstallInstructions();
        }
    };
    
    installButton.onmouseenter = () => {
        installButton.style.transform = 'scale(1.05)';
        installButton.style.background = '#e6891a';
    };
    
    installButton.onmouseleave = () => {
        installButton.style.transform = 'scale(1)';
        installButton.style.background = 'var(--accent)';
    };
    
    if (!installButton.parentElement) {
        document.body.appendChild(installButton);
    }
    installButton.style.display = 'block';
}

function hideInstallButton() {
    if (installButton.parentElement) {
        installButton.style.display = 'none';
    }
}

function showInstallInstructions() {
    // Создаем модальное окно с инструкциями
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 2000;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
        background: var(--panel);
        padding: 24px;
        border-radius: 16px;
        max-width: 320px;
        text-align: center;
        color: var(--text);
    `;
    
    content.innerHTML = `
        <h3 style="margin: 0 0 16px 0;">📱 Установка приложения</h3>
        <p style="margin: 0 0 20px 0; line-height: 1.4;">
            <strong>Для iOS:</strong><br>
            Нажмите "Поделиться" 📤<br>
            → "На экран «Домой»"
        </p>
        <p style="margin: 0 0 20px 0; line-height: 1.4;">
            <strong>Для Android:</strong><br>
            Нажмите "⋮" (Меню)<br>
            → "Добавить на главный экран"
        </p>
        <button onclick="this.closest('div').parentElement.remove()" 
                style="background: var(--accent); color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
            Понятно
        </button>
    `;
    
    modal.appendChild(content);
    document.body.appendChild(modal);
    
    // Закрытие по клику вне окна
    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    };
}

// Событие для Android/Chrome
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('PWA установка доступна');
    
    // Показываем кнопку через 3 секунды
    setTimeout(showInstallButton, 3000);
});

// Событие после установки
window.addEventListener('appinstalled', () => {
    console.log('PWA установлено');
    deferredPrompt = null;
    hideInstallButton();
});

// Проверяем режим отображения
function isRunningAsPWA() {
    return window.matchMedia('(display-mode: standalone)').matches || 
           window.navigator.standalone === true;
}

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    // Если уже PWA - не показываем кнопку
    if (isRunningAsPWA()) {
        console.log('Уже работает как PWA');
        return;
    }
    
    // Проверяем поддержку PWA
    if ('BeforeInstallPromptEvent' in window) {
        console.log('Браузер поддерживает PWA установку');
        // Кнопка появится при beforeinstallprompt
    } else {
        // Браузер не поддерживает автоматическую установку
        console.log('Показываем кнопку с инструкциями');
        setTimeout(showInstallButton, 3000);
    }
});

// Также проверяем при каждом запуске
setTimeout(() => {
    if (!isRunningAsPWA() && !deferredPrompt) {
        showInstallButton();
    }
}, 5000);

});
