import React from 'react';
import styled from 'styled-components';
import { Subject } from '@/types';

interface Props {
  subject: Subject;
  onClick?: () => void;
}

const Card = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  background-color: ${({ theme }) => theme.colors.white};
  cursor: pointer;

  font-size: ${({ theme }) => theme.typography.T5.fontSize};
  font-weight: ${({ theme }) => theme.typography.T5.fontWeight};
  font-family: ${({ theme }) => theme.typography.T5.fontFamily};
  line-height: ${({ theme }) => theme.typography.T5.lineHeight};
`;

const SubjectCard: React.FC<Props> = ({ subject, onClick }) => {
  return (
    <Card onClick={onClick}>
      <div>{subject.title}</div>
      <div>{subject.prof.join(', ')}</div>
      <div>{subject.where}</div>
    </Card>
  );
};

export default SubjectCard;
