import { Keyring } from "@polkadot/api";
import BN from 'bn.js';

import mangataHelper from './common/mangataHelper';
import oakHelper from './common/oakHelper';
import { sendExtrinsic } from './common/util';

const mgxCurrencyId = 0;
const turCurrencyId = 7;
const SUBSTRATE_SS58 = 42;
const OAK_ENDPOINT = process.env.OAK_ENDPOINT;
const TARGET_ENDPOINT = process.env.TARGET_ENDPOINT;

async function main () {
	// Initialize
  await oakHelper.initialize(OAK_ENDPOINT);
  await mangataHelper.initialize(TARGET_ENDPOINT);
	const mangataApi = mangataHelper.getApi();

	const keyring = new Keyring();
	const keyPair = keyring.addFromUri('//Alice', undefined, 'sr25519');
	console.log('Alice address: ', keyPair.address);

	// Mint TUR token
	console.log('Mint TUR...');
	const mintTokenExtrinsic = mangataApi.tx.tokens.mint(turCurrencyId, keyPair.address, 5000000000000000);
	await sendExtrinsic(mangataApi, mintTokenExtrinsic, keyPair, { isSudo: true });

	// Check Balance
	const mgxBalance = await mangataHelper.checkFreeBalance(keyPair.address);
	console.log("Alice's MGX freeBalance: ", mgxBalance.toString());

	const turBalance = await mangataHelper.checkFreeBalance(keyPair.address, { currencyId: turCurrencyId });
	console.log("Alice's TUR freeBalance: ", turBalance.toString());

	// Add proxy
	console.log('Add proxy...');
	const proxyAccount = oakHelper.getProxyAccount(keyPair.address);
  console.log('Proxy account: ', keyring.encodeAddress(proxyAccount, SUBSTRATE_SS58));

	await mangataHelper.addProxy(proxyAccount, keyPair);
  console.log('Add proxy on mangata successfully!');

	// Create pool
	console.log('Create pool...');
	await mangataHelper.mangata.createPool(
		keyPair,
		mgxCurrencyId,
		new BN('1000000000000000000000'), // 1000 MGX (MGX is 18 decimals)
		turCurrencyId,
		new BN('1000000000000'), // 1 TUR (TUR is 12 decimals)
	);

	// Get pools
	console.log('Get pools...');
	const pools = await mangataHelper.mangata.getPools();
	console.log('Pools: ', pools);

	// Promote pool
	console.log('Promote pool...');
	const promotePoolExtrinsic = mangataApi.tx.xyk.promotePool(pools[0].liquidityTokenId);
	await sendExtrinsic(mangataApi, promotePoolExtrinsic, keyPair, { isSudo: true });

	// Buy asset
	console.log('Buy asset...');
	await mangataHelper.mangata.buyAsset(keyPair, '0', '7', new BN('1000000000000'), new BN('100000000000000000000000000'));
}

main().catch(console.error).finally(() => process.exit());