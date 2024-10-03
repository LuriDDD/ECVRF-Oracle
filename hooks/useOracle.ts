import { sleep } from "@ton/blueprint";
import { mnemonicNew, mnemonicToPrivateKey } from "@ton/crypto";
import { Blockchain, SandboxContract, TreasuryContract } from "@ton/sandbox";
import { Address, TonClient } from "@ton/ton";
import { Oracle, ORACLE_CONTRACT_CODE_CELL, OracleConfig } from "../wrappers/Oracle";

export async function deployOracle(
    ton: TonClient,
    sender: any,
    params: {
        ownerAddress: Address
        publicKey: Buffer,
        secretKeyECVRF: bigint
    }
) {
    let code = ORACLE_CONTRACT_CODE_CELL

    const blockchain = await Blockchain.create({config: 'slim'});
    let deployer: SandboxContract<TreasuryContract> = await blockchain.treasury('deployer');
    
    const invalidOracle = blockchain.openContract(Oracle.createFromConfig({
        ownerAddress: deployer.address, 
        publicKey: params.publicKey,
        publicKeyECVRF: 0n
    }, 
        code));
    await invalidOracle.sendDeploy(deployer.getSender());

    const config: OracleConfig = {
        ownerAddress: params.ownerAddress,
        publicKey: params.publicKey,
        publicKeyECVRF: await invalidOracle.getPublicKey(params.secretKeyECVRF)
    }
    const oracle = ton.open(Oracle.createFromConfig(config, code));
    console.log("Oracle Address:", oracle.address.toString())
    await oracle.sendDeploy(sender);

    return oracle.address
}


export async function startOracle(
    ton: TonClient,
    params: {
        oracleAddress: Address
        secretKey: Buffer,
        secretKeyECVRF: bigint
    }
) {
    let code = ORACLE_CONTRACT_CODE_CELL

    const blockchain = await Blockchain.create({config: 'slim'});
    let deployer: SandboxContract<TreasuryContract> = await blockchain.treasury('deployer');

    let invalidKeyPair = await mnemonicToPrivateKey(await mnemonicNew())
    
    const invalidOracle = blockchain.openContract(Oracle.createFromConfig({
        ownerAddress: deployer.address, 
        publicKey: invalidKeyPair.publicKey,
        publicKeyECVRF: 0n
    }, 
        code));
    await invalidOracle.sendDeploy(deployer.getSender());

    const oracle = ton.open(Oracle.createFromAddress(params.oracleAddress));
    console.log("Oracle Address:", oracle.address.toString())
    if (!(await ton.isContractDeployed( oracle.address))) {
        throw new Error(`Oracle is not deployed.`);
    }

    console.log('Begin loop');
    let seqno = 0
    while (true) {
        let data = await oracle.getOracleData()
        console.log("seqno:", data.seqno, "requests:", data.unfulfilledRequests, "lastRandTime:", data.lastRandTime, "previousBlockRootHash:", data.previousBlockRootHash)
        if (seqno != data.seqno && data.unfulfilledRequests != 0) {
            let alpha = await oracle.getAlpha();
            let pi = await invalidOracle.getCalcPiFromAlpha(params.secretKeyECVRF, alpha);
            await oracle.sendProvideRandomness(data.seqno, pi, params.secretKey);
            seqno = data.seqno
        }
        await sleep(1000)
    }
}

export async function sendWithdraw(
    ton: TonClient, 
    sender: any,
    params: {
        oracleAddress: Address
    }
){
    const oracle = ton.open(Oracle.createFromAddress(params.oracleAddress));
    await oracle.sendWithdraw(sender);
}

export async function sendSubscribeRandom(
    ton: TonClient, 
    sender: any,
    params: {
        oracleAddress: Address,
        randomNumbers: bigint,
        consumer?: Address
    }
){
    const oracle = ton.open(Oracle.createFromAddress(params.oracleAddress));
    await oracle.sendSubscribeRandom(sender, params.randomNumbers, params.consumer);
}