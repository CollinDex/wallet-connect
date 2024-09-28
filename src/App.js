import React, { useState, useEffect } from 'react';
import Web3 from 'web3';
import classes from './App.module.css';
import TestToken from '../src/abis/TestToken.json';
import TokenStaking from '../src/abis/TokenStaking.json';
import Staking from './components/Staking';
import AdminTesting from './components/AdminTesting';
import Navigation from './components/Navigation';

const App = () => {
  const [account, setAccount] = useState('Connecting to Metamask..');
  const [network, setNetwork] = useState({ id: '0', name: 'none' });
  const [testTokenContract, setTestTokenContract] = useState('');
  const [tokenStakingContract, setTokenStakingContract] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [contractBalance, setContractBalance] = useState('0');
  const [totalStaked, setTotalStaked] = useState([0, 0]);
  const [myStake, setMyStake] = useState([0, 0]);
  const [appStatus, setAppStatus] = useState(true);
  const [loader, setLoader] = useState(false);
  const [userBalance, setUserBalance] = useState('0');
  const [apy, setApy] = useState([0, 0]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    //connecting to ethereum blockchain
    const ethEnabled = async () => {
      fetchDataFromBlockchain();
    };

    ethEnabled();
  }, []);

  const fetchDataFromBlockchain = async () => {
    try {
      if (!window.ethereum) {
        setAppStatus(false);
        setAccount('Metamask is not detected');
        setLoader(false);
        return;
      }
  
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const web3 = new Web3(window.ethereum);
      window.web3 = web3;
  
      // Fetch account
      const accounts = await web3.eth.getAccounts();
      if (accounts.length === 0) {
        setAccount('No account found');
        setLoader(false);
        return;
      }
      setAccount(accounts[0]);
  
      // Fetch network ID and name
      const networkId = await web3.eth.net.getId();
      const networkType = await web3.eth.net.getNetworkType();
      setNetwork({ ...network, id: networkId, name: networkType });
  
      // Load TestToken contract data
      const testTokenData = TestToken.networks[networkId];
      if (!testTokenData) {
        setAppStatus(false);
        alert('TestToken contract is not deployed on this network. Please switch to the correct network.');
        setLoader(false);
        return;
      }
  
      const testToken = new web3.eth.Contract(TestToken.abi, testTokenData.address);
      setTestTokenContract(testToken);
  
      // Fetch user's TestToken balance
      const testTokenBalance = await testToken.methods.balanceOf(accounts[0]).call();
      const convertedBalance = web3.utils.fromWei(testTokenBalance.toString(), 'Ether');
      setUserBalance(convertedBalance);
      setContractBalance(contractBalance);
  
      // Fetch contract balance and total staked amount
      const tokenStakingData = TokenStaking.networks[networkId];
      if (!tokenStakingData) {
        setAppStatus(false);
        alert('TokenStaking contract is not deployed on this network. Please switch to the correct network.');
        setLoader(false);
        return;
      }
  
      const tokenStaking = new web3.eth.Contract(TokenStaking.abi, tokenStakingData.address);
      setTokenStakingContract(tokenStaking);
  
      // Fetch staking details
      const myStake = await tokenStaking.methods.stakingBalance(accounts[0]).call();
      const convertedStake = web3.utils.fromWei(myStake.toString(), 'Ether');
      setMyStake([convertedStake, '0']); 
  
      const totalStaked = await tokenStaking.methods.totalStaked().call();
      const convertedTotalStaked = web3.utils.fromWei(totalStaked.toString(), 'Ether');
      setTotalStaked([convertedTotalStaked, '0']); 
  
      // Fetch APY values
      const defaultAPY = (await tokenStaking.methods.defaultAPY().call()) / 1000 * 365;
      setApy([defaultAPY, '0']); 
  
      // Everything worked, remove loader
      setLoader(false);
    } catch (error) {
      console.error('Error in fetching data from blockchain:', error.message);
      setAppStatus(false);
      setAccount('Error fetching data. Check console for details.');
      setLoader(false);
    }
  };
  

  const inputHandler = (received) => {
    setInputValue(received);
  };

  const changePage = () => {
    if (page === 1) {
      setPage(2);
    } else if (page === 2) {
      setPage(1);
    }
  };

  const stakeHandler = () => {
    if (!appStatus) {
    } else {
      if (!inputValue || inputValue === '0' || inputValue < 0) {
        setInputValue('');
      } else {
        setLoader(true);
        let convertToWei = window.web3.utils.toWei(inputValue, 'Ether');

        //aproving tokens for spending
        testTokenContract.methods
          .approve(tokenStakingContract._address, convertToWei)
          .send({ from: account })
          .on('transactionHash', (hash) => {
            if (page === 1) {
              tokenStakingContract.methods
                .stakeTokens(convertToWei)
                .send({ from: account })
                .on('transactionHash', (hash) => {
                  setLoader(false);
                  fetchDataFromBlockchain();
                })
                .on('receipt', (receipt) => {
                  setLoader(false);
                  fetchDataFromBlockchain();
                })
                .on('confirmation', (confirmationNumber, receipt) => {
                  setLoader(false);
                  fetchDataFromBlockchain();
                });
            } else if (page === 2) {
              tokenStakingContract.methods
                .customStaking(convertToWei)
                .send({ from: account })
                .on('transactionHash', (hash) => {
                  setLoader(false);
                  fetchDataFromBlockchain();
                })
                .on('receipt', (receipt) => {
                  setLoader(false);
                  fetchDataFromBlockchain();
                })
                .on('confirmation', (confirmationNumber, receipt) => {
                  setLoader(false);
                  fetchDataFromBlockchain();
                });
            }
          })
          .on('error', function(error) {
            setLoader(false);
            console.log('Error Code:', error.code);
            console.log(error.message);
          });
        setInputValue('');
      }
    }
  };

  const unStakeHandler = () => {
    if (!appStatus) {
    } else {
      setLoader(true);

      // let convertToWei = window.web3.utils.toWei(inputValue, 'Ether')
      if (page === 1) {
        tokenStakingContract.methods
          .unstakeTokens()
          .send({ from: account })
          .on('transactionHash', (hash) => {
            setLoader(false);
            fetchDataFromBlockchain();
          })
          .on('receipt', (receipt) => {
            setLoader(false);
            fetchDataFromBlockchain();
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            setLoader(false);
            fetchDataFromBlockchain();
          })
          .on('error', function(error) {
            console.log('Error Code:', error.code);
            console.log(error.message);
            setLoader(false);
          });

        setInputValue('');
      } else if (page === 2) {
        tokenStakingContract.methods
          .customUnstake()
          .send({ from: account })
          .on('transactionHash', (hash) => {
            setLoader(false);
            fetchDataFromBlockchain();
          })
          .on('receipt', (receipt) => {
            setLoader(false);
            fetchDataFromBlockchain();
          })
          .on('confirmation', (confirmationNumber, receipt) => {
            setLoader(false);
            fetchDataFromBlockchain();
          })

          .on('error', function(error) {
            console.log('Error Code:', error.code);
            console.log(error.message);
            setLoader(false);
          });
        setInputValue('');
      }
    }
  };

  const redistributeRewards = async () => {
    if (!appStatus) {
    } else {
      setLoader(true);
      tokenStakingContract.methods
        .redistributeRewards()
        .send({ from: account })
        .on('transactionHash', (hash) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('receipt', (receipt) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('confirmation', (confirmationNumber, receipt) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('error', function(error) {
          console.log('Error Code:', error.code);
          console.log(error.code);
          setLoader(false);
        });
    }
  };

  const redistributeCustomRewards = async () => {
    if (!appStatus) {
    } else {
      setLoader(true);
      tokenStakingContract.methods
        .customRewards()
        .send({ from: account })
        .on('transactionHash', (hash) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('receipt', (receipt) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('confirmation', (confirmationNumber, receipt) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('error', function(error) {
          console.log('Error Code:', error.code);
          console.log(error.code);
          setLoader(false);
        });
    }
  };

  const claimTst = async () => {
    if (!appStatus) {
    } else {
      setLoader(true);
      tokenStakingContract.methods
        .claimTst()
        .send({ from: account })
        .on('transactionHash', (hash) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('receipt', (receipt) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('confirmation', (confirmationNumber, receipt) => {
          setLoader(false);
          fetchDataFromBlockchain();
        })
        .on('error', function(error) {
          console.log('Error Code:', error.code);
          console.log(error.code);
          setLoader(false);
        });
    }
  };

  return (
    <div className={classes.Grid}>
      {loader ? <div className={classes.curtain}></div> : null}
      <div className={classes.loader}></div>
      <div className={classes.Child}>
        <Navigation apy={apy} changePage={changePage} />
        <div>
          <Staking
            account={account}
            totalStaked={page === 1 ? totalStaked[0] : totalStaked[1]}
            myStake={page === 1 ? myStake[0] : myStake[1]}
            userBalance={userBalance}
            unStakeHandler={unStakeHandler}
            stakeHandler={stakeHandler}
            inputHandler={inputHandler}
            apy={page === 1 ? apy[0] : apy[1]}
            page={page}
          />
        </div>
        <div className={classes.for_testing}>
          <AdminTesting
            network={network}
            tokenStakingContract={tokenStakingContract}
            contractBalance={contractBalance}
            redistributeRewards={
              page === 1 ? redistributeRewards : redistributeCustomRewards
            }
            claimTst={claimTst}
            page={page}
          />
        </div>
      </div>
    </div>
  );
};

export default App;
