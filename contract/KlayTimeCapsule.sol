// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "./utils/Ownable.sol";
import "./utils/IKIP7.sol";
import "./utils/IKIP17.sol";

contract KlayTimeCapsule is Ownable {

    constructor() {}

    mapping (address => address) public target;

    function setTarget(address _target) public {
        target[msg.sender] = _target;
    }

    function executeCapsule_kip7(address user, address asset) public onlyOwner{
        uint256 _balance = IKIP7(asset).balanceOf(user);
        IKIP7(asset).transferFrom(user, target[user], _balance);
    }

    function executeCapsule_kip17(address user, address asset, uint256[] memory ids) public onlyOwner{
        for(uint256 i = 0; i < ids.length; i++){
            IKIP17(asset).transferFrom(user, target[user], ids[i]);
        }
    }
}
