import axios from "axios";
import { ethers } from "ethers";
import {
  _USDC,
  _RETH,
  PROXYTRANSFER,
  PUBLICKEY,
  ARBITRUM_CHAIN_ID,
} from "../utils/resources.js";
import { ARBITRUM_PROVIDER, ARBITRUM_WALLET } from "../utils/ethersUtils.js";
import fs from "fs";
const ABI = JSON.parse(
  fs.readFileSync(new URL("../abi.json", import.meta.url), "utf8")
);

// Paraswap
const fetchApiUrl = "https://apiv5.paraswap.io/prices";
const transactApiUrl = `https://apiv5.paraswap.io/transactions/42161`;

// 1 USDC = "100000" (USDC has 6 decimals)
// const srcValue = "100000";

// USDC Contract
const usdcContract = new ethers.Contract(_USDC.address, ABI, ARBITRUM_WALLET);

// async function checkAllowance() {
//   try {
//     console.log("checking allowance:");
//     const allowance = await usdcContract.allowance(PUBLICKEY, PROXYTRANSFER);
//     console.log(`Allowance for spender from owner is: ${allowance}`);
//   } catch (error) {
//     console.error("Error fetching allowance:", error);
//   }
// }

// async function setAllowance(amount: number) {
//   const amountToApprove = ethers.parseUnits(amount.toString(), _USDC.decimals);

//   console.log(
//     `Setting allowance for ${PROXYTRANSFER} to spend ${amount} tokens...`
//   );

//   try {
//     const tx = await usdcContract.approve(PROXYTRANSFER, amountToApprove);

//     console.log(`Approval transaction sent: ${tx.hash}`);

//     await tx.wait();
//     console.log("Allowance set successfully.");
//   } catch (error) {
//     console.error("Error setting allowance:", error);
//   }
// }

async function fetchPrice(amount: bigint) {
  const fetchParams = {
    srcToken: _USDC.address,
    srcDecimals: _USDC.decimals,
    destToken: _RETH.address,
    destDecimals: _RETH.decimals,
    amount: amount, // "100000"
    side: "SELL",
    network: ARBITRUM_CHAIN_ID,
  };

  try {
    const response = await axios.get(fetchApiUrl, { params: fetchParams });

    const srcAmountHuman = ethers.formatUnits(
      BigInt(fetchParams.amount),
      fetchParams.srcDecimals
    );

    const destAmountHuman = ethers.formatUnits(
      BigInt(response.data.priceRoute.destAmount),
      response.data.priceRoute.destDecimals
    );

    console.log(
      `Paraswap quote: ${srcAmountHuman} ${_USDC.symbol} → ${destAmountHuman} ${_RETH.symbol}`
    );

    console.log("Gas USD cost:", response.data.priceRoute.gasCostUSD);

    return response.data.priceRoute;
  } catch (error) {
    console.error("Error fetching price:", error);
  }
}

async function buildTransaction(amount: string) {
  const amountWei = ethers.parseUnits(amount, _USDC.decimals);

  console.log("Amount to swap:", amountWei.toString());

  //
  // 0. Check Allowance
  //
  const currentAllowance: bigint = await usdcContract.allowance(
    PUBLICKEY,
    PROXYTRANSFER
  );

  console.log("Current allowance:", currentAllowance.toString());

  if (currentAllowance < amountWei) {
    console.log(
      `Allowance too low. Need ${amountWei}, have ${currentAllowance}. Approving...`
    );

    const approveTx = await usdcContract.approve(PROXYTRANSFER, amountWei);
    console.log("Approval tx:", approveTx.hash);

    await approveTx.wait();
    console.log("Approval confirmed.");
  } else {
    console.log("Sufficient allowance. No approval needed.");
  }

  //
  // 1. Fetch Paraswap price route
  //
  const priceRoute = await fetchPrice(amountWei);
  if (!priceRoute) {
    console.log("Cannot build tx: no priceRoute.");
    throw Error;
  }

  // console.log(priceRoute);

  const srcUSD = Number(priceRoute.srcUSD);
  const destUSD = Number(priceRoute.destUSD);

  const diff = (destUSD - srcUSD) / srcUSD;

  console.log(
    `Src: ${srcUSD}, Dest: ${destUSD}, final diff: ${diff.toFixed(6)} $`
  );
  if (diff < -0.01) {
    console.log("❌ Price impact too high. Abort tx.");
    throw Error;
  }

  //
  // 2. Build Paraswap transaction
  //
  const txParams = {
    srcToken: _USDC.address,
    srcDecimals: _USDC.decimals,
    destToken: _RETH.address,
    destDecimals: _RETH.decimals,
    srcAmount: amountWei.toString(),
    priceRoute,
    slippage: 50,
    userAddress: PUBLICKEY,
    // TODO: REMOVE THESE FLAGS IN PRODUCTION
    // ignoreChecks: true,
  };

  const block = await ARBITRUM_PROVIDER.getBlock("latest");
  const baseFee = block.baseFeePerGas;

  try {
    const response = await axios.post(transactApiUrl, txParams, {
      params: { gasPrice: baseFee },
    });

    // console.log("Paraswap tx data:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error calling Paraswap /transactions:", error);
    return null;
  }
}

export async function sendTransaction(amount: string) {
  try {
    const txParams = await buildTransaction(amount);
    if (!txParams) {
      console.log("No tx params. Aborting.");
      return;
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
  } catch (error) {
    console.error("Error sending tx:", error);
  }
}

// await buildTransaction("0.1");
// await checkAllowance();
// await setAllowance(1);
// await sendTransaction();
