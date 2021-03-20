const {
  config,
  ethers,
  ethers: {
    utils: { formatEther, parseEther },
    provider,
  },
} = require('hardhat');
const { buildTypedData } = require('ethers-typed-data-legacy');

const { chainId } = config.networks.hardhat;
const TYPED_DATA_DOMAIN_VERSION = '1';

async function processTx(txPromise) {
  const tx = await txPromise;
  const { gasPrice } = tx;
  const receipt = await tx.wait();
  const { gasUsed } = receipt;

  return {
    ...receipt,
    totalCost: gasPrice.mul(gasUsed),
  };
}

function createTypedDataFactory(contract, contractName, primaryType, types) {
  return {
    createTypedData(message) {
      return buildTypedData(
        {
          name: contractName,
          version: TYPED_DATA_DOMAIN_VERSION,
          chainId,
          verifyingContract: contract.address,
        },
        primaryType,
        types,
        message,
      );
    },
    signTypeData(signer, message) {
      return provider.send('eth_signTypedData', [signer, this.createTypedData(message)]);
    },
  };
}

function createDaiTokenTypedDataFactory(tokenContract) {
  return createTypedDataFactory(tokenContract, 'DAI', 'Permit', [
    {
      name: 'holder',
      type: 'address',
    },
    {
      name: 'spender',
      type: 'address',
    },
    {
      name: 'nonce',
      type: 'uint256',
    },
    {
      name: 'expiry',
      type: 'uint256',
    },
    {
      name: 'allowed',
      type: 'bool',
    },
  ]);
}
async function deployContract(name, args = [], deployer = null) {
  let factory = await ethers.getContractFactory(name);

  if (deployer) {
    factory = factory.connect(deployer);
  }

  return await factory.deploy(...(args || []));
}

function getMemeTokenHash(ERC721ContractAddress, memeId) {
  const packedParams = ethers.utils.solidityPack(['address', 'uint256'], [ERC721ContractAddress, memeId]);
  return ethers.utils.keccak256(packedParams);
}

function setDeadline(addMinutes) {
  return Math.round((+new Date() + 1000 * 60 * addMinutes) / 1000);
}

function fromWei(number) {
  return formatEther(number);
}

function toWei(number) {
  return parseEther(number.toString());
}

module.exports = {
  ZERO_ADDRESS: `0x${'0'.repeat(40)}`,
  processTx,
  createDaiTokenTypedDataFactory,
  deployContract,
  getMemeTokenHash,
  setDeadline,
  fromWei,
  toWei,
};
