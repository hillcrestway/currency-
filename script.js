const API_URL = "https://api.frankfurter.app";
let chartInstance = null;

// Populate currency dropdowns
async function populateCurrencies() {
    try {
        const response = await fetch(`${API_URL}/currencies`);
        const data = await response.json();
        const currencyOptions = Object.keys(data);

        let fromSelect = document.getElementById("fromCurrency");
        let toSelect = document.getElementById("toCurrency");

        currencyOptions.forEach(currency => {
            let option1 = new Option(currency, currency);
            let option2 = new Option(currency, currency);
            fromSelect.appendChild(option1);
            toSelect.appendChild(option2);
        });

        fromSelect.value = "USD";
        toSelect.value = "EUR";
    } catch (error) {
        console.error("Error fetching currencies:", error);
    }
}

// Convert currency
async function convertCurrency() {
    const amount = document.getElementById("amount").value;
    const fromCurrency = document.getElementById("fromCurrency").value;
    const toCurrency = document.getElementById("toCurrency").value;

    if (!amount) {
        alert("Please enter an amount");
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
        console.error("Error fetching conversion rate:", error);
        alert("Failed to fetch exchange rate. Try again later.");
    }
}

// Fetch last 10 days of exchange rate data
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
        console.error("Error fetching historical data:", error);
    }
}

// Update the chart
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



// Initialize
document.addEventListener("DOMContentLoaded", populateCurrencies);