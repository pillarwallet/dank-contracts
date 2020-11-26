const fsExtra = require('fs-extra');
const path = require('path');
const config = require('../config');

/**
 * @type import('hardhat/types').HardhatRuntimeEnvironment
 */
const func = async function (hre) {
  const { deployments } = hre;
  const all = await deployments.all();

  await fsExtra.remove(config.artifactsPath);
  await fsExtra.ensureDir(config.artifactsPath);

  for(const contractName of Object.keys(all)) {
    const artifact = await deployments.getArtifact(contractName);
    const artifactPath = path.join(config.artifactsPath, `${contractName}.json`);
    await fsExtra.writeJSON(artifactPath, artifact, {
      spaces: 2,
    });
  }

  console.log('artifacts saved');
};
module.exports = func;
module.exports.runAtTheEnd = true;
