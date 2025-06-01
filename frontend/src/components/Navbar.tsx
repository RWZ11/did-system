import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'antd';
import { HomeOutlined, PlusOutlined, SearchOutlined, EditOutlined } from '@ant-design/icons';

const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
    },
    {
      key: '/create',
      icon: <PlusOutlined />,
      label: '创建DID',
    },
    {
      key: '/resolve',
      icon: <SearchOutlined />,
      label: '解析DID',
    },
    {
      key: '/update',
      icon: <EditOutlined />,
      label: '更新DID',
    },
  ];

  return (
    <Menu
      theme="dark"
      mode="horizontal"
      selectedKeys={[location.pathname]}
      items={menuItems}
      onClick={({ key }) => navigate(key)}
      style={{ lineHeight: '64px' }}
    />
  );
};

export default Navbar;