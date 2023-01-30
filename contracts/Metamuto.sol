// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "./interface/IUniswapV2Factory.sol";
import "./interface/IUniswapV2Pair.sol";
import "./interface/IUniswapV2Router02.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

contract Metamuto is ERC20, Ownable {
  using SafeMath for uint256;

  bool private _inSwapAndLiquify;

  uint32 public transferTaxRate;
  uint32 private buyBackFee;
  uint32 private sellBackFee;
  uint32 public liquidityFee;

  address public manager;
  address public uniswapV2Pair;
  address public pairWithToken;
  IUniswapV2Router02 public uniswapV2Router;

  uint256 public founderAllocation;
  uint256 public maxSupply;
  uint256 public minAmountToLiquify;

  mapping(address => bool) public isExcludedFromFee;
  mapping(address => bool) public blacklist;

  constructor() ERC20("Metamuto", "MUTO") {
    maxSupply = 10_000_000 ether; // 10 million
    founderAllocation = 1_000_000 ether; // 1 million

    transferTaxRate = 0;
    buyBackFee = 0;
    sellBackFee = 0;
    liquidityFee = 0;
    minAmountToLiquify = 0;

    removeExcludedFromFee(msg.sender);
    setExcludedFromFee(msg.sender);
  }

  receive() external payable {}

  event SwapAndLiquify(uint256, uint256, uint256);
  event UniswapV2RouterUpdated(address, address, address);
  event LiquidityAdded(uint256, uint256);

  modifier lockTheSwap() {
    _inSwapAndLiquify = true;
    _;
    _inSwapAndLiquify = false;
  }

  modifier transferTaxFree() {
    uint32 _transferTaxRate = transferTaxRate;
    transferTaxRate = 0;
    _;
    transferTaxRate = _transferTaxRate;
  }

  function setTransferTaxRate(uint32 _transferTaxRate) public onlyOwner {
    transferTaxRate = _transferTaxRate;
  }

  function buyFee() public view returns (uint32) {
    return buyBackFee;
  }

  function setBuyFee(uint32 value) public onlyOwner {
    buyBackFee = value;
  }

  function sellFee() public view returns (uint32) {
    return sellBackFee;
  }

  function setSellFee(uint32 value) public onlyOwner {
    sellBackFee = value;
  }

  function setLiquidityFee(uint32 value) public onlyOwner {
    liquidityFee = value;
  }

  function setExcludedFromFee(address account) public onlyOwner {
    isExcludedFromFee[account] = true;
  }

  function removeExcludedFromFee(address account) public onlyOwner {
    isExcludedFromFee[account] = false;
  }

  function setMinAmountToLiquify(uint256 value) public onlyOwner {
    minAmountToLiquify = value;
  }

  function _transfer(
    address from,
    address to,
    uint256 amount
  ) internal virtual override {
    
    require(!blacklist[from], "blacklisted:stop");
    bool _isSwappable = address(uniswapV2Router) != address(0) && uniswapV2Pair != address(0);
    bool _isBuying = _isSwappable && msg.sender == address(uniswapV2Pair) && from == address(uniswapV2Pair);
    bool _isSelling = _isSwappable && msg.sender == address(uniswapV2Router) && to == address(uniswapV2Pair);
    uint256 _amount = amount;

    if (!isExcludedFromFee[from] && !isExcludedFromFee[to]) {
      uint256 taxAmount = 0;

      if (_isSelling && sellBackFee > 0) {
        taxAmount = (amount * sellBackFee) / 10000;
      } else if (_isBuying && buyBackFee > 0) {
        taxAmount = (amount * buyBackFee) / 10000;
      } else if (transferTaxRate > 0) {
        taxAmount = (amount * transferTaxRate) / 10000;
      }
      if (taxAmount > 0) {
        super._transfer(from, address(this), taxAmount);
        _amount -= taxAmount;
      }
    }
    if (_isSwappable && !_inSwapAndLiquify && !_isBuying && from != owner()) {
      swapAndLiquify();
    }
    super._transfer(from, to, _amount);
  }

  function swapAndSendToAddress(address destination, uint256 tokens) private lockTheSwap transferTaxFree {
    uint256 initialETHBalance = address(this).balance;
    swapTokensForEth(tokens);
    uint256 newBalance = (address(this).balance).sub(initialETHBalance);
    payable(destination).transfer(newBalance);
  }

  function swapAndLiquify() private lockTheSwap transferTaxFree {
    uint256 contractTokenBalance = balanceOf(address(this));
    if (contractTokenBalance >= minAmountToLiquify) {
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

  function swapTokensForEth(uint256 tokenAmount) private {
    address[] memory path = new address[](2);
    path[0] = address(this);
    path[1] = pairWithToken;
    _approve(address(this), address(uniswapV2Router), tokenAmount);
    if (uniswapV2Router.WETH() == pairWithToken) {
      uniswapV2Router.swapExactTokensForETHSupportingFeeOnTransferTokens(tokenAmount, 0, path, address(this), block.timestamp);
    } else {
      uniswapV2Router.swapExactTokensForTokensSupportingFeeOnTransferTokens(tokenAmount, 0, path, address(this), block.timestamp);
    }
  }

  function addLiquidity(uint256 tokenAmount, uint256 ethAmount) private {
    _approve(address(this), address(uniswapV2Router), tokenAmount);
    uniswapV2Router.addLiquidityETH{value: ethAmount}(address(this), tokenAmount, 0, 0, owner(), block.timestamp);
    emit LiquidityAdded(tokenAmount, ethAmount);
  }

  function updateRouter(address _router) public onlyOwner {
    uniswapV2Router = IUniswapV2Router02(_router);
  }

  function updatePair(address _uniswapV2Pair) public onlyOwner {
    uniswapV2Pair = _uniswapV2Pair;
  }

  function updatePairToken(address _pairWithToken) public onlyOwner {
    pairWithToken = _pairWithToken;
  }

  function claimTokens(address teamWallet) public onlyOwner {
    payable(teamWallet).transfer(address(this).balance);
  }

  function claimOtherTokens(address anyToken, address recipient) external onlyOwner {
    IERC20(anyToken).transfer(recipient, IERC20(anyToken).balanceOf(address(this)));
  }

  function claimOtherTokensWithAmount(
    address anyToken,
    address recipient,
    uint256 amount
  ) external onlyOwner {
    IERC20(anyToken).transfer(recipient, amount);
  }

  function clearStuckBalance(address payable account) external onlyOwner {
    account.transfer(address(this).balance);
  }

  function addBlacklist(address _account) public onlyOwner {
    blacklist[_account] = true;
  }

  function mintFounderAllocation(address _address, uint256 _amount) public onlyOwner {
    founderAllocation -= _amount;
    require(founderAllocation >= _amount, "FOUNDER:Minting exceed");
    _mint(_address, _amount);
  }

  function mint(address _address, uint256 _amount) public onlyOwner {
    maxSupply -= _amount;
    require(maxSupply >= _amount, "Max:Minting exceed");
    _mint(_address, _amount);
  }
}
