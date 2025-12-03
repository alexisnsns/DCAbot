import axios from "axios";
import { ethers } from "ethers";
import fs from "fs";

import {
  _USDC,
  _RETH,
  _AAVE,
  PROXYTRANSFER,
  ARBITRUM_CHAIN_ID,
} from "../utils/resources.js";

import { ARBITRUM_PROVIDER, ARBITRUM_WALLET } from "../utils/ethersUtils.js";

const ABI = JSON.parse(
  fs.readFileSync(new URL("../abi.json", import.meta.url), "utf8")
);

// Paraswap endpoints
const fetchApiUrl = "https://apiv5.paraswap.io/prices";
const transactApiUrl = `https://apiv5.paraswap.io/transactions/42161`;

// USDC Contract
const usdcContract = new ethers.Contract(_USDC.address, ABI, ARBITRUM_WALLET);

// Token type
export type Token = {
  address: string;
  decimals: number;
  symbol: string;
};

// Slice allocation type
export type TokenAllocation = {
  token: Token;
  percentage: number; // 0-100
};

// ----------------------------
// 1. Compute allocations
// ----------------------------
function computeAllocations(
  totalAmount: string,
  allocations: TokenAllocation[]
) {
  const total = Number(totalAmount);
  return allocations.map(({ token, percentage }) => ({
    token,
    amount: (total * (percentage / 100)).toFixed(6), // string
  }));
}

// ----------------------------
// 2. Fetch Paraswap price
// ----------------------------
async function fetchPrice(amount: bigint, destToken: Token) {
  const fetchParams = {
    srcToken: _USDC.address,
    srcDecimals: _USDC.decimals,
    destToken: destToken.address,
    destDecimals: destToken.decimals,
    amount: amount.toString(),
    side: "SELL",
    network: ARBITRUM_CHAIN_ID,
  };

  try {
    const response = await axios.get(fetchApiUrl, { params: fetchParams });

    const srcAmountHuman = ethers.formatUnits(amount, _USDC.decimals);
    const destAmountHuman = ethers.formatUnits(
      BigInt(response.data.priceRoute.destAmount),
      response.data.priceRoute.destDecimals
    );

    console.log(
      `Paraswap quote: ${srcAmountHuman} ${_USDC.symbol} → ${destAmountHuman} ${destToken.symbol}`
    );

    console.log("Gas USD cost:", response.data.priceRoute.gasCostUSD);

    return response.data.priceRoute;
  } catch (error) {
    console.error("Error fetching price:", error);
    throw error;
  }
}

// ----------------------------
// 3. Build tx for a single token
// ----------------------------
async function buildTransaction(amount: string, destToken: Token, userAddress: string) {
  const amountWei = ethers.parseUnits(amount, _USDC.decimals);

  console.log("Amount to swap:", amountWei.toString());

  // 0. Check allowance
  const currentAllowance: bigint = await usdcContract.allowance(
    userAddress,
    PROXYTRANSFER
  );
  console.log("Current allowance:", currentAllowance.toString());

  if (currentAllowance < amountWei) {
    console.log(
      `Allowance too low. Need ${amountWei}, have ${currentAllowance}. Approving 10x the amount...`
    );
    const approveTx = await usdcContract.approve(PROXYTRANSFER, amountWei * 10n);
    console.log("Approval tx:", approveTx.hash);
    await approveTx.wait();
    console.log("Approval confirmed.");
  } else {
    console.log("Sufficient allowance. No approval needed.");
  }

  // 1. Fetch price route
  const priceRoute = await fetchPrice(amountWei, destToken);
  if (!priceRoute) {
    console.log("Cannot build tx: no priceRoute.");
    throw new Error("No price route");
  }

  // 2. Price impact check
  const srcUSD = Number(priceRoute.srcUSD);
  const destUSD = Number(priceRoute.destUSD);
  const diff = (destUSD - srcUSD) / srcUSD;

  console.log(
    `Src: ${srcUSD}, Dest: ${destUSD}, final diff: ${diff.toFixed(6)}%`
  );
  if (diff < -0.02) {
    console.log("❌ Price impact too high. Abort tx.");
    throw new Error("Price impact too high");
  }

  // 3. Build transaction
  const txParams = {
    srcToken: _USDC.address,  
    srcDecimals: _USDC.decimals,
    destToken: destToken.address,
    destDecimals: destToken.decimals,
    srcAmount: amountWei.toString(),
    priceRoute,
    slippage: 50, // 0.5% slippage
    userAddress: userAddress,
  };

  const block = await ARBITRUM_PROVIDER.getBlock("latest");
  const baseFee = block.baseFeePerGas;

  try {
    const response = await axios.post(transactApiUrl, txParams, {
      params: { gasPrice: baseFee },
    });
    return response.data;
  } catch (error) {
    console.error("Error calling Paraswap /transactions:", error);
    return null;
  }
}

// ----------------------------
// 4. Send tx for a single token
// ----------------------------
export async function sendTransaction(amount: string, destToken: Token, userAddress: string) {
  const txParams = await buildTransaction(amount, destToken, userAddress);
  if (!txParams) {
    console.log("No tx params. Aborting.");
    throw new Error("No tx params returned from buildTransaction");
  }

  const feeData = await ARBITRUM_PROVIDER.getFeeData();

  const txDetails = {
    to: txParams.to,
    data: txParams.data,
    value: 0n,
    gasLimit: BigInt(txParams.gas),
    maxFeePerGas: feeData.maxFeePerGas ?? 0n,
    maxPriorityFeePerGas: feeData.maxPriorityFeePerGas ?? 0n,
  };

  const txResponse = await ARBITRUM_WALLET.sendTransaction(txDetails);
  console.log(`Transaction hash: ${txResponse.hash}`);

  const receipt = await txResponse.wait();
  console.log(`Confirmed in block: ${receipt.blockNumber}`);
}

// ----------------------------
// 5. Swap USDC by ratio
// ----------------------------
export async function swapUSDCByRatio(
  totalAmount: string,
  allocations: TokenAllocation[],
  userAddress: string
) {
  const slices = computeAllocations(totalAmount, allocations);

  for (const slice of slices) {
    console.log(`\nSwapping ${slice.amount} USDC → ${slice.token.symbol}`);
    try {
      await sendTransaction(slice.amount, slice.token, userAddress);
    } catch (error) {
      console.error(`Transaction failed for ${slice.token.symbol}:`, error);
      throw error; // Re-throw to stop processing remaining transactions
    }
  }
}
