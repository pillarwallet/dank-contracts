pragma solidity ^0.6.8;


interface IERC1155 {
  event TransferSingle(address indexed _operator, address indexed _from, address indexed _to, bytes32 _hash, uint256 _amount);
  event TransferBatch(address indexed _operator, address indexed _from, address indexed _to, bytes32[] _hash, uint256[] _amounts);
  event ApprovalForAll(address indexed _owner, address indexed _operator, bool _approved);
  event URI(string _amount, bytes32 indexed _hash);

  function safeTransferFrom(address _from, address _to, bytes32 _hash, uint256 _amount, bytes calldata _data) external;
  function transferFrom(address _from, address _to, bytes32 _hash, uint256 _amount) external;
  function safeBatchTransferFrom(address _from, address _to, bytes32[] calldata _hashes, uint256[] calldata _amounts, bytes calldata _data) external;
  function balanceOf(address _owner, bytes32 _hash) external view returns (uint256);
  function balanceOfBatch(address[] calldata _owners, bytes32[] calldata _hashes) external view returns (uint256[] memory);
  function dispensedOf(bytes32 _hash) external view returns (uint256);
  function setApprovalForAll(address _operator, bool _approved) external;
  function isApprovedForAll(address _owner, address _operator) external view returns (bool isOperator);
}
