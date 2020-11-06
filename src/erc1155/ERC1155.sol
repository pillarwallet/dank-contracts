// SPDX-License-Identifier: MIT

pragma solidity ^0.6.8;

import "../common/math/SafeMath.sol";
import "../common/utils/Address.sol";
import "./interfaces/IERC1155TokenReceiver.sol";
import "../erc721/ERC721TokenHolder.sol";
import "./interfaces/IERC1155.sol";
import "./utils/CustomERC165.sol";


/**
 * @dev Implementation of Multi-Token Standard contract
 */
contract ERC1155 is IERC1155, CustomERC165, ERC721Holder {
  using SafeMath for uint256;
  using Address for address;

  /***********************************|
  |        Variables and Events       |
  |__________________________________*/

  // onReceive function signatures
  bytes4 constant internal ERC1155_RECEIVED_VALUE = 0xf23a6e61;
  bytes4 constant internal ERC1155_BATCH_RECEIVED_VALUE = 0xbc197c81;

  // Objects balances
  mapping (address => mapping(bytes32 => uint256)) internal balances;
  mapping (bytes32 => uint256) internal dispensed; // token id => amount of ERC1155 dispensed

  // Operator Functions
  mapping (address => mapping(address => bool)) internal operators;


  /***********************************|
  |     Public Transfer Functions     |
  |__________________________________*/

  /**
   * @notice Transfers amount amount of an _id from the _from address to the _to address specified
   * @param _from    Source address
   * @param _to      Target address
   * @param _hash    Computed hash of erc721 contract address and its tokenId
   * @param _amount  Transfered amount
   * @param _data    Additional data with no specified format, sent in call to `_to`
   */
  function safeTransferFrom(address _from, address _to, bytes32 _hash, uint256 _amount, bytes memory _data)
    public override returns (bool)
  {
    require((msg.sender == _from) || isApprovedForAll(_from, msg.sender), "ERC1155#safeTransferFrom: INVALID_OPERATOR");
    require(_to != address(0),"ERC1155#safeTransferFrom: INVALID_RECIPIENT");
    // require(_amount <= balances[_from][_id]) is not necessary since checked with safemath operations

    _safeTransferFrom(_from, _to, _hash, _amount);

    // currently do not support contract receivers;
    _callonERC1155Received(_from, _to, _hash, _amount, gasleft(), _data);

    return true;
  }

  /**
   * @notice Transfers amount amount of an _id from the _from address to the _to address specified
   * @param _from    Source address
   * @param _to      Target address
   * @param _hash    Computed hash of erc721 contract address and its tokenId
   * @param _amount  Transfered amount
   */
  function transferFrom(address _from, address _to, bytes32 _hash, uint256 _amount)
    public override returns (bool)
  {
    require((msg.sender == _from) || isApprovedForAll(_from, msg.sender), "ERC1155#safeTransferFrom: INVALID_OPERATOR");
    require(_to != address(0),"ERC1155#safeTransferFrom: INVALID_RECIPIENT");
    // require(_amount <= balances[_from][_id]) is not necessary since checked with safemath operations

    _safeTransferFrom(_from, _to, _hash, _amount);

    return true;
  }

  /**
   * @notice Send multiple types of Tokens from the _from address to the _to address (with safety call)
   * @param _from     Source addresses
   * @param _to       Target addresses
   * @param _hashes   Computed hash of erc721 contract address and its tokenId
   * @param _amounts  Transfer amounts per token type
   * @param _data     Additional data with no specified format, sent in call to `_to`
   */
  function safeBatchTransferFrom(address _from, address _to, bytes32[] memory _hashes, uint256[] memory _amounts, bytes memory _data)
    public override
  {
    // Requirements
    require((msg.sender == _from) || isApprovedForAll(_from, msg.sender), "ERC1155#safeBatchTransferFrom: INVALID_OPERATOR");
    require(_to != address(0), "ERC1155#safeBatchTransferFrom: INVALID_RECIPIENT");

    _safeBatchTransferFrom(_from, _to, _hashes, _amounts);
    _callonERC1155BatchReceived(_from, _to, _hashes, _amounts, gasleft(), _data);
  }


  /***********************************|
  |    Internal Transfer Functions    |
  |__________________________________*/

  /**
   * @notice Transfers amount amount of an _id from the _from address to the _to address specified
   * @param _from    Source address
   * @param _to      Target address
   * @param _hash    Computed hash of erc721 contract address and its tokenId
   * @param _amount  Transfered amount
   */
  function _safeTransferFrom(address _from, address _to, bytes32 _hash, uint256 _amount)
    internal
  {
    // Update balances
    balances[_from][_hash] = balances[_from][_hash].sub(_amount); // Subtract amount
    balances[_to][_hash] = balances[_to][_hash].add(_amount);     // Add amount

    // Emit event
    emit TransferSingle(msg.sender, _from, _to, _hash, _amount);
  }

  /**
   * @notice Verifies if receiver is contract and if so, calls (_to).onERC1155Received(...)
   */
  function _callonERC1155Received(address _from, address _to, bytes32 _hash, uint256 _amount, uint256 _gasLimit, bytes memory _data)
    internal
  {
    // Check if recipient is contract
    if (_to.isContract()) {
      bytes4 retval = IERC1155TokenReceiver(_to).onERC1155Received{gas: _gasLimit}(msg.sender, _from, _hash, _amount, _data);
      require(retval == ERC1155_RECEIVED_VALUE, "ERC1155#_callonERC1155Received: INVALID_ON_RECEIVE_MESSAGE");
    }
  }

  /**
   * @notice Send multiple types of Tokens from the _from address to the _to address (with safety call)
   * @param _from     Source addresses
   * @param _to       Target addresses
   * @param _hashes   Computed hash of erc721 contract address and its tokenId
   * @param _amounts  Transfer amounts per token type
   */
  function _safeBatchTransferFrom(address _from, address _to, bytes32[] memory _hashes, uint256[] memory _amounts)
    internal
  {
    require(_hashes.length == _amounts.length, "ERC1155#_safeBatchTransferFrom: INVALID_ARRAYS_LENGTH");

    // Number of transfer to execute
    uint256 nTransfer = _hashes.length;

    // Executing all transfers
    for (uint256 i = 0; i < nTransfer; i++) {
      // Update storage balance of previous bin
      balances[_from][_hashes[i]] = balances[_from][_hashes[i]].sub(_amounts[i]);
      balances[_to][_hashes[i]] = balances[_to][_hashes[i]].add(_amounts[i]);
    }

    // Emit event
    emit TransferBatch(msg.sender, _from, _to, _hashes, _amounts);
  }

  /**
   * @notice Verifies if receiver is contract and if so, calls (_to).onERC1155BatchReceived(...)
   */
  function _callonERC1155BatchReceived(address _from, address _to, bytes32[] memory _hashes, uint256[] memory _amounts, uint256 _gasLimit, bytes memory _data)
    internal
  {
    // Pass data if recipient is contract
    if (_to.isContract()) {
      bytes4 retval = IERC1155TokenReceiver(_to).onERC1155BatchReceived{gas: _gasLimit}(msg.sender, _from, _hashes, _amounts, _data);
      require(retval == ERC1155_BATCH_RECEIVED_VALUE, "ERC1155#_callonERC1155BatchReceived: INVALID_ON_RECEIVE_MESSAGE");
    }
  }


  /***********************************|
  |         Operator Functions        |
  |__________________________________*/

  /**
   * @notice Enable or disable approval for a third party ("operator") to manage all of caller's tokens
   * @param _operator  Address to add to the set of authorized operators
   * @param _approved  True if the operator is approved, false to revoke approval
   */
  function setApprovalForAll(address _operator, bool _approved)
    external override
  {
    // Update operator status
    operators[msg.sender][_operator] = _approved;
    emit ApprovalForAll(msg.sender, _operator, _approved);
  }

  /**
   * @notice Queries the approval status of an operator for a given owner
   * @param _owner     The owner of the Tokens
   * @param _operator  Address of authorized operator
   * @return isOperator True if the operator is approved, false if not
   */
  function isApprovedForAll(address _owner, address _operator)
    public override view returns (bool isOperator)
  {
    return operators[_owner][_operator];
  }


  /***********************************|
  |         Balance Functions         |
  |__________________________________*/

  /**
   * @notice Get the balance of an account's Tokens
   * @param _owner  The address of the token holder
   * @param _hash    Computed hash of erc721 contract address and its tokenId
   * @return The _owner's balance of the Token type requested
   */
  function balanceOf(address _owner, bytes32 _hash)
    public override view returns (uint256)
  {
    return balances[_owner][_hash];
  }

  /**
   * @notice Get the balance of multiple account/token pairs
   * @param _owners The addresses of the token holders
   * @param _hashes Computed hash of erc721 contract address and its tokenId
   * @return        The _owner's balance of the Token types requested (i.e. balance for each (owner, id) pair)
   */
  function balanceOfBatch(address[] memory _owners, bytes32[] memory _hashes)
    public override view returns (uint256[] memory)
  {
    require(_owners.length == _hashes.length, "ERC1155#balanceOfBatch: INVALID_ARRAY_LENGTH");

    // Variables
    uint256[] memory batchBalances = new uint256[](_owners.length);

    // Iterate over each owner and token ID
    for (uint256 i = 0; i < _owners.length; i++) {
      batchBalances[i] = balances[_owners[i]][_hashes[i]];
    }

    return batchBalances;
  }

  /***********************************|
  |         Deposits Functions        |
  |__________________________________*/

  /**
   * @notice Get the balance of an account's Tokens
   * @param _hash    Computed hash of erc721 contract address and its tokenId
   * @return The _owner's balance of the Token type requested
   */

  function dispensedOf(bytes32 _hash)
    public override view returns (uint256)
  {
    return dispensed[_hash];
  }

  /***********************************|
  |          ERC165 Functions         |
  |__________________________________*/

  /**
   * @notice Query if a contract implements an interface
   * @param _interfaceID  The interface identifier, as specified in ERC-165
   * @return `true` if the contract implements `_interfaceID` and
   */
  function supportsInterface(bytes4 _interfaceID) public override virtual pure returns (bool) {
    if (_interfaceID == type(IERC1155).interfaceId) {
      return true;
    }
    return super.supportsInterface(_interfaceID);
  }

  /***********************************|
  |   ERC721 on receive Functions     |
  |__________________________________*/

  /**
   * @notice Called by contract from which tokens are transferred
   */
  function onERC721Received(
      address,
      address from,
      uint256 tokenId,
      bytes calldata
  ) external override returns (bytes4) {

      // TODO later allow custom
      uint256 defaultAmount = 10**18;

      // msg.sender = erc721 contract address
      bytes32 uniqueHash = keccak256(abi.encodePacked(msg.sender, tokenId));

      dispensed[uniqueHash] = defaultAmount;

      // from = erc721 owner address
      _mint(from, uniqueHash, defaultAmount, "");

      return this.onERC721Received.selector;
  }

  /****************************************|
  |            Minting Functions           |
  |_______________________________________*/

  /**
   * @notice Mint _amount of tokens of a given id
   * @param _to      The address to mint tokens to
   * @param _hash     Hash of erc721 contract address and its tokenId
   * @param _amount  The amount to be minted
   * @param _data    Data to pass if receiver is contract
   */
  function _mint(address _to, bytes32 _hash, uint256 _amount, bytes memory _data)
    internal
  {
    // Add _amount
    balances[_to][_hash] = balances[_to][_hash].add(_amount);

    // Emit event
    emit TransferSingle(msg.sender, address(0x0), _to, _hash, _amount);
  }
}
