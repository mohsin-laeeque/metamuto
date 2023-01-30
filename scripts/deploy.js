const hre = require("hardhat");

async function main() {

  const [deployer,] = await ethers.getSigners();
  console.log('DEPLOYER: ',deployer.address);

  const Metamuto = await hre.ethers.getContractFactory("Metamuto");
  const metamuto = await Metamuto.deploy();
  await metamuto.deployed();

  await metamuto.deployTransaction.wait(6);
  
  try{await hre.run("verify:verify", {address: metamuto.address});}catch(e){console.log(e.message)}

  console.log("Metamuto deployed:", metamuto.address);

}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
