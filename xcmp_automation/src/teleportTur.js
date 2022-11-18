import "@imstar15/api-augment";
import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from '@polkadot/util-crypto';
import oakHelper from "./common/oakHelper";
import mangataHelper from "./common/mangataHelper";

const SUBSTRATE_SS58 = 42;
const TARGET_PARA_ID = process.env.TARGET_PARA_ID;
const OAK_ENDPOINT = process.env.OAK_ENDPOINT;
const TARGET_ENDPOINT = process.env.TARGET_ENDPOINT;

const OAK_SOV_ACCOUNT = "0x7369626c42080000000000000000000000000000000000000000000000000000";

async function main () {
  await cryptoWaitReady();

  const keyring = new Keyring();
  const keyPair = keyring.addFromUri('//Alice', undefined, 'sr25519');
  console.log('Account address: ', keyPair.address);

  // Initialize
  await oakHelper.initialize(OAK_ENDPOINT);
  await mangataHelper.initialize(TARGET_ENDPOINT);
  const oakApi = oakHelper.getApi();

  // Setup: Send TUR from Oak to Target Chain in order for Target Chain to pay fees.
  await oakApi.tx.xTokens.transfer(
    1,
    100000000000000,
    {
      V1: {
        parents: 1,
        interior: {
          X2: [
            { parachain: 2110 },
            { 
              AccountId32: {
                network: "Any",
                id: OAK_SOV_ACCOUNT,
              }
            }
          ]
        }
      }
    },
    1000000000000,
  ).signAndSend(keyPair, { nonce: -1 });
}

main().catch(console.error).finally(() => process.exit());
