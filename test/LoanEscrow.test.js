const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("LoanEscrow", function () {
  let invoiceNFT;
  let loanEscrow;
  let lender;
  let borrower;
  let debtor;

  beforeEach(async function () {
    [lender, borrower, debtor] = await ethers.getSigners();

    const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
    invoiceNFT = await InvoiceNFT.deploy();
    await invoiceNFT.waitForDeployment();

    const LoanEscrow = await ethers.getContractFactory("LoanEscrow");
    loanEscrow = await LoanEscrow.deploy();
    await loanEscrow.waitForDeployment();
  });

  it("Should create a loan with invoice NFT as collateral", async function () {
    const invoiceAmount = ethers.parseEther("1000");
    const principalAmount = ethers.parseEther("800");
    const interestAmount = ethers.parseEther("40");
    const dueDate = Math.floor(Date.now() / 1000) + 86400 * 30;

    // Mint invoice NFT to borrower
    await invoiceNFT.mint(borrower.address, debtor.address, invoiceAmount, dueDate);

    // Borrower approves escrow to transfer NFT
    await invoiceNFT.connect(borrower).approve(await loanEscrow.getAddress(), 0);

    // Lender creates loan
    const tx = await loanEscrow
      .connect(lender)
      .createLoan(
        borrower.address,
        await invoiceNFT.getAddress(),
        0,
        principalAmount,
        interestAmount,
        { value: principalAmount }
      );

    await expect(tx)
      .to.emit(loanEscrow, "LoanCreated")
      .withArgs(0, lender.address, borrower.address, 0, principalAmount, interestAmount);

    // Verify loan details
    const loan = await loanEscrow.loans(0);
    expect(loan.lender).to.equal(lender.address);
    expect(loan.borrower).to.equal(borrower.address);
    expect(loan.principalAmount).to.equal(principalAmount);
    expect(loan.settled).to.be.false;

    // Verify NFT is in escrow
    expect(await invoiceNFT.ownerOf(0)).to.equal(await loanEscrow.getAddress());
  });

  it("Should settle loan and return NFT to borrower", async function () {
    const invoiceAmount = ethers.parseEther("1000");
    const principalAmount = ethers.parseEther("800");
    const interestAmount = ethers.parseEther("40");
    const dueDate = Math.floor(Date.now() / 1000) + 86400 * 30;

    // Setup loan
    await invoiceNFT.mint(borrower.address, debtor.address, invoiceAmount, dueDate);
    await invoiceNFT.connect(borrower).approve(await loanEscrow.getAddress(), 0);
    await loanEscrow
      .connect(lender)
      .createLoan(
        borrower.address,
        await invoiceNFT.getAddress(),
        0,
        principalAmount,
        interestAmount,
        { value: principalAmount }
      );

    // Debtor settles loan
    const totalOwed = principalAmount + interestAmount;
    const tx = await loanEscrow.connect(debtor).settleLoan(0, { value: invoiceAmount });

    await expect(tx).to.emit(loanEscrow, "LoanSettled");

    // Verify loan is settled
    const loan = await loanEscrow.loans(0);
    expect(loan.settled).to.be.true;

    // Verify NFT returned to borrower
    expect(await invoiceNFT.ownerOf(0)).to.equal(borrower.address);
  });
});
