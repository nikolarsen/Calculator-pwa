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

// Упрощенная система состояний
const state = {
    expr: '',
    readyForNewInput: false,
    calculationInProgress: false,
    errorState: false
};

// Создаем элемент подсказки для истории
const historyHint = document.createElement('div');
historyHint.className = 'history-hint';
historyHint.textContent = 'Подсказка: Удерживайте AC для очистки истории';
historyHint.setAttribute('aria-label', 'Подсказка: Удерживайте AC для очистки истории');

/* ===== НАСТРОЙКИ - Загрузка и применение ===== */
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('calcSettings')) || getDefaultSettings();
    
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

function getDefaultSettings() {
    return {
        theme: 'dark',
        screenFontSize: 52,
        historyFontSize: 22,
        buttonShape: 'rounded',
        buttonSize: 'standard',
        buttonOpacity: 85,
        decimalPlaces: '10',
        keyboardSounds: 'off'
    };
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
    // Применяем тему
    document.body.className = `theme-${themeSelect.value}`;
    
    // Размеры шрифтов
    screen.style.fontSize = `${screenFontSize.value}px`;
    screenSizeValue.textContent = `${screenFontSize.value}px`;
    
    historyEl.style.fontSize = `${historyFontSize.value}px`;
    historySizeValue.textContent = `${historyFontSize.value}px`;
    
    // Формы и размеры кнопок
    applyButtonShape(buttonShape.value);
    applyButtonSize(buttonSize.value);
    applyButtonOpacity(buttonOpacity.value);
}

function resetSettingsToDefault() {
    const defaults = getDefaultSettings();
    
    themeSelect.value = defaults.theme;
    screenFontSize.value = defaults.screenFontSize;
    historyFontSize.value = defaults.historyFontSize;
    buttonShape.value = defaults.buttonShape;
    buttonSize.value = defaults.buttonSize;
    buttonOpacity.value = defaults.buttonOpacity;
    decimalPlaces.value = defaults.decimalPlaces;
    keyboardSounds.value = defaults.keyboardSounds;
    
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
                addHistoryLine(item);
            });
        } catch (error) {
            console.error('Ошибка загрузки истории:', error);
        }
    }
    updateHistoryHint();
}

function addHistoryLine(text) {
    const el = document.createElement('div');
    el.className = 'line';
    el.textContent = text;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `Вычисление: ${text}. Нажмите чтобы использовать результат`);
    historyEl.appendChild(el);
}

/* ===== УМНОЕ ФОРМАТИРОВАНИЕ ЧИСЕЛ ===== */
function formatDisplayValue(value) {
    if (!value || value === '0') return '0';
    
    // Если есть операторы - возвращаем как есть
    if (/[+−×÷()%]/.test(value)) {
        return value;
    }
    
    try {
        const num = parseFloat(value);
        if (isNaN(num)) return value;
        
        const absNum = Math.abs(num);
        const strNum = value.toString();
        
        // Для очень больших или очень маленьких чисел используем экспоненту
        if (strNum.length > 12) {
            if (absNum >= 1e12 || (absNum > 0 && absNum < 1e-6)) {
                return num.toExponential(6).replace('e', 'E');
            }
            
            // Обрезаем лишние десятичные знаки
            return parseFloat(num.toFixed(8)).toString();
        }
        
        return value;
    } catch (error) {
        return value;
    }
}

/* ===== ОТОБРАЖЕНИЕ ЭКРАНА ===== */
function renderScreen() {
    let displayValue = state.expr || '0';
    
    displayValue = formatDisplayValue(displayValue);
    
    // Сбрасываем классы размера
    screen.className = 'screen';
    
    // Автоматическое масштабирование
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
    state.errorState = true;
    screen.style.color = 'var(--danger)';
}

function hideError() {
    state.errorState = false;
    screen.style.color = '';
}

