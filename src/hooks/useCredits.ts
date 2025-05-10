import { Subject } from '@/types';

export const useCredits = (selected: Subject[]) => {
  return selected.reduce((total, s) => total + (s.credit ?? 0), 0);
};
