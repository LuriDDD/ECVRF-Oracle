import { Address } from '@ton/core';
import { NetworkProvider } from '@ton/blueprint';
import { sendSubscribeRandom } from '../hooks/useOracle';
import { TonClient } from '@ton/ton';

export async function run(provider: NetworkProvider) {
    const oracleAddress = Address.parse('')
    const randomNumbers = 2n
    await sendSubscribeRandom(provider.api() as TonClient, provider.sender(), {oracleAddress, randomNumbers})
}