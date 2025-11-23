import { getUserFluidPositions } from "./defiPositions/fluidPositions.js";
import { withdrawUSDCFromFluidMorpho } from "./withdrawFluidMorpho.js";
import { sendTransaction, Token } from "./paraswap.js";
import { _USDC, _RETH, _AAVE } from "../utils/resources.js";

const amount = 0.1;
const chain = "ARBITRUM";
const destToken = _AAVE; // Change to _RETH or _AAVE

const optimize = async () => {
  try {
    const positions = await getUserFluidPositions();

    console.log(
      "Current Fluid tokens (careful, price of the yield token is not the USD value):",
      positions
    );
    await withdrawUSDCFromFluidMorpho(amount.toString(), chain);

    console.log("--------------");

    await sendTransaction(amount.toString(), destToken);
    console.log("🎉 All good broski, DCA is done-zo.");
  } catch (error) {
    console.error("Error:", error);
  }
};

optimize();
