import { createContext, useContext } from 'react';

export type ActionPaneType = 'create' | 'review-only' | 'post' | 'writeup' | 'meetup' | 'group';

interface ActionPaneContextValue {
  activePane: ActionPaneType | null;
  openActionPane: (type: ActionPaneType) => void;
  closeActionPane: () => void;
}

export const ActionPaneContext = createContext<ActionPaneContextValue>({
  activePane: null,
  openActionPane: () => {},
  closeActionPane: () => {},
});

export function useActionPane() {
  return useContext(ActionPaneContext);
}
