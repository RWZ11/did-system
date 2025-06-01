import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout, ConfigProvider, theme } from 'antd';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateDID from './pages/CreateDID';
import ResolveDID from './pages/ResolveDID';
import UpdateDID from './pages/UpdateDID';

const { Header, Content, Footer } = Layout;

const App: React.FC = () => {
  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
        },
      }}
    >
      <Router>
        <Layout className="min-h-screen">
          <Header className="fixed w-full z-10">
            <Navbar />
          </Header>
          <Content className="mt-16 p-6">
            <div className="max-w-7xl mx-auto">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/create" element={<CreateDID />} />
                <Route path="/resolve" element={<ResolveDID />} />
                <Route path="/update" element={<UpdateDID />} />
              </Routes>
            </div>
          </Content>
          <Footer className="text-center">
            DID System ©{new Date().getFullYear()} Created with Rust & React
          </Footer>
        </Layout>
      </Router>
    </ConfigProvider>
  );
};

export default App;