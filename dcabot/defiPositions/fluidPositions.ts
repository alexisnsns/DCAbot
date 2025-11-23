import { ethers } from "ethers";

import {
  ERC20_ABI,
  FLUID_VAULT_ADDRESS_USDC_ARB,
} from "../../utils/resources.js";

import { wallets, providers } from "../../utils/ethersUtils.js";

const userAddress = await wallets["ARBITRUM"].getAddress();

export async function getUserFluidPositions() {
  // Contract for the USDC Fluid Morpho vault (Arbitrum only)
  const contract = new ethers.Contract(
    FLUID_VAULT_ADDRESS_USDC_ARB,
    ERC20_ABI,
    providers["ARBITRUM"]
  );

  // Raw on-chain balance
  const rawBalance = await contract.balanceOf(userAddress);

  // Convert units (USDC = 6 decimals)
  const balance = ethers.formatUnits(rawBalance, 6);

  const result = {
    chain: "ARBITRUM",
    balance,
  };

  // If the user has nothing, return empty array
  if (balance === "0.0") {
    // console.log([]);
    return [];
  }

  // console.log([result]);
  return [result];
}

// getUserFluidPositions();
