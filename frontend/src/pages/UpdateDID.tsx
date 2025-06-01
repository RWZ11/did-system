import React, { useState } from 'react';
import { Card, Form, Input, Button, Alert, Typography, Space, Modal } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { didApi } from '../services/api';
import type { DIDDocument, Service } from '../types/did';

const { Title, Paragraph, Text } = Typography;

const UpdateDID: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [currentDID, setCurrentDID] = useState<DIDDocument | null>(null);
  const [error, setError] = useState<string>('');

  // 解析DID获取当前文档
  const handleResolve = async (did: string) => {
    setResolving(true);
    setError('');
    try {
      const response = await didApi.resolve(did);
      if (response.success && response.data) {
        setCurrentDID(response.data);
        // 预填表单
        form.setFieldsValue({
          services: response.data.services,
        });
      } else {
        setError(response.error?.message || '解析DID失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '解析DID时发生错误');
    } finally {
      setResolving(false);
    }
  };

  // 更新DID文档
  const handleSubmit = async (values: {
    did: string;
    signing_key: string;
    services: Service[];
  }) => {
    if (!currentDID) {
      setError('请先解析DID获取当前文档');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 构建更新后的文档
      const updatedDocument: DIDDocument = {
        ...currentDID,
        services: values.services || [],
        updated: Math.floor(Date.now() / 1000), // 更新时间戳
      };

      const response = await didApi.update(values.did, {
        signing_key: values.signing_key,
        document: updatedDocument,
      });

      if (response.success) {
        Modal.success({
          title: '更新成功',
          content: 'DID文档已成功更新',
          onOk: () => {
            form.resetFields();
            setCurrentDID(null);
          },
        });
      } else {
        setError(response.error?.message || '更新DID失败');
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || '更新DID时发生错误');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Card>
        <Title level={2}>更新DID</Title>
        <Paragraph className="mb-6">
          更新DID文档信息，如添加或修改服务端点。请先输入DID标识符获取当前文档。
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
          >
            <Space>
              <Input placeholder="请输入DID标识符" />
              <Button
                onClick={() => handleResolve(form.getFieldValue('did'))}
                loading={resolving}
              >
                获取文档
              </Button>
            </Space>
          </Form.Item>

          <Form.Item
            label="签名密钥"
            name="signing_key"
            rules={[{ required: true, message: '请输入签名密钥' }]}
            help="请输入Base58编码的Ed25519私钥"
          >
            <Input.Password placeholder="请输入用于签名的私钥" />
          </Form.Item>

          <Form.List name="services">
            {(fields, { add, remove }) => (
              <div className="mb-4">
                <Form.Item label="服务端点">
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<PlusOutlined />}
                  >
                    添加服务端点
                  </Button>
                </Form.Item>
                {fields.map((field, index) => (
                  <Card
                    key={field.key}
                    size="small"
                    className="mb-4"
                    title={`服务端点 ${index + 1}`}
                    extra={
                      <MinusCircleOutlined
                        onClick={() => remove(field.name)}
                        style={{ color: '#ff4d4f' }}
                      />
                    }
                  >
                    <Form.Item
                      {...field}
                      label="ID"
                      name={[field.name, 'id']}
                      rules={[{ required: true, message: '请输入服务ID' }]}
                    >
                      <Input placeholder="请输入服务ID" />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      label="类型"
                      name={[field.name, 'type_']}
                      rules={[{ required: true, message: '请输入服务类型' }]}
                    >
                      <Input placeholder="请输入服务类型" />
                    </Form.Item>

                    <Form.Item
                      {...field}
                      label="端点"
                      name={[field.name, 'endpoint']}
                      rules={[{ required: true, message: '请输入服务端点' }]}
                    >
                      <Input placeholder="请输入服务端点URL" />
                    </Form.Item>
                  </Card>
                ))}
              </div>
            )}
          </Form.List>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              disabled={!currentDID}
            >
              更新DID
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

        {currentDID && (
          <Alert
            message="当前DID文档已加载"
            description={
              <div>
                <p>DID: {currentDID.id}</p>
                <p>创建时间: {new Date(currentDID.created * 1000).toLocaleString()}</p>
                <p>更新时间: {new Date(currentDID.updated * 1000).toLocaleString()}</p>
              </div>
            }
            type="info"
            showIcon
          />
        )}
      </Card>
    </div>
  );
};

export default UpdateDID;