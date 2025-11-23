import { getUserFluidPositions } from "./defiPositions/fluidPositions.js";
import { withdrawUSDCFromFluidMorpho } from "./withdrawFluidMorpho.js";
import { sendTransaction } from "./paraswap.js";

const amount = 0.1;
const chain = "ARBITRUM";

const optimize = async () => {
  try {
    const positions = await getUserFluidPositions();

    console.log(
      "Current DeFi Positions (careful, price of the yield token is not the USD value):",
      positions
    );
    await withdrawUSDCFromFluidMorpho(amount.toString(), chain);

    console.log("--------------");

    await sendTransaction(amount.toString());
    console.log("🎉 All good broski, DCA is done-zo.");
  } catch (error) {
    console.error("Error:", error);
  }
};

optimize();
