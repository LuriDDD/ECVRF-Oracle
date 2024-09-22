import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode, Slice, toNano, TupleBuilder } from '@ton/core';
import { sign } from '@ton/crypto';

export const ORACLE_CONTRACT_CODE = "b5ee9c7241022001000621000114ff00f4a413f4bcf2c80b01020120021a020148030602b6d020d749c120e30801d0d3030171b001fa403001e308ed44d0f40401f861d33f01f862d30701f863d30f01f864d33f01f865fa4001f866d3ff01f867d3ff01f868d31f01f869d430d0d3ff30f86a01d31f218210ab4c4859bae30f040501aa6c21018208989680a1f844a63c82080f4240a8a90420c101e30801fa4030f841521081010bf40a6fa1f84224a0f862b39e30f843a4f863f8438407bcf2d0aa96d70b3f12a001e201c8cb3ff8411281010bf441f8611f0074306c128210cb03bfafba8e2bf846c705f2e0abf844a63282080f4240a8f842a870fb02708018c8cb05f846cf1621fa02cb6ac98306fb009130e2020120070d020120080c020120090a0079b5589da89a1e80803f0c3a67e03f0c5a60e03f0c7a61e03f0c9a67e03f0cbf48003f0cda7fe03f0cfa7fe03f0d1a63e03f0d3a861a1a7fe61f0d5f087001fbb5cda43f24b90b19e2d05e059c724c1fa0d5958cdd55f958659e2eca3a9b09889b933aabcc02105a77e954705e1da2ac51d91aa5adf420d5b0c2d03b604e95ec83c21e0818dcb5eca28a656a7f39197feb19e2f97fee3f20802de45f240a605f248a662039197fee3f2080156ff9196ff97fee3f20801f24d521041f24b00b00685331f92423104610355904c8cbff13cbffcbff01c8cbff12cbff72f90400a9387f5204a8a0f926a90801c8cbff12cb7fcbffc9d00085b9af1ed44d0f40401f861d33f01f862d30701f863d30f01f864d33f01f865fa4001f866d3ff01f867d3ff01f868d31f01f869d430d0d3ff30f86af845f842f849f84a80201200e150201200f1202015810110079ae4ff6a2687a0200fc30e99f80fc31698380fc31e98780fc32699f80fc32fd2000fc3369ff80fc33e9ff80fc34698f80fc34ea186869ff987c357c22400105adeac01d02012013140007b0b29fe00099b1c3bb51343d01007e1874cfc07e18b4c1c07e18f4c3c07e1934cfc07e197e90007e19b4ffc07e19f4ffc07e1a34c7c07e1a750c3434ffcc3e1abe11298f208203d0902a006a20822625a02820020120161902012017180009b0ff3e49600079b28cfb51343d01007e1874cfc07e18b4c1c07e18f4c3c07e1934cfc07e197e90007e19b4ffc07e19f4ffc07e1a34c7c07e1a750c3434ffcc3e1abe10a0009fb7fb3da89a1e80803f0c3a67e03f0c5a60e03f0c7a61e03f0c9a67e03f0cbf48003f0cda7fe03f0cfa7fe03f0d1a63e03f0d3a861a1a7fe61f0d5f095f093f08b91967f963f97ff93f2019197ff93a1001c2f2ed44d0f40401f861d33f01f862d30701f863d30f01f864d33f01f865fa4001f866d3ff01f867d3ff01f868d31f01f869d430d0d3ff30f86af823f849bcf2e082f842c000f2d08320d31f30f845baf2a1d401d021f901f84812f910f2e083f8001b01feed44d0f40401f861d33f01f862d30701f863d30f01f864d33f01f865fa4001f866d3ff01f867d3ff01f868d31f01f869d430d0d3ff30f86af84af849f845c8cb3fcb1fcbffc9f900c8cbfff845a4f865f84ac8cbffc9f849f848f847f845f844f843f842f841c8f400cb3fcb07cb0fcb3ff846cf16cbffcbffcb1fccc9ed541c02f6f80f01d31f31f84759db3c8210069ceca8c8cb1fcbffc96df842f843a1f862f8438e44f84181010bf492f2e09602f861d70b3f20c2019ca5c8cb3f54200381010bf4419730f843a5f86301e2718018c8cb055003cf168209c9c380fa0212cb6a5220ccc972fb00e431f861f834006f106f25145f04f86af823f8691d1f01eed3ff21f921d37fd3ff300382f02ce39260fd06acac66eaafcac32cf17651d4d84c44dc99d55e601082d3bf4aa382f0ed15628ec8d52d6fa106ad861681db0274af641e10f040c6e5af6514532b53f9c8cbff58cf17cbff71f904016f22f9205303f9245df924f92304f9255352f924f9231035544513051e00d604c8cbff13cbffcbff01c8cbff12cbff72f90400a9387fbaf2e06482f0485492a4ee93a50435292b72892f17617b3a00787fc45899c4f214e4baa6a7ad82f0ed15628ec8d52d6fa106ad861681db0274af641e10f040c6e5af6514532b53f9c8cbff12cbffcbff71f90400005ef84ac8cbffc9f849f848f847f845f844f843f842f841c8f400cb3fcb07cb0fcb3ff846cf16cbffcbffcb1fccc9ed54c6dd0ecb";

