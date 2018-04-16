#!/bin/bash
# ----------------------------------------------------------------------------------------------
# Testing the smart contract
#
# Enjoy. (c) BokkyPooBah / Bok Consulting Pty Ltd 2017. The MIT Licence.
# ----------------------------------------------------------------------------------------------

MODE=${1:-test}

GETHATTACHPOINT=`grep ^IPCFILE= settings.txt | sed "s/^.*=//"`
PASSWORD=`grep ^PASSWORD= settings.txt | sed "s/^.*=//"`

SOURCEDIR=`grep ^SOURCEDIR= settings.txt | sed "s/^.*=//"`

TOKENFACTORYSOL=`grep ^TOKENFACTORYSOL= settings.txt | sed "s/^.*=//"`
TOKENFACTORYJS=`grep ^TOKENFACTORYJS= settings.txt | sed "s/^.*=//"`
DAOSOL=`grep ^DAOSOL= settings.txt | sed "s/^.*=//"`
DAOJS=`grep ^DAOJS= settings.txt | sed "s/^.*=//"`

DEPLOYMENTDATA=`grep ^DEPLOYMENTDATA= settings.txt | sed "s/^.*=//"`

INCLUDEJS=`grep ^INCLUDEJS= settings.txt | sed "s/^.*=//"`
TEST1OUTPUT=`grep ^TEST1OUTPUT= settings.txt | sed "s/^.*=//"`
TEST1RESULTS=`grep ^TEST1RESULTS= settings.txt | sed "s/^.*=//"`
JSONSUMMARY=`grep ^JSONSUMMARY= settings.txt | sed "s/^.*=//"`
JSONEVENTS=`grep ^JSONEVENTS= settings.txt | sed "s/^.*=//"`

CURRENTTIME=`date +%s`
CURRENTTIMES=`date -r $CURRENTTIME -u`

START_DATE=`echo "$CURRENTTIME+45" | bc`
START_DATE_S=`date -r $START_DATE -u`
END_DATE=`echo "$CURRENTTIME+60*2" | bc`
END_DATE_S=`date -r $END_DATE -u`

printf "MODE               = '$MODE'\n" | tee $TEST1OUTPUT
printf "GETHATTACHPOINT    = '$GETHATTACHPOINT'\n" | tee -a $TEST1OUTPUT
printf "PASSWORD           = '$PASSWORD'\n" | tee -a $TEST1OUTPUT
printf "SOURCEDIR          = '$SOURCEDIR'\n" | tee -a $TEST1OUTPUT
printf "TOKENFACTORYSOL    = '$TOKENFACTORYSOL'\n" | tee -a $TEST1OUTPUT
printf "TOKENFACTORYJS     = '$TOKENFACTORYJS'\n" | tee -a $TEST1OUTPUT
printf "DAOSOL             = '$DAOSOL'\n" | tee -a $TEST1OUTPUT
printf "DAOJS              = '$DAOJS'\n" | tee -a $TEST1OUTPUT
printf "DEPLOYMENTDATA     = '$DEPLOYMENTDATA'\n" | tee -a $TEST1OUTPUT
printf "INCLUDEJS          = '$INCLUDEJS'\n" | tee -a $TEST1OUTPUT
printf "TEST1OUTPUT        = '$TEST1OUTPUT'\n" | tee -a $TEST1OUTPUT
printf "TEST1RESULTS       = '$TEST1RESULTS'\n" | tee -a $TEST1OUTPUT
printf "JSONSUMMARY        = '$JSONSUMMARY'\n" | tee -a $TEST1OUTPUT
printf "JSONEVENTS         = '$JSONEVENTS'\n" | tee -a $TEST1OUTPUT
printf "CURRENTTIME        = '$CURRENTTIME' '$CURRENTTIMES'\n" | tee -a $TEST1OUTPUT
printf "START_DATE         = '$START_DATE' '$START_DATE_S'\n" | tee -a $TEST1OUTPUT
printf "END_DATE           = '$END_DATE' '$END_DATE_S'\n" | tee -a $TEST1OUTPUT

# Make copy of SOL file and modify start and end times ---
# `cp modifiedContracts/SnipCoin.sol .`
`cp $SOURCEDIR/$TOKENFACTORYSOL .`
`cp $SOURCEDIR/$DAOSOL .`

