import React from 'react';
import styled from 'styled-components';
import { Subject } from '@/types';
import SubjectCard from './SubjectCard';

interface Props {
  subjects: Subject[];
  onClick?: (subject: Subject) => void;
  onSelect?: (subject: Subject) => void; // onSelect를 선택적 prop으로 추가
}

const List = styled.div`
  display: flex;
  flex-direction: column;

  font-size: ${({ theme }) => theme.typography.T5.fontSize};
  font-weight: ${({ theme }) => theme.typography.T5.fontWeight};
  font-family: ${({ theme }) => theme.typography.T5.fontFamily};
  line-height: ${({ theme }) => theme.typography.T5.lineHeight};
`;

const SubjectList: React.FC<Props> = ({ subjects, onClick, onSelect }) => {
  const handleClick = (subject: Subject) => {
    // onClick이 있으면 onClick을, 없으면 onSelect를 호출
    if (onClick) {
      onClick(subject);
    } else if (onSelect) {
      onSelect(subject);
    }
  };

  return (
    <List>
      {subjects.map((subject) => (
        <SubjectCard
          key={`${subject.code}-${subject.group}`}
          subject={subject}
          onClick={() => handleClick(subject)}
        />
      ))}
    </List>
  );
};

export default SubjectList;