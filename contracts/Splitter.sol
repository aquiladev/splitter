pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Splitter {
    using SafeMath for uint256;

    address private _sender;
    address[] private _receivers;

    uint256 private _totalWithdrawn;
    mapping(address => uint256) private _withdrawn;

    modifier onlySender() {
        require(msg.sender == _sender, "Only sender can execute");
        _;
    }

    constructor(address sender, address receiver1, address receiver2) public {
        require(sender != address(0), "Sender cannot be empty");
        require(receiver1 != address(0), "Receiver1 cannot be empty");
        require(receiver2 != address(0), "Receiver2 cannot be empty");

        _sender = sender;
        _receivers.push(receiver1);
        _receivers.push(receiver2);
    }

    function () external payable onlySender {
    }

    function withdraw() public {
        address payable account = msg.sender;
        uint256 amount = _balanceOf(account);
        require(amount != 0, "Amount cannot be zero");

        _withdrawn[account] = _withdrawn[account].add(amount);
        _totalWithdrawn = _totalWithdrawn.add(amount);

        account.transfer(amount);
    }

    function withdrawn(uint256 index) public view returns(uint256) {
        require(index < _receivers.length, "Receiver does not exist");
        return _withdrawn[_receivers[index]];
    }

    function balanceOf(uint256 index) public view returns(uint256) {
        require(index < _receivers.length, "Receiver does not exist");

        address account = _receivers[index];
        require(account != address(0), "Account fot found");

        return _balanceOf(account);
    }

    function _balanceOf(address account) internal view returns(uint256) {
        uint256 received = address(this).balance.add(_totalWithdrawn);
        return received.div(2).sub(_withdrawn[account]);
    }
}