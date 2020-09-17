const { ethers, providers } = require('ethers');
const fs = require('fs');
const path = require('path');
const appRootPath = require('app-root-path');
const abiCoder = require('web3-eth-abi');
const config = require('../config');

const ethProvider = new providers.JsonRpcProvider(
  config.eth_provider,
);

const getAbi = () => {
  const json = fs.readFileSync(path.join(appRootPath.path, './erc20/build/_ERC20_sol_ERC20.abi'));
  return JSON.parse(json.toString());
};

const abi = getAbi();
const mintMethod = abi.filter(m => m.name === 'mint')[0];

async function main () {
  const amount = ethers.BigNumber.from(10).pow(18);  
  const encodedContractFunction = abiCoder.encodeFunctionCall(
    mintMethod,
    [config.traderAddress, ethers.utils.hexlify(amount)] // 1 token of decimal 18
  );

  const wallet = new ethers.Wallet(config.ownerPrivateKey, ethProvider);
  const transactionCountPromise = await wallet.getTransactionCount();

  const result = await wallet.sendTransaction({
    to: config.erc20Address,
    nonce: transactionCountPromise,
    gasLimit: '0x5F5E10',
    gasPrice: '0xa',
    data: encodedContractFunction,
    value: 0,
    chainId: config.networkId,
  });
  console.info(result);
}

main();