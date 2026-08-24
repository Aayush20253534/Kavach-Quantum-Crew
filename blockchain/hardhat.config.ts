import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const CHAIN_RPC_URL = process.env.CHAIN_RPC_URL || "";
const ISSUER_PRIVATE_KEY = process.env.ISSUER_PRIVATE_KEY || "";
const CHAIN_ID = process.env.CHAIN_ID ? parseInt(process.env.CHAIN_ID, 10) : undefined;

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },

  // Default network used when no --network flag is passed.
  // In-memory, resets on every run — fastest for local dev + `npx hardhat test`.
  defaultNetwork: "hardhat",

  networks: {
    hardhat: {
      chainId: 31337,
    },

    // Persistent local node: start with `npx hardhat node`, then point
    // deploy/issue/verify/revoke scripts at it with `--network localhost`.
    // Used for the actual judge demo so on-chain state survives across
    // multiple separate script invocations instead of resetting each time.
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },

    // Optional / secondary path (Invariant 7): a public testnet deployment
    // is never required for tests or judging to pass. Only enabled if the
    // required env vars are actually present, so an empty .env never
    // breaks `npx hardhat compile`/`test` on a machine with no testnet
    // credentials configured.
    ...(CHAIN_RPC_URL && ISSUER_PRIVATE_KEY && CHAIN_ID
      ? {
          testnet: {
            url: CHAIN_RPC_URL,
            accounts: [ISSUER_PRIVATE_KEY],
            chainId: CHAIN_ID,
          },
        }
      : {}),
  },

  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },

  typechain: {
    outDir: "typechain-types",
    target: "ethers-v6",
  },

  mocha: {
    timeout: 40000,
  },
};

export default config;