# --- Modify parameters ---
# `perl -pi -e "s/START_DATE \= 1525132800.*$/START_DATE \= $START_DATE; \/\/ $START_DATE_S/" $CROWDSALESOL`
# `perl -pi -e "s/endDate \= 1527811200;.*$/endDate \= $END_DATE; \/\/ $END_DATE_S/" $CROWDSALESOL`

DIFFS1=`diff $SOURCEDIR/$TOKENFACTORYSOL $TOKENFACTORYSOL`
echo "--- Differences $SOURCEDIR/$TOKENFACTORYSOL $TOKENFACTORYSOL ---" | tee -a $TEST1OUTPUT
echo "$DIFFS1" | tee -a $TEST1OUTPUT

DIFFS1=`diff $SOURCEDIR/$DAOSOL $DAOSOL`
echo "--- Differences $SOURCEDIR/$DAOSOL $DAOSOL ---" | tee -a $TEST1OUTPUT
echo "$DIFFS1" | tee -a $TEST1OUTPUT

solc_0.4.20 --version | tee -a $TEST1OUTPUT
solc_0.4.21 --version | tee -a $TEST1OUTPUT

echo "var tokenFactoryOutput=`solc_0.4.20 --optimize --pretty-json --combined-json abi,bin,interface $TOKENFACTORYSOL`;" > $TOKENFACTORYJS
echo "var daoOutput=`solc_0.4.21 --optimize --pretty-json --combined-json abi,bin,interface $DAOSOL`;" > $DAOJS


geth --verbosity 3 attach $GETHATTACHPOINT << EOF | tee -a $TEST1OUTPUT
loadScript("$TOKENFACTORYJS");
loadScript("$DAOJS");
loadScript("functions.js");

var tokenFactoryLibBTTSAbi = JSON.parse(tokenFactoryOutput.contracts["$TOKENFACTORYSOL:BTTSLib"].abi);
var tokenFactoryLibBTTSBin = "0x" + tokenFactoryOutput.contracts["$TOKENFACTORYSOL:BTTSLib"].bin;
var tokenFactoryAbi = JSON.parse(tokenFactoryOutput.contracts["$TOKENFACTORYSOL:BTTSTokenFactory"].abi);
var tokenFactoryBin = "0x" + tokenFactoryOutput.contracts["$TOKENFACTORYSOL:BTTSTokenFactory"].bin;
var tokenAbi = JSON.parse(tokenFactoryOutput.contracts["$TOKENFACTORYSOL:BTTSToken"].abi);
var membersLibAbi = JSON.parse(daoOutput.contracts["$DAOSOL:Members"].abi);
var membersLibBin = "0x" + daoOutput.contracts["$DAOSOL:Members"].bin;
var daoAbi = JSON.parse(daoOutput.contracts["$DAOSOL:DFFDAO"].abi);
var daoBin = "0x" + daoOutput.contracts["$DAOSOL:DFFDAO"].bin;

// console.log("DATA: tokenFactoryLibBTTSAbi=" + JSON.stringify(tokenFactoryLibBTTSAbi));
// console.log("DATA: tokenFactoryLibBTTSBin=" + JSON.stringify(tokenFactoryLibBTTSBin));
// console.log("DATA: tokenFactoryAbi=" + JSON.stringify(tokenFactoryAbi));
// console.log("DATA: tokenFactoryBin=" + JSON.stringify(tokenFactoryBin));
// console.log("DATA: tokenAbi=" + JSON.stringify(tokenAbi));
// console.log("DATA: membersLibAbi=" + JSON.stringify(membersLibAbi));
// console.log("DATA: membersLibBin=" + JSON.stringify(membersLibBin));
// console.log("DATA: daoAbi=" + JSON.stringify(daoAbi));
// console.log("DATA: daoBin=" + JSON.stringify(daoBin));

