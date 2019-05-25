pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Splitter {
    using SafeMath for uint256;

    mapping (address => uint) public balances;

    event Split(address indexed sender, address indexed receiver1, address indexed receiver2, uint amount);
    event Withdrawn(address indexed who, uint amount);

    function () external {
        revert("Not supported");
    }

    function split(address receiver1, address receiver2) public payable {
        require(receiver1 != address(0), "Receiver1 cannot be empty");
        require(receiver2 != address(0), "Receiver2 cannot be empty");
        require(msg.value > 1, "Value should be greater 1 Wei");

        uint256 half = msg.value.div(2);
        balances[receiver1] = balances[receiver1].add(half);
        balances[receiver2] = balances[receiver2].add(half);

        uint amount = half.mul(2);
        uint256 remainder = msg.value.sub(amount);
        if(remainder > 0) {
            msg.sender.transfer(remainder);
        }

        emit Split(msg.sender, receiver1, receiver2, amount);
    }

    function withdraw() public {
        uint256 amount = balances[msg.sender];
        require(amount > 0, "Amount cannot be zero");

        balances[msg.sender] = 0;
        msg.sender.transfer(amount);

        emit Withdrawn(msg.sender, amount);
    }
}