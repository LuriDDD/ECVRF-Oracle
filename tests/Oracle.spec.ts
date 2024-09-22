import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Oracle } from '../wrappers/Oracle';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Oracle', () => {
    let code: Cell;

    beforeAll(async () => {
        code = await compile('Oracle');
    });

    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let oracle: SandboxContract<Oracle>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        oracle = blockchain.openContract(Oracle.createFromConfig({}, code));

        deployer = await blockchain.treasury('deployer');

        const deployResult = await oracle.sendDeploy(deployer.getSender(), toNano('0.05'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: oracle.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and oracle are ready to use
    });
});
