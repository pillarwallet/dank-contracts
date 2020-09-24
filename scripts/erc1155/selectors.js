const { ethers } = require('ethers');

async function main() {
  console.info('ERC1155 selectors')
  const selector = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('safeTransferFrom(address,address,bytes32,uint256,bytes)'));
  console.info('safeTransferFrom: ', selector.toString().slice(0, 10));
  const test = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('transferFrom(address,address,bytes32,uint256)'));
  console.info('transferFrom: ', test.toString().slice(0, 10));
}

main()
  .catch((err) => console.error(err))
  .finally(() => process.exit());
