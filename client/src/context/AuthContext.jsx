import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sf_token'));
  const [currentUser, setCurrentUser] = useState(() => {
    const u = localStorage.getItem('sf_user');
    return u ? JSON.parse(u) : null;
  });

  function login(token, user) {
    localStorage.setItem('sf_token', token);
    localStorage.setItem('sf_user', JSON.stringify(user));
    setToken(token);
    setCurrentUser(user);
  }

  function logout() {
    localStorage.removeItem('sf_token');
    localStorage.removeItem('sf_user');
    setToken(null);
    setCurrentUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, currentUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
