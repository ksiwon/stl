import styled from 'styled-components';

const Summary = styled.div`
  background: ${({ theme }) => theme.colors.gray[100]};
  padding: 10px 16px;
  border-radius: 6px;
  text-align: right;
  font-size: ${({ theme }) => theme.typography.T6.fontSize};
  font-weight: ${({ theme }) => theme.typography.T6.fontWeight};
  font-family: ${({ theme }) => theme.typography.T6.fontFamily};
  line-height: ${({ theme }) => theme.typography.T6.lineHeight};
`;

interface Props {
  total: number;
  max?: number;
}

const CreditSummary: React.FC<Props> = ({ total, max = 21 }) => {
  return <Summary>총 학점: {total} / {max}</Summary>;
};

export default CreditSummary;
