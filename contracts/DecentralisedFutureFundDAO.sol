pragma solidity ^0.4.21;

// ----------------------------------------------------------------------------
// Decentralised Future Fund DAO
//
// https://github.com/bokkypoobah/DecentralisedFutureFundDAO
//
// Enjoy.
//
// (c) BokkyPooBah / Bok Consulting Pty Ltd 2018. The MIT Licence.
// ----------------------------------------------------------------------------


// ----------------------------------------------------------------------------
// ERC Token Standard #20 Interface
// https://github.com/ethereum/EIPs/blob/master/EIPS/eip-20.md
// ----------------------------------------------------------------------------
contract ERC20Interface {
    function totalSupply() public view returns (uint);
    function balanceOf(address tokenOwner) public view returns (uint balance);
    function allowance(address tokenOwner, address spender) public view returns (uint remaining);
    function transfer(address to, uint tokens) public returns (bool success);
    function approve(address spender, uint tokens) public returns (bool success);
    function transferFrom(address from, address to, uint tokens) public returns (bool success);

    event Transfer(address indexed from, address indexed to, uint tokens);
    event Approval(address indexed tokenOwner, address indexed spender, uint tokens);
}


// ----------------------------------------------------------------------------
// BokkyPooBah's Token Teleportation Service Interface v1.10
//
// Enjoy. (c) BokkyPooBah / Bok Consulting Pty Ltd 2018. The MIT Licence.
// ----------------------------------------------------------------------------
contract BTTSTokenInterface is ERC20Interface {
    uint public constant bttsVersion = 110;

    bytes public constant signingPrefix = "\x19Ethereum Signed Message:\n32";
    bytes4 public constant signedTransferSig = "\x75\x32\xea\xac";
    bytes4 public constant signedApproveSig = "\xe9\xaf\xa7\xa1";
    bytes4 public constant signedTransferFromSig = "\x34\x4b\xcc\x7d";
    bytes4 public constant signedApproveAndCallSig = "\xf1\x6f\x9b\x53";

    event OwnershipTransferred(address indexed from, address indexed to);
    event MinterUpdated(address from, address to);
    event Mint(address indexed tokenOwner, uint tokens, bool lockAccount);
    event MintingDisabled();
    event TransfersEnabled();
    event AccountUnlocked(address indexed tokenOwner);

    function approveAndCall(address spender, uint tokens, bytes data) public returns (bool success);

    // ------------------------------------------------------------------------
    // signed{X} functions
    // ------------------------------------------------------------------------
    function signedTransferHash(address tokenOwner, address to, uint tokens, uint fee, uint nonce) public view returns (bytes32 hash);
    function signedTransferCheck(address tokenOwner, address to, uint tokens, uint fee, uint nonce, bytes sig, address feeAccount) public view returns (CheckResult result);
    function signedTransfer(address tokenOwner, address to, uint tokens, uint fee, uint nonce, bytes sig, address feeAccount) public returns (bool success);

    function signedApproveHash(address tokenOwner, address spender, uint tokens, uint fee, uint nonce) public view returns (bytes32 hash);
    function signedApproveCheck(address tokenOwner, address spender, uint tokens, uint fee, uint nonce, bytes sig, address feeAccount) public view returns (CheckResult result);
    function signedApprove(address tokenOwner, address spender, uint tokens, uint fee, uint nonce, bytes sig, address feeAccount) public returns (bool success);

    function signedTransferFromHash(address spender, address from, address to, uint tokens, uint fee, uint nonce) public view returns (bytes32 hash);
    function signedTransferFromCheck(address spender, address from, address to, uint tokens, uint fee, uint nonce, bytes sig, address feeAccount) public view returns (CheckResult result);
    function signedTransferFrom(address spender, address from, address to, uint tokens, uint fee, uint nonce, bytes sig, address feeAccount) public returns (bool success);

    function signedApproveAndCallHash(address tokenOwner, address spender, uint tokens, bytes _data, uint fee, uint nonce) public view returns (bytes32 hash);
    function signedApproveAndCallCheck(address tokenOwner, address spender, uint tokens, bytes _data, uint fee, uint nonce, bytes sig, address feeAccount) public view returns (CheckResult result);
    function signedApproveAndCall(address tokenOwner, address spender, uint tokens, bytes _data, uint fee, uint nonce, bytes sig, address feeAccount) public returns (bool success);

    function mint(address tokenOwner, uint tokens, bool lockAccount) public returns (bool success);
    function unlockAccount(address tokenOwner) public;
    function disableMinting() public;
    function enableTransfers() public;

    // ------------------------------------------------------------------------
    // signed{X}Check return status
    // ------------------------------------------------------------------------
    enum CheckResult {
        Success,                           // 0 Success
        NotTransferable,                   // 1 Tokens not transferable yet
        AccountLocked,                     // 2 Account locked
        SignerMismatch,                    // 3 Mismatch in signing account
        InvalidNonce,                      // 4 Invalid nonce
        InsufficientApprovedTokens,        // 5 Insufficient approved tokens
        InsufficientApprovedTokensForFees, // 6 Insufficient approved tokens for fees
        InsufficientTokens,                // 7 Insufficient tokens
        InsufficientTokensForFees,         // 8 Insufficient tokens for fees
        OverflowError                      // 9 Overflow error
    }
}


