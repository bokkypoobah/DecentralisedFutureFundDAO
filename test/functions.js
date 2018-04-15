// ETH/USD 19 Feb 2018 21:38 AEDT from CMC and ethgasstation.info
var ethPriceUSD = 401.43;
var defaultGasPrice = web3.toWei(1, "gwei");

// -----------------------------------------------------------------------------
// Accounts
// -----------------------------------------------------------------------------
var accounts = [];
var accountNames = {};

addAccount(eth.accounts[0], "Account #0 - Miner");
addAccount(eth.accounts[1], "Account #1 - Contract Owner");
addAccount(eth.accounts[2], "Account #2 - Wallet");
addAccount(eth.accounts[3], "Account #3 - Team Wallet");
addAccount(eth.accounts[4], "Account #4 - Airdrop Wallet");
addAccount(eth.accounts[5], "Account #5");
addAccount(eth.accounts[6], "Account #6");
addAccount(eth.accounts[7], "Account #7");
addAccount(eth.accounts[8], "Account #8");
addAccount(eth.accounts[9], "Account #9");
addAccount(eth.accounts[10], "Account #10");
addAccount(eth.accounts[11], "Account #11");

var minerAccount = eth.accounts[0];
var contractOwnerAccount = eth.accounts[1];
var wallet = eth.accounts[2];
var teamWallet = eth.accounts[3];
var airdropWallet = eth.accounts[4];
var account5 = eth.accounts[5];
var account6 = eth.accounts[6];
var account7 = eth.accounts[7];
var account8 = eth.accounts[8];
var account9 = eth.accounts[9];
var account10 = eth.accounts[10];
var account11 = eth.accounts[11];

var baseBlock = eth.blockNumber;

function unlockAccounts(password) {
  for (var i = 0; i < eth.accounts.length && i < accounts.length; i++) {
    personal.unlockAccount(eth.accounts[i], password, 100000);
    if (i > 0 && eth.getBalance(eth.accounts[i]) == 0) {
      personal.sendTransaction({from: eth.accounts[0], to: eth.accounts[i], value: web3.toWei(1000000, "ether")});
    }
  }
  while (txpool.status.pending > 0) {
  }
  baseBlock = eth.blockNumber;
}

function addAccount(account, accountName) {
  accounts.push(account);
  accountNames[account] = accountName;
}


// -----------------------------------------------------------------------------
// Token Contract
// -----------------------------------------------------------------------------
var tokenContractAddress = null;
var tokenContractAbi = null;

function addTokenContractAddressAndAbi(address, tokenAbi) {
  tokenContractAddress = address;
  tokenContractAbi = tokenAbi;
}


// -----------------------------------------------------------------------------
// Account ETH and token balances
// -----------------------------------------------------------------------------
function printBalances() {
  var token = tokenContractAddress == null || tokenContractAbi == null ? null : web3.eth.contract(tokenContractAbi).at(tokenContractAddress);
  var decimals = token == null ? 18 : token.decimals();
  var i = 0;
  var totalTokenBalance = new BigNumber(0);
  console.log("RESULT:  # Account                                             EtherBalanceChange                          Token Name");
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  accounts.forEach(function(e) {
    var etherBalanceBaseBlock = eth.getBalance(e, baseBlock);
    var etherBalance = web3.fromWei(eth.getBalance(e).minus(etherBalanceBaseBlock), "ether");
    var tokenBalance = token == null ? new BigNumber(0) : token.balanceOf(e).shift(-decimals);
    totalTokenBalance = totalTokenBalance.add(tokenBalance);
    console.log("RESULT: " + pad2(i) + " " + e  + " " + pad(etherBalance) + " " + padToken(tokenBalance, decimals) + " " + accountNames[e]);
    i++;
  });
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  console.log("RESULT:                                                                           " + padToken(totalTokenBalance, decimals) + " Total Token Balances");
  console.log("RESULT: -- ------------------------------------------ --------------------------- ------------------------------ ---------------------------");
  console.log("RESULT: ");
}

function pad2(s) {
  var o = s.toFixed(0);
  while (o.length < 2) {
    o = " " + o;
  }
  return o;
}

