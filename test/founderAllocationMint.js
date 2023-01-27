const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");
// const { time } = require("@nomicfoundation/hardhat-network-helpers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("Recruit Coin Contract ⏱", function () {

    let ad1, ad2, ad3, ad4, ad5, ad6, ad7, ad9, ad10;

    let theRecruitCoin;
    let DaiCoin;
    let USDTCoin;
    let BUSDCoin;
    let TUSDCoin;
    let tokenName = "RecruitCoin";
    let tokenSymbol = "RECRUIT";
    let tokenDecimal = 18;

    let pricesEther = [ethers.utils.parseEther("0.02"),ethers.utils.parseEther("0.1")];



    let bonusArray = [
        15, // week 1
        10, // week 2
        7, // week 3
        5, // week 4
        50 // refferal
    ];
    let supplies = [
        250_000_000e18, // TOTAL_SUPPLY
        250_000e18, // SOFT_CAP $5000
        750_000_0e18, // HARD_CAP $150000
        250_000_00e18, // 10% PUBLIC_SALE
        750_000_0e18, // 3% PRE_SALE
        625_000_00e18, // 25% EARLY
        150_000_000e18, // 60% PUBLIC_UNCAPPED
        0, // TOTAL RAISED
        500_000_0e18 // 2% FOUNDER
    ];

    let datesArray = [
        Date.now(), // preSaleStart
        Date.now() + 30, // preSaleEnd
        Date.now() + 30, // publicSaleStart
        Date.now() + 60  // publicSaleEnd
    ];

    let paymentTokensArray = [];

    it('Deploy Contracts', async function () {
        [owner, bankAddress, ad1, ad2, ad3, ad4, ad5, ad6, ad7, ad9, ad10, wl1, wl2, wl3, ...addrs] = await ethers.getSigners();

        // DAI
        const NonStandardToken_Dai = await ethers.getContractFactory("StableToken");
        DaiCoin = await NonStandardToken_Dai.deploy( "DAI Token", "DAI");

        // //ERC20Mock USDT
        const ERC20Mock_USDT = await ethers.getContractFactory("StableToken");
        USDTCoin = await ERC20Mock_USDT.deploy("Test Tether", "USDT");


        // // //FaucetToken BUSD
        const FaucetToken_BUSD = await ethers.getContractFactory("StableToken");
        BUSDCoin = await FaucetToken_BUSD.deploy( "BUSD Token", "BUSD");

        // // TUSDFaucet TUSD
        const TUSD_Faucet = await ethers.getContractFactory("StableToken");
        TUSDCoin = await TUSD_Faucet.deploy("Tusd Token", "TUSD");

        // // paymentTokensArray Set Array
        paymentTokensArray = [DaiCoin.address, USDTCoin.address, BUSDCoin.address, TUSDCoin.address];

        const RecruitCoin = await ethers.getContractFactory("RecruitCoin");
        theRecruitCoin = await RecruitCoin.deploy();
    });



    describe("Founder Allocation Mint", function () {
        it("Founder Allocation Mint", async function () {
            // let _recipientArray = [ad1.address, ad2.address, ad3.address];
            var _totalAllocationDeposit = Number(200000000000000000000);
            var _founderAllocation = await theRecruitCoin.supplies(8);
            var _remainingFounder = _founderAllocation - _totalAllocationDeposit;
            let _amount = BigNumber.from("200000000000000000000");
            await theRecruitCoin.connect(owner).founderAllocationMint([ad1.address], [_amount]);
        });
        it("Overflow allocation", async function () {
            let _amount = BigNumber.from("150000000000000000000000000");
            await expect(
                theRecruitCoin.connect(owner).founderAllocationMint([ad1.address], [_amount])
            ).to.be.revertedWith(
                "OVERFLOW ALLOCATION"
            );
        });
    });
});

