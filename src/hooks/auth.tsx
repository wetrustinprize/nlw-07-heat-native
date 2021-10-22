import React, { createContext, useContext, useEffect, useState } from "react";
import * as AuthSessions from "expo-auth-session";
import { api } from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CLIENT_ID = "af1a86aeaa885ae3b712";
const SCOPE = "read:user";

const USER_STORAGE = "@nlw-07-heat-native:user";
const TOKEN_STORAGE = "@nlw-07-heat-native:token";

type User = {
  id: string;
  avatar_url: string;
  name: string;
  login: string;
};

type AuthContextData = {
  user: User | null;
  isSignIng: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

type AuthResponse = {
  token: string;
  user: User;
};

type AuthorizationResponse = {
  params: {
    code?: string;
    error?: string;
  };
  type?: string;
};

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthContext = createContext({} as AuthContextData);

const AuthProvider = ({ children }: AuthProviderProps) => {
  const [isSignIng, setIsSignIng] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  const signIn = async () => {
    try {
      setIsSignIng(true);

      const authUrl = `https://github.com/login/oauth/authorize?client_id=${CLIENT_ID}&scope=${SCOPE}`;
      const authSessionResponse = (await AuthSessions.startAsync({
        authUrl,
      })) as AuthorizationResponse;

      if (
        authSessionResponse.type == "success" &&
        authSessionResponse.params.error !== "access_denied"
      ) {
        const authResponse = await api.post<AuthResponse>("/authenticate", {
          code: authSessionResponse.params.code,
        });
        const { user, token } = authResponse.data;

        api.defaults.headers.common["authorization"] = `Bearer ${token}`;
        await AsyncStorage.setItem(USER_STORAGE, JSON.stringify(user));
        await AsyncStorage.setItem(TOKEN_STORAGE, token);

        setUser(user);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsSignIng(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    await AsyncStorage.removeItem(USER_STORAGE);
    await AsyncStorage.removeItem(TOKEN_STORAGE);
  };

  useEffect(() => {
    const loadUserStorageData = async () => {
      const userStorage = await AsyncStorage.getItem(USER_STORAGE);
      const tokenStorage = await AsyncStorage.getItem(TOKEN_STORAGE);

      if (userStorage && tokenStorage) {
        api.defaults.headers.common["authorization"] = `Bearer ${tokenStorage}`;
        setUser(JSON.parse(userStorage));
      }
      setIsSignIng(false);
    };

    loadUserStorageData();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        signIn,
        signOut,
        user,
        isSignIng,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const useAuth = () => {
  const context = useContext(AuthContext);

  return context;
};

export { AuthProvider, useAuth };
