import React, {
  useEffect,
  useState,
  useCallback,
  useContext,
  PropsWithChildren,
  useMemo,
} from 'react';
import { SocketUser, Maybe } from 'types';
import useSocketIo, { useSocketListener } from '../SocketIoContext';
import { storeToken } from 'utils';
import ViewerFormModal from './components/ViewerFormModal';
import useDialogState from 'components/BaseDialog/hooks/useBaseDialog';

interface ViewerContextValue {
  viewer: Maybe<SocketUser>;
  isEditing: boolean;
  startEditing: VoidFunction;
  finishEditing: VoidFunction;
}

const ViewerContext = React.createContext<ViewerContextValue>(
  {} as ViewerContextValue
);

export function useViewer() {
  const viewer = useContext(ViewerContext);
  return viewer;
}

type ViewerProviderProps = React.PropsWithChildren<{}>;

function ViewerProvider({ children }: ViewerProviderProps) {
  const [viewer, setViewer] = useState<Maybe<SocketUser>>(null);

  const io = useSocketIo();

  const getViewerInfo = useCallback(() => {
    io?.emit('who am i', (socketUser: SocketUser, token: string) => {
      storeToken(token);
      setViewer(socketUser);
    });
  }, [io]);

  useEffect(() => {
    getViewerInfo();
  }, [getViewerInfo]);

  useSocketListener('reconnect', getViewerInfo);

  const handleViewerChange = useCallback(
    (socketUser: SocketUser) => {
      if (socketUser.id === viewer?.id) {
        setViewer(socketUser);
      }
    },
    [viewer]
  );

  useSocketListener('edit user', handleViewerChange);

  const { isOpen, openDialog, closeDialog } = useDialogState();

  const contextValue = useMemo<ViewerContextValue>(
    () => ({
      viewer,
      isEditing: isOpen,
      startEditing: openDialog,
      finishEditing: closeDialog,
    }),
    [closeDialog, isOpen, openDialog, viewer]
  );

  return (
    <>
      <ViewerContext.Provider value={contextValue}>
        {children}
        <ViewerFormModal />
      </ViewerContext.Provider>
    </>
  );
}

export default ViewerProvider;
