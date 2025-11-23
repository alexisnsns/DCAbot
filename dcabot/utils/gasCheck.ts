import { ethers } from "ethers";
import { wallets, providers } from "../../utils/ethersUtils.js";

const COINGECKO_IDS = {
  BASE: "ethereum",
  ARBITRUM: "ethereum",
  POLYGON: "matic-network",
  OPTIMISM: "ethereum",
  SCROLL: "ethereum",
};

const CHAINNAME = "POLYGON";
const userAddress = await wallets[CHAINNAME].getAddress();

async function fetchPrices() {
  const ids = Object.values(COINGECKO_IDS).filter(
    (v, i, arr) => arr.indexOf(v) === i
  ); // unique values
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(
    ","
  )}&vs_currencies=usd`;

  const res = await fetch(url);
  const data = await res.json();
  return data; // e.g. { ethereum: { usd: 3421.12 }, "matic-network": { usd: 0.75 } }
}

export async function getUserNativeUSDValuesSingleChain(chain: string) {
  try {
    const prices = await fetchPrices();

    const provider = providers[chain.toUpperCase()];
    if (!provider) throw new Error(`No provider for ${chain}`);

    const rawBalance = await provider.getBalance(userAddress);
    const balance = parseFloat(ethers.formatEther(rawBalance));

    const tokenId = COINGECKO_IDS[chain.toUpperCase()];

    const price = prices[tokenId]?.usd || 0;
    const usdValue = balance * price;

    return usdValue;
  } catch (err) {
    console.error("Error getting balances in USD:", err);
    throw err;
  }
}

// getUserNativeUSDValuesSingleChain("OPTIMISM");

// export async function getUserNativeUSDValues() {
//   try {
//     const prices = await fetchPrices();

//     const balancePromises = CHAINS.map(async (chain) => {
//       const provider = providers[chain];
//       if (!provider) throw new Error(`No provider for ${chain}`);

//       const rawBalance = await provider.getBalance(userAddress);
//       const balance = parseFloat(ethers.formatEther(rawBalance));

//       const tokenId = COINGECKO_IDS[chain];
//       const price = prices[tokenId]?.usd || 0;
//       const usdValue = (balance * price).toFixed(2);

//       return {
//         chain,
//         usdValue,
//       };
//     });

//     const results = await Promise.all(balancePromises);

//     const filtered = results.filter(({ usdValue }) => usdValue !== "0.00");

//     return filtered;
//   } catch (err) {
//     console.error("Error getting balances in USD:", err);
//     throw err;
//   }
// }

// getUserNativeUSDValues();