// ----------------------------------------------------------------------------
// Safe maths
// ----------------------------------------------------------------------------
library SafeMath {
    function add(uint a, uint b) internal pure returns (uint c) {
        c = a + b;
        require(c >= a);
    }
    function sub(uint a, uint b) internal pure returns (uint c) {
        require(b <= a);
        c = a - b;
    }
    function mul(uint a, uint b) internal pure returns (uint c) {
        c = a * b;
        require(a == 0 || c / a == b);
    }
    function div(uint a, uint b) internal pure returns (uint c) {
        require(b > 0);
        c = a / b;
    }
}


// ----------------------------------------------------------------------------
// Owned contract
// ----------------------------------------------------------------------------
contract Owned {
    address public owner;
    address public newOwner;

    event OwnershipTransferred(address indexed _from, address indexed _to);

    modifier onlyOwner {
        require(msg.sender == owner);
        _;
    }

    function Owned() public {
        owner = msg.sender;
    }
    function transferOwnership(address _newOwner) public onlyOwner {
        newOwner = _newOwner;
    }
    function acceptOwnership() public {
        require(msg.sender == newOwner);
        emit OwnershipTransferred(owner, newOwner);
        owner = newOwner;
        newOwner = address(0);
    }
    function transferOwnershipImmediately(address _newOwner) public onlyOwner {
        emit OwnershipTransferred(owner, _newOwner);
        owner = _newOwner;
    }
}


library Members {
    struct Member {
        bool exists;
        uint index;
        bytes32 name;
        bool governor;
    }
    struct Data {
        bool initialised;
        mapping(address => Member) entries;
        address[] index;
    }

    event MemberAdded(address indexed _address, bytes32 _name, bool _governor, uint totalAfter);
    event MemberRemoved(address indexed _address, bytes32 _name, bool _governor, uint totalAfter);

    function init(Data storage self) public {
        require(!self.initialised);
        self.initialised = true;
    }
    function exists(Data storage self, address _address) public view returns (bool) {
        return self.entries[_address].exists;
    }
    function isGovernor(Data storage self, address _address) public view returns (bool) {
        return self.entries[_address].governor;
    }
    function add(Data storage self, address _address, bytes32 _name, bool _governor) public {
        require(!self.entries[_address].exists);
        self.index.push(_address);
        self.entries[_address] = Member(true, self.index.length - 1, _name, _governor);
        emit MemberAdded(_address, _name, _governor, self.index.length);
    }
    function remove(Data storage self, address _address) public {
        require(self.entries[_address].exists);
        uint removeIndex = self.entries[_address].index;
        emit MemberRemoved(_address, self.entries[_address].name, self.entries[_address].governor, self.index.length - 1);
        uint lastIndex = self.index.length - 1;
        address lastIndexAddress = self.index[lastIndex];
        self.index[removeIndex] = lastIndexAddress;
        self.entries[lastIndexAddress].index = removeIndex;
        delete self.entries[_address];
        if (self.index.length > 0) {
            self.index.length--;
        }
    }
    function length(Data storage self) public view returns (uint) {
        return self.index.length;
    }
}


