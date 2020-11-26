const { deployments } = require('hardhat');
const fsExtra = require('fs-extra');
const path = require('path');
const config = require('../config');

async function main() {
  const all = await deployments.all();
  await fsExtra.remove(config.artifactsPath2);
  await fsExtra.ensureDir(config.artifactsPath2);

  for(const contractName of Object.keys(all)) {
    const artifact = await deployments.getArtifact(contractName);
    const artifactPath = path.join(config.artifactsPath2, `${contractName}.json`);
    await fsExtra.writeJSON(artifactPath, artifact, {
      spaces: 2,
    });
  }

  console.log('artifacts saved');
}

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
