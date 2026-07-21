import os
import requests
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("TWELVE_DATA_API_KEY")


def get_live_price(symbol: str):
    url = "https://api.twelvedata.com/price"

    params = {
        "symbol": symbol,
        "apikey": API_KEY
    }

    response = requests.get(url, params=params)
    data = response.json()

    print(data)

    if "price" not in data:
        return None

    return {
        "symbol": symbol,
        "price": float(data["price"])
    }