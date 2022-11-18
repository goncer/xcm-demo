import "@imstar15/api-augment";
import { Keyring } from "@polkadot/api";
import { cryptoWaitReady } from '@polkadot/util-crypto';
import oakHelper from "./common/oakHelper";
import mangataHelper from "./common/mangataHelper";
import { sendExtrinsic } from "./common/util";

const TARGET_PARA_ID = process.env.TARGET_PARA_ID;
const OAK_ENDPOINT = process.env.OAK_ENDPOINT;
const TARGET_ENDPOINT = process.env.TARGET_ENDPOINT;

async function main () {
  await cryptoWaitReady();

  // Initialize
  await oakHelper.initialize(OAK_ENDPOINT);
  await mangataHelper.initialize(TARGET_ENDPOINT);
  const oakApi = oakHelper.getApi();

  // Create key pair
  const keyring = new Keyring();
  const keyPair = keyring.addFromUri('//Alice', undefined, 'sr25519');

  // Create mangata proxy call
  const proxyExtrinsic = mangataHelper.getApi().tx.xyk.compoundRewards(8, 1000);
  const mangataProxyCall = await mangataHelper.createProxyCall(keyPair.address, proxyExtrinsic);
  const encodedMangataProxyCall = mangataProxyCall.method.toHex(mangataProxyCall);
  const mangataProxyCallFees = await mangataProxyCall.paymentInfo(keyPair.address);

  console.log('encodedMangataProxyCall: ', encodedMangataProxyCall);
  console.log('mangataProxyCallFees: ', mangataProxyCallFees.toHuman());

   // Schedule automated task on Oak
  // 1. Create the call for scheduleXcmpTask 
  const providedId = "xcmp_automation_test_" + (Math.random() + 1).toString(36).substring(7);
  const xcmpCall = oakApi.tx.automationTime.scheduleXcmpTask(
    providedId,
    { Fixed: { executionTimes: [0] } },
    TARGET_PARA_ID,
    0,
    encodedMangataProxyCall,
    mangataProxyCallFees.weight,
  );
  console.log('xcmpCall: ', xcmpCall);

  const xcmFrees = await oakHelper.getXcmFees(keyPair.address, xcmpCall);
  console.log('xcmFrees: ', xcmFrees.toHuman());

  // 3. Sign and send scheduleXcmpTask call.
  // Get TaskId for Task.
  const taskId = await oakApi.rpc.automationTime.generateTaskId(keyPair.address, providedId);
  console.log('TaskId: ', taskId.toHuman());

  console.log('Send xcmp call...')
  const blockHash = await sendExtrinsic(oakApi, xcmpCall, keyPair);

  // Get Task
  const blockApi = await oakApi.at(blockHash);
  const task = await blockApi.query.automationTime.accountTasks(keyPair.address, taskId);
  console.log('Task: ', task.toHuman());
}

main().catch(console.error).finally(() => process.exit());
