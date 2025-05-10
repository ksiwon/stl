import styled from 'styled-components';

const FooterWrapper = styled.footer`
  width: calc(100% - 48px);
  padding: 12px 24px;
  background-color: ${({ theme }) => theme.colors.gray[100]};
  color: ${({ theme }) => theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.typography.T7.fontSize};
  font-weight: ${({ theme }) => theme.typography.T7.fontWeight};
  font-family: ${({ theme }) => theme.typography.T7.fontFamily};
  line-height: ${({ theme }) => theme.typography.T7.lineHeight};
  text-align: center;
`;

const Footer: React.FC = () => {
  return <FooterWrapper>© 2025 STL 프로젝트 - 모든 권리 보유</FooterWrapper>;
};

export default Footer;
