// DeFi Positions
import { getUserFluidPositions } from "./defiPositions/fluidPositions.js";
import { getUserMorphoPositions } from "./defiPositions/morphoPositions.js";

// Utils
import { getUserUSDCBalance } from "./utils/usdcBalancesCheck.js";

// Actions
// import {
//   depositUSDCToFluidMorphoSingleChain,
//   depositUSDCToFluidMorphoCrossChain,
// } from "./depositFluidMorpho.js";

import { withdrawUSDCFromFluidMorpho } from "./withdrawFluidMorpho.js";
import { sendTransaction } from "./paraswap.js";

////////////////////////////////////////////////////////////

const amount = 1;
const chain = "ARBITRUM";

// const fetchDefiPositions = async () => {
//   try {
//     const userFluidBalances = await getUserFluidPositions();
//     const userMorphoBalances = await getUserMorphoPositions();

//     const allDefiBalances = [...userFluidBalances, ...userMorphoBalances];
//     console.log("Current position:");
//     for (const { chain, balance, ID } of allDefiBalances) {
//       if (Number(balance) > 0.1) {
//         const poolLabel = ID ? ` (Pool ${ID})` : "";
//         console.log(`${chain}${poolLabel}: ${Number(balance).toFixed(2)} USDC`);
//       }
//     }
//     return allDefiBalances;
//   } catch (error) {
//     console.log("error fetching defi positions", error);
//     return;
//   }
// };

const optimize = async () => {
  try {
    await withdrawUSDCFromFluidMorpho(amount.toString(), chain);

    console.log("--------------");

    await sendTransaction(amount.toString());
    // console.log("--------------");
    console.log("🎉 All good broski, DCA is done-zo.");
  } catch (error) {
    console.error("Error:", error);
  }
};

optimize();
