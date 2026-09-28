import AsyncStorage from "@react-native-async-storage/async-storage";
import { User } from "../types";

const USER_STORAGE_KEY = "@dikidi_mobile_user";

export const authStorage = {
  getUser: async (): Promise<User | null> => {
    try {
      const data = await AsyncStorage.getItem(USER_STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  setUser: async (user: User): Promise<void> => {
    try {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error("Error saving user to storage:", e);
    }
  },

  removeUser: async (): Promise<void> => {
    try {
      await AsyncStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.error("Error removing user from storage:", e);
    }
  },
};
