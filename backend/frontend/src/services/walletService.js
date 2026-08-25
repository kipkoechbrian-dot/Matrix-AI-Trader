import api from "./api";

export async function getWallet() {
    const response = await api.get("/wallet");
    return response.data;
}

export async function deposit(amount) {
    const response = await api.post(`/wallet/deposit/${amount}`);
    return response.data;
}

export async function withdraw(amount) {
    const response = await api.post(`/wallet/withdraw/${amount}`);
    return response.data;
}

export async function getWalletHistory() {
    const response = await api.get("/wallet/history");
    return response.data;
}
