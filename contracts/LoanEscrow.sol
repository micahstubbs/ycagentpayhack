// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LoanEscrow is IERC721Receiver, Ownable {
    struct Loan {
        address lender;
        address borrower;
        uint256 invoiceTokenId;
        uint256 principalAmount;
        uint256 interestAmount;
        uint256 totalOwed;
        bool settled;
        address invoiceNFTContract;
    }

    uint256 private _loanIdCounter;
    mapping(uint256 => Loan) public loans;

    event LoanCreated(
        uint256 indexed loanId,
        address indexed lender,
        address indexed borrower,
        uint256 invoiceTokenId,
        uint256 principalAmount,
        uint256 interestAmount
    );

    event LoanSettled(
        uint256 indexed loanId,
        uint256 amountToLender,
        uint256 amountToBorrower
    );

    constructor() Ownable(msg.sender) {}

    function createLoan(
        address borrower,
        address invoiceNFTContract,
        uint256 invoiceTokenId,
        uint256 principalAmount,
        uint256 interestAmount
    ) external payable returns (uint256) {
        require(borrower != address(0), "Invalid borrower address");
        require(principalAmount > 0, "Principal must be greater than 0");
        require(msg.value == principalAmount, "Must send principal amount");

        // Transfer invoice NFT to escrow
        IERC721(invoiceNFTContract).safeTransferFrom(
            borrower,
            address(this),
            invoiceTokenId
        );

        uint256 loanId = _loanIdCounter++;
        uint256 totalOwed = principalAmount + interestAmount;

        loans[loanId] = Loan({
            lender: msg.sender,
            borrower: borrower,
            invoiceTokenId: invoiceTokenId,
            principalAmount: principalAmount,
            interestAmount: interestAmount,
            totalOwed: totalOwed,
            settled: false,
            invoiceNFTContract: invoiceNFTContract
        });

        // Transfer principal to borrower
        payable(borrower).transfer(principalAmount);

        emit LoanCreated(
            loanId,
            msg.sender,
            borrower,
            invoiceTokenId,
            principalAmount,
            interestAmount
        );

        return loanId;
    }

    function settleLoan(uint256 loanId) external payable {
        Loan storage loan = loans[loanId];
        require(!loan.settled, "Loan already settled");
        require(msg.value >= loan.totalOwed, "Insufficient payment amount");

        loan.settled = true;

        // Transfer interest + principal to lender
        uint256 lenderAmount = loan.principalAmount + loan.interestAmount;
        payable(loan.lender).transfer(lenderAmount);

        // Transfer remaining proceeds to borrower
        uint256 remainingAmount = msg.value - loan.totalOwed;
        if (remainingAmount > 0) {
            payable(loan.borrower).transfer(remainingAmount);
        }

        // Return invoice NFT to borrower
        IERC721(loan.invoiceNFTContract).safeTransferFrom(
            address(this),
            loan.borrower,
            loan.invoiceTokenId
        );

        emit LoanSettled(loanId, lenderAmount, remainingAmount);
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes calldata
    ) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }

    receive() external payable {}
}