export const ORACLE_CONTRACT_CODE_CELL = Cell.fromBoc(Buffer.from(ORACLE_CONTRACT_CODE, 'hex'))[0];

export type OracleConfig = {
    ownerAddress: Address,
    publicKeyECVRF: bigint,
    publicKey: Buffer
}

export type OracleData = {
    seqno: number,
    unfulfilledRequests: number,
    lastRandTime: number,
    previousBlockRootHash: bigint
}

export class Oracle implements Contract {
    constructor(readonly address: Address, readonly init?: { code: Cell; data: Cell }) {}

    static createFromAddress(address: Address) {
        return new Oracle(address);
    }

    static createFromConfig(config: OracleConfig, code: Cell, workchain: number = 0) {
        const data = beginCell()
            .storeUint(1, 1 + 64 + 8 + 16 + 64)
            .storeAddress(config.ownerAddress)
            .storeUint(config.publicKeyECVRF, 256)
            .storeBuffer(config.publicKey)
            .storeUint(0, 32)
            .storeRef(beginCell()
                .storeUint(0, 256)
                .endCell())
            .endCell();
        const init = {code, data};
        return new Oracle(contractAddress(workchain, init), init);
    }

    async sendSubscribeRandom(provider: ContractProvider, via: Sender, randomNumbers: bigint, consumer?: Address) {
        consumer = consumer ?? via.address!!;
        await provider.internal(via, {
            value: randomNumbers * toNano('0.07') + toNano('0.01'),
            body: beginCell().storeUint(0xAB4C4859, 32).storeAddress(consumer).endCell(),
        });
    }

    async getAlpha(provider: ContractProvider): Promise<Slice> {
        const data = (await provider.get('get_alpha', [])).stack;
        return data.readCell().asSlice()
    }

    async sendProvideRandomness(provider: ContractProvider, seqno: number, pi: Slice, secretReplay: Buffer) {
        console.log("Sending message")
        let builder = beginCell().storeUint(seqno, 32).storeSlice(pi)
        const signature = beginCell().storeBuffer(sign(builder.endCell().hash(), secretReplay)).endCell();
        await provider.external(builder.storeRef(signature).endCell());
    }

    async getCalcPiFromAlpha(provider: ContractProvider, secret: bigint, alpha: Slice): Promise<Slice> {
        const data = (await provider.get('ecvrf::rist255::with_secret::prove', [{type: 'int', value: secret}, {type: 'slice', cell: alpha.asCell()}])).stack;
        return data.readCell().asSlice()
    }

    async sendDeploy(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: toNano(0.1),
            body: beginCell().endCell(),
            bounce: false
        });
    }

    async getPublicKey(provider: ContractProvider, secret: bigint): Promise<bigint> {
        const data = (await provider.get('rist255::get_public_key', [{type: 'int', value: secret}])).stack;
        return data.readBigNumber();
    }

    async sendWithdraw(provider: ContractProvider, via: Sender) {
        await provider.internal(via, {
            value: toNano(0.1),
            body: beginCell().storeUint(0xCB03BFAF, 32).endCell(),
            bounce: true
        });
    }

    async getOracleData(provider: ContractProvider): Promise<OracleData> {
        let data = (await provider.get('get_oracle_data', [])).stack
        return {
            seqno: data.readNumber(),
            unfulfilledRequests: data.readNumber(),
            lastRandTime: data.readNumber(),
            previousBlockRootHash: data.readBigNumber(),
        }
    }
}