function pad(s) {
  var o = s.toFixed(18);
  while (o.length < 27) {
    o = " " + o;
  }
  return o;
}

function padToken(s, decimals) {
  var o = s.toFixed(decimals);
  var l = parseInt(decimals)+12;
  while (o.length < l) {
    o = " " + o;
  }
  return o;
}


// -----------------------------------------------------------------------------
// Transaction status
// -----------------------------------------------------------------------------
function printTxData(name, txId) {
  var tx = eth.getTransaction(txId);
  var txReceipt = eth.getTransactionReceipt(txId);
  var gasPrice = tx.gasPrice;
  var gasCostETH = tx.gasPrice.mul(txReceipt.gasUsed).div(1e18);
  var gasCostUSD = gasCostETH.mul(ethPriceUSD);
  var block = eth.getBlock(txReceipt.blockNumber);
  console.log("RESULT: " + name + " status=" + txReceipt.status + (txReceipt.status == 0 ? " Failure" : " Success") + " gas=" + tx.gas +
    " gasUsed=" + txReceipt.gasUsed + " costETH=" + gasCostETH + " costUSD=" + gasCostUSD +
    " @ ETH/USD=" + ethPriceUSD + " gasPrice=" + web3.fromWei(gasPrice, "gwei") + " gwei block=" + 
    txReceipt.blockNumber + " txIx=" + tx.transactionIndex + " txId=" + txId +
    " @ " + block.timestamp + " " + new Date(block.timestamp * 1000).toUTCString());
}

function assertEtherBalance(account, expectedBalance) {
  var etherBalance = web3.fromWei(eth.getBalance(account), "ether");
  if (etherBalance == expectedBalance) {
    console.log("RESULT: OK " + account + " has expected balance " + expectedBalance);
  } else {
    console.log("RESULT: FAILURE " + account + " has balance " + etherBalance + " <> expected " + expectedBalance);
  }
}

function failIfTxStatusError(tx, msg) {
  var status = eth.getTransactionReceipt(tx).status;
  if (status == 0) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    console.log("RESULT: PASS " + msg);
    return 1;
  }
}

function passIfTxStatusError(tx, msg) {
  var status = eth.getTransactionReceipt(tx).status;
  if (status == 1) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    console.log("RESULT: PASS " + msg);
    return 1;
  }
}

function gasEqualsGasUsed(tx) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  return (gas == gasUsed);
}

function failIfGasEqualsGasUsed(tx, msg) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  if (gas == gasUsed) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    console.log("RESULT: PASS " + msg);
    return 1;
  }
}

function passIfGasEqualsGasUsed(tx, msg) {
  var gas = eth.getTransaction(tx).gas;
  var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
  if (gas == gasUsed) {
    console.log("RESULT: PASS " + msg);
    return 1;
  } else {
    console.log("RESULT: FAIL " + msg);
    return 0;
  }
}

function failIfGasEqualsGasUsedOrContractAddressNull(contractAddress, tx, msg) {
  if (contractAddress == null) {
    console.log("RESULT: FAIL " + msg);
    return 0;
  } else {
    var gas = eth.getTransaction(tx).gas;
    var gasUsed = eth.getTransactionReceipt(tx).gasUsed;
    if (gas == gasUsed) {
      console.log("RESULT: FAIL " + msg);
      return 0;
    } else {
      console.log("RESULT: PASS " + msg);
      return 1;
    }
  }
}


//-----------------------------------------------------------------------------
// Wait one block
//-----------------------------------------------------------------------------
function waitOneBlock(oldCurrentBlock) {
  while (eth.blockNumber <= oldCurrentBlock) {
  }
  console.log("RESULT: Waited one block");
  console.log("RESULT: ");
  return eth.blockNumber;
}


//-----------------------------------------------------------------------------
// Pause for {x} seconds
//-----------------------------------------------------------------------------
function pause(message, addSeconds) {
  var time = new Date((parseInt(new Date().getTime()/1000) + addSeconds) * 1000);
  console.log("RESULT: Pausing '" + message + "' for " + addSeconds + "s=" + time + " now=" + new Date());
  while ((new Date()).getTime() <= time.getTime()) {
  }
  console.log("RESULT: Paused '" + message + "' for " + addSeconds + "s=" + time + " now=" + new Date());
  console.log("RESULT: ");
}


