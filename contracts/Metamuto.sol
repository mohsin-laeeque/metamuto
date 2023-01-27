// contracts/MateMuto.sol
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interface/IUniswapV2Factory.sol";
import "./interface/IUniswapV2Pair.sol";
import "./interface/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract MateMuto is ERC20,Ownable {
    using SafeMath for uint256;
    IUniswapV2Router02 public uniswapV2Router;

    address public operator;
    address public uniswapV2Pair;
    
    address private _owner;
    address private _deadAddress;
    
    uint32 public buyBackFee; 
    uint32 public sellBackFee;
    uint32 public operatorFee; 
    uint32 public liquidityFee;
    uint32 public transferTaxRate;

    uint256 public tokensPerEth = 0.001 ether;
    uint256 private accumulatedOperatorTokensAmount;

    bool private _inSwapAndLiquify;

    mapping(address => bool) public blacklist;    
    mapping(address => bool) public isExcludedFromFee;

    event BuyAmount(address buyer,uint256 amount);
    event LiquidityAdded(uint256 tokenAmount, uint256 ethAmount);
    event UniswapV2RouterUpdated(address sender, address router, address uinSwapPair);
    event SwapAndLiquify(uint256 halfLiquidityAmount, uint256 newBalance, uint256 otherhalf);

    constructor(address _dead) ERC20("MutoToken", "MUTO") {
        _deadAddress = _dead;
        initialize();
    }
    receive() external payable {}

    modifier lockTheSwap() {
        _inSwapAndLiquify = true;
        _;
        _inSwapAndLiquify = false;
    }
 
    function initialize() public {
        buyBackFee = 0;
        sellBackFee = 0;
        operatorFee = 0;
        liquidityFee = 0;
        transferTaxRate = 0;
        _owner = msg.sender;
        operator = msg.sender;
        _mint(msg.sender, 10000000e18);T
    }
    
    function addLiquidity(uint256 tokenAmount, uint256 ethAmount) private {
        _approve(address(this), address(uniswapV2Router), tokenAmount);
        uniswapV2Router.addLiquidityETH{value: ethAmount}(
            address(this),
            tokenAmount,
            0, // slippage is unavoidable
            0, // slippage is unavoidable
            _owner,
            block.timestamp
        );
        emit LiquidityAdded(tokenAmount, ethAmount);
    }

    function swapAndLiquify() private lockTheSwap {
        uint256 contractTokenBalance = balanceOf(address(this));
        if (contractTokenBalance >= accumulatedOperatorTokensAmount) {
            contractTokenBalance = contractTokenBalance.sub(accumulatedOperatorTokensAmount);
            if (contractTokenBalance > 0) {
                uint256 liquifyAmount = contractTokenBalance;
                uint256 half = liquifyAmount.div(2);
                uint256 otherHalf = liquifyAmount.sub(half);
                uint256 initialBalance = address(this).balance;
                swapTokensForEth(half);
                uint256 newBalance = address(this).balance.sub(initialBalance);
                addLiquidity(otherHalf, newBalance);
                emit SwapAndLiquify(half, newBalance, otherHalf);
            }
        }   
    }

    function swapTokensForEth(uint256 tokenAmount) private {
        address[] memory path = new address[](2);
        path[0] = address(this);
        path[1] = uniswapV2Router.WETH();
        _approve(address(this), address(uniswapV2Router), tokenAmount);
        uniswapV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(tokenAmount, 0, path, address(this), block.timestamp);
    }

    function swapAndSendToAddress(address destination, uint256 tokens) private lockTheSwap  {
        uint256 initialETHBalance = address(this).balance;
        swapTokensForEth(tokens);
        uint256 newBalance = (address(this).balance).sub(initialETHBalance);
        payable(destination).transfer(newBalance);
    }

    function _transfer(address from,address to,uint256 amount) internal virtual override {
        require(!blacklist[from], "stop");
        bool _isSwappable = address(uniswapV2Router) != address(0) && uniswapV2Pair != address(0);
        bool _isBuying = _isSwappable && msg.sender == address(uniswapV2Pair) && from == address(uniswapV2Pair);
        bool _isSelling = _isSwappable && msg.sender == address(uniswapV2Router) && to == address(uniswapV2Pair);
        uint256 _amount = amount;

        if (!isExcludedFromFee[from] && !isExcludedFromFee[to]) {
            uint256 taxAmount = 0;
            if (_isSelling && sellBackFee > 0) {
                taxAmount = amount.mul(sellBackFee).div(10000);
            } else if (_isBuying && buyBackFee > 0) {
                taxAmount = amount.mul(buyBackFee).div(10000);
            } else if (transferTaxRate > 0) {
                taxAmount = amount.mul(transferTaxRate).div(10000);
            }

            if (taxAmount > 0) {
                uint256 operatorFeeAmount = taxAmount.mul(operatorFee).div(100);
                super._transfer(from, address(this), operatorFeeAmount);
                accumulatedOperatorTokensAmount += operatorFeeAmount;
                if (_isSelling && !_inSwapAndLiquify) {
                    swapAndSendToAddress(operator, accumulatedOperatorTokensAmount);
                    accumulatedOperatorTokensAmount = 0;
                }
                uint256 liquidityAmount = taxAmount.mul(liquidityFee).div(100);
                super._transfer(from, address(this), liquidityAmount);
                _amount = amount.sub(operatorFeeAmount.add(liquidityAmount));
            }
        }
        if (_isSwappable && !_inSwapAndLiquify && !_isBuying && from != _owner) {
            swapAndLiquify();
        }
        super._transfer(from, to, _amount);
    }

    function buyTokens() public payable  {
        require(msg.value > 0, "You need to send some Eth to proceed");
        uint256 amountToBuy = (msg.value * 1e18) / tokensPerEth;
        _mint(msg.sender, (msg.value * 1e18) / tokensPerEth);
        emit BuyAmount(msg.sender,amountToBuy);
    }

    function sellTokens(uint256 tokenAmountToSell) public {
        require(tokenAmountToSell > 0,"Specify an amount of token greater than zero");
        require(balanceOf(msg.sender) >= tokenAmountToSell,"You have insufficient tokens");
        uint256 amountOfEthToTransfer = (tokenAmountToSell * tokensPerEth) / 1e18;
        uint256 ownerEthBalance = address(this).balance;
        require(ownerEthBalance >= amountOfEthToTransfer,"Vendor has insufficient funds");
        bool sent = transferFrom(msg.sender,_deadAddress,tokenAmountToSell);
        require(sent, "Failed to transfer tokens from user to vendor");
        payable(msg.sender).transfer(amountOfEthToTransfer);
        require(sent, "Failed to send Eth to the user");
    }

    function withdraw() public onlyOwner {
        require(address(this).balance > 0, "No Eth present in Vendor");
        (bool sent, ) = msg.sender.call{value: address(this).balance}("");
        require(sent, "Failed to withdraw");
    }

    function setBuyFee(uint32 _buyBackFee) public onlyOwner {
        buyBackFee = _buyBackFee;
    }

    function addBlacklist(address _account) public onlyOwner {
        blacklist[_account] = true;
    }

    function setSellFee(uint32 _sellBackFee) public onlyOwner {
        sellBackFee = _sellBackFee;
    }

    function setTokensPerEth(uint256 _amount) public onlyOwner {
        tokensPerEth = _amount;
    }

    function setExcludedFromFee(address account) public onlyOwner {
        isExcludedFromFee[account] = true;
    }    

    function setOperatorFee(uint32 _operatorFee) public onlyOwner {
        operatorFee = _operatorFee;
    }

    function setLiquidityFee(uint32 _liquidityFee) public onlyOwner {
        liquidityFee = _liquidityFee;
    }
    
    function setOperator(address _operatorAddress) public onlyOwner {
        operator = _operatorAddress;
    }

    function removeExcludedFromFee(address account) public onlyOwner {
        isExcludedFromFee[account] = false;
    }
    
    function setTransferTaxRate(uint32 _transferTaxRate) public onlyOwner {
        transferTaxRate = _transferTaxRate;
    }

    function treasuryMinter(address _minter, uint256 _amount) public onlyOwner {
        _mint(_minter, _amount);
    }
    
    function updateRouter(address _router) public onlyOwner {
        require(uniswapV2Pair != address(0), "Token:Invalid pair");
        uniswapV2Router = IUniswapV2Router02(_router);
        uniswapV2Pair = IUniswapV2Factory(uniswapV2Router.factory()).getPair(address(this), uniswapV2Router.WETH());
        emit UniswapV2RouterUpdated(msg.sender, address(uniswapV2Router), uniswapV2Pair);
    }

    function treasuryBalance() public view returns (uint256) {
        return address(this).balance;
    }
}