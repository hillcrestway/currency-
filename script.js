const history = { 
  currency: [], 'exchange-trends': [], crypto: [], 'crypto-trends': [], stocks: [], 
  compound: [], portfolio: [], tax: [], loan: [], dividend: [], budget: [], retirement: [], 
  'savings-goal': [], 'net-worth': [], inflation: [], risk: [] 
};
const portfolio = [];
let lastUpdated = Date.now();
let autoRefreshInterval = null;
const pinnedTools = new Set();
let fiatRates = {};
let cryptoRates = {};

// Replace 'YOUR_CURRENCY_LAYER_KEY' with your actual API key or use mock data
const CURRENCY_LAYER_API = 'http://api.currencylayer.com/live?access_key=d04a0998897cc4c604438e6610d9fb24&source=USD';
const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,ripple,tether,binancecoin,cardano,solana,dogecoin,polkadot&vs_currencies=usd';

// Mock data for testing without API keys
const mockFiatRates = { 
  USD: 1, EUR: 0.85, GBP: 0.73, JPY: 110, AUD: 1.35, CAD: 1.25, CHF: 0.92, 
  CNY: 6.45, INR: 75, BRL: 5.5, ZAR: 15, RUB: 73, SGD: 1.35, NZD: 1.45, MXN: 20 
};
const mockCryptoRates = { 
  BTC: 50000, ETH: 3000, XRP: 0.75, USDT: 1, BNB: 500, ADA: 1.2, SOL: 150, 
  DOGE: 0.15, DOT: 20, USD: 1 
};

async function fetchFiatRates() {
  try {
      const response = await fetch(CURRENCY_LAYER_API);
      const data = await response.json();
      if (data.success) {
          fiatRates = data.quotes;
          Object.keys(fiatRates).forEach(key => fiatRates[key.slice(3)] = fiatRates[key]);
          delete fiatRates['USD'];
      } else {
          throw new Error(data.error.info);
      }
  } catch (error) {
      console.error('Error fetching fiat rates:', error);
      fiatRates = { ...mockFiatRates };
      showNotification('Using mock fiat rates due to API failure.');
  }
}

async function fetchCryptoRates() {
  try {
      const response = await fetch(COINGECKO_API);
      const data = await response.json();
      cryptoRates = {
          BTC: data.bitcoin.usd,
          ETH: data.ethereum.usd,
          XRP: data.ripple.usd,
          USDT: data.tether.usd,
          BNB: data.binancecoin.usd,
          ADA: data.cardano.usd,
          SOL: data.solana.usd,
          DOGE: data.dogecoin.usd,
          DOT: data.polkadot.usd,
          USD: 1
      };
  } catch (error) {
      console.error('Error fetching crypto rates:', error);
      cryptoRates = { ...mockCryptoRates };
      showNotification('Using mock crypto rates due to API failure.');
  }
}

function updateTicker() {
  const ticker = document.getElementById('ticker');
  const rates = [
      `USD/EUR: ${(fiatRates.EUR || mockFiatRates.EUR).toFixed(4)}`,
      `USD/GBP: ${(fiatRates.GBP || mockFiatRates.GBP).toFixed(4)}`,
      `USD/JPY: ${(fiatRates.JPY || mockFiatRates.JPY).toFixed(2)}`,
      `BTC/USD: ${(cryptoRates.BTC || mockCryptoRates.BTC).toFixed(2)}`
  ];
  ticker.innerHTML = rates.map(rate => `<span>${rate}</span>`).join('');
}

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('collapsed');
  localStorage.setItem('sidebarCollapsed', document.querySelector('.sidebar').classList.contains('collapsed'));
}

function toggleTool(toolId) {
  if (!pinnedTools.has(toolId)) {
      document.querySelectorAll('.all-tools .tool-card').forEach(card => card.style.display = 'none');
      document.getElementById(toolId).style.display = 'block';
  }
  document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`[onclick="toggleTool('${toolId}')"]`).classList.add('active');
  localStorage.setItem('activeTool', toolId);
}