contract DFFDAO is Owned {
    using Members for Members.Data;

    enum ProposalType {
        EtherPayment,                      //  0 Ether payment
        TokenPayment,                      //  1 DFF Token payment
        OtherTokenPayment,                 //  2 Token payment
        MintTokens,                        //  3 Mint DFF tokens
        AddRule,                           //  4 Add governance rule
        DeleteRule,                        //  5 Delete governance rule
        UpdateBTTSToken,                   //  6 Update BTTS Token
        UpdateDAO,                         //  7 Update DAO
        AddMember,                         //  8 Add member
        AddGovernor,                       //  9 Add governor
        RemoveMember                       // 10 Remove member
    }

    struct Proposal {
        ProposalType proposalType;
        address proposer;
        bool governor;
        string description;
        address address1;
        address address2;
        address recipient;
        address tokenContract;
        uint amount;
        mapping(address => bool) voted;
        uint memberVotedNo;
        uint memberVotedYes;
        uint governorVotedNo;
        uint governorVotedYes;
        address executor;
        bool closed;
    }

    Proposal[] proposals;
    
    function proposeEtherPayment(string description, address _recipient, uint _amount) public {
        require(address(this).balance >= _amount);
        Proposal memory proposal = Proposal({
            proposalType: ProposalType.EtherPayment,
            proposer: msg.sender,
            governor: members.isGovernor(msg.sender),
            description: description,
            address1: address(0),
            address2: address(0),
            recipient: _recipient,
            tokenContract: address(0),
            amount: _amount,
            memberVotedNo: 0,
            memberVotedYes: 0,
            governorVotedNo: 0,
            governorVotedYes: 0,
            executor: address(0),
            closed: false
        });
        proposals.push(proposal);
    }

    uint8 public constant TOKEN_DECIMALS = 18;
    uint public constant TOKEN_DECIMALSFACTOR = 10 ** uint(TOKEN_DECIMALS); 

    BTTSTokenInterface public bttsToken;
    Members.Data members;
    bool public initialised;

    uint public tokensForNewGoverningMembers = 200000 * TOKEN_DECIMALSFACTOR; 
    uint public tokensForNewMembers = 1000 * TOKEN_DECIMALSFACTOR; 

    // Must be copied here to be added to the ABI
    event MemberAdded(address indexed _address, bytes32 _name, bool _governor, uint totalAfter);
    event MemberRemoved(address indexed _address, bytes32 _name, bool _governor, uint totalAfter);

    event BTTSTokenUpdated(address indexed oldBTTSToken, address indexed newBTTSToken);
    event TokensForNewGoverningMembersUpdated(uint oldTokens, uint newTokens);
    event TokensForNewMembersUpdated(uint oldTokens, uint newTokens);


    function Governance() public {
        members.init();
    }

    function initSetBTTSToken(address _bttsToken) public onlyOwner {
        require(!initialised);
        emit BTTSTokenUpdated(address(bttsToken), _bttsToken);
        bttsToken = BTTSTokenInterface(_bttsToken);
    }
    function initAddMember(address _address, bytes32 _name, bool _governor) public onlyOwner {
        require(!initialised);
        require(bttsToken != address(0));
        members.add(_address, _name, _governor);
        bttsToken.mint(_address, _governor ? tokensForNewGoverningMembers : tokensForNewMembers, false);
    }
    function initRemoveMember(address _address) public onlyOwner {
        require(!initialised);
        members.remove(_address);
    }
    function initialisationComplete() public onlyOwner {
        require(!initialised);
        require(members.length() != 0);
        initialised = true;
        transferOwnershipImmediately(address(0));
    }

    function setBTTSToken(address _bttsToken) internal {
        emit BTTSTokenUpdated(address(bttsToken), _bttsToken);
        bttsToken = BTTSTokenInterface(_bttsToken);
    }
    function setTokensForNewGoverningMembers(uint _newToken) internal {
        emit TokensForNewGoverningMembersUpdated(tokensForNewGoverningMembers, _newToken);
        tokensForNewGoverningMembers = _newToken;
    }
    function setTokensForNewMembers(uint _newToken) internal {
        emit TokensForNewMembersUpdated(tokensForNewMembers, _newToken);
        tokensForNewMembers = _newToken;
    }
    function addMember(address _address, bytes32 _name, bool _governor) internal {
        members.add(_address, _name, _governor);
        bttsToken.mint(_address, _governor ? tokensForNewGoverningMembers : tokensForNewMembers, false);
    }
    function removeMember(address _address) internal {
        members.remove(_address);
    }

    function numberOfMembers() public view returns (uint) {
        return members.length();
    }
    function getMembers() public view returns (address[]) {
        return members.index;
    }
    function getMemberData(address _address) public view returns (bool _exists, uint _index, bytes32 _name, bool _governor) {
        Members.Member memory member = members.entries[_address];
        return (member.exists, member.index, member.name, member.governor);
    }
    function getMemberByIndex(uint _index) public view returns (address _member) {
        return members.index[_index];
    }
}