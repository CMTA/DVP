import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { ContractFactory, Contract, BigNumber, ContractTransaction, ContractReceipt } from "ethers";
import { ethers } from "hardhat";

/**
 * The following variables are initialized in before() method
 */
let potFactory: ContractFactory;
let issuer: SignerWithAddress;
let sender: SignerWithAddress;
let receiver: SignerWithAddress;
let dvp: SignerWithAddress;
let other: SignerWithAddress;
let addrs: SignerWithAddress[];

/**
 * Test values
 */
const tokenId: BigNumber = BigNumber.from(123456789)
const tokenId2: BigNumber = BigNumber.from(987654321)
const businessId: string = "business 123"
const businessId2: string = "business 456"
const dealDetailNum: BigNumber = BigNumber.from(1)
const dealDetailNum2: BigNumber = BigNumber.from(2)
const dealDetailAddress: string = "0xFFcf8FDEE72ac11b5c542428B35EEF5769C409f0"
const currency: string = "EUR"
const amount: BigNumber = BigNumber.from(10000)
const painEventName: string = "PaymentInitiated"
const ChangeFinalAmountName: string = "ChangeFinalAmount"
const confirmEventName: string = "PaymentConfirmed"
const deactivateEventName: string = "PotDeactivated"

const newAmount: BigNumber = BigNumber.from(9000)
const wrongNewAmount: BigNumber = BigNumber.from(10001)
const negativeNewAmount: BigNumber = BigNumber.from(-1)
const POT_STATUS_ISSUED = 0
const POT_STATUS_PAYMENT_INITIATED = 1
const POT_STATUS_PAYMENT_CONFIRMED = 2
const POT_STATUS_DEACTIVATED = 3

/**
 * Constants from POT.sol used in test conditions
 */
const NOT_VALID_NFT: string = "003002";
const NOT_CURRENT_RECEIVER: string = "018003";
const INVALID_AMOUNT: string = "018004";

/**
* The following variable is initialized in beforeEach() method
*/
let pot: Contract;

/**
* Interfaces to structure test data
*/
interface ContractTestData {
  contractName: string,
  name: string,
  symbol: string,
  baseUri: string
}

const potContract: ContractTestData = { contractName: "POT", name: "PaymentOrderToken", symbol: "POT", baseUri: "http://token-base-uri/" }

/**
 * Contract factory and test accounts have to be requested only once for all tests
 */
before(async function () {
  potFactory = await ethers.getContractFactory(potContract.contractName);
  [issuer, sender, receiver, other, dvp, ...addrs] = await ethers.getSigners();
});

/**
 * Deploy a new version of the contract for each test
 */
beforeEach(async function () {
  pot = await potFactory.deploy(potContract.name, potContract.symbol, potContract.baseUri);

  storeName(pot, pot.address, 'POT');
  storeName(pot, sender.address, 'Sender');
  storeName(pot, receiver.address, 'Receiver');
  storeName(pot, issuer.address, 'Issuer');
  storeName(pot, dvp.address, 'DVP');

  await pot.connect(issuer).issuePaymentToken(
    sender.address,
    tokenId,
    businessId,
    dealDetailNum,
    dealDetailNum2,
    dealDetailAddress,
    currency,
    amount,
    sender.address,
    receiver.address);

  await pot.deployed();
});

function storeName(contract: Contract, address: string, name: string) {
  contract.store(address, name + ' (' + address.toLowerCase() + ')');
}

