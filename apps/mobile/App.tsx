import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ActivityIndicator,
  StatusBar,
  Platform,
} from "react-native";
import { StatusBar as ExpoStatusBar } from "expo-status-bar";
import { authStorage } from "./src/services/auth";
import { api } from "./src/services/api";
import { User, Salon } from "./src/types";
import { TabBar, TabKey } from "./src/components/TabBar";
import { LoginScreen } from "./src/screens/LoginScreen";
import { JournalScreen } from "./src/screens/JournalScreen";
import { ClientsScreen } from "./src/screens/ClientsScreen";
import { FinanceScreen } from "./src/screens/FinanceScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSalon, setCurrentSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>("journal");

  // Проверка сохраненной сессии
  useEffect(() => {
    const initApp = async () => {
      try {
        const user = await authStorage.getUser();
        if (user) {
          setCurrentUser(user);
          await loadSalonData(user);
        }
      } catch (e) {
        console.error("Init app error:", e);
      } finally {
        setLoading(false);
      }
    };

    initApp();
  }, []);

  const loadSalonData = async (user?: User) => {
    try {
      const salons = await api.getSalons();
      if (salons.length > 0) {
        // Если у пользователя есть привязанный салон, ищем его
        let targetSalon = salons[0];
        if (user?.ownedSalons && user.ownedSalons.length > 0) {
          const found = salons.find((s) => s.id === user.ownedSalons![0].id);
          if (found) targetSalon = found;
        }
        // Загружаем полные данные салона
        const fullSalon = await api.getSalonBySlug(targetSalon.slug);
        setCurrentSalon(fullSalon || targetSalon);
      }
    } catch (e) {
      console.error("Error loading salon data:", e);
    }
  };

  const handleLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    await loadSalonData(user);
  };

  const handleLogout = async () => {
    await authStorage.removeUser();
    setCurrentUser(null);
    setCurrentSalon(null);
    setActiveTab("journal");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111111" />
      </View>
    );
  }

  // Если не авторизован -> показываем экран логина
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ExpoStatusBar style="dark" />
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />
      <View style={styles.container}>
        {activeTab === "journal" && <JournalScreen salon={currentSalon} />}
        {activeTab === "clients" && <ClientsScreen salon={currentSalon} />}
        {activeTab === "finance" && <FinanceScreen salon={currentSalon} />}
        {activeTab === "salon" && (
          <ProfileScreen
            salon={currentSalon}
            currentUser={currentUser}
            onLogout={handleLogout}
          />
        )}

        <TabBar currentTab={activeTab} onSelectTab={setActiveTab} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
});
