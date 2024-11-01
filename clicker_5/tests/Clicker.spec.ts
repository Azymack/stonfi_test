import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, Cell, toNano } from '@ton/core';
import { Clicker } from '../wrappers/Clicker';
import '@ton/test-utils';
import { compile } from '@ton/blueprint';
import { Tracker } from '../wrappers/Tracker';
import { Vote } from '../wrappers/Vote';

describe('Clicker', () => {
    let clickerCode: Cell;
    let trackerCode: Cell;
    let voteCode: Cell;

    let blockchain: Blockchain;

    let clicker: SandboxContract<Clicker>;
    let deployerTracker: SandboxContract<Tracker>;
    let aliceTracker: SandboxContract<Tracker>;
    let bobTracker: SandboxContract<Tracker>;
    let leoTracker: SandboxContract<Tracker>;
    let firstVote: SandboxContract<Vote>;
    let secondVote: SandboxContract<Vote>;
    let thirdVote: SandboxContract<Vote>;

    let deployer: SandboxContract<TreasuryContract>;
    let alice: SandboxContract<TreasuryContract>;
    let bob: SandboxContract<TreasuryContract>;
    let leo: SandboxContract<TreasuryContract>;

    let tracker: (address: Address) => Promise<SandboxContract<Tracker>>;
    let vote: (voteId: number) => Promise<SandboxContract<Vote>>;

    beforeAll(async () => {
        clickerCode = await compile('Clicker');
        trackerCode = await compile('Tracker');
        voteCode = await compile('Vote');

        blockchain = await Blockchain.create();
        deployer = await blockchain.treasury('deployer');
        alice = await blockchain.treasury('alice');
        bob = await blockchain.treasury('bob');
        leo = await blockchain.treasury('leo');

        clicker = blockchain.openContract(
            Clicker.createFromConfig({ trackerCode: trackerCode, voteCode: voteCode }, clickerCode),
        );
        tracker = async (address: Address) =>
            blockchain.openContract(Tracker.createFromAddress(await clicker.getTrackerAddress(address)));
        vote = async (voteId: number) =>
            blockchain.openContract(Vote.createFromAddress(await clicker.getVoteAddress(voteId)));

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

        firstVote = await vote(1);
        secondVote = await vote(2);
        thirdVote = await vote(3);

        console.log(deployerTracker.address);
        console.log(aliceTracker.address);
        console.log(bobTracker.address);
        console.log(leoTracker.address);
        console.log(firstVote.address);
        console.log(secondVote.address);
        console.log(thirdVote.address);
    });

    beforeEach(async () => {});

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and clicker are ready to use
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
            to: firstVote.address,
            deploy: true,
            success: true,
        });

        expect(clickRes.transactions).toHaveTransaction({
            from: firstVote.address,
            to: deployer.address,
            deploy: false,
            success: true,
        });

        const voteIdOfDeployer = await deployerTracker.getVoteId();
        const countOfFirstVote = await firstVote.getCount();

        expect(Number(voteIdOfDeployer)).toBe(1);
        expect(Number(countOfFirstVote)).toBe(1);
    });
    it('not count repeated second vote', async () => {
        // should not change anything as user repeats his vote
        const clickRes = await clicker.sendClick(deployer.getSender(), toNano('1'), 1);

        const voteIdOfDeployer = await deployerTracker.getVoteId();
        const countOfFirstVote = await firstVote.getCount();

        expect(Number(voteIdOfDeployer)).toBe(1);
        expect(Number(countOfFirstVote)).toBe(1);
    });
    it('count third vote', async () => {
        // should not change anything as user repeats his vote
        await clicker.sendClick(leo.getSender(), toNano('1'), 1);
        await clicker.sendClick(alice.getSender(), toNano('1'), 2);
        await clicker.sendClick(deployer.getSender(), toNano('1'), 2);

        const voteIdOfDeployer = await deployerTracker.getVoteId();
        const voteIdOfLeo = await leoTracker.getVoteId();
        const voteIdOfAlice = await aliceTracker.getVoteId();

        const countOfFirstVote = await firstVote.getCount();
        const countOfSecondVote = await secondVote.getCount();

        expect(Number(voteIdOfDeployer)).toBe(2);
        expect(Number(voteIdOfLeo)).toBe(1);
        expect(Number(voteIdOfAlice)).toBe(2);
        expect(Number(countOfFirstVote)).toBe(1);
        expect(Number(countOfSecondVote)).toBe(2);
    });
});