function toggleCollapse(toolId) {
  const card = document.getElementById(toolId);
  card.classList.toggle('collapsed');
  const btn = card.querySelector('.tool-actions button:first-child i');
  btn.classList.toggle('fa-minus');
  btn.classList.toggle('fa-plus');
  localStorage.setItem(`collapsed-${toolId}`, card.classList.contains('collapsed'));
}

function toggleFavorite(toolId) {
  const btn = document.querySelector(`[onclick="toggleTool('${toolId}')"]`);
  btn.classList.toggle('favorite');
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  if (btn.classList.contains('favorite')) {
      if (!favorites.includes(toolId)) favorites.push(toolId);
  } else {
      const index = favorites.indexOf(toolId);
      if (index > -1) favorites.splice(index, 1);
  }
  localStorage.setItem('favorites', JSON.stringify(favorites));
}

function pinTool(toolId) {
  const card = document.getElementById(toolId);
  const pinnedContainer = document.getElementById('pinned-tools');
  const allContainer = document.getElementById('all-tools');
  if (pinnedTools.has(toolId)) {
      pinnedTools.delete(toolId);
      allContainer.appendChild(card);
      card.style.display = 'none';
  } else {
      pinnedTools.add(toolId);
      pinnedContainer.appendChild(card);
      card.style.display = 'block';
  }
  localStorage.setItem('pinnedTools', JSON.stringify([...pinnedTools]));
}

function toggleDarkMode() {
  document.body.classList.toggle('light-mode');
  localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
}

async function refreshAll() {
  lastUpdated = Date.now();
  await Promise.all([fetchFiatRates(), fetchCryptoRates()]);
  updateTicker();
  updateOverview();
  document.getElementById('last-updated').textContent = new Date().toLocaleTimeString();
}

function showSettings() {
  document.getElementById('settings-modal').style.display = 'flex';
}

function closeSettings() {
  document.getElementById('settings-modal').style.display = 'none';
}

function saveSettings() {
  const interval = parseInt(document.getElementById('refresh-interval').value) * 1000;
  if (autoRefreshInterval) clearInterval(autoRefreshInterval);
  autoRefreshInterval = setInterval(refreshAll, interval);
  document.getElementById('auto-refresh-status').textContent = `Every ${interval / 1000}s`;
  localStorage.setItem('refreshInterval', interval);
  closeSettings();
}

function showModal() {
  if (!localStorage.getItem('welcomeShown')) {
      document.getElementById('welcome-modal').style.display = 'flex';
      localStorage.setItem('welcomeShown', 'true');
  }
}

function closeModal() {
  document.getElementById('welcome-modal').style.display = 'none';
}

function searchTools() {
  const query = document.getElementById('tool-search').value.toLowerCase();
  document.querySelectorAll('.sidebar-btn').forEach(btn => {
      const text = btn.querySelector('span')?.textContent.toLowerCase() || '';
      btn.classList.toggle('hidden', !text.includes(query));
  });
}

function validateInput(value, min, errorElement, message) {
  if (!value || value < min) {
      errorElement.textContent = message;
      return false;
  }
  errorElement.textContent = '';
  return true;
}

function addToHistory(toolId, result) {
  const historyElement = document.getElementById(`${toolId}-history`);
  history[toolId].unshift(`${new Date().toLocaleTimeString()} - ${result}`);
  if (history[toolId].length > 5) history[toolId].pop();
  historyElement.innerHTML = `<button onclick="undoHistory('${toolId}')">Undo</button>` + 
      history[toolId].map(item => `<div>${item}</div>`).join('');
}

