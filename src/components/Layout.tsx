// components/Layout.tsx
import React from 'react';
import styled from 'styled-components';
import Header from './Header';
import Sidebar, { MenuItemType } from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  activeMenuItem: MenuItemType;
  onMenuItemClick: (item: MenuItemType) => void;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeMenuItem,
  onMenuItemClick
}) => {
  return (
    <LayoutContainer>
      <Header />
      <MainContent>
        <Sidebar activeItem={activeMenuItem} onMenuItemClick={onMenuItemClick} />
        <ContentArea>
          {children}
        </ContentArea>
      </MainContent>
    </LayoutContainer>
  );
};

const LayoutContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

const MainContent = styled.div`
  display: flex;
  flex: 1;
`;

const ContentArea = styled.main`
  flex: 1;
  padding: 24px;
  background-color: ${props => props.theme.colors.gray[100]};
  overflow-y: auto;
`;

export default Layout;