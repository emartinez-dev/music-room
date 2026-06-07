import { createContext, useContext, useState } from "react";
import { Snackbar } from "react-native-paper";

const SNACKBAR_DURATION = 3 * 1000;

type SnackbarContextType = {
  showSnackbar: (message: string) => void;
};

const SnackbarContext = createContext<SnackbarContextType>({
  showSnackbar: () => {},
});

export function SnackbarProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [message, setMessage] = useState("");

  const showSnackbar = (message: string) => {
    setMessage(message);
    setVisible(true);
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        visible={visible}
        onIconPress={() => {
          setVisible(false);
        }}
        onDismiss={() => {
          setVisible(false);
        }}
        duration={SNACKBAR_DURATION}
        className="mb-16"
      >
        {message}
      </Snackbar>
    </SnackbarContext.Provider>
  );
}

export const useSnackbar = () => useContext(SnackbarContext);
