// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract ChallengePool is Ownable {
    IERC20 public immutable usdcToken;

    uint256 public constant PLATFORM_FEE_BPS = 500; // 5%
    uint256 public nextChallengeId = 1;

    struct Challenge {
        address creator;
        uint256 prizePool;      // net pool after platform fee
        uint64 endsAt;
        uint64 claimDeadline;
        bytes32 merkleRoot;
        bool cancelled;
    }

    mapping(uint256 => Challenge) public challenges;
    mapping(uint256 => mapping(address => bool)) public hasClaimed;
    mapping(uint256 => uint256) public totalClaimed;

    event ChallengeCreated(
        uint256 indexed challengeId,
        address indexed creator,
        uint256 prizePool,
        uint256 platformFee,
        uint64 endsAt,
        uint64 claimDeadline
    );
    event MerkleRootSet(uint256 indexed challengeId, bytes32 merkleRoot);
    event RewardClaimed(
        uint256 indexed challengeId,
        address indexed user,
        uint256 amount
    );
    event ChallengeReclaimed(uint256 indexed challengeId, address indexed creator, uint256 amount);
    event ChallengeCancelled(uint256 indexed challengeId, address indexed creator, uint256 refund);

    constructor(address _usdcToken) Ownable(msg.sender) {
        require(_usdcToken != address(0), "Invalid USDC address");
        usdcToken = IERC20(_usdcToken);
    }

    function createChallenge(
        uint256 prizePool,
        uint64 endsAt,
        uint64 claimDeadline
    ) external returns (uint256) {
        require(prizePool > 0, "Prize pool must be > 0");
        require(endsAt > block.timestamp, "End must be in future");
        require(claimDeadline > endsAt, "Claim deadline must be after end");

        uint256 platformFee = (prizePool * PLATFORM_FEE_BPS) / 10000;
        uint256 netPool = prizePool - platformFee;

        require(
            usdcToken.transferFrom(msg.sender, address(this), prizePool),
            "USDC transfer failed"
        );

        // Send platform fee to contract owner
        if (platformFee > 0) {
            require(
                usdcToken.transfer(owner(), platformFee),
                "Fee transfer failed"
            );
        }

        uint256 challengeId = nextChallengeId++;
        challenges[challengeId] = Challenge({
            creator: msg.sender,
            prizePool: netPool,
            endsAt: endsAt,
            claimDeadline: claimDeadline,
            merkleRoot: bytes32(0),
            cancelled: false
        });

        emit ChallengeCreated(
            challengeId,
            msg.sender,
            netPool,
            platformFee,
            endsAt,
            claimDeadline
        );

        return challengeId;
    }

    function setMerkleRoot(uint256 challengeId, bytes32 merkleRoot) external {
        Challenge storage c = challenges[challengeId];
        require(c.creator != address(0), "Challenge does not exist");
        require(
            msg.sender == c.creator || msg.sender == owner(),
            "Not authorized"
        );
        require(!c.cancelled, "Challenge cancelled");
        require(block.timestamp >= c.endsAt, "Challenge not ended");

        c.merkleRoot = merkleRoot;
        emit MerkleRootSet(challengeId, merkleRoot);
    }

    function claimReward(
        uint256 challengeId,
        uint256 amount,
        bytes32[] calldata proof
    ) external {
        Challenge storage c = challenges[challengeId];
        require(c.creator != address(0), "Challenge does not exist");
        require(!c.cancelled, "Challenge cancelled");
        require(c.merkleRoot != bytes32(0), "Merkle root not set");
        require(block.timestamp <= c.claimDeadline, "Claim deadline passed");
        require(!hasClaimed[challengeId][msg.sender], "Already claimed");

        // Verify Merkle proof (double-hash leaf to match OpenZeppelin StandardMerkleTree)
        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(msg.sender, amount))));
        require(
            MerkleProof.verify(proof, c.merkleRoot, leaf),
            "Invalid proof"
        );

        hasClaimed[challengeId][msg.sender] = true;
        totalClaimed[challengeId] += amount;

        require(
            usdcToken.transfer(msg.sender, amount),
            "Reward transfer failed"
        );

        emit RewardClaimed(challengeId, msg.sender, amount);
    }

    function reclaimUnclaimed(uint256 challengeId) external {
        Challenge storage c = challenges[challengeId];
        require(c.creator != address(0), "Challenge does not exist");
        require(msg.sender == c.creator, "Not creator");
        require(!c.cancelled, "Challenge cancelled");
        require(block.timestamp > c.claimDeadline, "Claim deadline not passed");

        uint256 unclaimed = c.prizePool - totalClaimed[challengeId];
        require(unclaimed > 0, "Nothing to reclaim");

        // Zero out to prevent re-entrancy
        c.prizePool = totalClaimed[challengeId];

        require(
            usdcToken.transfer(c.creator, unclaimed),
            "Reclaim transfer failed"
        );

        emit ChallengeReclaimed(challengeId, c.creator, unclaimed);
    }

    function cancelChallenge(uint256 challengeId) external {
        Challenge storage c = challenges[challengeId];
        require(c.creator != address(0), "Challenge does not exist");
        require(msg.sender == c.creator, "Not creator");
        require(!c.cancelled, "Already cancelled");
        require(c.merkleRoot == bytes32(0), "Already finalized");

        c.cancelled = true;
        uint256 refund = c.prizePool;
        c.prizePool = 0;

        require(
            usdcToken.transfer(c.creator, refund),
            "Refund transfer failed"
        );

        emit ChallengeCancelled(challengeId, c.creator, refund);
    }
}