describe("POT", function () {
  it("Contract should have correct symbol and name", async () => {
    // ERC721
    expect(await pot.name()).to.equal(potContract.name);
    expect(await pot.symbol()).to.equal(potContract.symbol);
  });

  it("Payment token should have correct token URI", async () => {
    expect(await pot.connect(sender).tokenURI(tokenId)).to.equal("http://token-base-uri/" + tokenId);
  });

  it("Payment token should have status Issued after issuance", async () => {
      expect(await pot.connect(issuer).getStatus(tokenId)).to.equal(POT_STATUS_ISSUED);
  });

  it("Payment token should have correct detailDealNum", async () => {
    expect(await pot.connect(issuer).getDealDetailNum(tokenId)).to.equal(1);
  });

  it("Should not be able to deploy two PTs with same ID", async () => {
    await expect(pot.connect(issuer).issuePaymentToken(
      sender.address,
      tokenId,
      businessId,
      dealDetailNum,
      dealDetailNum2,
      dealDetailAddress,
      currency,
      amount,
      sender.address,
      receiver.address)).to.be.revertedWith("ERC721: token already minted");
  });

  it("Only contract owner should be able to deploy PTs", async () => {
    await expect(pot.connect(sender).issuePaymentToken(
      sender.address,
      tokenId2,
      businessId,
      dealDetailNum,
      dealDetailNum2,
      dealDetailAddress,
      currency,
      amount,
      sender.address,
      receiver.address)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("Owner should be able to transfer PT", async () => {
    expect(await pot.connect(issuer).ownerOf(tokenId)).to.equal(sender.address);

    await pot.connect(issuer).transferFrom(sender.address, sender.address, tokenId);

    expect(await pot.connect(issuer).ownerOf(tokenId)).to.equal(sender.address);
  });

  it("Non-owner should not be able to transfer PT", async () => {
    expect(await pot.connect(issuer).ownerOf(tokenId)).to.equal(sender.address);

    await expect(pot.connect(receiver).transferFrom(
      issuer.address,
      receiver.address,
      tokenId)).to.be.revertedWith("ERC721: caller is not token owner nor approved");
  });

  it("Token should be burned when sent to contract", async () => {
    await pot.connect(issuer).tokenURI(tokenId);
    await pot.connect(issuer).transferFrom(issuer.address, pot.address, tokenId);

    await expect(pot.connect(issuer).tokenURI(tokenId)).to.be.reverted;
  });

  it("Final amount and initial amount are the same", async () => {
    expect(await pot.getFinalAmount(tokenId)).to.equal(amount);
  });

  it("Receiver can change final amount", async () => {
    await pot.connect(receiver).changeAmount(tokenId, newAmount);
    expect(await pot.getFinalAmount(tokenId)).to.equal(newAmount);
  });

  it("Sender can't change final amount", async () => {
    await expect(pot.connect(sender)
      .changeAmount(
        tokenId,
        newAmount))
      .to.be.revertedWith(NOT_CURRENT_RECEIVER);
  });

  it("Random address can't change final amount", async () => {
    await expect(pot.connect(other)
      .changeAmount(
        tokenId,
        newAmount))
      .to.be.revertedWith(NOT_CURRENT_RECEIVER);
  });

  it("Final amount cannot be greater can initial amount", async () => {
    await expect(pot.connect(receiver)
      .changeAmount(
        tokenId,
        wrongNewAmount))
      .to.be.revertedWith(INVALID_AMOUNT);
  });

  it("Final amount cannot be negative", async () => {
    await expect(pot.connect(receiver)
      .changeAmount(
        tokenId,
        negativeNewAmount))
      .to.be.reverted // revertedWith is somehow not working on the error message returned
  });

  it("Token should be burned when sent to contract with final amount changed", async () => {
    await pot.connect(receiver).changeAmount(tokenId, newAmount);
    await pot.connect(issuer).tokenURI(tokenId);

    await pot.connect(issuer).transferFrom(issuer.address, pot.address, tokenId);

    await expect(pot.connect(issuer).tokenURI(tokenId)).to.be.reverted;
  });

  it("Event should be emitted when final amount of the POT is changed", async () => {
    await expect(pot.connect(receiver).changeAmount(tokenId, newAmount)).to.emit(pot, ChangeFinalAmountName)
      .withArgs(
        tokenId,
        newAmount,
        currency);
  });

  it("Contract should support safeTransferFrom", async () => {
    await pot.connect(issuer).transferFrom(sender.address, sender.address, tokenId);
    await pot.connect(sender)["safeTransferFrom(address,address,uint256)"](sender.address, pot.address, tokenId);
  });

  it("Token should be burned when sent to contract with safeTransferFrom", async () => {
    await pot.connect(issuer).tokenURI(tokenId);
    await pot.connect(issuer)["safeTransferFrom(address,address,uint256)"](issuer.address, pot.address, tokenId);
    await expect(pot.connect(issuer).tokenURI(tokenId)).to.be.reverted;
  });

  it("Measure gas used for transferFrom to address vs pot", async () => {
    let tx: ContractTransaction = await pot.connect(issuer).transferFrom(sender.address, sender.address, tokenId);
    let receipt: ContractReceipt = await tx.wait();
    console.log("transferFrom to address - Gas used:", receipt.gasUsed.toString());

    tx = await pot.connect(sender).transferFrom(sender.address, pot.address, tokenId);
    receipt = await tx.wait();
    console.log("transferFrom to POT - Gas used:", receipt.gasUsed.toString());
  });

  it("For an unknown businessId, expect an empty token list", async () => {
    let tokenIdFromPOT = await pot.getTokenIdByBusinessId("unknown businessId");
    expect(tokenIdFromPOT).to.equal(0);
  });

  it("Expect the one tokenId for the businessId", async () => {
    let tokenIdFromPOT = await pot.getTokenIdByBusinessId(businessId);
    expect(tokenIdFromPOT).to.equal(tokenId);
  });

  it("ownerToTokenId should return both tokens owned by address", async () => {
    // issue 2nd POT to sender
    await pot.connect(issuer).issuePaymentToken(
      sender.address,
      tokenId2,
      businessId2,
      dealDetailNum,
      dealDetailNum2,
      dealDetailAddress,
      currency,
      amount,
      sender.address,
      receiver.address);
    
    let tokenIdsFromSender = await pot.getTokenIdsByOwner(sender.address);
    expect(tokenIdsFromSender).to.have.length(2);
    expect(tokenIdsFromSender[0]).to.equal(tokenId);
    expect(tokenIdsFromSender[1]).to.equal(tokenId2);
  });

  it("When Token is burned it should be deleted from ownerToTokenId", async () => {
    // issue 2nd POT to sender
    await pot.connect(issuer).issuePaymentToken(
      sender.address,
      tokenId2,
      businessId2,
      dealDetailNum,
      dealDetailNum2,
      dealDetailAddress,
      currency,
      amount,
      sender.address,
      receiver.address);
  
    // burn first POT
    await pot.connect(sender).transferFrom(sender.address, pot.address, tokenId);

    //call getTokenIdsByOwner
    let tokenIdsFromSender = await pot.getTokenIdsByOwner(sender.address);
    expect(tokenIdsFromSender).to.have.length(1);
    expect(tokenIdsFromSender[0]).to.equal(tokenId2);
  });

  it("When Token is burned it should be deleted from businessIdToTokenId", async () => {
    // burn POT
    await pot.connect(sender).transferFrom(sender.address, pot.address, tokenId);

    //call getTokenIdByBusinessId
    let tokenIdForBusinessId = await pot.getTokenIdByBusinessId(businessId);
    expect(tokenIdForBusinessId).to.equal(0);
  });

  it("initiatePayment cannot be called by party other than POT owner", async () => {
    await expect(pot.connect(receiver).initiatePayment(tokenId)).to.be.revertedWith("Message sender is not owner nor approved for POT");
  });

  it("initiatePayment cannot be called for POT in status 'PaymentInitiated'", async () => {
    pot.connect(sender).initiatePayment(tokenId);
    await expect(pot.connect(sender).initiatePayment(tokenId)).to.be.revertedWith("POT does not have status 'Issued'");
  });

  it("Call of initiatePayment changes status of POT to 'PaymentInitiated'", async () => {
    pot.connect(sender).initiatePayment(tokenId);
    expect(await pot.connect(issuer).getStatus(tokenId)).to.equal(POT_STATUS_PAYMENT_INITIATED);
  });

  it("Call of initiatePayment emits event 'PaymentInitiated' with correct attributes", async () => {
    await expect(pot.connect(sender).initiatePayment(tokenId)).to.emit(pot, painEventName).withArgs(
        tokenId,
        sender.address,
        receiver.address,
        businessId,
        dealDetailNum,
        dealDetailNum2,
        dealDetailAddress,
        amount,
        currency,
        potContract.baseUri + tokenId.toString());
  });

  it("Call of initiatePayment emits event 'PaymentInitiated' with new amount after token with final amount changed", async () => {
    await pot.connect(receiver).changeAmount(tokenId, newAmount);
    await expect(pot.connect(sender).initiatePayment(tokenId)).to.emit(pot, painEventName).withArgs(
        tokenId,
        sender.address,
        receiver.address,
        businessId,
        dealDetailNum,
        dealDetailNum2,
        dealDetailAddress,
        newAmount,
        currency,
        potContract.baseUri + tokenId.toString());
  });

  it("confirmPayment cannot be called by party other than POT SC owner", async () => {
    await expect(pot.connect(sender).confirmPayment(tokenId)).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("confirmPayment cannot be called for POT in status 'Issued'", async () => {
    await expect(pot.connect(issuer).confirmPayment(tokenId)).to.be.revertedWith("POT does not have status 'PaymentInitiated'");
  });

  it("Call of confirmPayment changes status of POT to 'PaymentConfirmed'", async () => {
    pot.connect(sender).initiatePayment(tokenId);
    pot.connect(issuer).confirmPayment(tokenId);
    expect(await pot.connect(issuer).getStatus(tokenId)).to.equal(POT_STATUS_PAYMENT_CONFIRMED);
  });

  it("Call of confirmPayment emits event 'PaymentConfirmed' with correct attributes", async () => {
    pot.connect(sender).initiatePayment(tokenId);
    await expect(pot.connect(issuer).confirmPayment(tokenId)).to.emit(pot, confirmEventName).withArgs(
        tokenId,
        sender.address,
        receiver.address,
        businessId,
        dealDetailNum,
        dealDetailNum2,
        dealDetailAddress,
        amount,
        currency,
        potContract.baseUri + tokenId.toString());
  });

  it("Call of confirmPayment emits event 'PaymentConfirmed' with new amount after token with final amount changed", async () => {
    await pot.connect(receiver).changeAmount(tokenId, newAmount);
    pot.connect(sender).initiatePayment(tokenId);
    await expect(pot.connect(issuer).confirmPayment(tokenId)).to.emit(pot, confirmEventName).withArgs(
        tokenId,
        sender.address,
        receiver.address,
        businessId,
        dealDetailNum,
        dealDetailNum2,
        dealDetailAddress,
        newAmount,
        currency,
        potContract.baseUri + tokenId.toString());
  });

  it("DeactivatePot cannot be called by address not owning POT", async () => {
    await expect(pot.connect(receiver).deactivatePot(tokenId)).to.be.revertedWith("Message sender is not owner nor approved for POT");
  });

  it("DeactivatePot cannot be called for POT already having status 'Deactivated'", async () => {
    await pot.connect(sender).deactivatePot(tokenId);
    await expect(pot.connect(sender).deactivatePot(tokenId)).to.be.revertedWith("POT already has status 'Deactivated'");
  });

  it("Call of deactivatePot changes status of POT to 'Deactivated'", async () => {
    pot.connect(sender).deactivatePot(tokenId);
    expect(await pot.connect(issuer).getStatus(tokenId)).to.equal(POT_STATUS_DEACTIVATED);
  });

  it("Call of deactivatePot emits event 'PotDeactived' with correct attributes", async () => {
    await expect(pot.connect(sender).deactivatePot(tokenId)).to.emit(pot, deactivateEventName).withArgs(
        tokenId,
        sender.address,
        receiver.address,
        businessId,
        dealDetailNum,
        dealDetailNum2,
        dealDetailAddress,
        amount,
        currency,
        potContract.baseUri + tokenId.toString());
  });

  it("POT cannot be issued when contract is paused", async () => {
    await pot.connect(issuer).pause();
    await expect(pot.connect(issuer).issuePaymentToken(
          sender.address,
          tokenId2,
          businessId2,
          dealDetailNum,
          dealDetailNum2,
          dealDetailAddress,
          currency,
          amount,
          sender.address,
          receiver.address)).to.be.revertedWith("Pausable: paused");
  });

  it("POT cannot be transferred when contract is paused", async () => {
    pot.connect(issuer).pause();
    await expect(pot.connect(sender)["safeTransferFrom(address,address,uint256)"](sender.address, receiver.address, tokenId)).to.be.revertedWith("ERC721Pausable: token transfer while paused");
  });

  it("Payment cannot be initiated when contract is paused", async () => {
    pot.connect(issuer).pause();
    await expect(pot.connect(sender).initiatePayment(tokenId)).to.be.revertedWith("Pausable: paused");
  });

  it("Payment cannot be confirmed when contract is paused", async () => {
    pot.connect(sender).initiatePayment(tokenId);
    pot.connect(issuer).pause();
    await expect(pot.connect(issuer).confirmPayment(tokenId)).to.be.revertedWith("Pausable: paused");
  });

  it("POT cannot be deactivated when contract is paused", async () => {
    pot.connect(issuer).pause();
    await expect(pot.connect(sender).deactivatePot(tokenId)).to.be.revertedWith("Pausable: paused");
  });

  it("Contract cannot be paused by third account", async () => {
    await expect(pot.connect(sender).pause()).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("POT can be transferred when contract is unpaused after pause", async () => {
    pot.connect(issuer).pause();
    pot.connect(issuer).unpause();
    pot.connect(sender)["safeTransferFrom(address,address,uint256)"](sender.address, receiver.address, tokenId);
    expect(await pot.connect(issuer).ownerOf(tokenId)).to.equal(receiver.address);
  });

  it("getMintTime returns blocktime of minting", async () => {
    const provider = pot.provider;
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    const timestamp = block.timestamp;
    expect(await pot.connect(receiver).getMintTime(tokenId)).to.equal(timestamp);
  });
});
