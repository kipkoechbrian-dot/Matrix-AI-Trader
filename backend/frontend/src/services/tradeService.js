import api from "./api";

export async function getTrades() {
    const response = await api.get("/trades");
    return response.data;
}

export async function getDashboard() {
    const response = await api.get("/dashboard");
    return response.data;
}

export async function getStats() {
    const response = await api.get("/stats");
    return response.data;
}

export async function getAISignal(symbol = "EURUSD") {
    const response = await api.get(
        `/ai/signal/${symbol}`
    );

    return response.data;
}

export async function openTrade(data) {
    const response = await api.post(
        "/trade/open",
        data
    );

    return response.data;
}

export async function closeTrade(trade_id, exit_price) {
    const response = await api.post(
        "/trade/close",
        {
            trade_id,
            exit_price
        }
    );

    return response.data;
}

export async function getMarketPrice(symbol) {
    const response = await api.get(
        `/market/${symbol}`
    );

    return response.data;
}