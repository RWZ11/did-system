from flask import Flask, request, jsonify
from web3 import Web3
import json

app = Flask(__name__)

# 设置日志记录
import logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 设置项目根目录路径
import os
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
logger.info(f"项目根目录: {BASE_DIR}")

# 连接到本地的Hardhat节点
w3 = Web3(Web3.HTTPProvider('http://localhost:8545'))
logger.info(f"连接到区块链节点: {w3.is_connected()}")

# 加载合约ABI和地址
try:
    config_path = os.path.join(BASE_DIR, 'contract-config.json')
    logger.info(f"正在读取配置文件: {config_path}")
    with open(config_path) as f:
        contract_config = json.load(f)
        logger.info(f"加载合约配置: {contract_config}")

    contract_path = os.path.join(BASE_DIR, 'artifacts', 'contracts', 'DIDRegistry.sol', 'DIDRegistry.json')
    logger.info(f"正在读取合约文件: {contract_path}")
    with open(contract_path) as f:
        contract_json = json.load(f)
        contract_abi = contract_json['abi']
        logger.info("成功加载合约ABI")

    contract_address = contract_config['contractAddress']
    contract = w3.eth.contract(address=contract_address, abi=contract_abi)
    logger.info(f"智能合约初始化成功，地址: {contract_address}")
except Exception as e:
    logger.error(f"初始化失败: {str(e)}")
    raise
contract = w3.eth.contract(address=contract_address, abi=contract_abi)

@app.route('/did/<did>/status', methods=['GET'])
def get_did_status(did):
    try:
        app.logger.info(f'正在获取DID状态: {did}')
        # 添加详细的调试日志
        logger.info(f'合约地址: {contract.address}')
        logger.info(f'调用合约方法: getStatus({did})')
        
        # 调用合约的getStatus方法
        status = contract.functions.getStatus(did).call()
        logger.info(f'合约返回状态: {status}')
        
        response = {'active': status}
        logger.info(f'返回响应: {response}')
        return jsonify(response)
        return jsonify({'active': status})
    except Exception as e:
        app.logger.error(f'获取DID状态失败: {str(e)}')
        import traceback
        app.logger.error(traceback.format_exc())
        return jsonify({'error': str(e)}), 500

@app.route('/did/register', methods=['POST'])
def register_did():
    try:
        data = request.get_data()
        # 解析DID和公钥
        did = data[:data.index(b'\0')].decode('utf-8') if b'\0' in data else data.decode('utf-8')
        public_key = data[len(did)+1:] if len(data) > len(did) else b''
        
        # 获取默认账户
        account = w3.eth.accounts[0]
        
        # 调用合约的register方法
        tx_hash = contract.functions.register(did, public_key).transact({'from': account})
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return jsonify({
            'hash': tx_hash.hex(),
            'status': 'success' if receipt.status == 1 else 'failed'
        })
    except Exception as e:
        app.logger.error(f'注册DID失败: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/did/<did>', methods=['GET'])
def get_did_document(did):
    try:
        # 调用合约的resolve方法
        document = contract.functions.resolve(did).call()
        return jsonify(document)
    except Exception as e:
        app.logger.error(f'获取DID文档失败: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/did/store', methods=['POST'])
def store_did_document():
    try:
        document = request.get_json()
        
        # 获取默认账户
        account = w3.eth.accounts[0]
        
        # 调用合约的store方法
        tx_hash = contract.functions.store(document).transact({'from': account})
        receipt = w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return jsonify({
            'hash': tx_hash.hex(),
            'status': 'success' if receipt.status == 1 else 'failed'
        })
    except Exception as e:
        app.logger.error(f'存储DID文档失败: {str(e)}')
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3000, debug=True)