import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  StyleSheet,
  View,
  ActivityIndicator,
  StatusBar,
  Platform,
  TouchableOpacity,
  Text,
  Modal,
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

// Экраны клиента
import { ClientCatalogScreen } from "./src/screens/ClientCatalogScreen";
import { ClientAppointmentsScreen } from "./src/screens/ClientAppointmentsScreen";
import { ClientProfileScreen } from "./src/screens/ClientProfileScreen";
import { ClientBookingModal } from "./src/components/ClientBookingModal";

// Логин
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

  // Модалка авторизации
  const [loginModalVisible, setLoginModalVisible] = useState(false);

  // Инициализация при запуске
  useEffect(() => {
    const initApp = async () => {
      try {
        const user = await authStorage.getUser();
        if (user) {
          setCurrentUser(user);
          await loadSalonData(user);
          // Если у пользователя есть салон, открываем в режиме бизнеса
          if (user.ownedSalons && user.ownedSalons.length > 0) {
            setMode("business");
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

  const handleLoginSuccess = async (user: User, preferredMode?: AppMode) => {
    setCurrentUser(user);
    setLoginModalVisible(false);
    await loadSalonData(user);

    if (preferredMode) {
      setMode(preferredMode);
    } else if (user.ownedSalons && user.ownedSalons.length > 0) {
      setMode("business");
    } else {
      setMode("client");
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleLogout = async () => {
    await authStorage.removeUser();
    setCurrentUser(null);
    setCurrentSalon(null);
    setMode("client");
    setActiveClientTab("catalog");
    setActiveBusinessTab("journal");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleSwitchMode = (newMode: AppMode) => {
    if (newMode === "business" && !currentUser) {
      // Для бизнеса просим войти
      setLoginModalVisible(true);
      return;
    }
    Haptics.selectionAsync();
    setMode(newMode);
  };

  // Открытие модалки онлайн-записи клиентом
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

      {/* Верхний переключатель режимов [ Клиент | Бизнес ] */}
      <View style={styles.topModeBar}>
        <View style={styles.modeToggle}>
          <TouchableOpacity
            style={[styles.modeToggleBtn, mode === "client" && styles.modeToggleBtnActive]}
            onPress={() => handleSwitchMode("client")}
          >
            <Text
              style={[
                styles.modeToggleText,
                mode === "client" && styles.modeToggleTextActive,
              ]}
            >
              💇 Клиент
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.modeToggleBtn, mode === "business" && styles.modeToggleBtnActive]}
            onPress={() => handleSwitchMode("business")}
          >
            <Text
              style={[
                styles.modeToggleText,
                mode === "business" && styles.modeToggleTextActive,
              ]}
            >
              💼 Бизнес (CRM)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.container}>
        {/* РЕЖИМ БИЗНЕСА */}
        {mode === "business" && (
          <>
            {activeBusinessTab === "journal" && <JournalScreen salon={currentSalon} />}
            {activeBusinessTab === "clients" && <ClientsScreen salon={currentSalon} />}
            {activeBusinessTab === "finance" && <FinanceScreen salon={currentSalon} />}
            {activeBusinessTab === "salon" && (
              <ProfileScreen
                salon={currentSalon}
                currentUser={currentUser}
                onLogout={handleLogout}
                onSwitchToClient={() => handleSwitchMode("client")}
              />
            )}
          </>
        )}

        {/* РЕЖИМ КЛИЕНТА */}
        {mode === "client" && (
          <>
            {activeClientTab === "catalog" && (
              <ClientCatalogScreen
                onSelectSalonForBooking={handleOpenBooking}
                onSwitchToBusiness={() => handleSwitchMode("business")}
              />
            )}
            {activeClientTab === "my-bookings" && (
              <ClientAppointmentsScreen
                currentUser={currentUser}
                onGoToCatalog={() => setActiveClientTab("catalog")}
                onRequireLogin={() => setLoginModalVisible(true)}
              />
            )}
            {activeClientTab === "client-profile" && (
              <ClientProfileScreen
                currentUser={currentUser}
                onSwitchToBusiness={() => handleSwitchMode("business")}
                onLogout={handleLogout}
                onRequireLogin={() => setLoginModalVisible(true)}
              />
            )}
          </>
        )}

        {/* Нижний таббар */}
        <TabBar mode={mode} currentTab={currentTab} onSelectTab={handleSelectTab} />
      </View>

      {/* Модалка онлайн-бронирования */}
      <ClientBookingModal
        visible={bookingModalVisible}
        salon={bookingSalon}
        initialService={bookingService}
        currentUser={currentUser}
        onClose={() => setBookingModalVisible(false)}
        onBookingSuccess={handleBookingCompleted}
      />

      {/* Модалка входа */}
      <Modal
        visible={loginModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setLoginModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: "#f5f5f7" }}>
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onContinueAsGuest={() => setLoginModalVisible(false)}
          />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#ffffff",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  topModeBar: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
    alignItems: "center",
  },
  modeToggle: {
    flexDirection: "row",
    backgroundColor: "#f5f5f7",
    borderRadius: 14,
    padding: 3,
    width: "100%",
    maxWidth: 320,
  },
  modeToggleBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 11,
    alignItems: "center",
  },
  modeToggleBtnActive: {
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8e8e93",
  },
  modeToggleTextActive: {
    color: "#111111",
    fontWeight: "700",
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
