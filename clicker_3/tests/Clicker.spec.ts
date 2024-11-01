import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Cell, toNano } from '@ton/core';
import { Clicker } from '../wrappers/Clicker';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';

describe('Clicker', () => {
    let code: Cell;
    let blockchain: Blockchain;
    let clicker: SandboxContract<Clicker>;

    let deployer: SandboxContract<TreasuryContract>;
    let alice: SandboxContract<TreasuryContract>;
    let bob: SandboxContract<TreasuryContract>;
    let leo: SandboxContract<TreasuryContract>;

    let totalCount: BigInt;

    beforeAll(async () => {
        code = await compile('Clicker');
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        alice = await blockchain.treasury('alice');
        bob = await blockchain.treasury('bob');
        leo = await blockchain.treasury('leo');

        clicker = blockchain.openContract(Clicker.createFromConfig({ admin: deployer.address, userDic: null }, code));

        // const deployResult = await clicker.sendDeploy(deployer.getSender(), toNano('5'));

        const deployResult = await clicker.sendAddUser(deployer.getSender(), toNano('10'), leo.address);

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: clicker.address,
            deploy: true,
            // success: true,
        });

        console.log("deployer's address", deployer.address);
        console.log("alice's address", alice.address);
        console.log("bob's address", bob.address);
        console.log("leo's address", leo.address);
        console.log("clicker's address", clicker.address);
    });

    it('should deploy with initial count of 0', async () => {
        totalCount = await clicker.getTotalCount();
        expect(Number(totalCount)).toBe(0);
    });
    it('should count clicks', async () => {
        await clicker.sendClick(deployer.getSender(), toNano('1'));
        totalCount = await clicker.getTotalCount();
        expect(Number(totalCount)).toBe(0);

        await clicker.sendClick(leo.getSender(), toNano('1'));
        totalCount = await clicker.getTotalCount();
        expect(Number(totalCount)).toBe(1);
    });
    it('should not count wrong op', async () => {
        await clicker.sendWrong(deployer.getSender(), toNano('1'));
        totalCount = await clicker.getTotalCount();
        expect(Number(totalCount)).toBe(1); // it remains to be 1
    });
    it('admin adds a user', async () => {
        await clicker.sendAddUser(deployer.getSender(), toNano('1'), alice.address);
        await clicker.sendClick(alice.getSender(), toNano('1'));
        totalCount = await clicker.getTotalCount();
        expect(Number(totalCount)).toBe(2);
        await clicker.sendClick(leo.getSender(), toNano('1'));
        totalCount = await clicker.getTotalCount();
        expect(Number(totalCount)).toBe(3);
    });
    it('admin removes a user', async () => {
        await clicker.sendRemoveUser(deployer.getSender(), toNano('1'), leo.address);
        await clicker.sendClick(leo.getSender(), toNano('1'));
        totalCount = await clicker.getTotalCount();
        expect(Number(totalCount)).toBe(3); // it remains to be 3
        await clicker.sendClick(alice.getSender(), toNano('1'));
        totalCount = await clicker.getTotalCount();
        expect(Number(totalCount)).toBe(4);
    });
});
