const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("InvoiceNFT", function () {
  let invoiceNFT;
  let owner;
  let debtor;
  let borrower;

  beforeEach(async function () {
    [owner, debtor, borrower] = await ethers.getSigners();

    const InvoiceNFT = await ethers.getContractFactory("InvoiceNFT");
    invoiceNFT = await InvoiceNFT.deploy();
    await invoiceNFT.waitForDeployment();
  });

  it("Should mint an invoice NFT", async function () {
    const amount = ethers.parseEther("1000");
    const dueDate = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days

    const tx = await invoiceNFT.mint(
      borrower.address,
      debtor.address,
      amount,
      dueDate
    );

    await expect(tx)
      .to.emit(invoiceNFT, "InvoiceMinted")
      .withArgs(0, borrower.address, debtor.address, amount, dueDate);

    const invoice = await invoiceNFT.getInvoice(0);
    expect(invoice.debtor).to.equal(debtor.address);
    expect(invoice.amount).to.equal(amount);
    expect(invoice.paid).to.be.false;
  });

  it("Should allow debtor to pay invoice", async function () {
    const amount = ethers.parseEther("1000");
    const dueDate = Math.floor(Date.now() / 1000) + 86400 * 30;

    await invoiceNFT.mint(borrower.address, debtor.address, amount, dueDate);

    const tx = await invoiceNFT.connect(debtor).payInvoice(0, { value: amount });
    await expect(tx).to.emit(invoiceNFT, "InvoicePaid").withArgs(0, amount);

    const invoice = await invoiceNFT.getInvoice(0);
    expect(invoice.paid).to.be.true;
  });
});
