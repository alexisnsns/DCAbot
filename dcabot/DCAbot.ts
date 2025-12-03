import { ethers } from "ethers";
import { getUserFluidPositions } from "./defiPositions/fluidPositions.js";
import { withdrawUSDCFromFluidMorpho } from "./withdrawFluidMorpho.js";
import { swapUSDCByRatio, TokenAllocation } from "./paraswap.js";
import { _USDC, _RETH, _AAVE, ERC20_ABI } from "../utils/resources.js";
import { wallets, providers } from "../utils/ethersUtils.js";


// Amount to swap in USDC
const amount = 1;
const chain = "ARBITRUM";

// Allocations of the swap in percentages
const allocations: TokenAllocation[] = [
  { token: _RETH, percentage: 60 },
  { token: _AAVE, percentage: 40 },
];

async function getUSDCBalance(userAddress: string): Promise<string> {
  const provider = providers[chain];

  const usdcContract = new ethers.Contract(
    _USDC.address,
    ERC20_ABI,
    provider
  );

  const rawBalance = await usdcContract.balanceOf(userAddress);
  const balance = ethers.formatUnits(rawBalance, _USDC.decimals);

  return balance;
}

const optimize = async () => {
  try {
    const wallet = wallets[chain];
    const userAddress = await wallet.getAddress();

    const positions = await getUserFluidPositions();

    console.log(
      "Current Fluid tokens (careful, price of the yield token is not the USD value):",
      positions
    );

    // Check if wallet already has sufficient USDC
    const usdcBalance = await getUSDCBalance(userAddress);
    const requiredAmount = amount.toString();

    console.log(`Current USDC balance: ${usdcBalance}`);
    console.log(`Required USDC amount: ${requiredAmount}`);

    if (parseFloat(usdcBalance) < parseFloat(requiredAmount)) {
      console.log("Insufficient USDC balance, withdrawing from Fluid Morpho...");
      await withdrawUSDCFromFluidMorpho(requiredAmount, chain);
    } else {
      console.log("Sufficient USDC balance already available, skipping withdrawal.");
    }

    console.log("--------------");

    await swapUSDCByRatio(requiredAmount, allocations, userAddress);
    console.log("🎉 All good broski, DCA is done-zo.");
  } catch (error) {
    console.error("Error:", error);
  }
};

optimize();
