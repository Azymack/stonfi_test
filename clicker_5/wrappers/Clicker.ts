import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';
import { parseDict } from '@ton/core/dist/dict/parseDict';
import { crc32 } from '../libs/crc32';
import { opClickStr, opWrongStr } from '../libs/consts';

export type ClickerConfig = {
    trackerCode: Cell;
    voteCode: Cell;
};

export function clickerConfigToCell(config: ClickerConfig): Cell {
    return beginCell().storeRef(config.trackerCode).storeRef(config.voteCode).endCell();
}

export class Clicker implements Contract {
    constructor(
        readonly address: Address,
        readonly init?: { code: Cell; data: Cell },
    ) {}

    static createFromAddress(address: Address) {
        return new Clicker(address);
    }

    static createFromConfig(config: ClickerConfig, code: Cell, workchain = 0) {
        const data = clickerConfigToCell(config);
        const init = { code, data };
        return new Clicker(contractAddress(workchain, init), init);
    }

    async sendDeploy(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(0, 32).endCell(),
        });
    }

    async sendClick(provider: ContractProvider, via: Sender, value: bigint, vote_id: number) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(crc32(opClickStr), 32).storeUint(vote_id, 64).endCell(),
        });
    }

    async sendWronng(provider: ContractProvider, via: Sender, value: bigint, vote_id: number) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(crc32(opWrongStr), 32).storeUint(vote_id, 64).endCell(),
        });
    }

    async getTrackerAddress(provider: ContractProvider, address: Address): Promise<Address> {
        const res = await provider.get('get_tracker_address', [
            {
                type: 'slice',
                cell: beginCell().storeAddress(address).endCell(),
            },
        ]);
        return res.stack.readAddress();
    }

    async getVoteAddress(provider: ContractProvider, vote_id: number): Promise<Address> {
        const res = await provider.get('get_vote_address', [
            {
                type: 'int',
                value: BigInt(vote_id),
            },
        ]);
        return res.stack.readAddress();
    }
}
