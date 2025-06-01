import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Descriptions } from 'antd';
import { didApi } from '../services/api';
import type { DIDDocument } from '../types/did';

const { Title, Paragraph, Text } = Typography;

const ResolveDID: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DIDDocument | null>(null);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (values: { did: string }) => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await didApi.resolve(values.did);
      if (response.success && response.data) {
        setResult(response.data);
      } else {
        setError(response.error?.message || '解析DID失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '解析DID时发生错误');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <Title level={2}>解析DID</Title>
        <Paragraph className="mb-6">
          输入DID标识符以查询其详细信息，包括公钥、认证方法和服务端点等。
        </Paragraph>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          disabled={loading}
        >
          <Form.Item
            label="DID标识符"
            name="did"
            rules={[{ required: true, message: '请输入DID标识符' }]}
            help="示例：did:example:123456789abcdefghi"
          >
            <Input placeholder="请输入要解析的DID标识符" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              解析DID
            </Button>
          </Form.Item>
        </Form>

        {error && (
          <Alert
            message="错误"
            description={error}
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        {result && (
          <div className="mt-6">
            <Title level={3}>DID文档</Title>
            <Card>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="DID标识符">
                  <Text copyable>{result.id}</Text>
                </Descriptions.Item>
                
                <Descriptions.Item label="创建时间">
                  {formatTime(result.created)}
                </Descriptions.Item>
                
                <Descriptions.Item label="更新时间">
                  {formatTime(result.updated)}
                </Descriptions.Item>
                
                <Descriptions.Item label="公钥信息">
                  {result.public_keys.map((key) => (
                    <div key={key.id} className="mb-4">
                      <p><strong>ID:</strong> {key.id}</p>
                      <p><strong>类型:</strong> {key.type_}</p>
                      <p><strong>控制者:</strong> {key.controller}</p>
                      <p>
                        <strong>公钥:</strong>
                        <Text copyable>{key.public_key_base58}</Text>
                      </p>
                    </div>
                  ))}
                </Descriptions.Item>
                
                <Descriptions.Item label="认证方法">
                  <ul className="list-disc pl-6">
                    {result.authentication.map((auth, index) => (
                      <li key={index}>{auth}</li>
                    ))}
                  </ul>
                </Descriptions.Item>
                
                {result.services.length > 0 && (
                  <Descriptions.Item label="服务端点">
                    {result.services.map((service) => (
                      <div key={service.id} className="mb-4">
                        <p><strong>ID:</strong> {service.id}</p>
                        <p><strong>类型:</strong> {service.type_}</p>
                        <p><strong>端点:</strong> {service.endpoint}</p>
                      </div>
                    ))}
                  </Descriptions.Item>
                )}
              </Descriptions>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
};

export default ResolveDID;