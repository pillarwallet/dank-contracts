const { ethers, providers } = require('ethers');
const config = require('../config');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const abiCoder = require('web3-eth-abi');

// const ethProvider = new providers.JsonRpcProvider(
//   config.eth_provider,
// );

// const getAbi = () => {
//   const json = fs.readFileSync(path.join(appRootPath.path, './erc1155/build/_ERC1155_sol_ERC1155.abi'));
//   return JSON.parse(json.toString());
// };

// const abi = getAbi();

// const contract = new ethers.Contract(
//   config.erc1155Address,
//   abi,
//   ethProvider
// );

async function main () {
  const selector = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('safeTransferFrom(address,address,bytes32,uint256,bytes)'));
  console.log('safeTransferFrom', selector.toString().slice(0, 10));
  const test = ethers.utils.keccak256(ethers.utils.toUtf8Bytes('transferFrom(address,address,uint256)'));
  console.log('transferFrom', test.toString().slice(0, 10));
}

main();