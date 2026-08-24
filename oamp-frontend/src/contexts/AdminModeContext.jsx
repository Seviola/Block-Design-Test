import { createContext, useContext, useState, useCallback } from "react";

const AdminModeContext = createContext({
  adminMode: false,
  showPinDialog: false,
  setShowPinDialog: () => {},
  attemptActivate: () => false,
  deactivate: () => {},
});

export function AdminModeProvider({ children }) {
  const [adminMode, setAdminMode] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);

  const attemptActivate = useCallback((pin) => {
    const expected = import.meta.env.VITE_ADMIN_PIN || "7890";
    if (pin === expected) {
      setAdminMode(true);
      setShowPinDialog(false);
      return true;
    }
    return false;
  }, []);

  const deactivate = useCallback(() => {
    setAdminMode(false);
  }, []);

  return (
    <AdminModeContext.Provider
      value={{ adminMode, showPinDialog, setShowPinDialog, attemptActivate, deactivate }}
    >
      {children}
    </AdminModeContext.Provider>
  );
}

export function useAdminMode() { // eslint-disable-line react-refresh/only-export-components
  return useContext(AdminModeContext);
}
