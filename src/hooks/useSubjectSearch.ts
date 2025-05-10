import { useState } from 'react';
import { Subject } from '@/types';

export const useSubjectSearch = (subjects: Subject[]) => {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState<number | null>(null);

  const filtered = subjects.filter((s) => {
    const matchesQuery = s.title.includes(query) || s.code.includes(query);
    const matchesType = !typeFilter || s.type === typeFilter;
    const matchesDept = deptFilter === null || s.dept === deptFilter;
    return matchesQuery && matchesType && matchesDept;
  });

  return {
    query,
    setQuery,
    typeFilter,
    setTypeFilter,
    deptFilter,
    setDeptFilter,
    filtered,
  };
};
