import styled from 'styled-components';
import Header from './Header';
import Footer from './Footer';

const LayoutWrapper = styled.div`
  display: flex;
  height: 100vh;
  flex-direction: column;
`;

const Content = styled.main`
  display: flex;
  flex: 1;
  overflow: hidden;
`;

interface Props {
  sidebar?: React.ReactNode;
  children: React.ReactNode;
}

const MainLayout: React.FC<Props> = ({ sidebar, children }) => {
  return (
    <LayoutWrapper>
      <Header />
      <Content>
        {sidebar}
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </Content>
      <Footer />
    </LayoutWrapper>
  );
};

export default MainLayout;
