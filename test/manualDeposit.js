const { expect } = require("chai");
const { ethers } = require("hardhat");
const { BigNumber } = require("@ethersproject/bignumber");
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
    // let supplies = [
    //     250 _000_000e18, // TOTAL_SUPPLY
    //     250 _000e18, // SOFT_CAP $5000
    //     750 _000_0e18, // HARD_CAP $150000
    //     250 _000_00e18, // 10% PUBLIC_SALE
    //     750 _000_0e18, // 3% PRE_SALE
    //     625 _000_00e18, // 25% EARLY
    //     150 _000_000e18, // 60% PUBLIC_UNCAPPED
    //     0, // TOTAL RAISED
    //     500 _000_0e18 // 2% FOUNDER
    // ];

    let datesArray = [
        Date.now(), // preSaleStart
        Date.now() + 30, // preSaleEnd
        Date.now() + 30, // publicSaleStart
        Date.now() + 60 // publicSaleEnd
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

        // paymentTokensArray Set Array
        paymentTokensArray = [DaiCoin.address, USDTCoin.address, BUSDCoin.address, TUSDCoin.address];

        const RecruitCoin = await ethers.getContractFactory("RecruitCoin");
        theRecruitCoin = await RecruitCoin.deploy();
    });

    describe("Manual Deposit", function() {
        it("Only beneficiary can claim", async function() {
            let addressArray = [ad3.address, ad4.address];
            let paymentAmounts = [BigNumber.from("5000000000000000000"), BigNumber.from("6000000000000000000")];
            let preSale = [true, true];
            let publicSale3M = [false, false];
            let publicSale6M = [false, false];
            let referral = [ad1.address, ad1.address];
            // check Balance in totla supply
            const ownerBalance = await DaiCoin.balanceOf(owner.address);
            expect(await DaiCoin.totalSupply()).to.equal(await DaiCoin.totalSupply());
            // Transfer 50 tokens from addr1 to addr2
            await DaiCoin.connect(owner).transfer(ad3.address, 100);
            await DaiCoin.connect(owner).transfer(ad4.address, 200);
            expect(await DaiCoin.balanceOf(ad3.address)).to.equal(await DaiCoin.balanceOf(ad3.address));
            expect(await DaiCoin.balanceOf(ad4.address)).to.equal(await DaiCoin.balanceOf(ad4.address));
            await DaiCoin.connect(ad3).approve(theRecruitCoin.address, "115792089237316195423570985008687907853269984665640564039457584007913129639935");
            await DaiCoin.connect(ad4).approve(theRecruitCoin.address, "115792089237316195423570985008687907853269984665640564039457584007913129639935");
            await theRecruitCoin.manualDeposit(addressArray, paymentAmounts, preSale, publicSale3M, publicSale6M, referral);

            const vestingScheduleId = await theRecruitCoin.computeVestingScheduleIdForAddressAndIndex(ad4.address,0);
            const vestingSchedules = await theRecruitCoin.getVestingSchedule(vestingScheduleId);
            const _time = await helpers.time.increase(31536000);

            await theRecruitCoin.connect(ad4).claim(vestingScheduleId)
            await hre.network.provider.send("hardhat_reset")  

        });
    });
});