unlockAccounts("$PASSWORD");
printBalances();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var deployLibBTTSMessage = "Deploy BTTS Library";
// -----------------------------------------------------------------------------
console.log("RESULT: ----- " + deployLibBTTSMessage + " -----");
var tokenFactoryLibBTTSContract = web3.eth.contract(tokenFactoryLibBTTSAbi);
// console.log(JSON.stringify(tokenFactoryLibBTTSContract));
var tokenFactoryLibBTTSTx = null;
var tokenFactoryLibBTTSAddress = null;
var currentBlock = eth.blockNumber;
var tokenFactoryLibBTTS = tokenFactoryLibBTTSContract.new({from: contractOwnerAccount, data: tokenFactoryLibBTTSBin, gas: 6000000, gasPrice: defaultGasPrice},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        tokenFactoryLibBTTSTx = contract.transactionHash;
      } else {
        tokenFactoryLibBTTSAddress = contract.address;
        addAccount(tokenFactoryLibBTTSAddress, "BTTS Library");
        console.log("DATA: tokenFactoryLibBTTSAddress=" + tokenFactoryLibBTTSAddress);
      }
    }
  }
);
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(tokenFactoryLibBTTSTx, deployLibBTTSMessage);
printTxData("tokenFactoryLibBTTSTx", tokenFactoryLibBTTSTx);
// printTokenContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var deployTokenFactoryMessage = "Deploy BTTSTokenFactory";
// -----------------------------------------------------------------------------
console.log("RESULT: ----- " + deployTokenFactoryMessage + " -----");
// console.log("RESULT: tokenFactoryBin='" + tokenFactoryBin + "'");
var newTokenFactoryBin = tokenFactoryBin.replace(/__BTTSTokenFactory\.sol\:BTTSLib__________/g, tokenFactoryLibBTTSAddress.substring(2, 42));
// console.log("RESULT: newTokenFactoryBin='" + newTokenFactoryBin + "'");
var tokenFactoryContract = web3.eth.contract(tokenFactoryAbi);
// console.log(JSON.stringify(tokenFactoryAbi));
// console.log(tokenFactoryBin);
var tokenFactoryTx = null;
var tokenFactoryAddress = null;
var tokenFactory = tokenFactoryContract.new({from: contractOwnerAccount, data: newTokenFactoryBin, gas: 6000000, gasPrice: defaultGasPrice},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        tokenFactoryTx = contract.transactionHash;
      } else {
        tokenFactoryAddress = contract.address;
        addAccount(tokenFactoryAddress, "BTTSTokenFactory");
        addTokenFactoryContractAddressAndAbi(tokenFactoryAddress, tokenFactoryAbi);
        console.log("DATA: tokenFactoryAddress=" + tokenFactoryAddress);
      }
    }
  }
);
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(tokenFactoryTx, deployTokenFactoryMessage);
printTxData("tokenFactoryTx", tokenFactoryTx);
printTokenFactoryContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var tokenMessage = "Deploy Token Contract";
var symbol = "DFF";
var name = "Doofus Dongers";
var decimals = 18;
// var initialSupply = "25000000000000000000000000";
var initialSupply = "0";
var mintable = true;
var transferable = true;
// -----------------------------------------------------------------------------
console.log("RESULT: ----- " + tokenMessage + " -----");
var tokenContract = web3.eth.contract(tokenAbi);
// console.log(JSON.stringify(tokenContract));
var deployTokenTx = tokenFactory.deployBTTSTokenContract(symbol, name, decimals, initialSupply, mintable, transferable, {from: contractOwnerAccount, gas: 4000000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
var bttsTokens = getBTTSFactoryTokenListing();
console.log("RESULT: bttsTokens=#" + bttsTokens.length + " " + JSON.stringify(bttsTokens));
// Can check, but the rest will not work anyway - if (bttsTokens.length == 1)
var tokenAddress = bttsTokens[0];
var token = web3.eth.contract(tokenAbi).at(tokenAddress);
console.log("DATA: tokenAddress=" + tokenAddress);
addAccount(tokenAddress, "Token '" + token.symbol() + "' '" + token.name() + "'");
addTokenContractAddressAndAbi(tokenAddress, tokenAbi);
printBalances();
printTxData("deployTokenTx", deployTokenTx);
printTokenFactoryContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var deployLibDAOMessage = "Deploy DAO Library";
// -----------------------------------------------------------------------------
console.log("RESULT: ----- " + deployLibDAOMessage + " -----");
var membersLibContract = web3.eth.contract(membersLibAbi);
// console.log(JSON.stringify(membersLibContract));
var membersLibTx = null;
var membersLibAddress = null;
var membersLibBTTS = membersLibContract.new({from: contractOwnerAccount, data: membersLibBin, gas: 6000000, gasPrice: defaultGasPrice},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        membersLibTx = contract.transactionHash;
      } else {
        membersLibAddress = contract.address;
        addAccount(membersLibAddress, "DAO Library - Members");
        console.log("DATA: membersLibAddress=" + membersLibAddress);
      }
    }
  }
);
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(membersLibTx, deployLibDAOMessage);
printTxData("membersLibTx", membersLibTx);
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var deployDAOMessage = "Deploy DAO Contract";
// -----------------------------------------------------------------------------
console.log("RESULT: ----- " + deployDAOMessage + " -----");
var newDAOBin = daoBin.replace(/__DecentralisedFutureFundDAO\.sol\:Membe__/g, membersLibAddress.substring(2, 42));
var daoContract = web3.eth.contract(daoAbi);
var daoTx = null;
var daoAddress = null;
var dao = daoContract.new({from: contractOwnerAccount, data: newDAOBin, gas: 6000000, gasPrice: defaultGasPrice},
  function(e, contract) {
    if (!e) {
      if (!contract.address) {
        daoTx = contract.transactionHash;
      } else {
        daoAddress = contract.address;
        addAccount(daoAddress, "DFF DAO");
        addDAOContractAddressAndAbi(daoAddress, daoAbi);
        console.log("DATA: daoAddress=" + daoAddress);
      }
    }
  }
);
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(daoTx, deployDAOMessage);
printTxData("daoAddress=" + daoAddress, daoTx);
printDAOContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var initSetBTTSToken_Message = "Initialisation - Set BTTS Token";
// -----------------------------------------------------------------------------
console.log("RESULT: ----- " + initSetBTTSToken_Message + " -----");
var initSetBTTSToken_1Tx = dao.initSetBTTSToken(tokenAddress, {from: contractOwnerAccount, gas: 100000, gasPrice: defaultGasPrice});
var initSetBTTSToken_2Tx = token.setMinter(daoAddress, {from: contractOwnerAccount, gas: 100000, gasPrice: defaultGasPrice});
var initSetBTTSToken_3Tx = token.transferOwnershipImmediately(daoAddress, {from: contractOwnerAccount, gas: 100000, gasPrice: defaultGasPrice});
var initSetBTTSToken_4Tx = eth.sendTransaction({from: contractOwnerAccount, to: daoAddress, value: web3.toWei("100", "ether"), gas: 100000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(initSetBTTSToken_1Tx, initSetBTTSToken_Message + " - dao.initSetBTTSToken(bttsToken)");
failIfTxStatusError(initSetBTTSToken_2Tx, initSetBTTSToken_Message + " - token.setMinter(dao)");
failIfTxStatusError(initSetBTTSToken_3Tx, initSetBTTSToken_Message + " - token.transferOwnershipImmediately(dao)");
failIfTxStatusError(initSetBTTSToken_4Tx, initSetBTTSToken_Message + " - send 100 ETH to dao");
printTxData("initSetBTTSToken_1Tx", initSetBTTSToken_1Tx);
printTxData("initSetBTTSToken_2Tx", initSetBTTSToken_2Tx);
printTxData("initSetBTTSToken_3Tx", initSetBTTSToken_3Tx);
printTxData("initSetBTTSToken_4Tx", initSetBTTSToken_4Tx);
printDAOContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var initAddMembers_Message = "Initialisation - Add Members";
var name1 = "0x" + web3.padLeft(web3.toHex("two").substring(2), 64);
var name2 = "0x" + web3.padLeft(web3.toHex("three").substring(2), 64);
var name3 = "0x" + web3.padLeft(web3.toHex("four").substring(2), 64);
// -----------------------------------------------------------------------------
console.log("RESULT: ----- " + initAddMembers_Message + " -----");
var initAddMembers_1Tx = dao.initAddMember(account2, name1, true, {from: contractOwnerAccount, gas: 300000, gasPrice: defaultGasPrice});
var initAddMembers_2Tx = dao.initAddMember(account3, name2, true, {from: contractOwnerAccount, gas: 300000, gasPrice: defaultGasPrice});
var initAddMembers_3Tx = dao.initAddMember(account4, name3, false, {from: contractOwnerAccount, gas: 300000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(initAddMembers_1Tx, initAddMembers_Message + " - dao.initAddMember(account2, 'two', true)");
failIfTxStatusError(initAddMembers_2Tx, initAddMembers_Message + " - dao.initAddMember(account3, 'three', true)");
failIfTxStatusError(initAddMembers_3Tx, initAddMembers_Message + " - dao.initAddMember(account4, 'four', false)");
printTxData("initAddMembers_1Tx", initAddMembers_1Tx);
printTxData("initAddMembers_2Tx", initAddMembers_2Tx);
printTxData("initAddMembers_3Tx", initAddMembers_3Tx);
printDAOContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


if (false) {
// -----------------------------------------------------------------------------
var initRemoveMembers_Message = "Initialisation - Remove Members";
// -----------------------------------------------------------------------------
console.log("RESULT: ----- " + initRemoveMembers_Message + " -----");
var initRemoveMembers_1Tx = dao.initRemoveMember(account2, {from: contractOwnerAccount, gas: 200000, gasPrice: defaultGasPrice});
var initRemoveMembers_2Tx = dao.initRemoveMember(account3, {from: contractOwnerAccount, gas: 200000, gasPrice: defaultGasPrice});
var initRemoveMembers_3Tx = dao.initRemoveMember(account4, {from: contractOwnerAccount, gas: 200000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(initRemoveMembers_1Tx, initRemoveMembers_Message + " - dao.initRemoveMember(account2)");
failIfTxStatusError(initRemoveMembers_2Tx, initRemoveMembers_Message + " - dao.initRemoveMember(account3)");
failIfTxStatusError(initRemoveMembers_3Tx, initRemoveMembers_Message + " - dao.initRemoveMember(account4)");
printTxData("initRemoveMembers_1Tx", initRemoveMembers_1Tx);
printTxData("initRemoveMembers_2Tx", initRemoveMembers_2Tx);
printTxData("initRemoveMembers_3Tx", initRemoveMembers_3Tx);
printDAOContractDetails();
printTokenContractDetails();
console.log("RESULT: ");
}


// -----------------------------------------------------------------------------
var initialisationComplete_Message = "Initialisation - Complete";
// -----------------------------------------------------------------------------
console.log("RESULT: ----- " + initialisationComplete_Message + " -----");
var initialisationComplete_1Tx = dao.initialisationComplete({from: contractOwnerAccount, gas: 100000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(initialisationComplete_1Tx, initialisationComplete_Message + " - dao.initialisationComplete()");
printTxData("initialisationComplete_1Tx", initialisationComplete_1Tx);
printDAOContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var etherPaymentProposal_Message = "Ether Payment Proposal";
// -----------------------------------------------------------------------------
console.log("RESULT: ----- " + etherPaymentProposal_Message + " -----");
var etherPaymentProposal_1Tx = dao.proposeEtherPayment("payment to ac2", account2, new BigNumber("12").shift(18), {from: account2, gas: 300000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(etherPaymentProposal_1Tx, etherPaymentProposal_Message + " - dao.proposeEtherPayment(ac2, 12 ETH)");
printTxData("etherPaymentProposal_1Tx", etherPaymentProposal_1Tx);
printDAOContractDetails();
printTokenContractDetails();
console.log("RESULT: ");


// -----------------------------------------------------------------------------
var vote1_Message = "Vote - Ether Payment Proposal";
// -----------------------------------------------------------------------------
console.log("RESULT: ----- " + vote1_Message + " -----");
var vote1_1Tx = dao.voteYes(0, {from: account3, gas: 300000, gasPrice: defaultGasPrice});
while (txpool.status.pending > 0) {
}
printBalances();
failIfTxStatusError(vote1_1Tx, vote1_Message + " - ac3 dao.voteYes(proposal 0)");
printTxData("vote1_1Tx", vote1_1Tx);
printDAOContractDetails();
printTokenContractDetails();
console.log("RESULT: ");



EOF
grep "DATA: " $TEST1OUTPUT | sed "s/DATA: //" > $DEPLOYMENTDATA
cat $DEPLOYMENTDATA
grep "RESULT: " $TEST1OUTPUT | sed "s/RESULT: //" > $TEST1RESULTS
cat $TEST1RESULTS