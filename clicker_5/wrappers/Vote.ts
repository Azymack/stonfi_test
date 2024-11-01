import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';

export type VoteConfig = {};

export function voteConfigToCell(config: VoteConfig): Cell {
    return beginCell().endCell();
}

export class Vote implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new Vote(address);
    }

    static createFromConfig(config: VoteConfig, code: Cell, workchain = 0) {
        const data = voteConfigToCell(config);
        const init = { code, data };
        return new Vote(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().endCell(),
        });
    }

    async getCount(provider: ContractProvider) {
        const res = (await provider.get('get_count', [])).stack;
        return res.readBigNumber();
    }
}