/* ===== ДОБАВЛЕНИЕ В ИСТОРИЮ ===== */
function addHistoryItem(input, result) {
    const text = `${input} = ${result}`;
    const el = document.createElement('div');
    el.className = 'line';
    el.textContent = text;
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.setAttribute('aria-label', `Вычисление: ${input} равно ${result}. Нажмите чтобы использовать результат`);
    
    historyEl.prepend(el);

    // Ограничиваем историю 50 элементами
    while (historyEl.children.length > 50) {
        historyEl.removeChild(historyEl.lastChild);
    }
    
    saveHistory();
    updateHistoryHint();
}

/* ===== УПРОЩЕННАЯ ВАЛИДАЦИЯ ВЫРАЖЕНИЯ ===== */
function validateExpression(expr) {
    if (!expr) return false;
    
    const validations = [
        // Нельзя начинать с × или ÷ или +
        () => !/^[×÷+]/.test(expr),
        
        // Проверка деления на ноль
        () => !/÷\s*-?\s*0(?!\.)/.test(expr),
        
        // Проверка на двойные операторы
        () => !/([+×÷][+×÷])/.test(expr),
        
        // Проверка на пустые скобки
        () => !expr.includes('()'),
        
        // Проверка баланса скобок
        () => {
            const open = (expr.match(/\(/g) || []).length;
            const close = (expr.match(/\)/g) || []).length;
            return open === close;
        },
        
        // После ( нельзя ставить × или ÷ или +
        () => !/\([×÷+]/.test(expr),
        
        // Запрет операторов в конце
        () => !/[+×÷−]$/.test(expr)
    ];
    
    return validations.every(validation => validation());
}

/* ===== ПОДГОТОВКА И ВЫЧИСЛЕНИЕ ВЫРАЖЕНИЯ ===== */
function sanitizeForCalc(displayExpr) {
    if (!displayExpr) return '';
    
    return displayExpr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/\s/g, '');
}

function safeEval(displayExpr) {
    if (!validateExpression(displayExpr)) {
        return null;
    }
    
    let jsExpr = sanitizeForCalc(displayExpr);
    if (!jsExpr) return null;

    try {
        // Обработка процентов - упрощенная версия
        jsExpr = jsExpr.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
        
        const result = Function('"use strict";return(' + jsExpr + ')')();
        
        if (typeof result !== 'number' || !isFinite(result)) {
            return null;
        }
        
        // Обработка очень больших/маленьких чисел
        if (Math.abs(result) > 1e15) return null;
        if (Math.abs(result) < 1e-15 && result !== 0) return 0;
        
        const decimalPlacesValue = parseInt(decimalPlaces.value) || 10;
        
        return Number.isInteger(result) ? result : parseFloat(result.toFixed(decimalPlacesValue));
    } catch (error) {
        return null;
    }
}

/* ===== ОБРАБОТКА ВВОДА ===== */
function insertChar(ch) {
    if (state.errorState) {
        hideError();
    }
    
    const lastChar = state.expr.slice(-1);
    const ops = ['+', '−', '×', '÷'];
    
    // Валидация ввода операторов
    if (!state.expr && (ch === '×' || ch === '÷' || ch === '+')) {
        return;
    }
    
    if (lastChar === '(' && (ch === '×' || ch === '÷' || ch === '+')) {
        return;
    }
    
    // Обработка операторов после операторов (разрешаем только унарный минус)
    if (ops.includes(lastChar) && ops.includes(ch)) {
        if (ch === '−') {
            state.expr += ch;
        } else {
            state.expr = state.expr.slice(0, -1) + ch;
        }
        renderScreen();
        return;
    }
    
    // Обработка readyForNewInput
    if (state.readyForNewInput && ops.includes(ch)) {
        state.expr += ch;
        state.readyForNewInput = false;
    } else {
        state.expr += ch;
    }
    
    renderScreen();
}

