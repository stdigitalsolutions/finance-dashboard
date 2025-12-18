// MoneyTrack - Personal Finance Tracker
// Main Application JavaScript

class MoneyTrack {
    constructor() {
        this.init();
    }

    async init() {
        // Initialize application
        this.setupEventListeners();
        this.loadAppData();
        this.setupTheme();
        this.setupDate();
        this.setupCharts();
        
        // Hide loading screen after 1 second
        setTimeout(() => {
            document.getElementById('loadingScreen').classList.add('hidden');
            document.getElementById('appContainer').style.opacity = '1';
            this.showToast('MoneyTrack loaded successfully!', 'success');
        }, 1000);
        
        // Check for PWA install prompt
        this.setupPWA();
    }

    // ===== DATA MANAGEMENT =====
    
    async loadAppData() {
        try {
            // Load transactions
            const transactionsData = localStorage.getItem('moneyTrack_transactions');
            this.transactions = transactionsData ? JSON.parse(transactionsData) : [];
            
            // Load categories or create default ones
            const categoriesData = localStorage.getItem('moneyTrack_categories');
            if (categoriesData) {
                this.categories = JSON.parse(categoriesData);
            } else {
                this.createDefaultCategories();
                this.saveCategories();
            }
            
            // Load settings
            const settingsData = localStorage.getItem('moneyTrack_settings');
            this.settings = settingsData ? JSON.parse(settingsData) : {
                currency: 'ZAR',
                theme: 'light',
                defaultView: 'dashboard'
            };
            
            // Update UI with loaded data
            this.updateDashboard();
            this.renderCategories();
            this.renderTransactions();
            this.updateChart();
            
        } catch (error) {
            console.error('Error loading app data:', error);
            this.showToast('Error loading data. Starting fresh.', 'error');
            this.transactions = [];
            this.categories = [];
            this.createDefaultCategories();
        }
    }

    createDefaultCategories() {
        this.categories = [
            // Income Categories
            { id: 'inc_salary', name: 'Salary', type: 'income', color: '#10b981', icon: 'fas fa-money-bill-wave' },
            { id: 'inc_freelance', name: 'Freelance', type: 'income', color: '#3b82f6', icon: 'fas fa-laptop-code' },
            { id: 'inc_investment', name: 'Investment', type: 'income', color: '#8b5cf6', icon: 'fas fa-chart-line' },
            { id: 'inc_other', name: 'Other Income', type: 'income', color: '#06b6d4', icon: 'fas fa-coins' },
            
            // Expense Categories
            { id: 'exp_food', name: 'Food & Dining', type: 'expense', color: '#ef4444', icon: 'fas fa-utensils' },
            { id: 'exp_transport', name: 'Transport', type: 'expense', color: '#f59e0b', icon: 'fas fa-car' },
            { id: 'exp_shopping', name: 'Shopping', type: 'expense', color: '#ec4899', icon: 'fas fa-shopping-bag' },
            { id: 'exp_entertainment', name: 'Entertainment', type: 'expense', color: '#8b5cf6', icon: 'fas fa-film' },
            { id: 'exp_bills', name: 'Bills & Utilities', type: 'expense', color: '#06b6d4', icon: 'fas fa-lightbulb' },
            { id: 'exp_health', name: 'Health', type: 'expense', color: '#10b981', icon: 'fas fa-heartbeat' },
            { id: 'exp_education', name: 'Education', type: 'expense', color: '#6366f1', icon: 'fas fa-graduation-cap' },
            { id: 'exp_other', name: 'Other Expenses', type: 'expense', color: '#64748b', icon: 'fas fa-question-circle' }
        ];
    }

    saveTransactions() {
        try {
            localStorage.setItem('moneyTrack_transactions', JSON.stringify(this.transactions));
            return true;
        } catch (error) {
            console.error('Error saving transactions:', error);
            this.showToast('Error saving transactions. Storage might be full.', 'error');
            return false;
        }
    }

    saveCategories() {
        try {
            localStorage.setItem('moneyTrack_categories', JSON.stringify(this.categories));
            return true;
        } catch (error) {
            console.error('Error saving categories:', error);
            return false;
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('moneyTrack_settings', JSON.stringify(this.settings));
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            return false;
        }
    }

    // ===== TRANSACTION MANAGEMENT =====
    
