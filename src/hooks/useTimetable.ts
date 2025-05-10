import { useState } from 'react';
import { Subject } from '@/types';

export const useTimetable = () => {
  const [selected, setSelected] = useState<Subject[]>([]);

  const addSubject = (subject: Subject) => {
    if (!isConflict(subject)) {
      setSelected((prev) => [...prev, subject]);
    }
  };

  const removeSubject = (subject: Subject) => {
    setSelected((prev) =>
      prev.filter((s) => !(s.code === subject.code && s.group === subject.group))
    );
  };

  const isConflict = (newSubject: Subject): boolean => {
    return selected.some((s) =>
      s.time.some((t1) =>
        newSubject.time.some(
          (t2) =>
            t1.date === t2.date &&
            !(t1.eh <= t2.sh || t2.eh <= t1.sh) // 시간 겹침 여부 확인
        )
      )
    );
  };

  const clearAll = () => setSelected([]);

  return { selected, addSubject, removeSubject, isConflict, clearAll };
};
