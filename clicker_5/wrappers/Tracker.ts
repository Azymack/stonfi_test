import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type TrackerConfig = {};

export function trackerConfigToCell(config: TrackerConfig): Cell {
    return beginCell().endCell();
}

export class Tracker implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new Tracker(address);
    }

    static createFromConfig(config: TrackerConfig, code: Cell, workchain = 0) {
        const data = trackerConfigToCell(config);
        const init = { code, data };
        return new Tracker(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getVoteId(provider: ContractProvider) {
        const res = (await provider.get('get_vote_id', [])).stack;
        return res.readBigNumber();
    }
}
