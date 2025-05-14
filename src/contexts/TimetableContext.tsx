// src/contexts/TimetableContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Subject } from '../types/subject';
import { hasSubjectConflict } from '../utils/subjectUtils';

interface TimetableContextType {
  selectedSubjects: Subject[];
  addSubject: (subject: Subject) => { success: boolean; message: string };
  removeSubject: (subjectId: string) => void;
}

const TimetableContext = createContext<TimetableContextType | undefined>(undefined);

export const TimetableProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);

  const addSubject = (subject: Subject) => {
    // 이미 추가된 과목인지 확인
    if (selectedSubjects.some(s => s.id === subject.id)) {
      return { success: false, message: '이미 추가된 과목입니다.' };
    }

    // 시간 충돌 확인
    const hasConflict = selectedSubjects.some(selected => 
      hasSubjectConflict(subject, selected)
    );

    if (hasConflict) {
      return { success: false, message: '다른 과목과 시간이 겹칩니다.' };
    }

    // 과목 추가
    setSelectedSubjects(prev => [...prev, subject]);
    return { success: true, message: `'${subject.name}' 과목이 시간표에 추가되었습니다.` };
  };

  const removeSubject = (subjectId: string) => {
    setSelectedSubjects(prev => prev.filter(subject => subject.id !== subjectId));
  };

  return (
    <TimetableContext.Provider value={{ selectedSubjects, addSubject, removeSubject }}>
      {children}
    </TimetableContext.Provider>
  );
};

export const useTimetable = () => {
  const context = useContext(TimetableContext);
  if (context === undefined) {
    throw new Error('useTimetable must be used within a TimetableProvider');
  }
  return context;
};
