// src/contexts/ChatContext.tsx
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// 메시지 타입 정의
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
}

// 추천 결과 타입 정의
export interface RecommendationResult {
  subjects: any[]; // Subject 타입을 여기서는 any로 처리
  explanation: string;
}

// ChatContext 타입 정의
interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  recommendationResult: RecommendationResult | null;
  addMessage: (message: Message) => void;
  setIsLoading: (loading: boolean) => void;
  setRecommendationResult: (result: RecommendationResult | null) => void;
  resetChat: () => void;
  clearChat: () => void;
}

// 초기 메시지
const INITIAL_MESSAGES: Message[] = [
  {
    role: 'system',
    content: '안녕하세요! 저는 당신의 시간표 작성을 도와드릴 AI 어시스턴트입니다. 전공, 학년, 듣고 싶은 수업, 오전 수업 선호 여부, 영어 강의 여부, 필수 과목, 원하는 총 학점 등을 알려주시면 최적의 시간표를 추천해 드릴게요.'
  },
  {
    role: 'assistant',
    content: '안녕하세요! 저는 당신의 시간표 작성을 도와드릴 AI 어시스턴트입니다. 어떤 도움이 필요하신가요? 전공, 학년, 듣고 싶은 수업, 오전 수업 선호 여부, 영어 강의 여부, 필수 과목, 원하는 총 학점 등을 알려주시면 최적의 시간표를 추천해 드릴게요.'
  }
];

// Context 생성
const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Provider Props 타입
interface ChatProviderProps {
  children: ReactNode;
}

// ChatProvider 컴포넌트
export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [recommendationResult, setRecommendationResult] = useState<RecommendationResult | null>(null);

  // 메시지 추가 함수
  const addMessage = useCallback((message: Message) => {
    const messageWithTimestamp = {
      ...message,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, messageWithTimestamp]);
  }, []);

  // 채팅 초기화 (초기 메시지로 되돌리기)
  const resetChat = useCallback(() => {
    setMessages(INITIAL_MESSAGES);
    setRecommendationResult(null);
    setIsLoading(false);
  }, []);

  // 채팅 완전 삭제 (빈 배열로 만들기)
  const clearChat = useCallback(() => {
    setMessages([]);
    setRecommendationResult(null);
    setIsLoading(false);
  }, []);

  const value: ChatContextType = {
    messages,
    isLoading,
    recommendationResult,
    addMessage,
    setIsLoading,
    setRecommendationResult,
    resetChat,
    clearChat
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

// Hook for using ChatContext
export const useChat = (): ChatContextType => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};