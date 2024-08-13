import { Hex } from "@nilfoundation/niljs";
import * as dotenv from "dotenv";
dotenv.config();

const getConfig = () => {
  const { NIL_RPC_ENDPOINT, PRIVATE_KEY, WALLET_ADDRESS } = process.env;

  if (!NIL_RPC_ENDPOINT || !PRIVATE_KEY || !WALLET_ADDRESS)
    throw Error("Did you forget to set .env?");

  return {
    rpc: NIL_RPC_ENDPOINT,
    privateKey: PRIVATE_KEY as Hex,
    wallet: WALLET_ADDRESS.toLowerCase() as Hex, // TODO for what lower case?
    shardId: 1,
  };
};

export default getConfig();
