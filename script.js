document.addEventListener("DOMContentLoaded", function () {
  console.log("✅ Script Loaded: DOM is ready!");

  const API_URL = "https://api.frankfurter.app";
  const CRYPTO_API_URL = "https://api.coingecko.com/api/v3/simple/price";
  let chartInstance = null;

  // 🏦 Populate Currency Dropdowns
  async function populateCurrencies() {
      try {
          const response = await fetch(`${API_URL}/currencies`);
          const data = await response.json();
          const currencyOptions = Object.keys(data);

          let fromSelect = document.getElementById("fromCurrency");
          let toSelect = document.getElementById("toCurrency");

          currencyOptions.forEach(currency => {
              fromSelect.appendChild(new Option(currency, currency));
              toSelect.appendChild(new Option(currency, currency));
          });

          fromSelect.value = "USD";
          toSelect.value = "EUR";
      } catch (error) {
          console.error("❌ Error fetching currencies:", error);
      }
  }

  // 💱 Convert Currency (Fiat-to-Fiat)
  async function convertCurrency() {
      const amount = document.getElementById("amount").value;
      const fromCurrency = document.getElementById("fromCurrency").value;
      const toCurrency = document.getElementById("toCurrency").value;

      if (!amount) {
          alert("Please enter an amount.");
          return;
      }

      try {
          const response = await fetch(`${API_URL}/latest?amount=${amount}&from=${fromCurrency}&to=${toCurrency}`);
          const data = await response.json();
          const rate = data.rates[toCurrency];
          const result = amount * rate;

          document.getElementById("result").innerText = `${amount} ${fromCurrency} = ${result.toFixed(2)} ${toCurrency}`;

          fetchHistoricalData(fromCurrency, toCurrency);
      } catch (error) {
          console.error("❌ Error fetching conversion rate:", error);
          alert("Failed to fetch exchange rate.");
      }
  }

  // 📊 Fetch Last 10 Days Exchange Rate Data
  async function fetchHistoricalData(fromCurrency, toCurrency) {
      const days = 10;
      const labels = [];
      const dataPoints = [];

      let endDate = new Date();
      let startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      let startStr = startDate.toISOString().split("T")[0];
      let endStr = endDate.toISOString().split("T")[0];

      try {
          const response = await fetch(`${API_URL}/${startStr}..${endStr}?from=${fromCurrency}&to=${toCurrency}`);
          const data = await response.json();

          Object.keys(data.rates).forEach(date => {
              labels.push(date);
              dataPoints.push(data.rates[date][toCurrency]);
          });

          updateChart(labels, dataPoints);
      } catch (error) {
          console.error("❌ Error fetching historical data:", error);
      }
  }

  // 📈 Update Chart
  function updateChart(labels, data) {
      let ctx = document.getElementById("exchangeChart").getContext("2d");

      if (chartInstance) {
          chartInstance.destroy();
      }

      chartInstance = new Chart(ctx, {
          type: "line",
          data: {
              labels: labels,
              datasets: [{
                  label: "Exchange Rate Trend",
                  data: data,
                  borderColor: "#ff4b5c",
                  backgroundColor: "rgba(255, 75, 92, 0.2)",
                  borderWidth: 3,
                  pointBackgroundColor: "#ff4b5c",
                  fill: true,
                  tension: 0.4
              }]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: { labels: { font: { size: 14, weight: "bold" } } },
                  tooltip: { backgroundColor: "#222", titleFont: { size: 16, weight: "bold" }, bodyFont: { size: 14 }, padding: 10, displayColors: false }
              },
              scales: {
                  x: { ticks: { font: { size: 13 } }, grid: { display: false } },
                  y: { ticks: { font: { size: 13 } }, grid: { color: "rgba(0, 0, 0, 0.1)", lineWidth: 1 } }
              }
          }
      });
  }

  // 🪙 Convert Crypto <-> Fiat
  async function convert(direction) {
      const amount = document.getElementById("amount").value;
      const currency = document.getElementById("currency").value;
      const crypto = document.getElementById("crypto").value;

      if (!amount) {
          alert("Please enter an amount.");
          return;
      }

      try {
          const response = await fetch(`${CRYPTO_API_URL}?ids=${crypto}&vs_currencies=${currency}`);
          const data = await response.json();
          console.log("🔍 API Response:", data);

          if (!data[crypto] || !data[crypto][currency]) {
              alert("Error fetching exchange rate. Try again later.");
              return;
          }

          const rate = data[crypto][currency];
          let result;

          if (direction === 'crypto-to-fiat') {
              result = (amount * rate).toFixed(2) + ` ${currency.toUpperCase()}`;
          } else {
              result = (amount / rate).toFixed(6) + ` ${crypto.toUpperCase()}`;
          }

          document.getElementById("result").innerText = `Converted Amount: ${result}`;
      } catch (error) {
          console.error("❌ Error fetching conversion rate:", error);
          alert("Failed to fetch conversion rate.");
      }
  }

  // 🛠 Attach Functions to Global Scope
  window.convertCurrency = convertCurrency;
  window.convert = convert;

  // 🔥 Initialize
  populateCurrencies();
});