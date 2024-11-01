import { toNano } from '@ton/core';
import { Clicker } from '../wrappers/Clicker';
import { compile, NetworkProvider } from '@ton/blueprint';

export async function run(provider: NetworkProvider) {
    const clicker = provider.open(Clicker.createFromConfig({}, await compile('Clicker')));

    await clicker.sendDeploy(provider.sender(), toNano('0.05'));

    await provider.waitForDeploy(clicker.address);

    // run methods on `clicker`
}
