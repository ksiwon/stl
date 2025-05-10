import styled from 'styled-components';

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: 6px;
  font-size: ${({ theme }) => theme.typography.T5.fontSize};
  font-weight: ${({ theme }) => theme.typography.T5.fontWeight};
  font-family: ${({ theme }) => theme.typography.T5.fontFamily};
  line-height: ${({ theme }) => theme.typography.T5.lineHeight};

  &:focus {
    border-color: ${({ theme }) => theme.colors.primary};
    outline: none;
  }
`;

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<Props> = ({ value, onChange, placeholder }) => {
  return <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || '과목 검색'} />;
};

export default SearchBar;
