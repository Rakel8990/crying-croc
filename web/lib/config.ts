export const CONTRACT_ID: string =
  process.env.NEXT_PUBLIC_CONTRACT_ID || "croc-final-43570992494-1.testnet"

export const NETWORK_ID: string =
  process.env.NEXT_PUBLIC_NEAR_NETWORK_ID || "testnet"

export const RPC_URLS: string[] = [
  process.env.NEXT_PUBLIC_NEAR_NODE_URL || "https://test.rpc.fastnear.com",
  "https://rpc.testnet.near.org",
]

export const REPO_URL: string = "https://github.com/Rakel8990/crying-croc"
