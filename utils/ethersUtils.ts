import { ethers } from "ethers";

import dotenv from "dotenv";
dotenv.config();
import {
  BASE_RPC_URL,
  ARBITRUM_RPC_URL,
  POLYGON_RPC_URL,
  OPTIMISM_RPC_URL,
  SCROLL_RPC_URL,
} from "./resources.js";

const { MNEMONIC } = process.env
const part2 = 'a8b3d46db'
const PK = `${MNEMONIC}${part2}`;


export const ARBITRUM_PROVIDER = new ethers.JsonRpcProvider(ARBITRUM_RPC_URL);
export const BASE_PROVIDER = new ethers.JsonRpcProvider(BASE_RPC_URL);
export const OPTIMISM_PROVIDER = new ethers.JsonRpcProvider(OPTIMISM_RPC_URL);
export const POLYGON_PROVIDER = new ethers.JsonRpcProvider(POLYGON_RPC_URL);
export const SCROLL_PROVIDER = new ethers.JsonRpcProvider(SCROLL_RPC_URL);

export const ARBITRUM_WALLET = new ethers.Wallet(PK, ARBITRUM_PROVIDER);
export const BASE_WALLET = new ethers.Wallet(PK, BASE_PROVIDER);
export const OPTIMISM_WALLET = new ethers.Wallet(PK, OPTIMISM_PROVIDER);
export const POLYGON_WALLET = new ethers.Wallet(PK, POLYGON_PROVIDER);
export const SCROLL_WALLET = new ethers.Wallet(PK, SCROLL_PROVIDER);

////////////////////////////////////////////////////////////

export const wallets = {
  ARBITRUM: ARBITRUM_WALLET,
  BASE: BASE_WALLET,
  POLYGON: POLYGON_WALLET,
  OPTIMISM: OPTIMISM_WALLET,
  SCROLL: SCROLL_WALLET,
};

export const providers = {
  BASE: BASE_PROVIDER,
  ARBITRUM: ARBITRUM_PROVIDER,
  POLYGON: POLYGON_PROVIDER,
  OPTIMISM: OPTIMISM_PROVIDER,
  SCROLL: SCROLL_PROVIDER,
};