function undoHistory(toolId) {
  if (history[toolId].length) {
      history[toolId].shift();
      const historyElement = document.getElementById(`${toolId}-history`);
      historyElement.innerHTML = `<button onclick="undoHistory('${toolId}')">Undo</button>` + 
          history[toolId].map(item => `<div>${item}</div>`).join('');
      if (toolId === 'portfolio' && portfolio.length) {
          portfolio.shift();
          updatePortfolioResult();
          localStorage.setItem('portfolio', JSON.stringify(portfolio));
      }
  }
}

function exportResult(toolId) {
  const result = document.getElementById(`${toolId}-result`).textContent;
  if (result) {
      const blob = new Blob([result], { type: 'text/plain' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${toolId}-result-${Date.now()}.txt`;
      link.click();
  }
}

function exportAllHistory() {
  const allHistory = Object.entries(history).map(([toolId, entries]) => 
      `${toolId.toUpperCase()}:\n${entries.join('\n') || 'No history'}\n`
  ).join('\n');
  const blob = new Blob([allHistory], { type: 'text/plain' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `all-history-${Date.now()}.txt`;
  link.click();
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

function updateOverview() {
  const totalValue = portfolio.reduce((sum, item) => 
      sum + item.quantity * (cryptoRates[item.asset] || fiatRates[item.asset] || item.price), 0).toFixed(2);
  document.getElementById('overview-portfolio').textContent = `$${totalValue}`;
  document.getElementById('overview-btc').textContent = `$${cryptoRates.BTC ? cryptoRates.BTC.toFixed(2) : mockCryptoRates.BTC.toFixed(2)}`;
  document.getElementById('overview-usd-eur').textContent = fiatRates.EUR ? fiatRates.EUR.toFixed(2) : mockFiatRates.EUR.toFixed(2);
}

function convertCurrency() {
  const amount = parseFloat(document.getElementById('currency-amount').value);
  const from = document.getElementById('from-currency').value;
  const to = document.getElementById('to-currency').value;
  const errorElement = document.getElementById('currency-error');
  const resultElement = document.getElementById('currency-result');

  if (!validateInput(amount, 0, errorElement, 'Enter a valid amount > 0')) return;
  const rate = (fiatRates[to] || mockFiatRates[to]) / (fiatRates[from] || mockFiatRates[from]);
  const result = (amount * rate).toFixed(2);
  const resultText = `${amount} ${from} = ${result} ${to} (Rate: ${rate.toFixed(4)})`;
  resultElement.textContent = resultText;
  addToHistory('currency', resultText);
}

function showExchangeTrends() {
  const pair = document.getElementById('exchange-pair').value;
  const errorElement = document.getElementById('exchange-trends-error');
  const resultElement = document.getElementById('exchange-trends-result');

  const [base, target] = pair.split('-');
  const rate = (fiatRates[target] || mockFiatRates[target]) / (fiatRates[base] || mockFiatRates[base]);
  const resultText = `Trend for ${pair}: ${rate.toFixed(4)}`;
  resultElement.textContent = resultText;
  addToHistory('exchange-trends', resultText);
}

function convertCrypto() {
  const amount = parseFloat(document.getElementById('crypto-amount').value);
  const from = document.getElementById('from-crypto').value;
  const to = document.getElementById('to-crypto').value;
  const errorElement = document.getElementById('crypto-error');
  const resultElement = document.getElementById('crypto-result');

  if (!validateInput(amount, 0, errorElement, 'Enter a valid amount > 0')) return;
  const rate = (cryptoRates[to] || mockCryptoRates[to]) / (cryptoRates[from] || mockCryptoRates[from]);
  const result = (amount * rate).toFixed(4);
  const resultText = `${amount} ${from} = ${result} ${to} (Rate: ${rate.toFixed(4)})`;
  resultElement.textContent = resultText;
  addToHistory('crypto', resultText);
}

function showCryptoTrends() {
  const crypto = document.getElementById('crypto-trend').value;
  const errorElement = document.getElementById('crypto-trends-error');
  const resultElement = document.getElementById('crypto-trends-result');

  const price = cryptoRates[crypto] || mockCryptoRates[crypto];
  const resultText = `${crypto} Trend: $${price.toFixed(2)} USD`;
  resultElement.textContent = resultText;
  addToHistory('crypto-trends', resultText);
}

function calculateStockValue() {
  const symbol = document.getElementById('stock-symbol').value.trim().toUpperCase();
  const earnings = parseFloat(document.getElementById('earnings').value);
  const growthRate = parseFloat(document.getElementById('growth-rate').value);
  const discountRate = parseFloat(document.getElementById('discount-rate').value);
  const errorElement = document.getElementById('stock-error');
  const resultElement = document.getElementById('stock-result');

  if (!symbol) { errorElement.textContent = 'Enter a stock symbol'; return; }
  if (!validateInput(earnings, 0, errorElement, 'Enter valid earnings > 0')) return;
  if (!validateInput(growthRate, 0, errorElement, 'Enter valid growth rate ≥ 0')) return;
  if (!validateInput(discountRate, 0, errorElement, 'Enter valid discount rate > 0')) return;

  const growthFactor = 1 + growthRate / 100;
  const discountFactor = 1 + discountRate / 100;
  const intrinsicValue = (earnings * growthFactor * 10 / discountFactor).toFixed(2);
  const resultText = `${symbol} Intrinsic Value: $${intrinsicValue}`;
  resultElement.textContent = resultText;
  addToHistory('stocks', resultText);
}

function calculateCompound() {
  const principal = parseFloat(document.getElementById('principal').value);
  const rate = parseFloat(document.getElementById('rate').value);
  const years = parseFloat(document.getElementById('years').value);
  const frequency = parseInt(document.getElementById('frequency').value);
  const errorElement = document.getElementById('compound-error');
  const resultElement = document.getElementById('compound-result');

  if (!validateInput(principal, 0, errorElement, 'Enter valid principal > 0')) return;
  if (!validateInput(rate, 0, errorElement, 'Enter valid rate > 0')) return;
  if (!validateInput(years, 1, errorElement, 'Enter valid years ≥ 1')) return;

  const amount = principal * Math.pow(1 + (rate / 100 / frequency), frequency * years).toFixed(2);
  const resultText = `Future Value: $${amount} (Principal: $${principal}, ${years} years)`;
  resultElement.textContent = resultText;
  addToHistory('compound', resultText);
}

function updatePortfolioResult() {
  const totalValue = portfolio.reduce((sum, item) => 
      sum + item.quantity * (cryptoRates[item.asset] || fiatRates[item.asset] || item.price), 0).toFixed(2);
  document.getElementById('portfolio-result').textContent = `Portfolio Value: $${totalValue} (${portfolio.length} assets)`;
  updateOverview();
}

function addToPortfolio() {
  const asset = document.getElementById('portfolio-asset').value.trim().toUpperCase();
  const quantity = parseFloat(document.getElementById('portfolio-quantity').value);
  const price = parseFloat(document.getElementById('portfolio-price').value);
  const errorElement = document.getElementById('portfolio-error');
  const resultElement = document.getElementById('portfolio-result');

  if (!asset) { errorElement.textContent = 'Enter an asset symbol'; return; }
  if (!validateInput(quantity, 0, errorElement, 'Enter valid quantity > 0')) return;
  if (!validateInput(price, 0, errorElement, 'Enter valid price > 0')) return;

  portfolio.unshift({ asset, quantity, price });
  updatePortfolioResult();
  addToHistory('portfolio', `${asset}: ${quantity} @ $${price}`);
  localStorage.setItem('portfolio', JSON.stringify(portfolio));
}

function calculateTax() {
  const income = parseFloat(document.getElementById('tax-income').value);
  const rate = parseFloat(document.getElementById('tax-rate').value);
  const deductions = parseFloat(document.getElementById('tax-deductions').value) || 0;
  const errorElement = document.getElementById('tax-error');
  const resultElement = document.getElementById('tax-result');

  if (!validateInput(income, 0, errorElement, 'Enter valid income > 0')) return;
  if (!validateInput(rate, 0, errorElement, 'Enter valid tax rate > 0')) return;
  if (deductions < 0) { errorElement.textContent = 'Deductions cannot be negative'; return; }

  const taxableIncome = Math.max(income - deductions, 0);
  const tax = (taxableIncome * (rate / 100)).toFixed(2);
  const resultText = `Tax: $${tax} (Income: $${income}, Deductions: $${deductions})`;
  resultElement.textContent = resultText;
  addToHistory('tax', resultText);
}

function calculateLoan() {
  const amount = parseFloat(document.getElementById('loan-amount').value);
  const rate = parseFloat(document.getElementById('loan-rate').value);
  const years = parseFloat(document.getElementById('loan-years').value);
  const errorElement = document.getElementById('loan-error');
  const resultElement = document.getElementById('loan-result');

  if (!validateInput(amount, 0, errorElement, 'Enter valid loan amount > 0')) return;
  if (!validateInput(rate, 0, errorElement, 'Enter valid rate > 0')) return;
  if (!validateInput(years, 1, errorElement, 'Enter valid years ≥ 1')) return;

  const monthlyRate = rate / 100 / 12;
  const months = years * 12;
  const payment = (amount * monthlyRate * Math.pow(1 + monthlyRate, months)) / 
      (Math.pow(1 + monthlyRate, months) - 1);
  const totalPayment = (payment * months).toFixed(2);
  const totalInterest = (totalPayment - amount).toFixed(2);
  const resultText = `Monthly: $${payment.toFixed(2)} | Total: $${totalPayment} | Interest: $${totalInterest}`;
  resultElement.textContent = resultText;
  addToHistory('loan', resultText);
}

function calculateDividend() {
  const symbol = document.getElementById('dividend-symbol').value.trim().toUpperCase();
  const dividend = parseFloat(document.getElementById('dividend-amount').value);
  const price = parseFloat(document.getElementById('dividend-price').value);
  const errorElement = document.getElementById('dividend-error');
  const resultElement = document.getElementById('dividend-result');

  if (!symbol) { errorElement.textContent = 'Enter a stock symbol'; return; }
  if (!validateInput(dividend, 0, errorElement, 'Enter valid dividend > 0')) return;
  if (!validateInput(price, 0, errorElement, 'Enter valid price > 0')) return;

  const yield = ((dividend / price) * 100).toFixed(2);
  const resultText = `${symbol} Yield: ${yield}% (Dividend: $${dividend}, Price: $${price})`;
  resultElement.textContent = resultText;
  addToHistory('dividend', resultText);
}

function calculateBudget() {
  const income = parseFloat(document.getElementById('budget-income').value);
  const fixed = parseFloat(document.getElementById('budget-fixed').value) || 0;
  const variable = parseFloat(document.getElementById('budget-variable').value) || 0;
  const errorElement = document.getElementById('budget-error');
  const resultElement = document.getElementById('budget-result');

  if (!validateInput(income, 0, errorElement, 'Enter valid income > 0')) return;
  if (fixed < 0) { errorElement.textContent = 'Fixed expenses cannot be negative'; return; }
  if (variable < 0) { errorElement.textContent = 'Variable expenses cannot be negative'; return; }

  const totalExpenses = fixed + variable;
  const savings = (income - totalExpenses).toFixed(2);
  const resultText = `Savings: $${savings} (Income: $${income}, Expenses: $${totalExpenses})`;
  resultElement.textContent = resultText;
  addToHistory('budget', resultText);
  if (savings < 0) showNotification('Warning: Budget deficit detected!');
}

function calculateRetirement() {
  const savings = parseFloat(document.getElementById('retirement-savings').value) || 0;
  const contribution = parseFloat(document.getElementById('retirement-contribution').value) || 0;
  const rate = parseFloat(document.getElementById('retirement-rate').value);
  const years = parseFloat(document.getElementById('retirement-years').value);
  const errorElement = document.getElementById('retirement-error');
  const resultElement = document.getElementById('retirement-result');

  if (savings < 0) { errorElement.textContent = 'Savings cannot be negative'; return; }
  if (contribution < 0) { errorElement.textContent = 'Contribution cannot be negative'; return; }
  if (!validateInput(rate, 0, errorElement, 'Enter valid rate > 0')) return;
  if (!validateInput(years, 1, errorElement, 'Enter valid years ≥ 1')) return;

  let total = savings;
  for (let i = 0; i < years; i++) {
      total = (total + contribution) * (1 + rate / 100);
  }
  const resultText = `Retirement Fund: $${total.toFixed(2)} (Years: ${years})`;
  resultElement.textContent = resultText;
  addToHistory('retirement', resultText);
}

function calculateSavingsGoal() {
  const goal = parseFloat(document.getElementById('savings-goal-amount').value);
  const current = parseFloat(document.getElementById('savings-goal-current').value) || 0;
  const monthly = parseFloat(document.getElementById('savings-goal-monthly').value);
  const rate = parseFloat(document.getElementById('savings-goal-rate').value) || 0;
  const errorElement = document.getElementById('savings-goal-error');
  const resultElement = document.getElementById('savings-goal-result');

  if (!validateInput(goal, 0, errorElement, 'Enter valid goal amount > 0')) return;
  if (current < 0) { errorElement.textContent = 'Current savings cannot be negative'; return; }
  if (!validateInput(monthly, 0, errorElement, 'Enter valid monthly savings > 0')) return;
  if (rate < 0) { errorElement.textContent = 'Interest rate cannot be negative'; return; }

  let balance = current;
  let months = 0;
  const monthlyRate = rate / 100 / 12;
  while (balance < goal && months < 1200) { // Cap at 100 years
      balance = balance * (1 + monthlyRate) + monthly;
      months++;
  }
  const years = (months / 12).toFixed(1);
  const resultText = months < 1200 ? 
      `Goal reached in ${months} months (${years} years)` : 
      'Goal unreachable in 100 years';
  resultElement.textContent = resultText;
  addToHistory('savings-goal', resultText);
}

function calculateNetWorth() {
  const assets = parseFloat(document.getElementById('net-worth-assets').value) || 0;
  const liabilities = parseFloat(document.getElementById('net-worth-liabilities').value) || 0;
  const errorElement = document.getElementById('net-worth-error');
  const resultElement = document.getElementById('net-worth-result');

  if (assets < 0) { errorElement.textContent = 'Assets cannot be negative'; return; }
  if (liabilities < 0) { errorElement.textContent = 'Liabilities cannot be negative'; return; }

  const netWorth = (assets - liabilities).toFixed(2);
  const resultText = `Net Worth: $${netWorth} (Assets: $${assets}, Liabilities: $${liabilities})`;
  resultElement.textContent = resultText;
  addToHistory('net-worth', resultText);
}

function calculateInflation() {
  const amount = parseFloat(document.getElementById('inflation-amount').value);
  const rate = parseFloat(document.getElementById('inflation-rate').value);
  const years = parseFloat(document.getElementById('inflation-years').value);
  const errorElement = document.getElementById('inflation-error');
  const resultElement = document.getElementById('inflation-result');

  if (!validateInput(amount, 0, errorElement, 'Enter valid amount > 0')) return;
  if (!validateInput(rate, 0, errorElement, 'Enter valid inflation rate > 0')) return;
  if (!validateInput(years, 1, errorElement, 'Enter valid years ≥ 1')) return;

  const futureValue = (amount * Math.pow(1 + rate / 100, years)).toFixed(2);
  const resultText = `Future Value: $${futureValue} (Amount: $${amount}, ${years} years)`;
  resultElement.textContent = resultText;
  addToHistory('inflation', resultText);
}

function calculateRisk() {
  const amount = parseFloat(document.getElementById('risk-amount').value);
  const returnRate = parseFloat(document.getElementById('risk-return').value);
  const volatility = parseFloat(document.getElementById('risk-volatility').value);
  const years = parseFloat(document.getElementById('risk-years').value);
  const errorElement = document.getElementById('risk-error');
  const resultElement = document.getElementById('risk-result');

  if (!validateInput(amount, 0, errorElement, 'Enter valid investment > 0')) return;
  if (!validateInput(returnRate, 0, errorElement, 'Enter valid return rate > 0')) return;
  if (!validateInput(volatility, 0, errorElement, 'Enter valid volatility > 0')) return;
  if (!validateInput(years, 1, errorElement, 'Enter valid years ≥ 1')) return;

  const expectedReturn = amount * Math.pow(1 + returnRate / 100, years);
  const stdDev = volatility / 100 * expectedReturn;
  const lowerBound = (expectedReturn - stdDev).toFixed(2);
  const upperBound = (expectedReturn + stdDev).toFixed(2);
  const resultText = `Expected: $${expectedReturn.toFixed(2)} | Range: $${lowerBound} - $${upperBound} (${years} years)`;
  resultElement.textContent = resultText;
  addToHistory('risk', resultText);
}

// Initialization
(async () => {
  fiatRates = { ...mockFiatRates };
  cryptoRates = { ...mockCryptoRates };
  await Promise.all([fetchFiatRates(), fetchCryptoRates()]);
  updateTicker();
  updateOverview();
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') toggleDarkMode();
  const savedTool = localStorage.getItem('activeTool') || 'currency';
  toggleTool(savedTool);
  if (localStorage.getItem('sidebarCollapsed') === 'true') toggleSidebar();
  const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
  favorites.forEach(toggleFavorite);
  document.querySelectorAll('.tool-card').forEach(card => {
      const toolId = card.id;
      if (localStorage.getItem(`collapsed-${toolId}`) === 'true') toggleCollapse(toolId);
  });
  const savedPortfolio = JSON.parse(localStorage.getItem('portfolio') || '[]');
  portfolio.push(...savedPortfolio);
  if (portfolio.length) updatePortfolioResult();
  const savedPinned = JSON.parse(localStorage.getItem('pinnedTools') || '[]');
  savedPinned.forEach(pinTool);
  const savedInterval = localStorage.getItem('refreshInterval');
  if (savedInterval) {
      autoRefreshInterval = setInterval(refreshAll, savedInterval);
      document.getElementById('auto-refresh-status').textContent = `Every ${savedInterval / 1000}s`;
      document.getElementById('refresh-interval').value = savedInterval / 1000;
  }
  showModal();
})();

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey) {
      switch (e.key) {
          case '1': toggleTool('currency'); break;
          case '2': toggleTool('exchange-trends'); break;
          case '3': toggleTool('crypto'); break;
          case '4': toggleTool('crypto-trends'); break;
          case '5': toggleTool('stocks'); break;
          case '6': toggleTool('compound'); break;
          case '7': toggleTool('portfolio'); break;
          case '8': toggleTool('tax'); break;
          case '9': toggleTool('loan'); break;
          case '0': toggleTool('dividend'); break;
          case 'b': toggleTool('budget'); break;
          case 'r': toggleTool('retirement'); break;
          case 's': toggleTool('savings-goal'); break;
          case 'n': toggleTool('net-worth'); break;
          case 'i': toggleTool('inflation'); break;
          case 'k': toggleTool('risk'); break;
          case 'm': toggleDarkMode(); break;
          case 't': toggleSidebar(); break;
          case 'e': refreshAll(); break;
          case ',': showSettings(); break;
          case 'x': exportAllHistory(); break;
      }
  }
});