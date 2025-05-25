import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import './App.css';
import DecentralizedID from './contracts/DecentralizedID.json';

// 测试网络配置
const TEST_NETWORK = {
  name: '本地测试网络',
  chainId: '0x539', // 1337 十六进制
  rpcUrl: 'http://127.0.0.1:8545'
};

// 测试账户 - 这些是Hardhat本地网络的默认测试账户
const TEST_ACCOUNTS = [
  {
    address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
    privateKey: '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  },
  {
    address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    privateKey: '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d'
  },
  {
    address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
    privateKey: '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a'
  }
];

// 导入合约ABI和接口
const contractABI = DecentralizedID.abi;

// 合约地址 - 需要在部署后更新
const contractAddress = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

function App() {
  // 切换测试账户
  const switchTestAccount = async (index) => {
    setSelectedTestAccount(index);
    await connectTestWallet();
  };

  // 复制到剪贴板
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 状态变量
  const [account, setAccount] = useState(""); // 用户钱包地址
  const [verificationCode, setVerificationCode] = useState(""); // 邮箱验证码
  const [verificationStatus, setVerificationStatus] = useState({
    email: false,
    social: false
  }); // 验证状态
  const [provider, setProvider] = useState(null); // 以太坊提供者
  const [contract, setContract] = useState(null); // 合约实例
  const [didValue, setDidValue] = useState(""); // 用于注册的DID值
  const [lookupAddress, setLookupAddress] = useState(""); // 用于查询的地址
  const [lookupResult, setLookupResult] = useState(""); // 查询结果
  const [isConnected, setIsConnected] = useState(false); // 连接状态
  const [loading, setLoading] = useState(false); // 加载状态
  const [error, setError] = useState(""); // 错误信息
  const [txHash, setTxHash] = useState(""); // 交易哈希
  const [activeTab, setActiveTab] = useState('register'); // 当前激活的标签页
  const [showTestAccounts, setShowTestAccounts] = useState(false); // 是否显示测试账户
  const [copied, setCopied] = useState(false); // 复制状态
  const [username, setUsername] = useState(""); // 用户名
  const [avatar, setAvatar] = useState(""); // 头像URI
  const [tags, setTags] = useState([]); // 标签列表
  const [newTag, setNewTag] = useState(""); // 新标签输入
  const [userProfile, setUserProfile] = useState(null); // 用户资料
  const [didHistory, setDidHistory] = useState([]); // DID历史记录
  const [email, setEmail] = useState(""); // 邮箱
  const [emailVerified, setEmailVerified] = useState(false); // 邮箱验证状态
  const [socialAccounts, setSocialAccounts] = useState([]); // 社交账号列表
  const [newSocialAccount, setNewSocialAccount] = useState(""); // 新社交账号输入

  const [selectedTestAccount, setSelectedTestAccount] = useState(0); // 选择的测试账户索引
  const [showUpdateForm, setShowUpdateForm] = useState(false); // 控制更新资料表单的显示和隐藏

  // 连接本地测试网络钱包
  const connectTestWallet = async () => {
    try {
      setError("");
      setLoading(true);
      
      // 使用选定的测试账户
      const testAccount = TEST_ACCOUNTS[selectedTestAccount];
      setAccount(testAccount.address);
      
      // 创建自定义provider和signer
      const provider = new ethers.JsonRpcProvider(TEST_NETWORK.rpcUrl);
      setProvider(provider);
      
      // 使用私钥创建钱包
      const wallet = new ethers.Wallet(testAccount.privateKey, provider);
      
      // 创建合约实例
      const didContract = new ethers.Contract(contractAddress, contractABI, wallet);
      setContract(didContract);
      setIsConnected(true);
      
    } catch (err) {
      console.error("连接测试钱包错误:", err);
      setError(err.message || "连接测试钱包失败");
    } finally {
      setLoading(false);
    }
  };
  
  // 连接钱包
  const connectWallet = async () => {
    await connectTestWallet();
  };

  // 注册DID
  const registerDID = async () => {
    if (!didValue) {
      setError("请输入DID值");
      return;
    }
    
    if (!contract) {
      setError("请先连接钱包");
      return;
    }

    try {
      setError("");
      setLoading(true);
      setTxHash("");
      
      // 先检查合约地址是否正确
      const code = await provider.getCode(contractAddress);
      if (code === '0x') {
        setError("合约地址无效，请确保合约已正确部署");
        return;
      }

      // 检查账户是否已注册DID
      const isRegistered = await contract.isRegistered(account);
      if (isRegistered) {
        setError("当前账户已注册DID，不能重复注册");
        return;
      }
      
      // 调用合约方法注册DID，设置合理的gas配置
      const gasLimit = await contract.registerDID.estimateGas(didValue)
        .catch(() => ethers.toBigInt(500000)); // 如果估算失败，使用默认值

      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice;

      const tx = await contract.registerDID(didValue, {
        gasLimit: gasLimit * ethers.toBigInt(12) / ethers.toBigInt(10), // 增加20%的gas限制
        gasPrice: gasPrice
      });

      setTxHash(tx.hash);
      
      // 等待交易确认
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        // 清空输入
        setDidValue("");
        setError("");
        alert("DID注册成功！交易已确认");
      } else {
        setError("交易已确认但可能失败，请检查交易详情");
      }
      
    } catch (err) {
      console.error("注册DID错误:", err);
      let errorMessage = "注册DID失败";
      
      // 处理常见错误类型
      if (err.code === 'ACTION_REJECTED') {
        errorMessage = "用户取消了交易";
      } else if (err.code === 'INSUFFICIENT_FUNDS') {
        errorMessage = "账户余额不足，无法支付gas费用";
      } else if (err.code === 'UNPREDICTABLE_GAS_LIMIT') {
        errorMessage = "无法估算gas限制，请检查输入值是否有效";
      } else if (err.message.includes('user rejected')) {
        errorMessage = "用户拒绝了交易请求";
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 发送邮箱验证码
  const sendVerificationCode = async () => {
    try {
      setError("");
      setLoading(true);
      
      // 这里应该调用后端API发送验证码
      // 目前模拟发送验证码
      const mockCode = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('模拟验证码:', mockCode);
      alert(`模拟发送验证码: ${mockCode}`);
      
      setVerificationStatus(prev => ({ ...prev, email: false }));
    } catch (err) {
      console.error("发送验证码错误:", err);
      setError("发送验证码失败");
    } finally {
      setLoading(false);
    }
  };

  // 验证邮箱
  const verifyEmail = async () => {
    try {
      setError("");
      setLoading(true);
      
      if (!contract) {
        setError("请先连接钱包");
        return;
      }

      // 调用合约的verifyEmail方法
      const tx = await contract.verifyEmail();
      setTxHash(tx.hash);
      
      const receipt = await tx.wait();
      if (receipt.status === 1) {
        setVerificationStatus(prev => ({ ...prev, email: true }));
        alert("邮箱验证成功！");
      } else {
        setError("邮箱验证失败，请重试");
      }
    } catch (err) {
      console.error("验证邮箱错误:", err);
      setError("验证邮箱失败");
    } finally {
      setLoading(false);
    }
  };

  // 验证社交账号
  const verifySocialAccount = async (platform) => {
    try {
      setError("");
      setLoading(true);
      
      // 这里应该调用社交平台的OAuth认证
      // 目前模拟验证过程
      setTimeout(() => {
        setVerificationStatus(prev => ({ ...prev, social: true }));
        alert(`${platform}账号验证成功！`);
        setLoading(false);
      }, 2000);
      
    } catch (err) {
      console.error("验证社交账号错误:", err);
      setError("验证社交账号失败");
      setLoading(false);
    }
  };

  // 更新用户资料
  const updateUserProfile = async () => {
    try {
      setError("");
      setLoading(true);
      setTxHash("");

      // 检查输入
      if (!username.trim()) {
        setError("请输入用户名");
        return;
      }

      // 调用合约方法更新资料
      const tx = await contract.updateProfile(username, avatar);
      setTxHash(tx.hash);
      
      // 等待交易确认
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        alert("用户资料更新成功！");
        // 刷新用户资料
        await getUserProfile(account);
      } else {
        setError("交易已确认但可能失败，请检查交易详情");
      }
    } catch (err) {
      console.error("更新用户资料错误:", err);
      setError(err.message || "更新用户资料失败");
    } finally {
      setLoading(false);
    }
  };

  // 更新邮箱
  const updateEmail = async () => {
    try {
      setError("");
      setLoading(true);
      setTxHash("");

      if (!email.trim()) {
        setError("请输入邮箱");
        return;
      }

      const tx = await contract.updateEmail(email);
      setTxHash(tx.hash);
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        alert("邮箱更新成功！");
        await getUserProfile(account);
      } else {
        setError("交易已确认但可能失败，请检查交易详情");
      }
    } catch (err) {
      console.error("更新邮箱错误:", err);
      setError(err.message || "更新邮箱失败");
    } finally {
      setLoading(false);
    }
  };

  // 添加社交账号
  const addSocialAccount = async () => {
    try {
      setError("");
      setLoading(true);
      setTxHash("");

      if (!newSocialAccount.trim()) {
        setError("请输入社交账号");
        return;
      }

      const tx = await contract.addSocialAccount(newSocialAccount);
      setTxHash(tx.hash);
      
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        alert("社交账号添加成功！");
        setNewSocialAccount("");
        await getUserProfile(account);
      } else {
        setError("交易已确认但可能失败，请检查交易详情");
      }
    } catch (err) {
      console.error("添加社交账号错误:", err);
      setError(err.message || "添加社交账号失败");
    } finally {
      setLoading(false);
    }
  };

  // 获取用户资料
  const getUserProfile = async (address) => {
    try {
      setError("");
      setLoading(true);

      // 调用合约方法获取用户资料
      const profile = await contract.getProfile(address);
      setUserProfile({
        did: profile[0],
        username: profile[1],
        avatar: profile[2],
        tags: profile[3],
        email: profile[4],
        emailVerified: profile[5],
        socialAccounts: profile[6]
      });
    } catch (err) {
      console.error("获取用户资料错误:", err);
      setError(err.message || "获取用户资料失败");
    } finally {
      setLoading(false);
    }
  };

  // 添加标签
  const addUserTag = async () => {
    try {
      setError("");
      setLoading(true);
      setTxHash("");

      // 检查输入
      if (!newTag.trim()) {
        setError("请输入标签");
        return;
      }

      // 调用合约方法添加标签
      const tx = await contract.addTag(newTag);
      setTxHash(tx.hash);
      
      // 等待交易确认
      const receipt = await tx.wait();
      
      if (receipt.status === 1) {
        setNewTag(""); // 清空输入
        alert("标签添加成功！");
        // 刷新用户资料
        await getUserProfile(account);
      } else {
        setError("交易已确认但可能失败，请检查交易详情");
      }
    } catch (err) {
      console.error("添加标签错误:", err);
      setError(err.message || "添加标签失败");
    } finally {
      setLoading(false);
    }
  };

  // 获取DID历史记录
  const getDidHistory = async (address) => {
    try {
      setError("");
      setLoading(true);

      // 调用合约方法获取历史记录
      const records = await contract.getDidHistory(address);
      
      // 格式化历史记录
      const formattedRecords = records.map(record => ({
        did: record.did,
        timestamp: new Date(Number(record.timestamp) * 1000).toLocaleString(),
        action: record.action
      }));

      setDidHistory(formattedRecords);
    } catch (err) {
      console.error("获取历史记录错误:", err);
      setError(err.message || "获取历史记录失败");
    } finally {
      setLoading(false);
    }
  };

  // 查询DID
  const lookupDID = async () => {
    if (!lookupAddress || !ethers.isAddress(lookupAddress)) {
      setError("请输入有效的以太坊地址");
      return;
    }
    
    try {
      setError("");
      setLoading(true);
      setLookupResult("");
      
      // 调用合约方法查询DID
      const result = await contract.getDID(lookupAddress);
      
      if (result && result.length > 0) {
        setLookupResult(result);
      } else {
        setLookupResult("未找到DID");
      }
      
    } catch (err) {
      console.error("查询DID错误:", err);
      setError(err.message || "查询DID失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <div className="sidebar" style={{width: '400px', minWidth: '400px', borderRight: '1px solid rgba(255, 255, 255, 0.1)'}}>
        <h1 style={{whiteSpace: 'nowrap'}}>去中心化的ID管理系统</h1>
      <p>基于区块链的DID解决方案</p>
        
        {/* 连接钱包按钮 */}
        <div className="wallet-connection">
          {!isConnected ? (
            <button onClick={connectWallet} disabled={loading}>
              {loading ? "连接中..." : "连接钱包"}
            </button>
          ) : (
            <p style={{whiteSpace: 'nowrap', width: '380px', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.85rem'}}>当前账户: {account}</p>
          )}
        </div>

        {/* 测试账户切换 */}
        <div className="test-accounts">
          <button onClick={() => setShowTestAccounts(!showTestAccounts)}>
            {showTestAccounts ? '隐藏测试账户' : '显示测试账户'}
          </button>
          {showTestAccounts && (
            <div className="test-accounts">
              <h3>测试账户</h3>
              {TEST_ACCOUNTS.map((account, index) => (
                <div key={index} className="test-account">
                  <p className="account-address">地址: {account.address}</p>
                  <div className="account-buttons">
                    <button onClick={() => switchTestAccount(index)} className="sidebar-button">
                      使用此账户
                    </button>
                    <button onClick={() => copyToClipboard(account.address)} className="sidebar-button">
                      {copied ? '已复制' : '复制地址'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 导航按钮 */}
        <div className="nav-buttons">
          <button
            className={`nav-button ${activeTab === 'register' ? 'active' : ''}`}
            onClick={() => setActiveTab('register')}
          >
            注册
          </button>
          <button
            className={`nav-button ${activeTab === 'query' ? 'active' : ''}`}
            onClick={() => setActiveTab('query')}
          >
            查询
          </button>
          <button
            className={`nav-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('profile');
              if (account) {
                getUserProfile(account);
              }
            }}
          >
            用户资料
          </button>
          <button
            className={`nav-button ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('history');
              if (account) {
                getDidHistory(account);
              }
            }}
          >
            历史记录
          </button>
        </div>

        {/* 错误信息显示 */}
        {error && <div className="error">{error}</div>}

        {/* 加载状态显示 */}
        {loading && <div className="loading">处理中...</div>}

        {/* 交易哈希显示 */}
        {txHash && (
          <div className="tx-hash">
            交易哈希: <a href={`https://localhost:8545/${txHash}`} target="_blank" rel="noopener noreferrer">{txHash}</a>
          </div>
        )}

        </div> 

        {/* 主要内容区域 */}
        <div className="main-content" style={{flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px'}}>
          {/* 注册DID表单 */}
          {activeTab === 'register' && (
            <div className="register-form" style={{width: '100%', maxWidth: '500px', background: 'rgba(184, 230, 255, 0.05)', padding: '30px', borderRadius: '10px', border: '1px solid rgba(184, 230, 255, 0.2)'}}>              
              <h2 style={{textAlign: 'center', marginBottom: '20px', color: '#4FC3FF', fontWeight: 'bold'}}>注册DID</h2>
              <input
                type="text"
                placeholder="输入DID值"
                value={didValue}
                onChange={(e) => setDidValue(e.target.value)}
                style={{width: '100%', padding: '10px', marginBottom: '20px', borderRadius: '5px', border: '1px solid #4FC3FF', background: 'rgba(184, 230, 255, 0.1)', color: '#4FC3FF'}}
              />
              <button 
                onClick={registerDID} 
                disabled={loading || !isConnected}
                style={{width: '100%', padding: '10px', borderRadius: '5px', border: 'none', background: '#4FC3FF', color: 'white', cursor: 'pointer', fontWeight: 'bold'}}
              >
                注册
              </button>
            </div>
          )}

          {/* 查询DID表单 */}
          {activeTab === 'query' && (
            <div className="query-form" style={{width: '100%', maxWidth: '500px', background: 'rgba(184, 230, 255, 0.05)', padding: '30px', borderRadius: '10px', border: '1px solid rgba(184, 230, 255, 0.2)'}}>
                <h2 style={{textAlign: 'center', marginBottom: '20px', color: '#4FC3FF', fontWeight: 'bold'}}>查询DID</h2>
              <input style={{width: '100%', marginBottom: '15px', padding: '10px', borderRadius: '5px', border: '1px solid rgba(184, 230, 255, 0.3)', background: 'rgba(184, 230, 255, 0.1)', color: '#4FC3FF'}}
                type="text"
                placeholder="输入以太坊地址"
                value={lookupAddress}
                onChange={(e) => setLookupAddress(e.target.value)}
              />
              <button 
                onClick={lookupDID} 
                disabled={loading}
                style={{width: '100%', padding: '10px', borderRadius: '5px', background: 'rgba(184, 230, 255, 0.2)', border: '1px solid rgba(184, 230, 255, 0.4)', color: '#4FC3FF', cursor: 'pointer', marginBottom: '15px', fontSize: '16px', fontWeight: 'bold'}}
              >
                查询
              </button>
              {lookupResult && (
                 <div style={{textAlign: 'center', marginTop: '15px', padding: '15px', background: 'rgba(184, 230, 255, 0.1)', borderRadius: '5px', color: '#4FC3FF', border: '1px solid rgba(184, 230, 255, 0.3)'}}>
                   <p style={{margin: 0}}>查询结果：{lookupResult}</p>
                </div>
              )}
            </div>
          )}

          {/* 历史记录列表 */}
          {activeTab === 'history' && (
            <div className="history-form">
              <h2>DID历史记录</h2>
              <div className="timeline">
                {didHistory.map((record, index) => (
                  <div key={index} className="timeline-item">
                    <div className="timeline-content">
                      <h3>{record.action}</h3>
                      <p>DID: {record.did}</p>
                      <p>时间: {record.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="profile-form" style={{width: '100%', maxWidth: '800px'}}>
              <h2 style={{fontSize: '24px', color: '#4FC3FF', marginBottom: '20px', fontWeight: 'bold'}}>用户资料管理</h2>
              {isConnected ? (
                <div style={{width: '100%'}}>
                  {/* 显示当前资料 */}
                  {userProfile && (
                    <div className="current-profile" style={{background: 'rgba(184, 230, 255, 0.05)', padding: '30px', borderRadius: '10px', marginBottom: '20px', border: '1px solid rgba(184, 230, 255, 0.2)'}}>                      <h3 style={{fontSize: '24px', color: '#4FC3FF', marginBottom: '20px', fontWeight: 'bold'}}>当前资料</h3>
                      <p style={{fontSize: '16px', color: '#4FC3FF', marginBottom: '15px'}}>用户名: {userProfile.username}</p>
                      <p style={{fontSize: '16px', color: '#4FC3FF', marginBottom: '15px'}}>头像URI: {userProfile.avatar}</p>
                      <p style={{fontSize: '16px', color: '#4FC3FF', marginBottom: '15px'}}>邮箱: {userProfile.email}</p>
                      <p style={{fontSize: '16px', color: '#4FC3FF', marginBottom: '15px'}}>邮箱验证状态: {userProfile.emailVerified ? '已验证' : '未验证'}</p>
                      <div className="tags" style={{marginTop: '25px'}}>
                        <p style={{fontSize: '18px', color: '#4FC3FF', marginBottom: '15px', fontWeight: 'bold'}}>标签:</p>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
                          {userProfile.tags.map((tag, index) => (
                            <span key={index} className="tag" style={{background: 'rgba(184, 230, 255, 0.1)', padding: '8px 15px', borderRadius: '6px', color: '#4FC3FF', fontSize: '14px', border: '1px solid rgba(184, 230, 255, 0.2)'}}>{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="social-accounts" style={{marginTop: '25px'}}>
                        <p style={{fontSize: '18px', color: '#4FC3FF', marginBottom: '15px', fontWeight: 'bold'}}>社交账号:</p>
                        {userProfile.socialAccounts.map((account, index) => (
                          <div key={index} className="social-account-item" style={{display: 'flex', alignItems: 'center', marginBottom: '10px'}}>
                            <span className="social-account" style={{fontSize: '16px', color: '#4FC3FF', flex: 1, background: 'rgba(184, 230, 255, 0.08)', padding: '10px 15px', borderRadius: '6px'}}>{account}</span>
                            {!verificationStatus.social && (
                              <button 
                                onClick={() => verifySocialAccount(account)}
                                className="verify-button"
                                disabled={loading}
                                style={{marginLeft: '15px', padding: '8px 15px', background: 'rgba(184, 230, 255, 0.2)', border: '1px solid rgba(184, 230, 255, 0.4)', borderRadius: '6px', color: '#4FC3FF', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold'}}>
                                验证
                              </button>
                            )}
                          </div>
                        ))}
                        {verificationStatus.social && (
                          <div className="verification-status success" style={{color: '#4FC3FF', fontSize: '14px', marginTop: '10px', background: 'rgba(184, 230, 255, 0.1)', padding: '8px 15px', borderRadius: '6px', display: 'inline-block'}}>
                            ✓ 社交账号已验证
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => setShowUpdateForm(!showUpdateForm)} 
                        style={{marginTop: '20px', padding: '12px 24px', background: 'rgba(184, 230, 255, 0.2)', border: '1px solid rgba(184, 230, 255, 0.4)', borderRadius: '6px', color: '#4FC3FF', cursor: 'pointer', width: '100%', fontSize: '16px', fontWeight: 'bold'}}
                      >
                        {showUpdateForm ? '隐藏更新表单' : '更新资料'}
                      </button>
                    </div>
                  )}

                  {/* 更新资料表单 */}
                  {showUpdateForm && (
                    <div className="update-profile" style={{background: 'rgba(184, 230, 255, 0.05)', padding: '30px', borderRadius: '10px', width: '100%', border: '1px solid rgba(184, 230, 255, 0.2)', marginBottom: '30px'}}>
                      <h3 style={{fontSize: '20px', color: '#4FC3FF', marginBottom: '20px', fontWeight: 'bold'}}>更新资料</h3>
                      <input
                        type="text"
                        placeholder="用户名"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        style={{width: '100%', marginBottom: '15px', padding: '12px', borderRadius: '6px', border: '1px solid rgba(184, 230, 255, 0.3)', background: 'rgba(184, 230, 255, 0.1)', color: '#4FC3FF', fontSize: '16px'}}
                      />
                      <input
                        type="text"
                        placeholder="头像URI"
                        value={avatar}
                        onChange={(e) => setAvatar(e.target.value)}
                        style={{width: '100%', marginBottom: '15px', padding: '12px', borderRadius: '6px', border: '1px solid rgba(184, 230, 255, 0.3)', background: 'rgba(184, 230, 255, 0.1)', color: '#4FC3FF', fontSize: '16px'}}
                      />
                      <button 
                        onClick={updateUserProfile} 
                        disabled={loading}
                        style={{width: '100%', marginBottom: '30px', padding: '12px', background: 'rgba(184, 230, 255, 0.2)', border: '1px solid rgba(184, 230, 255, 0.4)', borderRadius: '6px', color: '#4FC3FF', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'}}
                      >
                        更新基本资料
                      </button>

                      <div className="email-section" style={{marginBottom: '30px'}}>
                        <h4 style={{fontSize: '18px', color: '#4FC3FF', marginBottom: '15px', fontWeight: 'bold'}}>邮箱设置</h4>
                        <input
                          type="email"
                          placeholder="邮箱地址"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          style={{width: '100%', marginBottom: '15px', padding: '12px', borderRadius: '6px', border: '1px solid rgba(184, 230, 255, 0.3)', background: 'rgba(184, 230, 255, 0.1)', color: '#4FC3FF', fontSize: '16px'}}
                        />
                        <button 
                          onClick={updateEmail} 
                          disabled={loading}
                          style={{width: '100%', marginBottom: '15px', padding: '12px', background: 'rgba(184, 230, 255, 0.2)', border: '1px solid rgba(184, 230, 255, 0.4)', borderRadius: '6px', color: '#4FC3FF', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'}}
                        >
                          更新邮箱
                        </button>
                        {!verificationStatus.email && (
                          <div style={{background: 'rgba(184, 230, 255, 0.05)', padding: '20px', borderRadius: '6px', marginTop: '15px', border: '1px solid rgba(184, 230, 255, 0.2)'}}>
                            <button 
                              onClick={sendVerificationCode} 
                              disabled={loading}
                              style={{width: '100%', marginBottom: '15px', padding: '12px', background: 'rgba(184, 230, 255, 0.2)', border: '1px solid rgba(184, 230, 255, 0.4)', borderRadius: '6px', color: '#4FC3FF', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'}}
                            >
                              发送验证码
                            </button>
                            <input
                              type="text"
                              placeholder="输入验证码"
                              value={verificationCode}
                              onChange={(e) => setVerificationCode(e.target.value)}
                              style={{width: '100%', marginBottom: '15px', padding: '12px', borderRadius: '6px', border: '1px solid rgba(184, 230, 255, 0.3)', background: 'rgba(184, 230, 255, 0.1)', color: '#4FC3FF', fontSize: '16px'}}
                            />
                            <button 
                              onClick={verifyEmail} 
                              disabled={loading}
                              style={{width: '100%', padding: '12px', background: 'rgba(184, 230, 255, 0.2)', border: '1px solid rgba(184, 230, 255, 0.4)', borderRadius: '6px', color: '#4FC3FF', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'}}
                            >
                              验证邮箱
                            </button>
                          </div>
                        )}
                        {verificationStatus.email && (
                          <div className="verification-status success" style={{color: '#4FC3FF', textAlign: 'center', fontSize: '16px', padding: '10px', background: 'rgba(184, 230, 255, 0.1)', borderRadius: '6px', marginTop: '15px', border: '1px solid rgba(184, 230, 255, 0.2)'}}>
                            ✓ 邮箱已验证
                          </div>
                        )}
                      </div>

                      <div className="social-section" style={{marginBottom: '30px'}}>
                        <h4 style={{fontSize: '18px', color: '#4FC3FF', marginBottom: '15px', fontWeight: 'bold'}}>社交账号管理</h4>
                        <div style={{background: 'rgba(184, 230, 255, 0.05)', padding: '20px', borderRadius: '6px', border: '1px solid rgba(184, 230, 255, 0.2)'}}>
                          <input
                            type="text"
                            placeholder="社交账号"
                            value={newSocialAccount}
                            onChange={(e) => setNewSocialAccount(e.target.value)}
                            style={{width: '100%', marginBottom: '15px', padding: '12px', borderRadius: '6px', border: '1px solid rgba(184, 230, 255, 0.3)', background: 'rgba(184, 230, 255, 0.1)', color: '#4FC3FF', fontSize: '16px'}}
                          />
                          <button 
                            onClick={addSocialAccount} 
                            disabled={loading}
                            style={{width: '100%', marginBottom: '20px', padding: '12px', background: 'rgba(184, 230, 255, 0.2)', border: '1px solid rgba(184, 230, 255, 0.4)', borderRadius: '6px', color: '#4FC3FF', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'}}
                          >
                            添加社交账号
                          </button>
                        </div>
                      </div>

                      <div className="tag-section" style={{marginBottom: '30px'}}>
                        <h4 style={{fontSize: '18px', color: '#4FC3FF', marginBottom: '15px', fontWeight: 'bold'}}>标签管理</h4>
                        <div style={{background: 'rgba(184, 230, 255, 0.05)', padding: '20px', borderRadius: '6px', border: '1px solid rgba(184, 230, 255, 0.2)'}}>
                          <input
                            type="text"
                            placeholder="新标签"
                            value={newTag}
                            onChange={(e) => setNewTag(e.target.value)}
                            style={{width: '100%', marginBottom: '15px', padding: '12px', borderRadius: '6px', border: '1px solid rgba(184, 230, 255, 0.3)', background: 'rgba(184, 230, 255, 0.1)', color: '#4FC3FF', fontSize: '16px'}}
                          />
                          <button 
                            onClick={addUserTag} 
                            disabled={loading}
                            style={{width: '100%', marginBottom: '20px', padding: '12px', background: 'rgba(184, 230, 255, 0.2)', border: '1px solid rgba(184, 230, 255, 0.4)', borderRadius: '6px', color: '#4FC3FF', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold'}}
                          >
                            添加标签
                          </button>
                          <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px'}}>
                            {userProfile.tags && userProfile.tags.map((tag, index) => (
                              <span key={index} style={{padding: '8px 15px', background: 'rgba(184, 230, 255, 0.1)', borderRadius: '6px', color: '#4FC3FF', fontSize: '14px', border: '1px solid rgba(184, 230, 255, 0.3)'}}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <p>请先连接钱包</p>
              )}
            </div>
          )}
         </div>
    </div>
  );
}

export default App;