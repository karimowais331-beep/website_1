/**
 * Premium Futuristic Calculator
 */

class Calculator {
    constructor() {
        this.currentExpression = '';
        this.history = JSON.parse(localStorage.getItem('calculatorHistory')) || [];
        this.currentMode = 'standard';
        this.currentTheme = localStorage.getItem('calculatorTheme') || 'neon';
        this.keyboardSupport = localStorage.getItem('calculatorKeyboardSupport') !== 'false';
        this.angleMode = localStorage.getItem('calculatorAngleMode') || 'DEG';
        this.decimalPrecision = parseInt(localStorage.getItem('calculatorPrecision')) || 2;
        this.init();
    }

    init() {
        this.applyTheme(this.currentTheme);
        this.updateKeyboardStatus();
        this.updateAngleMode();
        this.updatePrecision();
        this.switchMode('standard'); // Initialize with standard mode
        this.updateDisplay();
        this.updateTime();
        this.bindEvents();
        this.renderHistory();
        setInterval(() => this.updateTime(), 1000);
    }

    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }

    bindEvents() {
        // DEG/RAD toggle
        document.querySelectorAll('.btn.scientific.angle-toggle').forEach(btn => {
            btn.addEventListener('click', () => {
                this.addButtonPressEffect(btn);
                this.setAngleMode(btn.dataset.angleMode);
            });
        });

        // Number/operator buttons
        document.querySelectorAll('.btn.number, .btn.operator').forEach(btn => {
            btn.addEventListener('click', () => {
                const value = btn.dataset.value;
                this.addButtonPressEffect(btn);
                this.appendToExpression(value);
            });
        });

        // Special buttons
        document.querySelectorAll('.btn.special').forEach(btn => {
            const action = btn.dataset.action;
            btn.addEventListener('click', () => {
                this.addButtonPressEffect(btn);
                if (action === 'clear') this.clear();
                else if (action === 'parentheses') this.toggleParentheses();
                else if (action === 'percent') this.addPercent();
            });
        });

        // Scientific functions
        document.querySelectorAll('.btn.scientific[data-func]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.addButtonPressEffect(btn);
                this.applyScientificFunction(btn.dataset.func);
            });
        });

        // Scientific constants
        document.querySelectorAll('.btn.scientific[data-value]').forEach(btn => {
            btn.addEventListener('click', () => {
                let value = btn.dataset.value;
                if (value === 'π') value = Math.PI.toFixed(12);
                if (value === 'e') value = Math.E.toFixed(12);
                this.addButtonPressEffect(btn);
                this.appendToExpression(value);
            });
        });

        // Delete button
        document.querySelector('.btn.delete').addEventListener('click', () => {
            this.addButtonPressEffect(document.querySelector('.btn.delete'));
            this.delete();
        });

        // Equals button
        document.querySelector('.btn.equals').addEventListener('click', () => {
            this.addButtonPressEffect(document.querySelector('.btn.equals'));
            this.calculate();
        });

        // History clear
        document.querySelector('.clear-history').addEventListener('click', () => {
            this.confirmClearHistory();
        });

        // Mode navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', () => {
                this.switchMode(item.dataset.mode);
                document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });

        // Theme switching (sidebar)
        document.querySelectorAll('.theme-circle').forEach(circle => {
            circle.addEventListener('click', () => {
                this.switchTheme(circle.dataset.theme);
            });
        });

        // Mobile sidebar toggle
        const mobileToggle = document.getElementById('mobileToggle');
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                document.querySelector('.sidebar').classList.toggle('open');
            });
        }

        // Keyboard toggle
        const keyboardToggle = document.getElementById('keyboardToggle');
        if (keyboardToggle) {
            keyboardToggle.addEventListener('click', () => {
                this.toggleKeyboardSupport();
            });
        }

        // Keyboard
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Settings panel events
        const precisionSelect = document.getElementById('precisionSelect');
        if (precisionSelect) {
            precisionSelect.addEventListener('change', (e) => {
                this.setPrecision(parseInt(e.target.value));
                this.updateDisplay();
            });
        }

        const keyboardToggleSettings = document.getElementById('keyboardToggleSettings');
        if (keyboardToggleSettings) {
            keyboardToggleSettings.addEventListener('click', () => {
                this.toggleKeyboardSupport();
                this.updateSettingsUI();
            });
        }

        document.querySelectorAll('.theme-option').forEach(option => {
            option.addEventListener('click', () => {
                this.switchTheme(option.dataset.theme);
                this.updateSettingsUI();
            });
        });

        const clearHistoryMain = document.getElementById('clearHistoryMain');
        if (clearHistoryMain) {
            clearHistoryMain.addEventListener('click', () => {
                this.confirmClearHistory();
            });
        }
    }

    toggleKeyboardSupport() {
        this.keyboardSupport = !this.keyboardSupport;
        localStorage.setItem('calculatorKeyboardSupport', String(this.keyboardSupport));
        this.updateKeyboardStatus();
    }

    updateKeyboardStatus() {
        const toggle = document.getElementById('keyboardToggle');
        if (toggle) {
            toggle.textContent = this.keyboardSupport ? 'ON' : 'OFF';
            toggle.classList.remove('on', 'off');
            toggle.classList.add(this.keyboardSupport ? 'on' : 'off');
        }
    }

    setAngleMode(mode) {
        this.angleMode = mode;
        localStorage.setItem('calculatorAngleMode', mode);
        this.updateAngleMode();
    }

    updateAngleMode() {
        document.querySelectorAll('.btn.scientific.angle-toggle').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.angleMode === this.angleMode);
        });
        const display = document.getElementById('angleModeDisplay');
        if (display) {
            display.textContent = this.angleMode;
        }
    }

    setPrecision(precision) {
        this.decimalPrecision = precision;
        localStorage.setItem('calculatorPrecision', precision);
    }

    updatePrecision() {
        // No precision select in simplified version
    }

    switchMode(mode) {
        this.currentMode = mode;
        const modeBadge = document.getElementById('modeBadge');
        const scientificButtons = document.getElementById('scientificButtons');
        const buttonGrid = document.getElementById('buttonGrid');
        const calculatorPanel = document.getElementById('calculatorPanel');
        const historyPanel = document.getElementById('historyPanel');
        const settingsPanel = document.getElementById('settingsPanel');

        modeBadge.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);

        // Hide all panels first
        scientificButtons.classList.remove('active');
        buttonGrid.style.display = 'none';
        calculatorPanel.style.display = 'none';
        historyPanel.style.display = 'none';
        settingsPanel.style.display = 'none';

        if (mode === 'standard') {
            buttonGrid.style.display = 'grid';
            calculatorPanel.style.display = 'block';
        } else if (mode === 'scientific') {
            buttonGrid.style.display = 'grid';
            calculatorPanel.style.display = 'block';
            scientificButtons.classList.add('active');
        } else if (mode === 'history') {
            historyPanel.style.display = 'flex';
            this.renderHistoryMain();
        } else if (mode === 'settings') {
            settingsPanel.style.display = 'flex';
            this.updateSettingsUI();
        }
    }

    renderHistoryMain() {
        const historyListMain = document.getElementById('historyListMain');
        
        if (this.history.length === 0) {
            historyListMain.innerHTML = `<div class="history-empty">
                <i class="fas fa-history" style="font-size: 28px; margin-bottom: 12px; opacity: 0.5;"></i>
                <div style="font-size: 14px;">No calculations yet</div>
            </div>`;
            return;
        }
        
        historyListMain.innerHTML = this.history
            .slice(0, 20)
            .map((item, index) => `
                <div class="history-item" data-index="${index}" tabindex="0" role="button">
                    <span class="expr">${this.escapeHtml(item.expression || '')}</span>
                    <span class="res">= ${this.escapeHtml(item.result || '0')}</span>
                </div>
            `).join('');
        
        historyListMain.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                if (this.history[index]) {
                    this.currentExpression = this.history[index].expression;
                    this.switchMode('standard');
                    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
                    document.querySelector('.nav-item[data-mode="standard"]').classList.add('active');
                    this.updateDisplay();
                }
            });
        });
    }

    updateSettingsUI() {
        const precisionSelect = document.getElementById('precisionSelect');
        const keyboardToggleSettings = document.getElementById('keyboardToggleSettings');
        const themeOptions = document.querySelectorAll('.theme-option');
        
        precisionSelect.value = this.decimalPrecision;
        
        if (this.keyboardSupport) {
            keyboardToggleSettings.classList.add('active');
        } else {
            keyboardToggleSettings.classList.remove('active');
        }
        
        themeOptions.forEach(option => {
            if (option.dataset.theme === this.currentTheme) {
                option.classList.add('active');
            } else {
                option.classList.remove('active');
            }
        });
    }

    switchTheme(theme) {
        this.currentTheme = theme;
        this.applyTheme(theme);
        localStorage.setItem('calculatorTheme', theme);
    }

    applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        document.querySelectorAll('.theme-circle').forEach(circle => {
            circle.classList.toggle('active', circle.dataset.theme === theme);
        });
    }

    addButtonPressEffect(btn) {
        btn.classList.add('pressed');
        setTimeout(() => btn.classList.remove('pressed'), 150);
    }

    isValidInput(value) {
        const lastChar = this.currentExpression.slice(-1);
        const operators = '+-*/^';
        
        if (operators.includes(value) && operators.includes(lastChar)) {
            return false;
        }
        
        if (value === '.' && this.isLastNumberHavingDecimal()) {
            return false;
        }
        
        return true;
    }

    isLastNumberHavingDecimal() {
        const tokens = this.currentExpression.split(/[\+\-\*\/\^]/);
        const lastNumber = tokens[tokens.length - 1];
        return lastNumber.includes('.');
    }

    appendToExpression(value) {
        if (!this.isValidInput(value)) return;
        this.currentExpression += value;
        this.updateDisplay();
    }

    clear() {
        this.currentExpression = '';
        this.updateDisplay();
    }

    delete() {
        this.currentExpression = this.currentExpression.slice(0, -1);
        this.updateDisplay();
    }

    toggleParentheses() {
        const openCount = (this.currentExpression.match(/\(/g) || []).length;
        const closeCount = (this.currentExpression.match(/\)/g) || []).length;
        if (openCount <= closeCount) {
            this.appendToExpression('(');
        } else {
            this.appendToExpression(')');
        }
    }

    addPercent() {
        this.appendToExpression('%');
    }

    applyScientificFunction(func) {
        if (!this.currentExpression) return;
        
        try {
            let value = this.safeEvaluate(this.currentExpression);
            let result;
            
            switch (func) {
                case 'sin':
                    value = this.angleMode === 'DEG' ? this.toRadians(value) : value;
                    result = Math.sin(value);
                    break;
                case 'cos':
                    value = this.angleMode === 'DEG' ? this.toRadians(value) : value;
                    result = Math.cos(value);
                    break;
                case 'tan':
                    value = this.angleMode === 'DEG' ? this.toRadians(value) : value;
                    result = Math.tan(value);
                    break;
                case 'log':
                    result = Math.log10(value);
                    break;
                case 'ln':
                    result = Math.log(value);
                    break;
                case 'sqrt':
                    result = Math.sqrt(value);
                    break;
                case 'square':
                    result = Math.pow(value, 2);
                    break;
                case 'pow':
                    this.currentExpression += '^';
                    this.updateDisplay();
                    return;
                case 'fact':
                    result = this.factorial(Math.floor(value));
                    break;
            }

            if (!isFinite(result) || isNaN(result)) {
                this.showError();
                return;
            }

            this.currentExpression = String(result);
            this.updateDisplay();
        } catch (e) {
            this.showError();
        }
    }

    factorial(n) {
        if (n < 0) return NaN;
        if (n === 0 || n === 1) return 1;
        let result = 1;
        for (let i = 2; i <= n; i++) result *= i;
        return result;
    }

    safeEvaluate(expr) {
        let processed = expr
            .replace(/×/g, '*')
            .replace(/÷/g, '/')
            .replace(/%/g, '/100')
            .replace(/\^/g, '**');
        
        return new Function('return ' + processed)();
    }

    calculate() {
        if (!this.currentExpression.trim()) return;
        
        try {
            let result = this.safeEvaluate(this.currentExpression);
            
            if (!isFinite(result) || isNaN(result)) {
                this.showError();
                return;
            }

            result = Number(result.toFixed(this.decimalPrecision));
            result = parseFloat(result);
            const resultStr = String(result);
            
            if (this.currentExpression && this.currentExpression !== resultStr) {
                this.history.unshift({
                    expression: this.currentExpression,
                    result: resultStr,
                    id: Date.now()
                });
                
                if (this.history.length > 20) this.history.pop();
                localStorage.setItem('calculatorHistory', JSON.stringify(this.history));
                this.renderHistory();
            }
            
            this.currentExpression = resultStr;
            this.updateDisplay();
        } catch (error) {
            this.showError();
        }
    }

    showError() {
        const resultEl = document.getElementById('result');
        resultEl.textContent = 'Error';
        resultEl.style.color = '#FF2D95';
        
        setTimeout(() => {
            this.updateDisplay();
        }, 1500);
    }

    updateDisplay() {
        const expressionEl = document.getElementById('expression');
        const resultEl = document.getElementById('result');
        
        resultEl.style.color = '';
        
        expressionEl.textContent = (this.currentExpression && this.currentExpression.trim() !== '') ? this.currentExpression : '0';
        
        try {
            if (this.currentExpression && this.currentExpression.trim() !== '') {
                let preview = this.safeEvaluate(this.currentExpression);
                if (isFinite(preview) && !isNaN(preview)) {
                    preview = Number(preview.toFixed(this.decimalPrecision));
                    preview = parseFloat(preview);
                } else {
                    preview = '0';
                }
                resultEl.textContent = String(preview);
            } else {
                resultEl.textContent = '0';
            }
        } catch {
            resultEl.textContent = '0';
        }
    }

    updateTime() {
        const now = new Date();
        const timeEl = document.getElementById('currentTime');
        const dateEl = document.getElementById('currentDate');
        
        timeEl.innerHTML = `<i class="far fa-clock"></i> ${now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })}`;
        
        dateEl.innerHTML = `<i class="far fa-calendar"></i> ${now.toLocaleDateString('en-US', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
        })}`;
    }

    renderHistory() {
        const historyList = document.getElementById('historyList');
        
        if (this.history.length === 0) {
            historyList.innerHTML = `<div class="history-empty">
                <i class="fas fa-history" style="font-size: 28px; margin-bottom: 12px; opacity: 0.5;"></i>
                <div style="font-size: 14px;">No calculations yet</div>
            </div>`;
            return;
        }
        
        historyList.innerHTML = this.history
            .slice(0, 20)
            .map((item, index) => `
                <div class="history-item" data-index="${index}" tabindex="0" role="button">
                    <span class="expr">${this.escapeHtml(item.expression || '')}</span>
                    <span class="res">= ${this.escapeHtml(item.result || '0')}</span>
                </div>
            `).join('');
        
        document.querySelectorAll('.history-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                if (this.history[index]) {
                    this.currentExpression = this.history[index].expression;
                    this.updateDisplay();
                    document.querySelector('.sidebar').classList.remove('open');
                }
            });
            
            item.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    item.click();
                }
            });
        });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    confirmClearHistory() {
        if (this.history.length === 0) return;
        
        if (confirm('Clear all history?')) {
            this.clearHistory();
        }
    }

    clearHistory() {
        this.history = [];
        localStorage.removeItem('calculatorHistory');
        this.renderHistory();
        if (this.currentMode === 'history') {
            this.renderHistoryMain();
        }
    }

    handleKeyboard(e) {
        if (!this.keyboardSupport) return;
        if (e.repeat) return;

        let targetBtn = null;
        const key = e.key;
        const keyLower = key.toLowerCase();
        
        if (key >= '0' && key <= '9') {
            targetBtn = document.querySelector(`.btn.number[data-value="${key}"]`);
            if (targetBtn) this.addButtonPressEffect(targetBtn);
            this.appendToExpression(key);
        } else if (['+', '-', '*', '/', '.', '(', ')'].includes(key)) {
            targetBtn = document.querySelector(`.btn[data-value="${key}"]`) || 
                        document.querySelector(`.btn.operator[data-value="${key}"]`) ||
                        document.querySelector(`.btn.number[data-value="${key}"]`);
            if (targetBtn) this.addButtonPressEffect(targetBtn);
            this.appendToExpression(key);
        } else if (key === 'Enter' || key === '=') {
            e.preventDefault();
            targetBtn = document.querySelector('.btn.equals');
            if (targetBtn) this.addButtonPressEffect(targetBtn);
            this.calculate();
        } else if (key === 'Backspace') {
            targetBtn = document.querySelector('.btn.delete');
            if (targetBtn) this.addButtonPressEffect(targetBtn);
            this.delete();
        } else if (key === 'Escape') {
            targetBtn = document.querySelector('.btn.special[data-action="clear"]');
            if (targetBtn) this.addButtonPressEffect(targetBtn);
            this.clear();
        } else if (key === '%') {
            targetBtn = document.querySelector('.btn.special[data-action="percent"]');
            if (targetBtn) this.addButtonPressEffect(targetBtn);
            this.addPercent();
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    new Calculator();
});
