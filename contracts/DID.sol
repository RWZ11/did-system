// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract DecentralizedID {
    struct Identity {
        string did;
        uint256 createdAt;
        uint256 expiresAt;
        bool isActive;
        mapping(address => bool) authorizedAddresses; // 授权地址列表
        string username; // 用户名
        string avatar; // 头像URI
        string[] tags; // 标签列表
        string email; // 邮箱地址
        string[] socialAccounts; // 社交媒体账号列表
        bool emailVerified; // 邮箱是否已验证
    }

    struct HistoryRecord {
        string did;
        uint256 timestamp;
        string action; // "register", "update", "revoke", "expire"
    }

    mapping(address => HistoryRecord[]) public didHistory; // DID历史记录

    uint256 public constant DEFAULT_EXPIRY_DAYS = 365;
    mapping(address => Identity) public identities;
    event DIDRegistered(address indexed user, string did);
    event DIDUpdated(address indexed user, string newDid);
    event DIDRevoked(address indexed user);
    event DIDExpired(address indexed user);
    event DIDAuthorized(address indexed owner, address indexed authorized);
    event DIDUnauthorized(address indexed owner, address indexed unauthorized);
    event DIDProfileUpdated(address indexed user, string username, string avatar, string email);
    event DIDTagAdded(address indexed user, string tag);
    event DIDSocialAccountAdded(address indexed user, string account);
    event DIDEmailVerified(address indexed user);

    modifier onlyNewUser() {
        require(bytes(identities[msg.sender].did).length == 0, "User already registered DID");
        _;
    }

    modifier onlyRegisteredUser() {
        require(bytes(identities[msg.sender].did).length > 0, "User not registered");
        _;
    }

    modifier onlyValidDID(string memory _did) {
        require(bytes(_did).length > 0, "DID cannot be empty");
        require(bytes(_did)[0] != ' ', "DID cannot start with space");
        _;
    }

    //注册DID
    function registerDID(string memory _did) public onlyNewUser onlyValidDID(_did) {
        Identity storage newIdentity = identities[msg.sender];
        newIdentity.did = _did;
        newIdentity.createdAt = block.timestamp;
        newIdentity.expiresAt = block.timestamp + (DEFAULT_EXPIRY_DAYS * 1 days);
        newIdentity.isActive = true;
        _recordHistory(msg.sender, "register");
        emit DIDRegistered(msg.sender, _did);
    }

    //更新DID
    function updateDID(string memory _newDid) public onlyRegisteredUser onlyValidDID(_newDid) {
        require(identities[msg.sender].isActive, "DID is revoked");
        require(block.timestamp < identities[msg.sender].expiresAt, "DID is expired");
        identities[msg.sender].did = _newDid;
        _recordHistory(msg.sender, "update");
        emit DIDUpdated(msg.sender, _newDid);
    }

    //撤销DID
    function revokeDID() public onlyRegisteredUser {
        identities[msg.sender].isActive = false;
        _recordHistory(msg.sender, "revoke");
        emit DIDRevoked(msg.sender);
    }

    //检查DID是否过期
    function checkExpiry(address _user) public {
        if(identities[_user].isActive && block.timestamp >= identities[_user].expiresAt) {
            identities[_user].isActive = false;
            _recordHistory(_user, "expire");
            emit DIDExpired(_user);
        }
    }

    function getDID(address _user) public view returns (string memory) {
        return identities[_user].isActive && block.timestamp < identities[_user].expiresAt ? identities[_user].did : "";
    }

    // 检查地址是否已注册DID
    function isRegistered(address _user) public view returns (bool) {
        return bytes(identities[_user].did).length > 0;
    }

    // 授权其他地址访问DID信息
    function authorizeDID(address _authorized) public onlyRegisteredUser {
        require(!identities[msg.sender].authorizedAddresses[_authorized], "Address already authorized");
        identities[msg.sender].authorizedAddresses[_authorized] = true;
        emit DIDAuthorized(msg.sender, _authorized);
    }

    // 取消授权
    function unauthorizeDID(address _unauthorized) public onlyRegisteredUser {
        require(identities[msg.sender].authorizedAddresses[_unauthorized], "Address not authorized");
        identities[msg.sender].authorizedAddresses[_unauthorized] = false;
        emit DIDUnauthorized(msg.sender, _unauthorized);
    }

    // 检查是否被授权
    function isAuthorized(address _owner, address _user) public view returns (bool) {
        return identities[_owner].authorizedAddresses[_user];
    }

    // 更新用户资料
    function updateProfile(string memory _username, string memory _avatar) public onlyRegisteredUser {
        require(identities[msg.sender].isActive, "DID is not active");
        identities[msg.sender].username = _username;
        identities[msg.sender].avatar = _avatar;
        emit DIDProfileUpdated(msg.sender, _username, _avatar, identities[msg.sender].email);
    }

    // 获取用户资料
    function getProfile(address _user) public view returns (
        string memory did,
        string memory username,
        string memory avatar,
        string[] memory tags,
        string memory email,
        bool emailVerified,
        string[] memory socialAccounts
    ) {
        require(msg.sender == _user || identities[_user].authorizedAddresses[msg.sender], "Not authorized to view profile");
        return (
            identities[_user].did,
            identities[_user].username,
            identities[_user].avatar,
            identities[_user].tags,
            identities[_user].email,
            identities[_user].emailVerified,
            identities[_user].socialAccounts
        );
    }

    // 添加标签
    function addTag(string memory _tag) public onlyRegisteredUser {
        require(identities[msg.sender].isActive, "DID is not active");
        identities[msg.sender].tags.push(_tag);
        emit DIDTagAdded(msg.sender, _tag);
    }

    // 获取DID历史记录
    function getDidHistory(address _user) public view returns (HistoryRecord[] memory) {
        return didHistory[_user];
    }

    // 记录DID历史
    function _recordHistory(address _user, string memory _action) internal {
        didHistory[_user].push(HistoryRecord(identities[_user].did, block.timestamp, _action));
    }

    // 更新用户邮箱
    function updateEmail(string memory _email) public onlyRegisteredUser {
        require(bytes(_email).length > 0, "Email cannot be empty");
        identities[msg.sender].email = _email;
        identities[msg.sender].emailVerified = false;
        emit DIDProfileUpdated(msg.sender, identities[msg.sender].username, identities[msg.sender].avatar, _email);
    }

    // 添加社交媒体账号
    function addSocialAccount(string memory _account) public onlyRegisteredUser {
        require(bytes(_account).length > 0, "Social account cannot be empty");
        identities[msg.sender].socialAccounts.push(_account);
        emit DIDSocialAccountAdded(msg.sender, _account);
    }

    // 验证邮箱（这里简化处理，实际应该有验证流程）
    function verifyEmail() public onlyRegisteredUser {
        require(bytes(identities[msg.sender].email).length > 0, "No email to verify");
        identities[msg.sender].emailVerified = true;
        emit DIDEmailVerified(msg.sender);
    }
}