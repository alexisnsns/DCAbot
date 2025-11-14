import axios from "axios";
import crypto from "crypto";
import { ethers } from "ethers";
import { _USDC, _RETH, PROXYTRANSFER, PUBLICKEY } from "../utils/resources.js";
import { ARBITRUM_PROVIDER, ARBITRUM_WALLET } from "../utils/ethersUtils.js";
import fs from "fs";
const ABI = JSON.parse(
  fs.readFileSync(new URL("../abi.json", import.meta.url), "utf8")
);

interface IERC20 extends ethers.BaseContract {
  approve(spender: string, amount: bigint): Promise<ethers.TransactionResponse>;
  allowance(owner: string, spender: string): Promise<bigint>;
}

// Paraswap
const fetchApiUrl = "https://apiv5.paraswap.io/prices";
const transactApiUrl = `https://apiv5.paraswap.io/transactions/42161`;

// 1 USDC = "100000" (USDC has 6 decimals)
const srcValue = "100000";

// USDC Contract
const usdcContract = new ethers.Contract(
  _USDC.address,
  ABI,
  ARBITRUM_PROVIDER
) as unknown as IERC20;

async function checkAllowance() {
  try {
    console.log("checking allowance:");
    const allowance = await usdcContract.allowance(PUBLICKEY, PROXYTRANSFER);
    console.log(`Allowance for spender from owner is: ${allowance}`);
  } catch (error) {
    console.error("Error fetching allowance:", error);
  }
}

async function setAllowance(amount: number) {
  const usdcContract = new ethers.Contract(
    "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
    ABI,
    ARBITRUM_WALLET
  );

  console.log("INTHERE!!");

  const amountToApprove = ethers.parseUnits(amount.toString(), _USDC.decimals);

  console.log(
    `Setting allowance for ${PROXYTRANSFER} to spend ${amount} tokens...`
  );

  try {
    const tx = await usdcContract.approve(PROXYTRANSFER, amountToApprove);

    console.log(`Approval transaction sent: ${tx.hash}`);

    await tx.wait();
    console.log("Allowance set successfully.");
  } catch (error) {
    console.error("Error setting allowance:", error);
  }
}

async function fetchPrice() {
  const fetchParams = {
    srcToken: _USDC.address,
    srcDecimals: _USDC.decimals,
    destToken: _RETH.address,
    destDecimals: _RETH.decimals,
    amount: srcValue, // "100000"
    side: "SELL",
    network: "42161",
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
      `Paraswap: ${srcAmountHuman} ${_USDC.symbol} → ${destAmountHuman} ${_RETH.symbol}`
    );

    console.log("Gas USD cost:", response.data.priceRoute.gasCostUSD);

    return response.data.priceRoute;
  } catch (error) {
    console.error("Error fetching price:", error);
  }
}

async function buildTransaction() {
  try {
    const priceRoute = await fetchPrice();
    if (!priceRoute) {
      console.log("Cannot build tx: no priceRoute.");
      return null;
    }

    const txParams = {
      srcToken: _USDC.address,
      srcDecimals: _USDC.decimals,
      destToken: _RETH.address,
      destDecimals: _RETH.decimals,
      srcAmount: srcValue,
      priceRoute,
      slippage: 50,
      userAddress: PUBLICKEY,
    };

    const response = await axios.post(transactApiUrl, txParams, {
      params: { gasPrice: "100" },
    });

    console.log("Transaction Data:", response.data);
    return response.data;
  } catch (error) {
    console.error("Error building transaction:", error);
    return null;
  }
}

async function sendTransaction() {
  try {
    const txParams = await buildTransaction();
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
      gasPrice: feeData.gasPrice ?? 0n, // correct for ethers v6
    };

    const txResponse = await ARBITRUM_WALLET.sendTransaction(txDetails);
    console.log(`Transaction hash: ${txResponse.hash}`);

    const receipt = await txResponse.wait();
    console.log(`Confirmed in block: ${receipt.blockNumber}`);
  } catch (error) {
    console.error("Error sending tx:", error);
  }
}

// await buildTransaction();
// await checkAllowance()
// await setAllowance(1);
await sendTransaction();
