import { Hex } from "@nilfoundation/niljs";
import * as dotenv from "dotenv";
dotenv.config();

const getConfig = () => {
  const { NIL_RPC_ENDPOINT, PRIVATE_KEY, WALLET_ADDRESS } = process.env;

  if (!NIL_RPC_ENDPOINT || !PRIVATE_KEY || !WALLET_ADDRESS)
    throw Error("Did you forget to set .env?");

  return {
    rpc: NIL_RPC_ENDPOINT,
    signerPrivateKey: PRIVATE_KEY as Hex,
    walletAddress: WALLET_ADDRESS.toLowerCase() as Hex,
    shardId: 1,
  };
};

export default getConfig();
