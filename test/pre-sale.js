const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");
// const { time } = require("@nomicfoundation/hardhat-network-helpers");
const helpers = require("@nomicfoundation/hardhat-network-helpers");

describe("Recruit Coin Contract ⏱", function() {

    let ad1, ad2, ad3, ad4, ad5, ad6, ad7, ad9, ad10;

    let theRecruitCoin;
    let DaiCoin;
    let USDTCoin;
    let BUSDCoin;
    let TUSDCoin;
    let tokenName = "RecruitCoin";
    let tokenSymbol = "RECRUIT";
    let tokenDecimal = 18;

    let pricesEther = [ethers.utils.parseEther("0.02"), ethers.utils.parseEther("0.1")];

    let bonusArray = [
        15, // week 1
        10, // week 2
        7, // week 3
        5, // week 4
        50 // refferal
    ];
    let supplies = [
        250000_000e18, // TOTAL_SUPPLY
        250000e18, // SOFT_CAP $5000
        750000_0e18, // HARD_CAP $150000
        250000_00e18, // 10% PUBLIC_SALE
        750000_0e18, // 3% PRE_SALE
        625000_00e18, // 25% EARLY
        150000_000e18, // 60% PUBLIC_UNCAPPED
        0, // TOTAL RAISED
        500000_0e18 // 2% FOUNDER
    ];

    let datesArray = [
            parseInt((Date.now() - 86400000) / 1000), // preSaleStart
            parseInt((Date.now() + 86400000) / 1000), // preSaleEnd 
            1669467801,
            1672451640
    ];

    let paymentTokensArray = [];

    it('Deploy Contracts', async function() {
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

    describe("Deposit Pre Sale", function() {

        it("Deposit Pre Sale", async function() {
            let paymentAmount = BigNumber.from("5000000000000000000");
            let dates_Array_Public = [
                parseInt((Date.now() / 1000) - 86400), // preSaleStart
                parseInt((Date.now() / 1000) + 86400), // preSaleEnd 
                0,
                0
            ];

            await theRecruitCoin.setDates(dates_Array_Public)
            for (let index = 0; index < dates_Array_Public.length; index++) {
                expect(dates_Array_Public[index]).to.equal(await theRecruitCoin.dates(index));
            }
            // set the payment Tokens
            await theRecruitCoin.setPaymentTokens([DaiCoin.address, USDTCoin.address, BUSDCoin.address, TUSDCoin.address])
                // check Balance in totla supply
            const ownerBalance = await DaiCoin.balanceOf(owner.address);
            expect(await DaiCoin.totalSupply()).to.equal(await DaiCoin.totalSupply());
            // Transfer 50 tokens from addr1 to addr2
            await DaiCoin.connect(owner).transfer(ad1.address, paymentAmount);
            expect(await DaiCoin.balanceOf(ad1.address)).to.equal(await DaiCoin.balanceOf(ad1.address));
            await DaiCoin.connect(ad1).approve(theRecruitCoin.address, "115792089237316195423570985008687907853269984665640564039457584007913129639935");
            //Set the Price of the ether
            for (let index = 0; index < pricesEther.length; index++) {
                expect(pricesEther[index]).to.equal(await theRecruitCoin.prices(index));
            }

            const tx = await theRecruitCoin.connect(ad1).deposit(paymentAmount, BigNumber.from("0"), "0x0000000000000000000000000000000000000000");
            //Get Vesting Schedule.
            const vestingScheduleId = await theRecruitCoin.computeVestingScheduleIdForAddressAndIndex(tx.from,0);
            const vestingSchedules = await theRecruitCoin.getVestingSchedule(vestingScheduleId);

            const _time = await helpers.time.increase(31536000*2); // 2 years fully claimed
            await theRecruitCoin.connect(ad1).claim(vestingScheduleId)
            // // After Claim tokens
            const vestingSchedulesAfterClaim = await theRecruitCoin.getVestingSchedule(vestingScheduleId);
            expect(vestingSchedules.amountTotal).to.equal(vestingSchedulesAfterClaim.released);  

        });

        it("Deposit Overflow Purchase Pre Sale", async function() {
            let paymentAmount = BigNumber.from("7500000000000000000000000");
            let dates_Array_Public = [
                parseInt((Date.now() / 1000) - 86400), // preSaleStart
                parseInt((Date.now() / 1000) + 86400), // preSaleEnd 
                0,
                0
            ];

            await theRecruitCoin.setDates(dates_Array_Public)
            for (let index = 0; index < dates_Array_Public.length; index++) {
                expect(dates_Array_Public[index]).to.equal(await theRecruitCoin.dates(index));
            }
            // set the payment Tokens
            await theRecruitCoin.setPaymentTokens([DaiCoin.address, USDTCoin.address, BUSDCoin.address, TUSDCoin.address])
                // check Balance in totla supply
            const ownerBalance = await DaiCoin.balanceOf(owner.address);
            expect(await DaiCoin.totalSupply()).to.equal(await DaiCoin.totalSupply());
            // Transfer 50 tokens from addr1 to addr2
            await DaiCoin.connect(owner).transfer(ad1.address, paymentAmount);
            expect(await DaiCoin.balanceOf(ad1.address)).to.equal(await DaiCoin.balanceOf(ad1.address));
            await DaiCoin.connect(ad1).approve(theRecruitCoin.address, "115792089237316195423570985008687907853269984665640564039457584007913129639935");
            //Set the Price of the ether
            for (let index = 0; index < pricesEther.length; index++) {
                expect(pricesEther[index]).to.equal(await theRecruitCoin.prices(index));
            }

            await hre.network.provider.send("hardhat_reset")
        });
    });
});