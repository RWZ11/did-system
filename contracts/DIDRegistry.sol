// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DIDRegistry {
    // DID状态映射
    mapping(string => bool) private activeDIDs;
    
    // DID文档映射
    mapping(string => string) private didDocuments;
    
    // 注册DID事件
    event DIDRegistered(string did, string document);
    // 更新DID事件
    event DIDUpdated(string did, string document);
    // 停用DID事件
    event DIDDeactivated(string did);

    // 注册新的DID
    function register(string memory did, string memory document) public {
        require(!activeDIDs[did], "DID already exists");
        activeDIDs[did] = true;
        didDocuments[did] = document;
        emit DIDRegistered(did, document);
    }

    // 更新DID文档
    function update(string memory did, string memory document) public {
        require(activeDIDs[did], "DID not found");
        didDocuments[did] = document;
        emit DIDUpdated(did, document);
    }

    // 停用DID
    function deactivate(string memory did) public {
        require(activeDIDs[did], "DID not found");
        activeDIDs[did] = false;
        emit DIDDeactivated(did);
    }

    // 获取DID状态
    function getStatus(string memory did) public view returns (bool) {
        return activeDIDs[did];
    }

    // 获取DID文档
    function getDocument(string memory did) public view returns (string memory) {
        require(activeDIDs[did], "DID not found or deactivated");
        return didDocuments[did];
    }
}
