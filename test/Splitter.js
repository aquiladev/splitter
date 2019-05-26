const { BN, expectRevert, constants, send, balance, expectEvent } = require('openzeppelin-test-helpers');

const Splitter = artifacts.require('./Splitter.sol');

let splitter;

contract('Splitter', accounts => {
    beforeEach(async () => {
        splitter = await Splitter.new();
    });

    describe('fallback', function () {
        it('reverts when send value', async () => {
            await expectRevert.unspecified(send.ether(accounts[4], splitter.address, new BN('1')));
        });
    });

    describe('split', function () {
        it('reverts when receiver1 is not defined', async () => {
            await expectRevert(splitter.split(constants.ZERO_ADDRESS, accounts[1]), 'Receiver1 cannot be empty');
        });

        it('reverts when receiver2 is not defined', async () => {
            await expectRevert(splitter.split(accounts[1], constants.ZERO_ADDRESS), 'Receiver2 cannot be empty');
        });

        it('reverts when value zero', async () => {
            await expectRevert(splitter.split(accounts[1], accounts[2], { value: 0 }), 'Value should be greater 1 Wei');
        });

        it('reverts when value one', async () => {
            await expectRevert(splitter.split(accounts[1], accounts[2], { value: 1 }), 'Value should be greater 1 Wei');
        });

        it('reverts when paused', async () => {
            await splitter.pause({ from: accounts[0] });

            await expectRevert(splitter.split(accounts[1], accounts[2], { value: 20 }), 'Paused');
        });

        it('should split', async () => {
            await splitter.split(accounts[1], accounts[2], { value: 2 });

            (await splitter.balances(accounts[1])).should.be.bignumber.equal('1');
            (await splitter.balances(accounts[2])).should.be.bignumber.equal('1');
        });

        it('should split and transfer back of remainder when value cannot be splitted equaly', async () => {
            const balanceTrackerSplitter = await balance.tracker(splitter.address);
            const gasPrice = new BN('20000000');

            const { logs } = await splitter.split(accounts[1], accounts[2], { value: 3, gasPrice });

            (await splitter.balances(accounts[0])).should.be.bignumber.equal('1');
            (await splitter.balances(accounts[1])).should.be.bignumber.equal('1');
            (await splitter.balances(accounts[2])).should.be.bignumber.equal('1');
            (await balanceTrackerSplitter.delta()).should.be.bignumber.equal('3');
            expectEvent.inLogs(logs, 'LogBalanceIncreased', { account: accounts[0], amount: new BN('1') });
            expectEvent.inLogs(logs, 'LogBalanceIncreased', { account: accounts[1], amount: new BN('1') });
            expectEvent.inLogs(logs, 'LogBalanceIncreased', { account: accounts[2], amount: new BN('1') });
        });

        it('should consume right amount of wei', async () => {
            const balanceSender = new BN(await web3.eth.getBalance(accounts[0]));
            const gasPrice = new BN('20000000');

            const result = await splitter.split(accounts[1], accounts[2], { value: 3, gasPrice });

            const newBalanceSender = new BN(await web3.eth.getBalance(accounts[0]));
            const gasUsed = new BN(gasPrice).mul(new BN(result.receipt.gasUsed));
            const delta = balanceSender.sub(newBalanceSender).sub(gasUsed);

            delta.should.be.bignumber.equal('3');
        });
    });

    describe('withdraw', function () {
        it('reverts when balance zero', async () => {
            await expectRevert(splitter.withdraw({ from: accounts[1] }), 'Amount cannot be zero');
        });

        it('reverts when paused', async () => {
            await splitter.split(accounts[1], accounts[2], { value: 10 });
            await splitter.pause({ from: accounts[0] });

            await expectRevert(splitter.withdraw({ from: accounts[1] }), 'Paused');
        });

        it('should withdraw for receiver', async () => {
            const balanceTrackerSplitter = await balance.tracker(splitter.address);
            const balanceTrackerReceiver = await balance.tracker(splitter.address);
            await splitter.split(accounts[1], accounts[2], { value: 10 });

            const { logs } = await splitter.withdraw({ from: accounts[1] });

            (await balanceTrackerSplitter.delta()).should.be.bignumber.equal('5');
            (await balanceTrackerReceiver.delta()).should.be.bignumber.equal('5');
            expectEvent.inLogs(logs, 'LogBalanceDecreased', {
                account: accounts[1],
                amount: new BN('5')
            });
        });
    });
});