//-----------------------------------------------------------------------------
//Wait until some unixTime + additional seconds
//-----------------------------------------------------------------------------
function waitUntil(message, unixTime, addSeconds) {
  var t = parseInt(unixTime) + parseInt(addSeconds) + parseInt(1);
  var time = new Date(t * 1000);
  console.log("RESULT: Waiting until '" + message + "' at " + unixTime + "+" + addSeconds + "s=" + time + " now=" + new Date());
  while ((new Date()).getTime() <= time.getTime()) {
  }
  console.log("RESULT: Waited until '" + message + "' at at " + unixTime + "+" + addSeconds + "s=" + time + " now=" + new Date());
  console.log("RESULT: ");
}


//-----------------------------------------------------------------------------
//Wait until some block
//-----------------------------------------------------------------------------
function waitUntilBlock(message, block, addBlocks) {
  var b = parseInt(block) + parseInt(addBlocks);
  console.log("RESULT: Waiting until '" + message + "' #" + block + "+" + addBlocks + "=#" + b + " currentBlock=" + eth.blockNumber);
  while (eth.blockNumber <= b) {
  }
  console.log("RESULT: Waited until '" + message + "' #" + block + "+" + addBlocks + "=#" + b + " currentBlock=" + eth.blockNumber);
  console.log("RESULT: ");
}


