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

// Звуки
let soundEnabled = false;
const clickSound = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==");

let expr = '';
let readyForNewInput = false;
let replaceLastNumber = false;
let calculationInProgress = false;
let errorState = false;

// Создаем элемент подсказки для истории
const historyHint = document.createElement('div');
historyHint.className = 'history-hint';
historyHint.textContent = 'Подсказка: Удерживайте AC для очистки истории';
historyHint.setAttribute('aria-label', 'Подсказка: Удержижите AC для очистки истории');

/* ===== НАСТРОЙКИ - Загрузка и применение ===== */
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
        soundEnabled = settings.keyboardSounds === 'on';
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
    document.body.setAttribute('data-button-shape', shape);
}

function applyButtonSize(size) {
    document.body.setAttribute('data-button-size', size);
}

function applyButtonOpacity(opacity) {
    document.body.style.setProperty('--button-opacity', `${opacity}%`);
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

/* ===== ПРОВЕРКА СИНТАКСИСА - УСИЛЕННАЯ ВАЛИДАЦИЯ ===== */
function validateExpression(displayExpr) {
    if (!displayExpr) return false;
    
    // Нельзя начинать с × или ÷ или +
    if (displayExpr.startsWith('×') || displayExpr.startsWith('÷') || displayExpr.startsWith('+')) {
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
    
    // После ( нельзя ставить × или ÷ или +
    if (displayExpr.includes('(×') || displayExpr.includes('(÷') || displayExpr.includes('(+')) {
        return false;
    }
    
    // Проверка на незакрытые скобки
    const open = (displayExpr.match(/\(/g) || []).length;
    const close = (displayExpr.match(/\)/g) || []).length;
    if (open !== close) {
        return false;
    }
    
    // ЗАПРЕТ: множественные операторы (кроме унарного минуса)
    if (/([+×÷][+×÷])/.test(displayExpr)) {
        return false;
    }
    
    // ЗАПРЕТ: операторы в конце
    if (/[+×÷]$/.test(displayExpr)) {
        return false;
    }
    
    // ЗАПРЕТ: два оператора деления/умножения подряд
    if (/[×÷][×÷]/.test(displayExpr)) {
        return false;
    }
    
    // ЗАПРЕТ: оператор сразу после открывающей скобки (кроме унарного минуса)
    if (/\([+×÷]/.test(displayExpr)) {
        return false;
    }
    
    // ЗАПРЕТ: бессмысленные выражения с множественными нулями
    if (/[×÷]-?0[×÷]-?0/.test(displayExpr)) {
        return false;
    }
    
    // ЗАПРЕТ: множественные унарные минусы (больше одного подряд)
    if (/−−\d/.test(displayExpr)) {
        return false;
    }
    
    // ЗАПРЕТ: ведущие нули
    if (/\D0\d/.test(displayExpr)) {
        return false;
    }

    // ЗАПРЕТ: деление сразу после деления
    if (/÷\s*÷/.test(displayExpr)) {
        return false;
    }
    
    // ЗАПРЕТ: выражения, заканчивающиеся на оператор
    if (/[+×÷−]$/.test(displayExpr)) {
        return false;
    }
    
    return true;
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
    
    const lastChar = expr.slice(-1);
    const ops = ['+', '−', '×', '÷'];
    
    // СТРОГИЙ ЗАПРЕТ: нельзя начинать выражение с операторов ×÷+
    if (!expr && (ch === '×' || ch === '÷' || ch === '+')) {
        return;
    }
    
    // После ( нельзя ставить × или ÷ или +
    if (lastChar === '(' && (ch === '×' || ch === '÷' || ch === '+')) {
        return;
    }
    
    // ЗАПРЕТ: оператор после оператора (кроме унарного минуса)
    if (ops.includes(lastChar) && ops.includes(ch)) {
        if (ch === '−') {
            if (lastChar === '−') return;
            expr += ch;
        } else {
            expr = expr.slice(0, -1) + ch;
        }
        renderScreen();
        return;
    }
    
    // ЗАПРЕТ: оператор после открывающей скобки (кроме унарного минуса)
    if (lastChar === '(' && ops.includes(ch) && ch !== '−') {
        return;
    }
    
    // Проверка всей комбинации при вводе
    const newExpr = expr + ch;
    
    // Запрет деления на ноль при вводе
    if (newExpr.includes('÷0') && !newExpr.includes('÷0.')) {
        return;
    }
    
    // Запрет невалидных комбинаций операторов в середине выражения
    if (/([+×÷][+×÷])/.test(newExpr)) {
        return;
    }
    
    // Запрет тройных операторов
    if (/[+−×÷]{3,}/.test(newExpr)) {
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

/* ===== ЗВУКИ ===== */
function playSound() {
    if (soundEnabled) {
        clickSound.currentTime = 0;
        clickSound.play().catch(() => {
            // Игнорируем ошибки воспроизведения звука
        });
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
