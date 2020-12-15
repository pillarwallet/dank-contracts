const {
  ethers,
  ethers: {
    utils: { formatEther, parseEther },
  },
} = require('hardhat');

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
  getMemeTokenHash,
  setDeadline,
  fromWei,
  toWei,
};
