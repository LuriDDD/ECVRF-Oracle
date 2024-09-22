import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { TonClient } from '@ton/ton';
import { deployOracle } from '../hooks/useOracle';

export async function run(provider: NetworkProvider) {
    const secretKeyECVRF = 1111n;
    const password = '';
    const ownerAddress = Address.parse("0QCyq_hrs4smOyq_uQ5P-BBAiM-SJtkd6V6FE3MnNJFhWC0J")
    const mnemonics = ''.split(',');
    
    await deployOracle(provider.api() as TonClient, provider.sender(), {
        ownerAddress,
        keyPair: await mnemonicToPrivateKey(mnemonics, password), 
        secretKeyECVRF
    })
}