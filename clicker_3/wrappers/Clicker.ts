import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Sender, SendMode } from '@ton/core';
import { parseDict } from '@ton/core/dist/dict/parseDict';
import { crc32 } from '../libs/crc32';
import { opAddStr, opClickStr, opRemoveStr, opWrongStr } from '../libs/consts';

export type ClickerConfig = {
    admin: Address;
    userDic: Cell | null;
};

export function clickerConfigToCell(config: ClickerConfig): Cell {
    return beginCell().storeUint(0, 64).storeAddress(config.admin).storeMaybeRef(config.userDic).endCell();
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

    async sendClick(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(crc32(opClickStr), 32).endCell(),
        });
    }

    async sendWrong(provider: ContractProvider, via: Sender, value: bigint) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(crc32(opWrongStr), 32).endCell(),
        });
    }

    async sendAddUser(provider: ContractProvider, via: Sender, value: bigint, address: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(crc32(opAddStr), 32).storeAddress(address).endCell(),
        });
    }

    async sendRemoveUser(provider: ContractProvider, via: Sender, value: bigint, address: Address) {
        await provider.internal(via, {
            value,
            sendMode: SendMode.PAY_GAS_SEPARATELY,
            body: beginCell().storeUint(crc32(opRemoveStr), 32).storeAddress(address).endCell(),
        });
    }

    async getTotalCount(provider: ContractProvider) {
        const result = (await provider.get('get_count', [])).stack;
        return result.readBigNumber();
    }

    async getUserDic(provider: ContractProvider) {
        const result = (await provider.get('get_user_dic', [])).stack;
        let accountsRaw = result.readCellOpt();
        const addressList: BigInt[] = [];

        if (accountsRaw !== null) {
            const addrMap = parseDict(accountsRaw.beginParse(), 256, (slice) => {
                return 0;
            });
            for (let k of addrMap.keys()) {
                // create address from hashpart
                addressList.push(k);
            }
        }

        return addressList;
    }
}
