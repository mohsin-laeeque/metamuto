const hre = require("hardhat");

async function main() {

  const [deployer,] = await ethers.getSigners();
  console.log('DEPLOYER: ',deployer.address);

  const MetaMuto = await hre.ethers.getContractFactory("MetaMuto");
  const metaMuto = await MetaMuto.deploy();
  await metaMuto.deployed();
  try{await hre.run("verify:verify", {address: metaMuto.address});}catch(e){console.log(e.message)}

  console.log("MetaMuto deployed:", metaMuto.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
