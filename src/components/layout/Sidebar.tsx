import styled from 'styled-components';

const SidebarWrapper = styled.aside`
  width: 260px;
  height: 100vh;
  padding: 16px;
  background-color: ${({ theme }) => theme.colors.gray[100]};
  overflow-y: auto;
`;

interface SidebarProps {
  children?: React.ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ children }) => {
  return <SidebarWrapper>{children}</SidebarWrapper>;
};

export default Sidebar;
