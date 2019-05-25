const { BN, expectRevert, constants, send, balance } = require('openzeppelin-test-helpers');

const Splitter = artifacts.require('./Splitter.sol');

contract.only('Splitter', accounts => {
    describe('fallback', function () {
        before(async () => {
            this.splitter = await Splitter.new();
        });

        it('reverts when not sender', async () => {
            await expectRevert.unspecified(send.ether(accounts[4], this.splitter.address, new BN('1')), "Not supported");
        });
    });

    describe('split', function () {
        beforeEach(async () => {
            this.splitter = await Splitter.new();
        });

        it('reverts when receiver1 is not defined', async () => {
            await expectRevert(this.splitter.split(constants.ZERO_ADDRESS, accounts[1]), 'Receiver1 cannot be empty');
        });

        it('reverts when receiver2 is not defined', async () => {
            await expectRevert(this.splitter.split(accounts[1], constants.ZERO_ADDRESS), 'Receiver2 cannot be empty');
        });

        it('reverts when value zero', async () => {
            await expectRevert(this.splitter.split(accounts[1], accounts[2], { value: 0 }), 'Value should be greater 1 Wei');
        });

        it('reverts when value one', async () => {
            await expectRevert(this.splitter.split(accounts[1], accounts[2], { value: 1 }), 'Value should be greater 1 Wei');
        });

        it('should split', async () => {
            await this.splitter.split(accounts[1], accounts[2], { value: 2 });

            (await this.splitter.balances(accounts[1])).should.be.bignumber.equal('1');
            (await this.splitter.balances(accounts[2])).should.be.bignumber.equal('1');
        });

        it('should split and transfer back of remainder when value cannot be splitted equaly', async () => {
            const balanceTrackerSplitter = await balance.tracker(this.splitter.address);
            await this.splitter.split(accounts[1], accounts[2], { value: 3 });

            (await this.splitter.balances(accounts[1])).should.be.bignumber.equal('1');
            (await this.splitter.balances(accounts[2])).should.be.bignumber.equal('1');
            (await balanceTrackerSplitter.delta()).should.be.bignumber.equal('2');
        });
    });

    describe('withdraw', function () {
        beforeEach(async () => {
            this.splitter = await Splitter.new();
        });

        it('reverts when balance zero', async () => {
            await expectRevert(this.splitter.withdraw({ from: accounts[1] }), 'Amount cannot be zero');
        });

        it('should withdraw for receiver', async () => {
            const balanceTrackerSplitter = await balance.tracker(this.splitter.address);
            const balanceTrackerReceiver = await balance.tracker(this.splitter.address);
            await this.splitter.split(accounts[1], accounts[2], { value: 10 });

            await this.splitter.withdraw({ from: accounts[1] });

            (await balanceTrackerSplitter.delta()).should.be.bignumber.equal('5');
            (await balanceTrackerReceiver.delta()).should.be.bignumber.equal('5');
        });
    });
});