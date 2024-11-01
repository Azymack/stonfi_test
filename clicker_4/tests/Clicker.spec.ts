import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, beginCell, Cell, Dictionary, toNano } from '@ton/core';
import { Clicker } from '../wrappers/Clicker';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { Tracker } from '../wrappers/Tracker';
import { logTransactions } from '../libs/helper';

describe('Clicker', () => {
    let clickerCode: Cell;
    let trackerCode: Cell;

    let blockchain: Blockchain;

    let clicker: SandboxContract<Clicker>;
    let deployerTracker: SandboxContract<Tracker>;
    let aliceTracker: SandboxContract<Tracker>;
    let bobTracker: SandboxContract<Tracker>;
    let leoTracker: SandboxContract<Tracker>;
    let tracker: (address: Address) => Promise<SandboxContract<Tracker>>;

    let deployer: SandboxContract<TreasuryContract>;
    let alice: SandboxContract<TreasuryContract>;
    let bob: SandboxContract<TreasuryContract>;
    let leo: SandboxContract<TreasuryContract>;

    beforeAll(async () => {
        clickerCode = await compile('Clicker');
        trackerCode = await compile('Tracker');

        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');
        alice = await blockchain.treasury('alice');
        bob = await blockchain.treasury('bob');
        leo = await blockchain.treasury('leo');

        clicker = blockchain.openContract(
            Clicker.createFromConfig({ trackerCode: trackerCode, dic: null }, clickerCode),
        );
        tracker = async (address: Address) =>
            blockchain.openContract(Tracker.createFromAddress(await clicker.getTrackerAddress(address)));

        const deployResult = await clicker.sendDeploy(deployer.getSender(), toNano('10'));

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: clicker.address,
            deploy: true,
            success: true,
        });

        deployerTracker = await tracker(deployer.address);
        aliceTracker = await tracker(alice.address);
        bobTracker = await tracker(bob.address);
        leoTracker = await tracker(leo.address);

        console.log('clicker addr', clicker.address);
        console.log('deployer addr', deployer.address);
        console.log('deployerTracker addr', deployerTracker.address);
        console.log('aliceTracker addr', aliceTracker.address);
        console.log('bobTracker addr', bobTracker.address);
        console.log('leoTracker addr', leoTracker.address);
    });

    it('should deploy', async () => {
        const dic = await clicker.getDic();
        console.log(dic);
    });
    it('count first vote', async () => {
        const clickRes = await clicker.sendClick(deployer.getSender(), toNano('1'), 1);

        expect(clickRes.transactions).toHaveTransaction({
            from: deployer.address,
            to: clicker.address,
            deploy: false,
            success: true,
        });

        expect(clickRes.transactions).toHaveTransaction({
            from: clicker.address,
            to: deployerTracker.address,
            deploy: true,
            success: true,
        });

        expect(clickRes.transactions).toHaveTransaction({
            from: deployerTracker.address,
            to: clicker.address,
            deploy: false,
            success: true,
        });

        expect(clickRes.transactions).toHaveTransaction({
            from: clicker.address,
            to: deployer.address,
            deploy: false,
            success: true,
        });

        const dic = await clicker.getDic();
        const voteIdOfDeployer = await deployerTracker.getVoteId();

        expect(dic).toEqual({ '1': 1 });
        expect(Number(voteIdOfDeployer)).toBe(1);
    });
    it('count secound vote from same voter', async () => {
        const clickRes = await clicker.sendClick(deployer.getSender(), toNano('1'), 2);

        expect(clickRes.transactions).toHaveTransaction({
            from: clicker.address,
            to: deployerTracker.address,
            deploy: false,
            success: true,
        });
        const dic = await clicker.getDic();
        const voteIdOfDeployer = await deployerTracker.getVoteId();

        expect(dic).toEqual({ '1': 0, '2': 1 });
        expect(Number(voteIdOfDeployer)).toBe(2);
    });
    it('count third vote from same voter on repeated vote', async () => {
        const clickRes = await clicker.sendClick(deployer.getSender(), toNano('1'), 2);

        expect(clickRes.transactions).toHaveTransaction({
            from: clicker.address,
            to: deployerTracker.address,
            deploy: false,
            success: true,
        });
        const dic = await clicker.getDic();
        const voteIdOfDeployer = await deployerTracker.getVoteId();

        expect(dic).toEqual({ '1': 0, '2': 1 });
        expect(Number(voteIdOfDeployer)).toBe(2);
    });
    it('count forth vote from different voter', async () => {
        const clickRes = await clicker.sendClick(leo.getSender(), toNano('1'), 2);

        expect(clickRes.transactions).toHaveTransaction({
            from: clicker.address,
            to: leoTracker.address,
            deploy: true,
            success: true,
        });
        const dic = await clicker.getDic();
        const voteIdOfLeo = await leoTracker.getVoteId();

        expect(dic).toEqual({ '1': 0, '2': 2 });
        expect(Number(voteIdOfLeo)).toBe(2);
    });
});
