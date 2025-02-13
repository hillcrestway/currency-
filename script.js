document.addEventListener("DOMContentLoaded", function () {
    console.log("✅ Script Loaded: DOM is ready!");

    const API_URL = "https://api.frankfurter.app";
    const COINGECKO_URL = "https://api.coingecko.com/api/v3/simple/price";

    // 🎯 Currency Converter
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
            console.error("❌ Error fetching currencies:", error);
        }
    }

    async function convertCurrency() {
        let amountInput = document.getElementById("amount");
        let fromCurrency = document.getElementById("fromCurrency").value;
        let toCurrency = document.getElementById("toCurrency").value;

        if (!amountInput || !amountInput.value) {
            alert("Please enter an amount.");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/latest?amount=${amountInput.value}&from=${fromCurrency}&to=${toCurrency}`);
            const data = await response.json();
            const rate = data.rates[toCurrency];
            const result = amountInput.value * rate;

            document.getElementById("currencyResult").innerText = `${amountInput.value} ${fromCurrency} = ${result.toFixed(2)} ${toCurrency}`;
        } catch (error) {
            console.error("❌ Error fetching conversion rate:", error);
            alert("Failed to fetch exchange rate. Try again later.");
        }
    }
    // Initialize currency dropdowns
    populateCurrencies();
});