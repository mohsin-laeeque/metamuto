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
        250000000e18, // TOTALSUPPLY
        250000e18, // SOFTCAP $5000
        7500000e18, // HARDCAP $10000
        25000000e18, // 10% PUBLICSALE
        7500000e18, // 3% PRESALE
        62500000e18, // 25% EARLY
        150000000e18, // 60% PUBLIC_UNCAPPED
        0, // TOTAL RAISED
        5000000e18 // 2% FOUNDER
    ];

    let datesArray = [
      1669380804, // preSaleStart
                1669380804, // preSaleEnd
                parseInt((Date.now() - 1036800000) / 1000), // publicSaleStart
                parseInt((Date.now() + 86400000) / 1000) // publicSaleEnd
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

    it("Token Name", async function() {
        expect(await theRecruitCoin.name()).to.equal(tokenName);
    });
    it("Token Symbol", async function() {
        expect(await theRecruitCoin.symbol()).to.equal(tokenSymbol);
    });
    it("Token Decimal", async function() {
        expect(await theRecruitCoin.decimals()).to.equal(tokenDecimal);
    });

    it("Token Owner", async function() {
        expect(await theRecruitCoin.owner()).to.equal(owner.address);
    });

    it("Should Set Dai Supply", async function() {
        const ownerBalance = await DaiCoin.balanceOf(owner.address);
        expect(await DaiCoin.totalSupply()).to.equal(ownerBalance);
        // Transfer 50 tokens from addr1 to addr2
        await DaiCoin.connect(owner).transfer(ad1.address, 50);
        expect(await DaiCoin.balanceOf(ad1.address)).to.equal(50);
    });

    it("Should Set BUSD Coin Supply", async function() {
        const ownerBalance = await BUSDCoin.balanceOf(owner.address);
        expect(await BUSDCoin.totalSupply()).to.equal(ownerBalance);

        // Transfer 50 tokens from addr1 to addr2
        await BUSDCoin.connect(owner).transfer(ad1.address, 50);
        expect(await BUSDCoin.balanceOf(ad1.address)).to.equal(50);
    });

    it("Should Set TUSD Coin Supply", async function() {
        const ownerBalance = await TUSDCoin.balanceOf(owner.address);
        expect(await TUSDCoin.totalSupply()).to.equal(ownerBalance);

        // Transfer 50 tokens from addr1 to addr2
        await TUSDCoin.connect(owner).transfer(ad1.address, 50);
        expect(await TUSDCoin.balanceOf(ad1.address)).to.equal(50);
    });

    it("Should Set USDT Coin Supply", async function() {
        const ownerBalance = await USDTCoin.balanceOf(owner.address);
        expect(await USDTCoin.totalSupply()).to.equal(ownerBalance);

        // Transfer 50 tokens from addr1 to addr2
        await USDTCoin.connect(owner).transfer(ad1.address, 50);
        expect(await USDTCoin.balanceOf(ad1.address)).to.equal(50);
    });

    // /** 
    //  * set the Merkle Root for the White lister
    // */

    it("Should Set Dates", async function() {
        await theRecruitCoin.setDates(datesArray);
        for (let index = 0; index < datesArray.length; index++) {
            expect(datesArray[index]).to.equal(await theRecruitCoin.dates(index));
        }
    });

    it("Should Set Bonus", async function() {
        await theRecruitCoin.setBonus(bonusArray)
        for (let index = 0; index < bonusArray.length; index++) {
            expect(bonusArray[index]).to.equal(await theRecruitCoin.bonus(index));
        }
    });

    it("Should Set Prices", async function() {
        await theRecruitCoin.setPrices(pricesEther)
        for (let index = 0; index < pricesEther.length; index++) {
            expect(pricesEther[index]).to.equal(await theRecruitCoin.prices(index));
        }
    });

    it("Should Set Payment Tokens", async function() {
        await theRecruitCoin.setPaymentTokens(paymentTokensArray);
        expect(paymentTokensArray.length).to.equal(await theRecruitCoin.getPaymentTokensCount());
    });

    it("Get Current Time", async function() {
        expect(await theRecruitCoin.getCurrentTime()).to.equal(await theRecruitCoin.getCurrentTime());
    });

    describe("Deposit PUBLIC SALE", function() {

        it("Deposit Overflow Purchase Public Sale", async function() {
            let paymentAmount = BigNumber.from("26000000000000000000000000");
            let dates_Array_Public = [
                0, // preSaleStart
                0, // preSaleEnd
                parseInt((Date.now() / 1000) - 86400), // publicSaleStart
                parseInt((Date.now() / 1000) + 86400) // publicSaleEnd
            ]; //Public sale
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
            await expect(
                theRecruitCoin.deposit(paymentAmount, BigNumber.from("0"), "0x0000000000000000000000000000000000000000")
            ).to.be.revertedWith(
                "Overflow purchase"
            );
        });
        it("Deposit Public Sale", async function() {
            let paymentAmount = BigNumber.from("5000000000000000000");

            let dates_Array_Public = [
                0, // preSaleStart
                0, // preSaleEnd
                parseInt((Date.now() / 1000) - 86400), // publicSaleStart
                parseInt((Date.now() / 1000) + 86400) // publicSaleEnd
            ]; //Public sale

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
            let _vestingSchedulesTotalAmount = await theRecruitCoin.vestingSchedulesTotalAmount();
            let _getBonusWeek = await theRecruitCoin.getBonusWeek();
            let _getCurrentTime = await theRecruitCoin.getCurrentTime();

            let paymentAmountNew = (Number(paymentAmount) / Number(pricesEther[1])) * Number(1e18);
            let BonusePaymentAmount = (paymentAmount * bonusArray[_getBonusWeek - 1]) / 100;
            let FinalpaymentAmount = Number(BonusePaymentAmount) + Number(paymentAmount);
            //Get weekly Bonus
            const tx = await theRecruitCoin.connect(ad1).deposit(paymentAmount, BigNumber.from("0"), "0x0000000000000000000000000000000000000000");
            //Get Vesting Schedule.
            const vestingScheduleId = await theRecruitCoin.computeVestingScheduleIdForAddressAndIndex(tx.from,0);
            const vestingSchedules = await theRecruitCoin.getVestingSchedule(vestingScheduleId);
            //vesting schedules Total Amount

            expect(await theRecruitCoin.vestingSchedulesTotalAmount()).to.equal(vestingSchedules.amountTotal);
            // //Time Calculation
            let _time = await helpers.time.increase(15552000); // 6 months
            await theRecruitCoin.connect(ad1).claim(vestingScheduleId)
            // // After Claim tokens
            const vestingSchedulesAfterClaim = await theRecruitCoin.getVestingSchedule(vestingScheduleId);
            expect(vestingSchedules.amountTotal).to.equal(vestingSchedulesAfterClaim.released);   
            await hre.network.provider.send("hardhat_reset")    
         });
    });
});