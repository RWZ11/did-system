import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Space } from 'antd';
import { didApi } from '../services/api';
import type { DIDDocument } from '../types/did';
import * as nacl from 'tweetnacl';
import * as bs58 from 'bs58';

const { Title, Paragraph, Text } = Typography;

const SAMPLE_KEY = 'CgVxRpiLjU41NchPWdNQpm2h4QHdeq4J2KWcprPivfAW';

// 生成随机的Ed25519私钥并进行Base58编码
const generateRandomKey = () => {
  // 生成Ed25519密钥对
  const keyPair = nacl.sign.keyPair();
  // 获取私钥（64字节，包含公钥）
  const privateKey = keyPair.secretKey;
  // 截取前32字节作为实际私钥
  const actualPrivateKey = privateKey.slice(0, 32);
  // 将私钥转换为Base58编码
  return bs58.encode(actualPrivateKey);
};

const CreateDID: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DIDDocument | null>(null);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (values: { signing_key: string }) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      console.debug('提交创建DID请求:', values);
      const response = await didApi.create({
        signing_key: values.signing_key.trim(),
      });

      if (response.success && response.data) {
        console.debug('DID创建成功:', response.data);
        setResult(response.data);
        form.resetFields();
      } else {
        console.error('DID创建失败:', response.error);
        setError(response.error?.message || '创建DID失败');
      }
    } catch (err: any) {
      console.error('创建DID时发生错误:', err);
      setError(err.response?.data?.error?.message || '创建DID时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const fillSampleKey = () => {
    form.setFieldsValue({ signing_key: SAMPLE_KEY });
  };

  const generateNewKey = () => {
    const newKey = generateRandomKey();
    form.setFieldsValue({ signing_key: newKey });
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <Title level={2}>创建DID</Title>
        <Paragraph className="mb-6">
          创建新的去中心化身份标识符（DID）。请提供Ed25519签名密钥（Base58编码格式，32字节）。
        </Paragraph>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={loading}
        >
          <Form.Item
            label="签名密钥"
            name="signing_key"
            rules={[
              { required: true, message: '请输入签名密钥' },
              { min: 40, message: 'Base58编码的密钥长度应至少为40个字符' },
              { pattern: /^[1-9A-HJ-NP-Za-km-z]+$/, message: '请输入有效的Base58编码字符串' },
            ]}
            extra={
              <Space>
                <Button type="link" size="small" onClick={generateNewKey}>
                  生成新密钥
                </Button>
                <Button type="link" size="small" onClick={fillSampleKey}>
                  使用示例密钥
                </Button>
              </Space>
            }
          >
            <Input.TextArea
              placeholder="请输入Base58编码的Ed25519私钥"
              autoSize={{ minRows: 2, maxRows: 4 }}
              allowClear
            />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={loading}>
              创建DID
            </Button>
          </Space>
        </Form>

        {error && (
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
            className="mt-4"
          />
        )}

        {result && (
          <Alert
            message="DID创建成功"
            description={
              <div>
                <p><Text strong>DID:</Text> {result.id}</p>
                <p><Text strong>创建时间:</Text> {new Date(result.created * 1000).toLocaleString()}</p>
                <p><Text strong>公钥:</Text> {result.public_keys[0]?.public_key_base58}</p>
              </div>
            }
            type="success"
            className="mt-4"
          />
        )}
      </Card>
    </div>
  );
};

export default CreateDID;