const hre = require("hardhat");

async function main() {

  const [deployer,] = await ethers.getSigners();
  console.log('DEPLOYER: ',deployer.address);

  const MateMuto = await hre.ethers.getContractFactory("MateMuto");
  const mateMuto = await MateMuto.deploy();
  await mateMuto.deployed();
  try{await hre.run("verify:verify", {address: mateMuto.address});}catch(e){}

  console.log("MateMuto deployed:", mateMuto.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
