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
import * as Haptics from "expo-haptics";
import { authStorage } from "./src/services/auth";
import { api } from "./src/services/api";
import { User, Salon, AppMode, Service } from "./src/types";
import {
  TabBar,
  TabKey,
  BusinessTabKey,
  ClientTabKey,
} from "./src/components/TabBar";

// Экраны бизнеса
import { JournalScreen } from "./src/screens/JournalScreen";
import { ClientsScreen } from "./src/screens/ClientsScreen";
import { FinanceScreen } from "./src/screens/FinanceScreen";
import { ProfileScreen } from "./src/screens/ProfileScreen";
import { BusinessAuthModal } from "./src/screens/BusinessAuthModal";

// Экраны клиента
import { ClientCatalogScreen } from "./src/screens/ClientCatalogScreen";
import { ClientAppointmentsScreen } from "./src/screens/ClientAppointmentsScreen";
import { ClientProfileScreen } from "./src/screens/ClientProfileScreen";
import { ClientBookingModal } from "./src/components/ClientBookingModal";

// Экран входа
import { LoginScreen } from "./src/screens/LoginScreen";

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentSalon, setCurrentSalon] = useState<Salon | null>(null);
  const [loading, setLoading] = useState(true);

  // Режим приложения: "client" или "business"
  const [mode, setMode] = useState<AppMode>("client");

  // Активные вкладки
  const [activeBusinessTab, setActiveBusinessTab] = useState<BusinessTabKey>("journal");
  const [activeClientTab, setActiveClientTab] = useState<ClientTabKey>("catalog");

  // Модалка онлайн-записи
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingSalon, setBookingSalon] = useState<Salon | null>(null);
  const [bookingService, setBookingService] = useState<Service | null>(null);

  // Модалка для бизнеса (логин по паролю или подача заявки с видео)
  const [businessAuthVisible, setBusinessAuthVisible] = useState(false);

  // Проверка сохраненной сессии при запуске
  useEffect(() => {
    const initApp = async () => {
      try {
        const user = await authStorage.getUser();
        if (user) {
          setCurrentUser(user);
          const hasSalon = user.ownedSalons && user.ownedSalons.length > 0;
          if (hasSalon || user.role === "SALON_OWNER" || user.role === "MASTER") {
            setMode("business");
            await loadSalonData(user);
          } else {
            setMode("client");
          }
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
        let targetSalon = salons[0];
        if (user?.ownedSalons && user.ownedSalons.length > 0) {
          const found = salons.find((s) => s.id === user.ownedSalons![0].id);
          if (found) targetSalon = found;
        }
        const fullSalon = await api.getSalonBySlug(targetSalon.slug);
        setCurrentSalon(fullSalon || targetSalon);
      }
    } catch (e) {
      console.error("Error loading salon data:", e);
    }
  };

  // Успешный вход через стандартную форму по SMS
  const handleLoginSuccess = async (user: User, isBusiness: boolean = false) => {
    setCurrentUser(user);
    if (isBusiness) {
      setMode("business");
      await loadSalonData(user);
    } else {
      setMode("client");
      setActiveClientTab("catalog");
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Успешный вход через форму бизнеса (по паролю)
  const handleBusinessLoginSuccess = async (user: User) => {
    setCurrentUser(user);
    setMode("business");
    setActiveBusinessTab("journal");
    await loadSalonData(user);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  // Выход из аккаунта -> возврат на первый экран (LoginScreen)
  const handleLogout = async () => {
    await authStorage.removeUser();
    setCurrentUser(null);
    setCurrentSalon(null);
    setMode("client");
    setActiveClientTab("catalog");
    setActiveBusinessTab("journal");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Открытие онлайн-бронирования клиентом
  const handleOpenBooking = (salon: Salon, service?: Service) => {
    setBookingSalon(salon);
    setBookingService(service || null);
    setBookingModalVisible(true);
  };

  const handleBookingCompleted = () => {
    setBookingModalVisible(false);
    setActiveClientTab("my-bookings");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#111111" />
      </View>
    );
  }

  // ЕСЛИ НЕ АВТОРИЗОВАН — ПЕРВЫЙ ЭКРАН ЭТО ЛОГИН
  if (!currentUser) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ExpoStatusBar style="dark" />
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onOpenBusinessAuth={() => setBusinessAuthVisible(true)}
        />
        <BusinessAuthModal
          visible={businessAuthVisible}
          onClose={() => setBusinessAuthVisible(false)}
          onLoginSuccess={handleBusinessLoginSuccess}
        />
      </SafeAreaView>
    );
  }

  const currentTab = mode === "business" ? activeBusinessTab : activeClientTab;

  const handleSelectTab = (tab: TabKey) => {
    if (mode === "business") {
      setActiveBusinessTab(tab as BusinessTabKey);
    } else {
      setActiveClientTab(tab as ClientTabKey);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="dark" />

      <View style={styles.container}>
        {/* РЕЖИМ БИЗНЕСА (ТОЛЬКО ДЛЯ ВЕРИФИЦИРОВАННЫХ САЛОНОВ И МАСТЕРОВ) */}
        {mode === "business" && (
          <>
            {activeBusinessTab === "journal" && (
              <JournalScreen salon={currentSalon} currentUser={currentUser} />
            )}
            {activeBusinessTab === "clients" && <ClientsScreen salon={currentSalon} />}
            {activeBusinessTab === "finance" && (
              <FinanceScreen salon={currentSalon} currentUser={currentUser} />
            )}
            {activeBusinessTab === "salon" && (
              <ProfileScreen
                salon={currentSalon}
                currentUser={currentUser}
                onLogout={handleLogout}
                onSwitchToClient={() => setMode("client")}
                onReloadSalon={() => loadSalonData(currentUser || undefined)}
              />
            )}
          </>
        )}

        {/* РЕЖИМ КЛИЕНТА (ОСНОВНОЙ ДЛЯ 99% ПОЛЬЗОВАТЕЛЕЙ) */}
        {mode === "client" && (
          <>
            {activeClientTab === "catalog" && (
              <ClientCatalogScreen onSelectSalonForBooking={handleOpenBooking} />
            )}
            {activeClientTab === "my-bookings" && (
              <ClientAppointmentsScreen
                currentUser={currentUser}
                onGoToCatalog={() => setActiveClientTab("catalog")}
                onRequireLogin={() => {}}
              />
            )}
            {activeClientTab === "client-profile" && (
              <ClientProfileScreen
                currentUser={currentUser}
                onLogout={handleLogout}
                onRequireLogin={() => {}}
              />
            )}
          </>
        )}

        {/* Нижний таббар */}
        <TabBar mode={mode} currentTab={currentTab} onSelectTab={handleSelectTab} />
      </View>

      {/* Модалка бронирования */}
      <ClientBookingModal
        visible={bookingModalVisible}
        salon={bookingSalon}
        initialService={bookingService}
        currentUser={currentUser}
        onClose={() => setBookingModalVisible(false)}
        onBookingSuccess={handleBookingCompleted}
      />

      {/* Модалка входа бизнеса и модерации */}
      <BusinessAuthModal
        visible={businessAuthVisible}
        onClose={() => setBusinessAuthVisible(false)}
        onLoginSuccess={handleBusinessLoginSuccess}
      />
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
