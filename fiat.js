const cryptoList = {
    "Bitcoin (BTC)": "bitcoin",
    "Ethereum (ETH)": "ethereum",
    "Ripple (XRP)": "ripple",
    "Litecoin (LTC)": "litecoin",
    "Cardano (ADA)": "cardano"
};

const currencyList = {
    "US Dollar (USD)": "usd",
    "Euro (EUR)": "eur",
    "British Pound (GBP)": "gbp",
    "Japanese Yen (JPY)": "jpy",
    "Brazilian Real (BRL)": "brl"
};

// Populate dropdowns when page loads
document.addEventListener("DOMContentLoaded", function () {
    populateDropdown(document.getElementById("fromCurrency"), { ...currencyList, ...cryptoList });
    populateDropdown(document.getElementById("toCurrency"), { ...currencyList, ...cryptoList });
});

function populateDropdown(dropdown, options) {
    for (let key in options) {
        let opt = document.createElement("option");
        opt.value = options[key];
        opt.textContent = key;
        dropdown.appendChild(opt);
    }
}

async function convert() {
    const amount = parseFloat(document.getElementById("amount").value);
    const from = document.getElementById("fromCurrency").value;
    const to = document.getElementById("toCurrency").value;
    const resultElement = document.getElementById("result");

    if (!amount || amount <= 0) {
        resultElement.textContent = "Please enter a valid amount.";
        return;
    }

    let apiUrl;
    let isFiatToCrypto = currencyList[getKeyByValue(currencyList, from)] && cryptoList[getKeyByValue(cryptoList, to)];
    let isCryptoToFiat = cryptoList[getKeyByValue(cryptoList, from)] && currencyList[getKeyByValue(currencyList, to)];

    if (isFiatToCrypto) {
        apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${to}&vs_currencies=${from}`;
    } else if (isCryptoToFiat) {
        apiUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${from}&vs_currencies=${to}`;
    } else {
        resultElement.textContent = "Invalid conversion type. Please select a valid currency/crypto pair.";
        return;
    }

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) throw new Error("Failed to fetch data");

        const data = await response.json();
        let rate;

        if (isFiatToCrypto) {
            rate = 1 / data[to][from]; // Invert rate for fiat → crypto
        } else {
            rate = data[from][to]; // Crypto → fiat direct conversion
        }

        resultElement.textContent = `${amount} ${getKeyByValue({ ...currencyList, ...cryptoList }, from)} = ${(amount * rate).toFixed(6)} ${getKeyByValue({ ...currencyList, ...cryptoList }, to)}`;
    } catch (error) {
        console.error("Error fetching exchange rate:", error);
        resultElement.textContent = "Error fetching exchange rate. Try again later.";
    }
}

function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
}