import styled from 'styled-components';

const HeaderWrapper = styled.header`
  width: calc(100% - 48px);
  padding: 16px 24px;
  background-color: ${({ theme }) => theme.colors.primary};
  color: white;
  font-size: ${({ theme }) => theme.typography.T3.fontSize};
  font-weight: ${({ theme }) => theme.typography.T3.fontWeight};
  font-family: ${({ theme }) => theme.typography.T3.fontFamily};
`;

const Header: React.FC = () => {
  return <HeaderWrapper>STL 시간표 생성기</HeaderWrapper>;
};

export default Header;
