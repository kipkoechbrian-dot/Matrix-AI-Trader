import api from "./api";

export async function getWallet() {
    const response = await api.get("/wallet");
    return response.data;
}