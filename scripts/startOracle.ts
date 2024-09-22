import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { TonClient } from '@ton/ton';
import { startOracle } from '../hooks/useOracle';

export async function run(provider: NetworkProvider) {
    const secretKeyECVRF = 1111n;
    const password = '';
    const oracleAddress = Address.parse("")
    const mnemonics = ''.split(',');
    console.log(provider.api())

    await startOracle(provider.api() as TonClient, {
        oracleAddress,
        keyPair: await mnemonicToPrivateKey(mnemonics), 
        secretKeyECVRF
    })
}
