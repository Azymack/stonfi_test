import { Transaction } from '@ton/core';
import { flattenTransaction } from '@ton/test-utils';

export function logTransactions(transactions: Transaction[]) {
    console.log('Transaction Logs:');
    for (let transaction of transactions) {
        console.log(flattenTransaction(transaction));
    }
}
