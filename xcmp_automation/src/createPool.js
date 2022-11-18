import "@imstar15/api-augment";
import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from '@polkadot/util-crypto';
import oakHelper from "./common/oakHelper";
import mangataHelper from "./common/mangataHelper";

const SUBSTRATE_SS58 = 42;
const TARGET_PARA_ID = process.env.TARGET_PARA_ID;
const OAK_ENDPOINT = process.env.OAK_ENDPOINT;
const TARGET_ENDPOINT = process.env.TARGET_ENDPOINT;

// const OAK_SOV_ACCOUNT = "68kxzikS2WZNkYSPWdYouqH5sEZujecVCy3TFt9xHWB5MDG5";

async function main () {
  await cryptoWaitReady();

  const keyring = new Keyring();
  const keyPair = keyring.addFromUri('//Alice', undefined, 'sr25519');
  console.log('Account address: ', keyPair.address);

  // Initialize
  await oakHelper.initialize(OAK_ENDPOINT);
  await mangataHelper.initialize(TARGET_ENDPOINT);
  // const oakApi = oakHelper.getApi();

	// await mangataHelper.createPool(keyPair);

	console.log(await mangataHelper.mangata.getAssetsInfo());

	await mangataHelper.createPool(keyPair);
}

main().catch(console.error).finally(() => process.exit());