function insertNumber(val) {
    if (state.errorState) {
        hideError();
    }
    
    // Если готовы к новому вводу и нет оператора в конце - очищаем
    if (state.readyForNewInput && !/[+−×÷]$/.test(state.expr)) {
        state.expr = '';
        state.readyForNewInput = false;
    }
    
    const parts = state.expr.split(/[^0-9.]/);
    const lastNum = parts[parts.length - 1] || '';
    
    // Запрет множественных точек
    if (val === '.' && lastNum.includes('.')) return;
    
    // Автодобавление 0 перед точкой если нужно
    if (val === '.' && (!lastNum || /[+−×÷(]$/.test(state.expr))) {
        state.expr += '0.';
    } else {
        state.expr += val;
    }
    
    state.readyForNewInput = false;
    renderScreen();
}

/* ===== ОСНОВНЫЕ ОПЕРАЦИИ ===== */
function handleEquals() {
    if (state.calculationInProgress || !state.expr || state.errorState) return;
    
    state.calculationInProgress = true;
    
    try {
        const result = safeEval(state.expr);
        
        if (result === null) {
            showError();
        } else {
            let displayResult = Number.isInteger(result) ? 
                result.toString() : 
                parseFloat(result.toFixed(10)).toString();
            
            addHistoryItem(state.expr, displayResult);
            state.expr = displayResult
                .replace(/\*/g, '×')
                .replace(/\//g, '÷')
                .replace(/-/g, '−');
            
            renderScreen();
            state.readyForNewInput = true;
        }
        
    } catch (error) {
        showError();
    } finally {
        setTimeout(() => {
            state.calculationInProgress = false;
        }, 100);
    }
}

function handlePercent() {
    if (state.errorState) return;
    
    const lastChar = state.expr.slice(-1);
    if (!state.expr || ['+', '−', '×', '÷', '('].includes(lastChar)) return;
    
    state.expr += '%';
    renderScreen();
}

function handleParen() {
    if (state.errorState) {
        hideError();
    }
    
    const open = (state.expr.match(/\(/g) || []).length;
    const close = (state.expr.match(/\)/g) || []).length;
    
    if (state.readyForNewInput) {
        state.expr = '';
        state.readyForNewInput = false;
    }
    
    if (!state.expr || /[+−×÷(]$/.test(state.expr)) {
        state.expr += '(';
    } else if (open > close && !/[+−×÷(]$/.test(state.expr)) {
        state.expr += ')';
    } else {
        state.expr += '×(';
    }
    
    renderScreen();
}

function handleDelete() {
    if (state.errorState) {
        hideError();
    }
    
    if (state.expr.length > 0) {
        state.expr = state.expr.slice(0, -1);
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
            state.expr = '';
            hideError();
            renderScreen();
            updateHistoryHint();
        }, 800);
    } else {
        state.expr = '';
        state.readyForNewInput = false;
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

    if (action) {
        switch (action) {
            case 'all-clear': handleAllClear(false); break;
            case 'delete': handleDelete(); break;
            case 'equals': handleEquals(); break;
            case 'percent': handlePercent(); break;
            case 'paren': handleParen(); break;
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
    if (state.errorState) return;
    
    const line = e.target.closest('.line');
    if (!line) return;
    
    try {
        const text = line.textContent.split('=')[1].trim();
        const lastChar = state.expr.slice(-1);
        const ops = ['+', '−', '×', '÷'];
        
        if (!state.expr || ops.includes(lastChar) || lastChar === '(') {
            state.expr += text.startsWith('−') && !state.expr ? text : `(${text})`;
        } else {
            state.expr = state.expr.replace(/([0-9.]+)$/, text);
        }
        
        state.readyForNewInput = false;
        renderScreen();
        vibrate();
    } catch (error) {
        // Игнорируем ошибки выбора из истории
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
        'Enter': 'equals', '=': 'equals',
        'Escape': 'all-clear', 'Delete': 'all-clear',
        'Backspace': 'delete', '%': 'percent',
        '(': 'paren', ')': 'paren'
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
