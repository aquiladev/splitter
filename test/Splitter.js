const { BN, expectRevert, constants, send, balance, expectEvent } = require('openzeppelin-test-helpers');

const Splitter = artifacts.require('./Splitter.sol');

let splitter;

contract.only('Splitter', accounts => {
    beforeEach(async () => {
        splitter = await Splitter.new();
    });

    describe('fallback', function () {
        it('reverts when not sender', async () => {
            await expectRevert.unspecified(send.ether(accounts[4], splitter.address, new BN('1')), "Not supported");
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

        it('should split', async () => {
            await splitter.split(accounts[1], accounts[2], { value: 2 });

            (await splitter.balances(accounts[1])).should.be.bignumber.equal('1');
            (await splitter.balances(accounts[2])).should.be.bignumber.equal('1');
        });

        it('should split and transfer back of remainder when value cannot be splitted equaly', async () => {
            const balanceTrackerSplitter = await balance.tracker(splitter.address);
            
            const { logs } = await splitter.split(accounts[1], accounts[2], { value: 3 });

            (await splitter.balances(accounts[1])).should.be.bignumber.equal('1');
            (await splitter.balances(accounts[2])).should.be.bignumber.equal('1');
            (await balanceTrackerSplitter.delta()).should.be.bignumber.equal('2');
            expectEvent.inLogs(logs, 'Split', {
                sender: accounts[0],
                receiver1: accounts[1],
                receiver2: accounts[2],
                amount: new BN('2')
              });
        });
    });

    describe('withdraw', function () {
        it('reverts when balance zero', async () => {
            await expectRevert(splitter.withdraw({ from: accounts[1] }), 'Amount cannot be zero');
        });

        it('should withdraw for receiver', async () => {
            const balanceTrackerSplitter = await balance.tracker(splitter.address);
            const balanceTrackerReceiver = await balance.tracker(splitter.address);
            await splitter.split(accounts[1], accounts[2], { value: 10 });

            const { logs } = await splitter.withdraw({ from: accounts[1] });

            (await balanceTrackerSplitter.delta()).should.be.bignumber.equal('5');
            (await balanceTrackerReceiver.delta()).should.be.bignumber.equal('5');
            expectEvent.inLogs(logs, 'Withdrawn', {
                who: accounts[1],
                amount: new BN('5')
              });
        });
    });
});