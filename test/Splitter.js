const { BN, expectRevert, constants, send, balance } = require('openzeppelin-test-helpers');
const { expect } = require('chai');

const Splitter = artifacts.require('./Splitter.sol');

contract.only('Splitter', accounts => {
    describe('constructor', function () {
        it('reverts when sender is not defined', async () => {
            await expectRevert(Splitter.new(constants.ZERO_ADDRESS, accounts[1], accounts[2]), 'Sender cannot be empty');
        });

        it('reverts when receiver1 is not defined', async () => {
            await expectRevert(Splitter.new(accounts[0], constants.ZERO_ADDRESS, accounts[2]), 'Receiver1 cannot be empty');
        });

        it('reverts when receiver2 is not defined', async () => {
            await expectRevert(Splitter.new(accounts[0], accounts[1], constants.ZERO_ADDRESS), 'Receiver2 cannot be empty');
        });
    });

    describe('fallback', function () {
        before(async () => {
            this.splitter = await Splitter.new(accounts[0], accounts[1], accounts[2]);
        });

        it('reverts when not sender', async () => {
            await expectRevert.unspecified(send.ether(accounts[4], this.splitter.address, new BN('1')));
        });

        it('should transfer', async () => {
            const balanceTracker = await balance.tracker(this.splitter.address);

            await send.ether(accounts[0], this.splitter.address, new BN('1'));

            (await balanceTracker.delta()).should.be.bignumber.equal('1');
        });
    });

    describe('balanceOf', function () {
        beforeEach(async () => {
            this.splitter = await Splitter.new(accounts[0], accounts[1], accounts[2]);
        });

        it('reverts when unknown address', async () => {
            await expectRevert(this.splitter.balanceOf(3), 'Receiver does not exist');
        });

        it('should return zero when balance is 1', async () => {
            await send.ether(accounts[0], this.splitter.address, new BN('1'));

            (await this.splitter.balanceOf(0)).should.be.bignumber.equal('0');
            (await this.splitter.balanceOf(1)).should.be.bignumber.equal('0');
        });

        it('should return right balance for odd total balance', async () => {
            await send.ether(accounts[0], this.splitter.address, new BN('3'));

            (await this.splitter.balanceOf(0)).should.be.bignumber.equal('1');
            (await this.splitter.balanceOf(1)).should.be.bignumber.equal('1');
        });

        it('should return right balance for even total balance', async () => {
            await send.ether(accounts[0], this.splitter.address, new BN('2'));

            (await this.splitter.balanceOf(0)).should.be.bignumber.equal('1');
            (await this.splitter.balanceOf(1)).should.be.bignumber.equal('1');
        });

        it('should return right balance for even total balance 2', async () => {
            await send.ether(accounts[0], this.splitter.address, new BN('10'));

            (await this.splitter.balanceOf(0)).should.be.bignumber.equal('5');
            (await this.splitter.balanceOf(1)).should.be.bignumber.equal('5');
        });

        it('should return right balance after partial withdrawal', async () => {
            await send.ether(accounts[0], this.splitter.address, new BN('10'));
            await this.splitter.withdraw({ from: accounts[1] });
            await send.ether(accounts[0], this.splitter.address, new BN('14'));

            (await this.splitter.balanceOf(0)).should.be.bignumber.equal('7');
            (await this.splitter.withdrawn(0)).should.be.bignumber.equal('5');
            (await this.splitter.balanceOf(1)).should.be.bignumber.equal('12');
            (await this.splitter.withdrawn(1)).should.be.bignumber.equal('0');
        });
    });

    describe('withdraw', function () {
        beforeEach(async () => {
            this.splitter = await Splitter.new(accounts[0], accounts[1], accounts[2]);
        });

        it('reverts when balance zero', async () => {
            await expectRevert(this.splitter.withdraw({ from: accounts[1] }), 'Amount cannot be zero');
        });

        it('should withdraw for receiver', async () => {
            const balanceTrackerSplitter = await balance.tracker(this.splitter.address);
            const balanceTrackerReceiver = await balance.tracker(this.splitter.address);
            await send.ether(accounts[0], this.splitter.address, new BN('10'));
            
            await this.splitter.withdraw({ from: accounts[1] });

            (await balanceTrackerSplitter.delta()).should.be.bignumber.equal('5');
            (await balanceTrackerReceiver.delta()).should.be.bignumber.equal('5');
        });
    });
});