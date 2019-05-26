pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

import "./Ownable.sol";
import "./Pausable.sol";

contract Splitter is Ownable, Pausable {
    using SafeMath for uint256;

    mapping (address => uint) public balances;

    event LogBalanceIncreased(address indexed account, uint amount);
    event LogBalanceDecreased(address indexed account, uint amount);

    constructor(bool paused) public Pausable(paused) {
    }

    function () external payable {
        revert("Not supported");
    }

    function split(address receiver1, address receiver2)
        public
        payable
        whenRunning
        whenAlive {

        require(receiver1 != address(0), "Receiver1 cannot be empty");
        require(receiver2 != address(0), "Receiver2 cannot be empty");
        require(msg.value > 1, "Value should be greater 1 Wei");

        uint256 half = msg.value.div(2);
        balances[receiver1] = balances[receiver1].add(half);
        balances[receiver2] = balances[receiver2].add(half);

        uint amount = half.mul(2);
        uint256 remainder = msg.value.sub(amount);
        balances[msg.sender] = balances[msg.sender].add(remainder);

        emit LogBalanceIncreased(receiver1, half);
        emit LogBalanceIncreased(receiver2, half);
        emit LogBalanceIncreased(msg.sender, remainder);
    }

    function withdraw() public whenRunning {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Amount cannot be zero");

        balances[msg.sender] = 0;

        emit LogBalanceDecreased(msg.sender, amount);
        msg.sender.transfer(amount);
    }
}