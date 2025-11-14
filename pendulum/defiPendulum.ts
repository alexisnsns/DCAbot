// DeFi Positions
import { getUserFluidPositions } from "./defiPositions/fluidPositions.js";
import { getUserMorphoPositions } from "./defiPositions/morphoPositions.js";

// Utils
import { getUserUSDCBalance } from "./utils/usdcBalancesCheck.js";

// Actions
import {
  depositUSDCToFluidMorphoSingleChain,
  depositUSDCToFluidMorphoCrossChain,
} from "./depositFluidMorpho.js";
import { withdrawUSDCFromFluidMorpho } from "./withdrawFluidMorpho.js";

////////////////////////////////////////////////////////////

const fetchDefiPositions = async () => {
  try {
    const userFluidBalances = await getUserFluidPositions();
    const userMorphoBalances = await getUserMorphoPositions();

    const allDefiBalances = [...userFluidBalances, ...userMorphoBalances];
    console.log("Current position:");
    for (const { chain, balance, ID } of allDefiBalances) {
      if (Number(balance) > 0.1) {
        const poolLabel = ID ? ` (Pool ${ID})` : "";
        console.log(`${chain}${poolLabel}: ${Number(balance).toFixed(2)} USDC`);
      }
    }
    return allDefiBalances;
  } catch (error) {
    console.log("error fetching defi positions", error);
    return;
  }
};

const optimize = async () => {
  try {
    // Step 1: Fetch the pool with the highest APY
    // Step 2: Fetch user's existing DeFi positions
    const allDefiBalances = await fetchDefiPositions();

    // Step 3: Check if any positions do not match the highest APY and withdraw
    await withdrawUSDCFromFluidMorpho("1", "ARBITRUM");

    // console.log("--------------");

    // console.log("--------------");
    // console.log("🎉 All good broski, yields are maximized.");
  } catch (error) {
    console.error("Error:", error);
  }
};

optimize();
