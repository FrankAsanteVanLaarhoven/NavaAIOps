'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

export type ViewType = 'onboarding' | 'main-chat' | 'settings' | 'profile';

export interface ViewState {
  view: ViewType;
  workspaceId?: string;
  channelId?: string;
  threadId?: string;
  // For thread overlay
  isThreadOpen?: boolean;
}

interface ViewContextType {
  viewState: ViewState;
  setView: (view: ViewType) => void;
  setChannel: (channelId: string) => void;
  setThread: (threadId: string | null) => void;
  openThread: (threadId: string) => void;
  closeThread: () => void;
  navigateToMainChat: (channelId?: string) => void;
}

const ViewContext = createContext<ViewContextType | undefined>(undefined);

export function ViewProvider({ children }: { children: ReactNode }) {
  const [viewState, setViewState] = useState<ViewState>({
    view: 'main-chat',
  });

  const setView = (view: ViewType) => {
    setViewState((prev) => ({ ...prev, view }));
  };

  const setChannel = (channelId: string) => {
    setViewState((prev) => ({
      ...prev,
      channelId,
      threadId: undefined,
      isThreadOpen: false,
    }));
  };

  const setThread = (threadId: string | null) => {
    setViewState((prev) => ({
      ...prev,
      threadId: threadId || undefined,
      isThreadOpen: !!threadId,
    }));
  };

  const openThread = (threadId: string) => {
    setViewState((prev) => ({
      ...prev,
      threadId,
      isThreadOpen: true,
    }));
  };

  const closeThread = () => {
    setViewState((prev) => ({
      ...prev,
      isThreadOpen: false,
      threadId: undefined,
    }));
  };

  const navigateToMainChat = (channelId?: string) => {
    setViewState({
      view: 'main-chat',
      channelId,
      threadId: undefined,
      isThreadOpen: false,
    });
  };

  return (
    <ViewContext.Provider
      value={{
        viewState,
        setView,
        setChannel,
        setThread,
        openThread,
        closeThread,
        navigateToMainChat,
      }}
    >
      {children}
    </ViewContext.Provider>
  );
}

export function useView() {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error('useView must be used within ViewProvider');
  }
  return context;
}
