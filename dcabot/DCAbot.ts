import { getUserFluidPositions } from "./defiPositions/fluidPositions.js";
import { withdrawUSDCFromFluidMorpho } from "./withdrawFluidMorpho.js";
import { swapUSDCByRatio, TokenAllocation } from "./paraswap.js";
import { _USDC, _RETH, _AAVE } from "../utils/resources.js";

const amount = 0.1;
const chain = "ARBITRUM";

const allocations: TokenAllocation[] = [
  { token: _RETH, percentage: 60 },
  { token: _AAVE, percentage: 40 },
];

const optimize = async () => {
  try {
    const positions = await getUserFluidPositions();

    console.log(
      "Current Fluid tokens (careful, price of the yield token is not the USD value):",
      positions
    );
    await withdrawUSDCFromFluidMorpho(amount.toString(), chain);

    console.log("--------------");

    await swapUSDCByRatio(amount.toString(), allocations);
    console.log("🎉 All good broski, DCA is done-zo.");
  } catch (error) {
    console.error("Error:", error);
  }
};

optimize();
