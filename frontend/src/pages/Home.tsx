import React from 'react';
import { Card, Row, Col, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, SearchOutlined, EditOutlined, StopOutlined } from '@ant-design/icons';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: '创建DID',
      icon: <PlusOutlined style={{ fontSize: '24px' }} />,
      description: '生成新的去中心化身份标识符，包含公钥和认证信息',
      path: '/create',
      buttonText: '开始创建',
    },
    {
      title: '解析DID',
      icon: <SearchOutlined style={{ fontSize: '24px' }} />,
      description: '查询并验证已存在的DID文档信息',
      path: '/resolve',
      buttonText: '立即查询',
    },
    {
      title: '更新DID',
      icon: <EditOutlined style={{ fontSize: '24px' }} />,
      description: '修改DID文档的内容，如添加服务端点或更新认证方法',
      path: '/update',
      buttonText: '更新文档',
    },
  ];

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">去中心化身份系统</h1>
        <p className="text-lg text-gray-600">
          基于区块链的分布式身份标识符（DID）管理平台
        </p>
      </div>

      <Row gutter={[24, 24]}>
        {features.map((feature) => (
          <Col xs={24} md={8} key={feature.title}>
            <Card
              hoverable
              className="h-full"
              actions={[
                <Button
                  type="primary"
                  icon={feature.icon}
                  onClick={() => navigate(feature.path)}
                >
                  {feature.buttonText}
                </Button>,
              ]}
            >
              <Card.Meta
                avatar={feature.icon}
                title={<span className="text-xl">{feature.title}</span>}
                description={<p className="mt-4">{feature.description}</p>}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <div className="mt-12 text-center">
        <h2 className="text-2xl font-semibold mb-4">为什么选择我们的DID系统？</h2>
        <Row gutter={[24, 24]} className="mt-8">
          <Col xs={24} md={8}>
            <h3 className="text-xl font-medium mb-2">去中心化</h3>
            <p className="text-gray-600">无需依赖中心化机构，数据由区块链网络维护</p>
          </Col>
          <Col xs={24} md={8}>
            <h3 className="text-xl font-medium mb-2">安全可靠</h3>
            <p className="text-gray-600">采用先进的密码学技术，确保身份信息的安全性</p>
          </Col>
          <Col xs={24} md={8}>
            <h3 className="text-xl font-medium mb-2">完全控制</h3>
            <p className="text-gray-600">用户完全掌控自己的身份数据和隐私信息</p>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default Home;