//-----------------------------------------------------------------------------
// Token Contract
//-----------------------------------------------------------------------------
var tokenFromBlock = 0;
function printTokenContractDetails() {
  console.log("RESULT: tokenContractAddress=" + tokenContractAddress);
  if (tokenContractAddress != null && tokenContractAbi != null) {
    var contract = eth.contract(tokenContractAbi).at(tokenContractAddress);
    var decimals = contract.decimals();
    console.log("RESULT: token.owner=" + contract.owner());
    console.log("RESULT: token.newOwner=" + contract.newOwner());
    console.log("RESULT: token.symbol=" + contract.symbol());
    console.log("RESULT: token.name=" + contract.name());
    console.log("RESULT: token.decimals=" + decimals);
    console.log("RESULT: token.totalSupply=" + contract.totalSupply().shift(-decimals));
    console.log("RESULT: token.transferable=" + contract.transferable());
    console.log("RESULT: token.mintable=" + contract.mintable());
    console.log("RESULT: token.minter=" + contract.minter());

    var latestBlock = eth.blockNumber;
    var i;

    var ownershipTransferredEvents = contract.OwnershipTransferred({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferredEvents.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferred " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    ownershipTransferredEvents.stopWatching();

    var minterUpdatedEvents = contract.MinterUpdated({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    minterUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: MinterUpdated " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    minterUpdatedEvents.stopWatching();

    var mintEvents = contract.Mint({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    mintEvents.watch(function (error, result) {
      console.log("RESULT: Mint " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    mintEvents.stopWatching();

    var mintingDisabledEvents = contract.MintingDisabled({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    mintingDisabledEvents.watch(function (error, result) {
      console.log("RESULT: MintingDisabled " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    mintingDisabledEvents.stopWatching();

    var accountUnlockedEvents = contract.AccountUnlocked({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    accountUnlockedEvents.watch(function (error, result) {
      console.log("RESULT: AccountUnlocked " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    accountUnlockedEvents.stopWatching();

    var approvalEvents = contract.Approval({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    approvalEvents.watch(function (error, result) {
      console.log("RESULT: Approval " + i++ + " #" + result.blockNumber + " owner=" + result.args.owner +
        " spender=" + result.args.spender + " tokens=" + result.args.tokens.shift(-decimals));
    });
    approvalEvents.stopWatching();

    var transferEvents = contract.Transfer({}, { fromBlock: tokenFromBlock, toBlock: latestBlock });
    i = 0;
    transferEvents.watch(function (error, result) {
      console.log("RESULT: Transfer " + i++ + " #" + result.blockNumber + ": from=" + result.args.from + " to=" + result.args.to +
        " tokens=" + result.args.tokens.shift(-decimals));
    });
    transferEvents.stopWatching();

    tokenFromBlock = latestBlock + 1;
  }
}


// -----------------------------------------------------------------------------
// Crowdsale Contract
// -----------------------------------------------------------------------------
var crowdsaleContractAddress = null;
var crowdsaleContractAbi = null;

function addCrowdsaleContractAddressAndAbi(address, crowdsaleAbi) {
  crowdsaleContractAddress = address;
  crowdsaleContractAbi = crowdsaleAbi;
}

function displaySplit(data) {
  var eth1 = data[0];
  var eth2 = data[1];
  var eth3 = data[2];
  var refund = data[3];
  var total = eth1.add(eth2).add(eth3).add(refund);
  return "[eth1=" + eth1.shift(-18) + "; eth2=" + eth2.shift(-18) + "; eth3=" + eth3.shift(-18) + "; refund=" + refund.shift(-18)  + "; total=" + total.shift(-18) + "]";
}

var crowdsaleFromBlock = 0;
function printCrowdsaleContractDetails() {
  console.log("RESULT: crowdsaleContractAddress=" + crowdsaleContractAddress);
  if (crowdsaleContractAddress != null && crowdsaleContractAbi != null) {
    var contract = eth.contract(crowdsaleContractAbi).at(crowdsaleContractAddress);
    console.log("RESULT: crowdsale.owner=" + contract.owner());
    console.log("RESULT: crowdsale.newOwner=" + contract.newOwner());
    console.log("RESULT: crowdsale.bttsToken=" + contract.bttsToken());
    console.log("RESULT: crowdsale.TOKEN_DECIMALS=" + contract.TOKEN_DECIMALS());
    console.log("RESULT: crowdsale.DECIMALS_FACTOR=" + contract.DECIMALS_FACTOR() + " " + contract.DECIMALS_FACTOR().shift(-18));
    console.log("RESULT: crowdsale.wallet=" + contract.wallet());
    console.log("RESULT: crowdsale.teamWallet=" + contract.teamWallet());
    console.log("RESULT: crowdsale.TOTALSUPPLY_SPOT=" + contract.TOTALSUPPLY_SPOT() + " " + contract.TOTALSUPPLY_SPOT().shift(-18));
    console.log("RESULT: crowdsale.PUBLIC_SALE_PERCENT_SPOT=" + contract.PUBLIC_SALE_PERCENT_SPOT());
    console.log("RESULT: crowdsale.airdropInitialSupply=" + contract.airdropInitialSupply() + " " + contract.airdropInitialSupply().shift(-18));
    console.log("RESULT: crowdsale.BONUS1_AMOUNT_USD=" + contract.BONUS1_AMOUNT_USD());
    console.log("RESULT: crowdsale.BONUS2_AMOUNT_USD=" + contract.BONUS2_AMOUNT_USD());
    console.log("RESULT: crowdsale.BONUS3_AMOUNT_USD=" + contract.BONUS3_AMOUNT_USD());
    console.log("RESULT: crowdsale.BONUS1_PERCENT_SPOT=" + contract.BONUS1_PERCENT_SPOT());
    console.log("RESULT: crowdsale.BONUS2_PERCENT_SPOT=" + contract.BONUS2_PERCENT_SPOT());
    console.log("RESULT: crowdsale.BONUS3_PERCENT_SPOT=" + contract.BONUS3_PERCENT_SPOT());
    console.log("RESULT: crowdsale.CAP_USD=" + contract.CAP_USD());
    console.log("RESULT: crowdsale.capEth=" + contract.capEth() + " " + contract.capEth().shift(-18) + " ETH");
    var e10 = new BigNumber(10).shift(18);
    var e1000 = new BigNumber(1000).shift(18);
    var e25000 = new BigNumber(25000).shift(18);
    var e50000 = new BigNumber(50000).shift(18);
    var e65000 = new BigNumber(65000).shift(18);
    console.log("RESULT: crowdsale.splitEthAmount(10 ETH, 1000 ETH)=" + displaySplit(contract.splitEthAmount(e10, e1000)));
    console.log("RESULT: crowdsale.splitEthAmount(10 ETH, 25000 ETH)=" + displaySplit(contract.splitEthAmount(e10, e25000)));
    console.log("RESULT: crowdsale.splitEthAmount(10 ETH, 50000 ETH)=" + displaySplit(contract.splitEthAmount(e10, e50000)));
    console.log("RESULT: crowdsale.splitEthAmount(10 ETH, 65000 ETH)=" + displaySplit(contract.splitEthAmount(e10, e65000)));
    console.log("RESULT: crowdsale.splitEthAmount(25000 ETH, 1000 ETH)=" + displaySplit(contract.splitEthAmount(e25000, e1000)));
    console.log("RESULT: crowdsale.splitEthAmount(25000 ETH, 25000 ETH)=" + displaySplit(contract.splitEthAmount(e25000, e25000)));
    console.log("RESULT: crowdsale.splitEthAmount(25000 ETH, 50000 ETH)=" + displaySplit(contract.splitEthAmount(e25000, e50000)));
    console.log("RESULT: crowdsale.splitEthAmount(50000 ETH, 1000 ETH)=" + displaySplit(contract.splitEthAmount(e50000, e1000)));
    console.log("RESULT: crowdsale.splitEthAmount(50000 ETH, 25000 ETH)=" + displaySplit(contract.splitEthAmount(e50000, e25000)));
    console.log("RESULT: crowdsale.START_DATE=" + contract.START_DATE() + " " + new Date(contract.START_DATE() * 1000).toUTCString() + " " + new Date(contract.START_DATE() * 1000).toString());
    console.log("RESULT: crowdsale.endDate=" + contract.endDate() + " " + new Date(contract.endDate() * 1000).toUTCString() + " " + new Date(contract.endDate() * 1000).toString());
    console.log("RESULT: crowdsale.usdPerKEther=" + contract.usdPerKEther() + " = " + contract.usdPerKEther().shift(-3) + " USD per ETH");
    console.log("RESULT: crowdsale.ethFromUsd(10,000,000)=" + contract.ethFromUsd(10000000) + " " + contract.ethFromUsd(10000000).shift(-18) + " ETH");
    console.log("RESULT: crowdsale.ethFromUsd(20,000,000)=" + contract.ethFromUsd(20000000) + " " + contract.ethFromUsd(20000000).shift(-18) + " ETH");
    console.log("RESULT: crowdsale.ethFromUsd(25,000,000)=" + contract.ethFromUsd(25000000) + " " + contract.ethFromUsd(25000000).shift(-18) + " ETH");
    console.log("RESULT: crowdsale.usdPerSpot=" + contract.usdPerSpot() + " " + contract.usdPerSpot().shift(-18) + " USD");
    console.log("RESULT: crowdsale.MIN_CONTRIBUTION_ETH=" + contract.MIN_CONTRIBUTION_ETH() + " " + contract.MIN_CONTRIBUTION_ETH().shift(-18) + " ETH");
    console.log("RESULT: crowdsale.contributedEth=" + contract.contributedEth() + " " + contract.contributedEth().shift(-18) + " ETH");
    console.log("RESULT: crowdsale.contributedUsd=" + contract.contributedUsd());
    console.log("RESULT: crowdsale.generatedSpot=" + contract.generatedSpot() + " " + contract.generatedSpot().shift(-18) + " SPOT");
    console.log("RESULT: crowdsale.finalised=" + contract.finalised());
    var oneEther = web3.toWei(1, "ether");
    console.log("RESULT: crowdsale.spotFromEth(1 ether, 0%)=" + contract.spotFromEth(oneEther, 0) + " " + contract.spotFromEth(oneEther, 0).shift(-18) + " SPOT");
    console.log("RESULT: crowdsale.spotFromEth(1 ether, 10%)=" + contract.spotFromEth(oneEther, 10) + " " + contract.spotFromEth(oneEther, 10).shift(-18) + " SPOT");
    console.log("RESULT: crowdsale.spotFromEth(1 ether, 20%)=" + contract.spotFromEth(oneEther, 20) + " " + contract.spotFromEth(oneEther, 20).shift(-18) + " SPOT");
    console.log("RESULT: crowdsale.spotFromEth(1 ether, 50%)=" + contract.spotFromEth(oneEther, 50) + " " + contract.spotFromEth(oneEther, 50).shift(-18) + " SPOT");
    console.log("RESULT: crowdsale.spotPerEth()=" + contract.spotPerEth() + " " + contract.spotPerEth().shift(-18) + " SPOT");

    var latestBlock = eth.blockNumber;
    var i;

    var ownershipTransferredEvents = contract.OwnershipTransferred({}, { fromBlock: crowdsaleFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferredEvents.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferred " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    ownershipTransferredEvents.stopWatching();

    var bttsTokenUpdatedEvents = contract.BTTSTokenUpdated({}, { fromBlock: crowdsaleFromBlock, toBlock: latestBlock });
    i = 0;
    bttsTokenUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: BTTSTokenUpdated " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    bttsTokenUpdatedEvents.stopWatching();

    var walletUpdatedEvents = contract.WalletUpdated({}, { fromBlock: crowdsaleFromBlock, toBlock: latestBlock });
    i = 0;
    walletUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: WalletUpdated " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    walletUpdatedEvents.stopWatching();

    var teamWalletUpdatedEvents = contract.TeamWalletUpdated({}, { fromBlock: crowdsaleFromBlock, toBlock: latestBlock });
    i = 0;
    teamWalletUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: TeamWalletUpdated " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    teamWalletUpdatedEvents.stopWatching();

    /*
    var endDateUpdatedEvents = contract.EndDateUpdated({}, { fromBlock: crowdsaleFromBlock, toBlock: latestBlock });
    i = 0;
    endDateUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: EndDateUpdated " + i++ + " #" + result.blockNumber +
        " oldEndDate=" + result.args.oldEndDate + " " + new Date(result.args.oldEndDate * 1000).toUTCString() +
        " newEndDate=" + result.args.newEndDate + " " + new Date(result.args.newEndDate * 1000).toUTCString());
    });
    endDateUpdatedEvents.stopWatching();
    */

    var usdPerKEtherUpdatedEvents = contract.UsdPerKEtherUpdated({}, { fromBlock: crowdsaleFromBlock, toBlock: latestBlock });
    i = 0;
    usdPerKEtherUpdatedEvents.watch(function (error, result) {
      console.log("RESULT: UsdPerKEtherUpdated " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    usdPerKEtherUpdatedEvents.stopWatching();

    var contributedEvents = contract.Contributed({}, { fromBlock: crowdsaleFromBlock, toBlock: latestBlock });
    i = 0;
    contributedEvents.watch(function (error, result) {
      console.log("RESULT: Contributed " + i++ + " #" + result.blockNumber + " addr=" + result.args.addr + 
        " ethAmount1=" + result.args.ethAmount1.shift(-18) + " ETH" +
        " ethAmount2=" + result.args.ethAmount2.shift(-18) + " ETH" +
        " ethAmount3=" + result.args.ethAmount3.shift(-18) + " ETH" +
        " ethRefund=" + result.args.ethRefund.shift(-18) + " ETH" +
        " accountEthAmount=" + result.args.accountEthAmount.shift(-18) + " ETH" +
        " usdAmount=" + result.args.usdAmount + " USD" +
        " spotAmount=" + result.args.spotAmount.shift(-18) + " SPOT" +
        " contributedEth=" + result.args.contributedEth.shift(-18) + " ETH" +
        " contributedUsd=" + result.args.contributedUsd + " USD" +
        " generatedSpot=" + result.args.generatedSpot.shift(-18) + " SPOT");
    });
    contributedEvents.stopWatching();

    crowdsaleFromBlock = latestBlock + 1;
  }
}


// -----------------------------------------------------------------------------
// TokenFactory Contract
// -----------------------------------------------------------------------------
var tokenFactoryContractAddress = null;
var tokenFactoryContractAbi = null;

function addTokenFactoryContractAddressAndAbi(address, tokenFactoryAbi) {
  tokenFactoryContractAddress = address;
  tokenFactoryContractAbi = tokenFactoryAbi;
}

var tokenFactoryFromBlock = 0;

function getBTTSFactoryTokenListing() {
  var addresses = [];
  console.log("RESULT: tokenFactoryContractAddress=" + tokenFactoryContractAddress);
  if (tokenFactoryContractAddress != null && tokenFactoryContractAbi != null) {
    var contract = eth.contract(tokenFactoryContractAbi).at(tokenFactoryContractAddress);

    var latestBlock = eth.blockNumber;
    var i;

    var bttsTokenListingEvents = contract.BTTSTokenListing({}, { fromBlock: tokenFactoryFromBlock, toBlock: latestBlock });
    i = 0;
    bttsTokenListingEvents.watch(function (error, result) {
      console.log("RESULT: get BTTSTokenListing " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
      addresses.push(result.args.bttsTokenAddress);
    });
    bttsTokenListingEvents.stopWatching();
  }
  return addresses;
}

function printTokenFactoryContractDetails() {
  console.log("RESULT: tokenFactoryContractAddress=" + tokenFactoryContractAddress);
  if (tokenFactoryContractAddress != null && tokenFactoryContractAbi != null) {
    var contract = eth.contract(tokenFactoryContractAbi).at(tokenFactoryContractAddress);
    console.log("RESULT: tokenFactory.owner=" + contract.owner());
    console.log("RESULT: tokenFactory.newOwner=" + contract.newOwner());

    var latestBlock = eth.blockNumber;
    var i;

    var ownershipTransferredEvents = contract.OwnershipTransferred({}, { fromBlock: tokenFactoryFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferredEvents.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferred " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    ownershipTransferredEvents.stopWatching();

    var bttsTokenListingEvents = contract.BTTSTokenListing({}, { fromBlock: tokenFactoryFromBlock, toBlock: latestBlock });
    i = 0;
    bttsTokenListingEvents.watch(function (error, result) {
      console.log("RESULT: BTTSTokenListing " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    bttsTokenListingEvents.stopWatching();

    tokenFactoryFromBlock = latestBlock + 1;
  }
}


// -----------------------------------------------------------------------------
// BonusList Contract
// -----------------------------------------------------------------------------
var bonusListContractAddress = null;
var bonusListContractAbi = null;

function addBonusListContractAddressAndAbi(address, bonusListAbi) {
  bonusListContractAddress = address;
  bonusListContractAbi = bonusListAbi;
}

var bonusListFromBlock = 0;
function printBonusListContractDetails() {
  console.log("RESULT: bonusListContractAddress=" + bonusListContractAddress);
  if (bonusListContractAddress != null && bonusListContractAbi != null) {
    var contract = eth.contract(bonusListContractAbi).at(bonusListContractAddress);
    console.log("RESULT: bonusList.owner=" + contract.owner());
    console.log("RESULT: bonusList.newOwner=" + contract.newOwner());
    console.log("RESULT: bonusList.sealed=" + contract.sealed());

    var latestBlock = eth.blockNumber;
    var i;

    var ownershipTransferredEvents = contract.OwnershipTransferred({}, { fromBlock: bonusListFromBlock, toBlock: latestBlock });
    i = 0;
    ownershipTransferredEvents.watch(function (error, result) {
      console.log("RESULT: OwnershipTransferred " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    ownershipTransferredEvents.stopWatching();

    var adminAddedEvents = contract.AdminAdded({}, { fromBlock: bonusListFromBlock, toBlock: latestBlock });
    i = 0;
    adminAddedEvents.watch(function (error, result) {
      console.log("RESULT: AdminAdded " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    adminAddedEvents.stopWatching();

    var adminRemovedEvents = contract.AdminRemoved({}, { fromBlock: bonusListFromBlock, toBlock: latestBlock });
    i = 0;
    adminRemovedEvents.watch(function (error, result) {
      console.log("RESULT: AdminRemoved " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    adminRemovedEvents.stopWatching();

    var addressListedEvents = contract.AddressListed({}, { fromBlock: bonusListFromBlock, toBlock: latestBlock });
    i = 0;
    addressListedEvents.watch(function (error, result) {
      console.log("RESULT: AddressListed " + i++ + " #" + result.blockNumber + " " + JSON.stringify(result.args));
    });
    addressListedEvents.stopWatching();

    bonusListFromBlock = latestBlock + 1;
  }
}


// -----------------------------------------------------------------------------
// Generate Summary JSON
// -----------------------------------------------------------------------------
function generateSummaryJSON() {
  console.log("JSONSUMMARY: {");
  if (crowdsaleContractAddress != null && crowdsaleContractAbi != null) {
    var contract = eth.contract(crowdsaleContractAbi).at(crowdsaleContractAddress);
    var blockNumber = eth.blockNumber;
    var timestamp = eth.getBlock(blockNumber).timestamp;
    console.log("JSONSUMMARY:   \"blockNumber\": " + blockNumber + ",");
    console.log("JSONSUMMARY:   \"blockTimestamp\": " + timestamp + ",");
    console.log("JSONSUMMARY:   \"blockTimestampString\": \"" + new Date(timestamp * 1000).toUTCString() + "\",");
    console.log("JSONSUMMARY:   \"crowdsaleContractAddress\": \"" + crowdsaleContractAddress + "\",");
    console.log("JSONSUMMARY:   \"crowdsaleContractOwnerAddress\": \"" + contract.owner() + "\",");
    console.log("JSONSUMMARY:   \"tokenContractAddress\": \"" + contract.bttsToken() + "\",");
    console.log("JSONSUMMARY:   \"tokenContractDecimals\": " + contract.TOKEN_DECIMALS() + ",");
    console.log("JSONSUMMARY:   \"crowdsaleWalletAddress\": \"" + contract.wallet() + "\",");
    console.log("JSONSUMMARY:   \"crowdsaleTeamWalletAddress\": \"" + contract.teamWallet() + "\",");
    console.log("JSONSUMMARY:   \"crowdsaleTeamPercent\": " + contract.TEAM_PERCENT_GZE() + ",");
    console.log("JSONSUMMARY:   \"bonusListContractAddress\": \"" + contract.bonusList() + "\",");
    console.log("JSONSUMMARY:   \"tier1Bonus\": " + contract.TIER1_BONUS() + ",");
    console.log("JSONSUMMARY:   \"tier2Bonus\": " + contract.TIER2_BONUS() + ",");
    console.log("JSONSUMMARY:   \"tier3Bonus\": " + contract.TIER3_BONUS() + ",");
    var startDate = contract.START_DATE();
    // BK TODO - Remove for production
    startDate = 1512921600;
    var endDate = contract.endDate();
    // BK TODO - Remove for production
    endDate = 1513872000;
    console.log("JSONSUMMARY:   \"crowdsaleStart\": " + startDate + ",");
    console.log("JSONSUMMARY:   \"crowdsaleStartString\": \"" + new Date(startDate * 1000).toUTCString() + "\",");
    console.log("JSONSUMMARY:   \"crowdsaleEnd\": " + endDate + ",");
    console.log("JSONSUMMARY:   \"crowdsaleEndString\": \"" + new Date(endDate * 1000).toUTCString() + "\",");
    console.log("JSONSUMMARY:   \"usdPerEther\": " + contract.usdPerKEther().shift(-3) + ",");
    console.log("JSONSUMMARY:   \"usdPerGze\": " + contract.USD_CENT_PER_GZE().shift(-2) + ",");
    console.log("JSONSUMMARY:   \"gzePerEth\": " + contract.gzePerEth().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"capInUsd\": " + contract.CAP_USD() + ",");
    console.log("JSONSUMMARY:   \"capInEth\": " + contract.capEth().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"minimumContributionEth\": " + contract.MIN_CONTRIBUTION_ETH().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"contributedEth\": " + contract.contributedEth().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"contributedUsd\": " + contract.contributedUsd() + ",");
    console.log("JSONSUMMARY:   \"generatedGze\": " + contract.generatedGze().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"lockedAccountThresholdUsd\": " + contract.lockedAccountThresholdUsd() + ",");
    console.log("JSONSUMMARY:   \"lockedAccountThresholdEth\": " + contract.lockedAccountThresholdEth().shift(-18) + ",");
    console.log("JSONSUMMARY:   \"precommitmentAdjusted\": " + contract.precommitmentAdjusted() + ",");
    console.log("JSONSUMMARY:   \"finalised\": " + contract.finalised());
  }
  console.log("JSONSUMMARY: }");
}