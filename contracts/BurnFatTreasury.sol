// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BurnFatTreasury is Ownable {
    IERC20 public immutable usdcToken;

    address public operationsWallet;
    uint256 public reservePool;

    // Pricing in USDC (6 decimals)
    uint256 public constant PRICE_PER_KG = 1_000_000; // $1.00
    uint256 public constant RETROSPECTIVE_PRICE_PER_KG = 500_000; // $0.50

    mapping(address => bool) public hasUsedRetrospective;

    event BurnSubmitted(
        address indexed user,
        uint256 kgAmount,
        uint256 usdcAmount,
        bool isRetrospective
    );
    event ReferralPaid(address indexed referrer, address indexed user, uint256 amount);
    event OperationsWalletUpdated(address indexed oldWallet, address indexed newWallet);
    event ReservePoolWithdrawn(address indexed to, uint256 amount);

    constructor(address _usdcToken, address _operationsWallet) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        require(_operationsWallet != address(0), "Invalid ops wallet");
        usdcToken = IERC20(_usdcToken);
        operationsWallet = _operationsWallet;
    }

    function submitBurn(uint256 kgAmount, bool isRetrospective, address referrer) external {
        require(kgAmount > 0, "Amount must be > 0");

        if (isRetrospective) {
            require(!hasUsedRetrospective[msg.sender], "Retrospective already used");
            hasUsedRetrospective[msg.sender] = true;
        }

        uint256 pricePerKg = isRetrospective ? RETROSPECTIVE_PRICE_PER_KG : PRICE_PER_KG;
        uint256 totalAmount = kgAmount * pricePerKg;

        // Pull USDC from user (requires prior approval)
        require(
            usdcToken.transferFrom(msg.sender, address(this), totalAmount),
            "USDC transfer failed"
        );

        // Split: 1/3 operations, 1/3 referral (or operations if no referrer), 1/3 reserve
        uint256 opsShare = totalAmount / 3;
        uint256 remaining = totalAmount - opsShare;
        uint256 referralShare = remaining / 2;
        uint256 reserveShare = remaining - referralShare;

        require(usdcToken.transfer(operationsWallet, opsShare), "Ops transfer failed");

        if (referrer != address(0) && referrer != msg.sender) {
            require(usdcToken.transfer(referrer, referralShare), "Referral transfer failed");
            emit ReferralPaid(referrer, msg.sender, referralShare);
        } else {
            require(usdcToken.transfer(operationsWallet, referralShare), "Ops referral transfer failed");
        }

        reservePool += reserveShare;

        emit BurnSubmitted(msg.sender, kgAmount, totalAmount, isRetrospective);
    }

    // --- Admin functions ---

    function setOperationsWallet(address _newWallet) external onlyOwner {
        require(_newWallet != address(0), "Invalid address");
        address old = operationsWallet;
        operationsWallet = _newWallet;
        emit OperationsWalletUpdated(old, _newWallet);
    }

    function withdrawReservePool(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Invalid address");
        require(amount <= reservePool, "Exceeds reserve pool");
        reservePool -= amount;
        require(usdcToken.transfer(to, amount), "Transfer failed");
        emit ReservePoolWithdrawn(to, amount);
    }
}