    addTransaction(transaction) {
        // Generate unique ID
        transaction.id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
        transaction.createdAt = new Date().toISOString();
        
        this.transactions.unshift(transaction); // Add to beginning
        if (this.saveTransactions()) {
            this.updateDashboard();
            this.renderTransactions();
            this.updateChart();
            this.showToast('Transaction added successfully!', 'success');
            return true;
        }
        return false;
    }

    deleteTransaction(transactionId) {
        const index = this.transactions.findIndex(t => t.id === transactionId);
        if (index !== -1) {
            this.transactions.splice(index, 1);
            if (this.saveTransactions()) {
                this.updateDashboard();
                this.renderTransactions();
                this.updateChart();
                this.showToast('Transaction deleted!', 'success');
                return true;
            }
        }
        return false;
    }

    getTransactionsByPeriod(period) {
        const now = new Date();
        let startDate;
        
        switch(period) {
            case 'today':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'week':
                startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                return this.transactions;
        }
        
        return this.transactions.filter(t => new Date(t.date) >= startDate);
    }

    // ===== DASHBOARD CALCULATIONS =====
    
    updateDashboard() {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        // Filter transactions for current month
        const monthlyTransactions = this.transactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate.getMonth() === currentMonth && 
                   transactionDate.getFullYear() === currentYear;
        });
        
        // Calculate totals
        const income = monthlyTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const expense = monthlyTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        const balance = income - expense;
        const savingsRate = income > 0 ? ((balance / income) * 100) : 0;
        
        // Update UI
        document.getElementById('totalIncome').textContent = this.formatCurrency(income);
        document.getElementById('totalExpense').textContent = this.formatCurrency(expense);
        document.getElementById('totalBalance').textContent = this.formatCurrency(balance);
        document.getElementById('savingsRate').textContent = `${savingsRate.toFixed(1)}%`;
        
        // Color balance based on value
        const balanceElement = document.getElementById('totalBalance');
        balanceElement.className = 'summary-amount';
        if (balance > 0) {
            balanceElement.classList.add('text-success');
        } else if (balance < 0) {
            balanceElement.classList.add('text-danger');
        }
    }

    // ===== CATEGORY MANAGEMENT =====
    
    addCategory(category) {
        // Generate ID
        category.id = 'cat_' + Date.now().toString(36) + Math.random().toString(36).substr(2);
        
        this.categories.push(category);
        if (this.saveCategories()) {
            this.renderCategories();
            this.renderCategorySelector();
            this.showToast('Category added successfully!', 'success');
            return true;
        }
        return false;
    }

    deleteCategory(categoryId) {
        // Check if category is used in transactions
        const isUsed = this.transactions.some(t => t.category === categoryId);
        
        if (isUsed) {
            this.showToast('Cannot delete category that is used in transactions', 'error');
            return false;
        }
        
        const index = this.categories.findIndex(c => c.id === categoryId);
        if (index !== -1) {
            this.categories.splice(index, 1);
            if (this.saveCategories()) {
                this.renderCategories();
                this.renderCategorySelector();
                this.showToast('Category deleted!', 'success');
                return true;
            }
        }
        return false;
    }

    // ===== UI RENDERING =====
    
    renderCategories() {
        const container = document.getElementById('categoriesList');
        if (!container) return;
        
        const incomeCategories = this.categories.filter(c => c.type === 'income');
        const expenseCategories = this.categories.filter(c => c.type === 'expense');
        
        let html = '<div class="category-group"><h4>Income Categories</h4>';
        
        if (incomeCategories.length === 0) {
            html += '<p class="empty-categories">No income categories yet</p>';
        } else {
            incomeCategories.forEach(category => {
                html += this.renderCategoryItem(category);
            });
        }
        
        html += '</div><div class="category-group"><h4>Expense Categories</h4>';
        
        if (expenseCategories.length === 0) {
            html += '<p class="empty-categories">No expense categories yet</p>';
        } else {
            expenseCategories.forEach(category => {
                html += this.renderCategoryItem(category);
            });
        }
        
        html += '</div>';
        container.innerHTML = html;
    }

    renderCategoryItem(category) {
        return `
            <div class="category-item" data-id="${category.id}">
                <div class="category-info">
                    <div class="category-color" style="background-color: ${category.color}"></div>
                    <i class="${category.icon}"></i>
                    <span class="category-name">${category.name}</span>
                </div>
                <div class="category-type ${category.type}">
                    ${category.type === 'income' ? 'Income' : 'Expense'}
                </div>
            </div>
        `;
    }

    renderCategorySelector() {
        const container = document.getElementById('categorySelector');
        if (!container) return;
        
        const type = document.getElementById('transactionType').value;
        const filteredCategories = this.categories.filter(c => c.type === type);
        
        let html = '';
        filteredCategories.forEach(category => {
            html += `
                <div class="category-chip" 
                     data-id="${category.id}"
                     style="background-color: ${category.color}20; color: ${category.color}; border-color: ${category.color}">
                    <i class="${category.icon}"></i>
                    ${category.name}
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Add click handlers
        container.querySelectorAll('.category-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                // Remove selected class from all chips
                container.querySelectorAll('.category-chip').forEach(c => {
                    c.classList.remove('selected');
                });
                // Add selected class to clicked chip
                chip.classList.add('selected');
                // Update hidden input
                document.getElementById('category').value = chip.dataset.id;
            });
        });
        
        // Select first category by default
        if (filteredCategories.length > 0) {
            const firstChip = container.querySelector('.category-chip');
            if (firstChip) {
                firstChip.classList.add('selected');
                document.getElementById('category').value = firstChip.dataset.id;
            }
        }
    }

    renderTransactions(filter = 'all') {
        const container = document.getElementById('transactionsList');
        if (!container) return;
        
        let transactionsToShow;
        
        switch(filter) {
            case 'income':
                transactionsToShow = this.transactions.filter(t => t.type === 'income');
                break;
            case 'expense':
                transactionsToShow = this.transactions.filter(t => t.type === 'expense');
                break;
            case 'today':
            case 'week':
            case 'month':
                transactionsToShow = this.getTransactionsByPeriod(filter);
                break;
            default:
                transactionsToShow = this.transactions;
        }
        
        if (transactionsToShow.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-receipt"></i>
                    <h3>No transactions found</h3>
                    <p>${filter !== 'all' ? 'Try changing the filter' : 'Add your first transaction'}</p>
                </div>
            `;
            return;
        }
        
        let html = '';
        transactionsToShow.forEach(transaction => {
            const category = this.categories.find(c => c.id === transaction.category);
            const date = new Date(transaction.date);
            const formattedDate = date.toLocaleDateString('en-ZA', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            });
            
            html += `
                <div class="transaction-item" data-id="${transaction.id}">
                    <div class="transaction-info">
                        <div class="transaction-icon" style="background-color: ${category?.color || '#ccc'}20; color: ${category?.color || '#666'}">
                            <i class="${category?.icon || 'fas fa-question'}"></i>
                        </div>
                        <div class="transaction-details">
                            <div class="transaction-title">${transaction.description}</div>
                            <div class="transaction-meta">
                                <span class="transaction-date">${formattedDate}</span>
                                ${category ? `<span class="transaction-category" style="background-color: ${category.color}20; color: ${category.color}">${category.name}</span>` : ''}
                            </div>
                        </div>
                    </div>
                    <div class="transaction-amount ${transaction.type}">
                        ${transaction.type === 'income' ? '+' : '-'}${this.formatCurrency(transaction.amount)}
                    </div>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // ===== CHARTS =====
    
    setupCharts() {
        this.expenseChart = null;
        this.chartColors = [
            '#ef4444', '#f59e0b', '#ec4899', '#8b5cf6', 
            '#3b82f6', '#06b6d4', '#10b981', '#84cc16',
            '#f97316', '#a855f7', '#6366f1', '#14b8a6'
        ];
    }

    updateChart() {
        const period = document.getElementById('chartPeriod').value;
        const transactions = this.getTransactionsByPeriod(period === 'all' ? 'all' : 'month');
        
        // Group expenses by category
        const expenseTransactions = transactions.filter(t => t.type === 'expense');
        const categoryMap = {};
        
        expenseTransactions.forEach(transaction => {
            const category = this.categories.find(c => c.id === transaction.category);
            const categoryName = category ? category.name : 'Uncategorized';
            
            if (!categoryMap[categoryName]) {
                categoryMap[categoryName] = {
                    amount: 0,
                    color: category ? category.color : '#64748b'
                };
            }
            
            categoryMap[categoryName].amount += parseFloat(transaction.amount);
        });
        
        // Prepare chart data
        const labels = Object.keys(categoryMap);
        const data = Object.values(categoryMap).map(item => item.amount);
        const backgroundColors = Object.values(categoryMap).map(item => item.color);
        
        const ctx = document.getElementById('expenseChart').getContext('2d');
        
        // Destroy existing chart
        if (this.expenseChart) {
            this.expenseChart.destroy();
        }
        
        // Create new chart
        this.expenseChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: backgroundColors,
                    borderWidth: 1,
                    borderColor: 'var(--bg-card)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.raw;
                                const total = data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${context.label}: ${this.formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                },
                cutout: '65%'
            }
        });
        
        // Update legend
        this.updateChartLegend(labels, data, backgroundColors);
    }

    updateChartLegend(labels, data, colors) {
        const container = document.getElementById('chartLegend');
        const total = data.reduce((a, b) => a + b, 0);
        
        let html = '';
        labels.forEach((label, index) => {
            const value = data[index];
            const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
            
            html += `
                <div class="legend-item">
                    <div class="legend-color" style="background-color: ${colors[index]}"></div>
                    <span>${label}</span>
                    <span class="legend-percentage">${percentage}%</span>
                </div>
            `;
        });
        
        container.innerHTML = html;
    }

    // ===== UTILITIES =====
    
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-ZA', {
            style: 'currency',
            currency: 'ZAR',
            minimumFractionDigits: 2
        }).format(amount);
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = 'toast ' + type;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }

    setupDate() {
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('date').value = today;
        document.getElementById('date').max = today; // Cannot select future dates
    }

    setupTheme() {
        // Load saved theme or default to light
        const savedTheme = localStorage.getItem('moneyTrack_theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        
        // Update theme toggle icon
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = savedTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        // Update settings
        this.settings.theme = savedTheme;
        this.saveSettings();
    }

    toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('moneyTrack_theme', newTheme);
        
        // Update icon
        const themeIcon = document.querySelector('#themeToggle i');
        themeIcon.className = newTheme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        
        this.settings.theme = newTheme;
        this.saveSettings();
        
        this.showToast(`Switched to ${newTheme} theme`, 'success');
    }

    // ===== EVENT LISTENERS =====
    
    setupEventListeners() {
        // Transaction form
        document.getElementById('transactionForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleTransactionSubmit();
        });
        
        // Type selector buttons
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.handleTypeChange(type);
            });
        });
        
        // Category form
        document.getElementById('categoryForm')?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleCategorySubmit();
        });
        
        // Filter changes
        document.getElementById('transactionFilter').addEventListener('change', (e) => {
            this.renderTransactions(e.target.value);
        });
        
        document.getElementById('chartPeriod').addEventListener('change', () => {
            this.updateChart();
        });
        
        // Clear form button
        document.getElementById('clearForm').addEventListener('click', () => {
            this.clearTransactionForm();
        });
        
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
        
        // Export button
        document.getElementById('exportBtn').addEventListener('click', () => {
            this.showExportModal();
        });
        
        // Add category button
        document.getElementById('addCategoryBtn').addEventListener('click', () => {
            this.showCategoryModal();
        });
        
        // Navigation buttons
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const view = e.currentTarget.dataset.view;
                this.switchView(view);
            });
        });
        
        // Modal close buttons
        document.querySelectorAll('.modal-close, .modal .btn-secondary').forEach(btn => {
            btn.addEventListener('click', () => {
                this.closeModals();
            });
        });
        
        // Color picker
        this.setupColorPicker();
        
        // Icon picker
        this.setupIconPicker();
        
        // Export options
        this.setupExportOptions();
        
        // PWA install
        this.setupPWAInstall();
    }

    handleTransactionSubmit() {
        const amount = parseFloat(document.getElementById('amount').value);
        const type = document.getElementById('transactionType').value;
        const category = document.getElementById('category').value;
        const description = document.getElementById('description').value.trim();
        const date = document.getElementById('date').value;
        
        if (!amount || amount <= 0) {
            this.showToast('Please enter a valid amount', 'error');
            return;
        }
        
        if (!category) {
            this.showToast('Please select a category', 'error');
            return;
        }
        
        if (!description) {
            this.showToast('Please enter a description', 'error');
            return;
        }
        
        const transaction = {
            amount: amount,
            type: type,
            category: category,
            description: description,
            date: date
        };
        
        if (this.addTransaction(transaction)) {
            this.clearTransactionForm();
        }
    }

    handleTypeChange(type) {
        // Update type selector UI
        document.querySelectorAll('.type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.type-btn[data-type="${type}"]`).classList.add('active');
        
        // Update hidden input
        document.getElementById('transactionType').value = type;
        
        // Update category selector
        this.renderCategorySelector();
    }

    clearTransactionForm() {
        document.getElementById('amount').value = '';
        document.getElementById('description').value = '';
        document.getElementById('date').value = new Date().toISOString().split('T')[0];
        
        // Reset to first category
        const selector = document.getElementById('categorySelector');
        if (selector) {
            selector.querySelectorAll('.category-chip').forEach((chip, index) => {
                chip.classList.remove('selected');
                if (index === 0) {
                    chip.classList.add('selected');
                    document.getElementById('category').value = chip.dataset.id;
                }
            });
        }
        
        this.showToast('Form cleared', 'info');
    }

    // ===== MODAL HANDLING =====
    
    showCategoryModal() {
        const modal = document.getElementById('categoryModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    showExportModal() {
        const modal = document.getElementById('exportModal');
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
        this.updateExportPreview();
    }

    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('active');
        });
        document.body.style.overflow = '';
    }

    handleCategorySubmit() {
        const name = document.getElementById('categoryName').value.trim();
        const type = document.getElementById('categoryType').value;
        const color = document.getElementById('categoryColor').value;
        const icon = document.getElementById('categoryIcon').value;
        
        if (!name) {
            this.showToast('Please enter a category name', 'error');
            return;
        }
        
        // Check for duplicate category name for same type
        const duplicate = this.categories.find(c => 
            c.name.toLowerCase() === name.toLowerCase() && c.type === type
        );
        
        if (duplicate) {
            this.showToast('A category with this name already exists', 'error');
            return;
        }
        
        const category = {
            name: name,
            type: type,
            color: color,
            icon: icon
        };
        
        if (this.addCategory(category)) {
            this.closeModals();
            document.getElementById('categoryForm').reset();
        }
    }

    setupColorPicker() {
        const colors = [
            '#ef4444', '#f59e0b', '#84cc16', '#10b981',
            '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6',
            '#a855f7', '#ec4899', '#f97316', '#64748b'
        ];
        
        const container = document.getElementById('colorPicker');
        let html = '';
        
        colors.forEach(color => {
            html += `<div class="color-option" style="background-color: ${color}" data-color="${color}"></div>`;
        });
        
        container.innerHTML = html;
        
        // Add click handlers
        container.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class
                container.querySelectorAll('.color-option').forEach(o => {
                    o.classList.remove('selected');
                });
                // Add selected class
                option.classList.add('selected');
                // Update hidden input
                document.getElementById('categoryColor').value = option.dataset.color;
            });
        });
        
        // Select first color by default
        const firstColor = container.querySelector('.color-option');
        if (firstColor) {
            firstColor.classList.add('selected');
        }
    }

    setupIconPicker() {
        const icons = [
            'fas fa-shopping-cart', 'fas fa-utensils', 'fas fa-car', 'fas fa-home',
            'fas fa-heartbeat', 'fas fa-graduation-cap', 'fas fa-film', 'fas fa-plane',
            'fas fa-gamepad', 'fas fa-gift', 'fasfa-coffee', 'fas fa-wifi',
            'fas fa-money-bill-wave', 'fas fa-laptop-code', 'fas fa-chart-line', 'fas fa-coins'
        ];
        
        const container = document.getElementById('iconPicker');
        let html = '';
        
        icons.forEach(icon => {
            html += `<div class="icon-option" data-icon="${icon}"><i class="${icon}"></i></div>`;
        });
        
        container.innerHTML = html;
        
        // Add click handlers
        container.querySelectorAll('.icon-option').forEach(option => {
            option.addEventListener('click', () => {
                // Remove selected class
                container.querySelectorAll('.icon-option').forEach(o => {
                    o.classList.remove('selected');
                });
                // Add selected class
                option.classList.add('selected');
                // Update hidden input
                document.getElementById('categoryIcon').value = option.dataset.icon;
            });
        });
        
        // Select first icon by default
        const firstIcon = container.querySelector('.icon-option');
        if (firstIcon) {
            firstIcon.classList.add('selected');
        }
    }

    // ===== EXPORT FUNCTIONALITY =====
    
    setupExportOptions() {
        document.querySelectorAll('.export-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const format = e.currentTarget.dataset.format;
                this.handleExport(format);
            });
        });
    }

    handleExport(format) {
        switch(format) {
            case 'csv':
                this.exportToCSV();
                break;
            case 'json':
                this.exportToJSON();
                break;
            case 'print':
                window.print();
                break;
        }
    }

    exportToCSV() {
        // Prepare CSV content
        let csv = 'Date,Type,Category,Description,Amount\n';
        
        this.transactions.forEach(transaction => {
            const category = this.categories.find(c => c.id === transaction.category);
            const categoryName = category ? category.name : 'Uncategorized';
            
            csv += `"${transaction.date}","${transaction.type}","${categoryName}","${transaction.description}","${transaction.amount}"\n`;
        });
        
        // Create download link
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `moneytrack-export-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Data exported as CSV', 'success');
    }

    exportToJSON() {
        const exportData = {
            transactions: this.transactions,
            categories: this.categories,
            settings: this.settings,
            exportedAt: new Date().toISOString()
        };
        
        const json = JSON.stringify(exportData, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `moneytrack-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showToast('Data exported as JSON backup', 'success');
    }

    updateExportPreview() {
        const container = document.getElementById('exportPreview');
        const totalTransactions = this.transactions.length;
        const totalIncome = this.transactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        const totalExpense = this.transactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        container.innerHTML = `
            Preview:
            • Total Transactions: ${totalTransactions}
            • Total Income: ${this.formatCurrency(totalIncome)}
            • Total Expenses: ${this.formatCurrency(totalExpense)}
            • Net Balance: ${this.formatCurrency(totalIncome - totalExpense)}
        `;
    }

    // ===== VIEW MANAGEMENT =====
    
    switchView(view) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.nav-btn[data-view="${view}"]`).classList.add('active');
        
        // Update content based on view
        // (In a real app, you would show/hide different sections)
        this.showToast(`Switched to ${view} view`, 'info');
    }

    // ===== PWA FUNCTIONALITY =====
    
    setupPWA() {
        // Register service worker
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('service-worker.js')
                .then(registration => {
                    console.log('Service Worker registered with scope:', registration.scope);
                })
                .catch(error => {
                    console.log('Service Worker registration failed:', error);
                });
        }
        
        // Listen for beforeinstallprompt event
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later
            deferredPrompt = e;
            // Show install prompt
            this.showInstallPrompt();
        });
        
        // Listen for app installed event
        window.addEventListener('appinstalled', () => {
            console.log('MoneyTrack was installed');
            this.hideInstallPrompt();
            this.showToast('MoneyTrack installed successfully!', 'success');
        });
    }

    showInstallPrompt() {
        const prompt = document.getElementById('installPrompt');
        prompt.classList.add('show');
    }

    hideInstallPrompt() {
        const prompt = document.getElementById('installPrompt');
        prompt.classList.remove('show');
    }

    setupPWAInstall() {
        document.getElementById('installApp').addEventListener('click', () => {
            this.hideInstallPrompt();
            
            if (this.deferredPrompt) {
                this.deferredPrompt.prompt();
                this.deferredPrompt.userChoice.then((choiceResult) => {
                    if (choiceResult.outcome === 'accepted') {
                        console.log('User accepted the install prompt');
                    } else {
                        console.log('User dismissed the install prompt');
                    }
                    this.deferredPrompt = null;
                });
            }
        });
        
        document.getElementById('dismissInstall').addEventListener('click', () => {
            this.hideInstallPrompt();
        });
    }
}

// ===== INITIALIZE APPLICATION =====

// Wait for DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app
    window.moneyTrack = new MoneyTrack();
    
    // Add global error handler
    window.addEventListener('error', (e) => {
        console.error('Global error:', e);
    });
    
    // Add beforeunload handler to save data
    window.addEventListener('beforeunload', () => {
        // Force save data
        if (window.moneyTrack) {
            window.moneyTrack.saveTransactions();
            window.moneyTrack.saveCategories();
        }
    });
});

// ===== OFFLINE DETECTION =====

// Check online/offline status
window.addEventListener('online', () => {
    if (window.moneyTrack) {
        window.moneyTrack.showToast('Back online', 'success');
    }
});

window.addEventListener('offline', () => {
    if (window.moneyTrack) {
        window.moneyTrack.showToast('You are offline. Changes will be saved locally.', 'warning');
    }
});