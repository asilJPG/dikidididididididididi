import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Alert,
} from "react-native";
import {
  User as UserIcon,
  Briefcase,
  Phone,
  MessageCircle,
  LogOut,
  ChevronRight,
  ShieldCheck,
  Globe,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { User } from "../types";

interface ClientProfileScreenProps {
  currentUser: User | null;
  onLogout: () => void;
  onRequireLogin: () => void;
}

export const ClientProfileScreen: React.FC<ClientProfileScreenProps> = ({
  currentUser,
  onLogout,
  onRequireLogin,
}) => {
  const handleOpenSupport = () => {
    Linking.openURL("https://t.me/dikidi_uz_support");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Шапка профиля */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {currentUser?.fullName ? currentUser.fullName.slice(0, 1).toUpperCase() : "К"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {currentUser?.fullName || "Гость приложения"}
          </Text>
          <Text style={styles.userPhone}>
            {currentUser?.phone || "Не авторизован"}
          </Text>
        </View>
        {!currentUser && (
          <TouchableOpacity style={styles.loginSmallBtn} onPress={onRequireLogin}>
            <Text style={styles.loginSmallBtnText}>Войти</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Настройки и информация */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>СЕРВИС И ПОДДЕРЖКА</Text>

        <TouchableOpacity style={styles.menuItem} onPress={handleOpenSupport}>
          <View style={styles.menuIcon}>
            <MessageCircle size={18} color="#111111" />
          </View>
          <Text style={styles.menuTitle}>Поддержка в Telegram</Text>
          <ChevronRight size={16} color="#8e8e93" />
        </TouchableOpacity>

        <View style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <Globe size={18} color="#111111" />
          </View>
          <Text style={styles.menuTitle}>Язык приложения</Text>
          <Text style={styles.menuValue}>Русский (UZ)</Text>
        </View>

        <View style={styles.menuItem}>
          <View style={styles.menuIcon}>
            <ShieldCheck size={18} color="#111111" />
          </View>
          <Text style={styles.menuTitle}>Политика конфиденциальности</Text>
          <ChevronRight size={16} color="#8e8e93" />
        </View>
      </View>

      {/* Выход из аккаунта */}
      {currentUser && (
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={() => {
            Alert.alert("Выход", "Вы действительно хотите выйти из аккаунта?", [
              { text: "Отмена", style: "cancel" },
              { text: "Выйти", style: "destructive", onPress: onLogout },
            ]);
          }}
        >
          <LogOut size={16} color="#e11d48" />
          <Text style={styles.logoutBtnText}>Выйти из аккаунта</Text>
        </TouchableOpacity>
      )}

      <Text style={styles.versionText}>DIKIDI Uzbekistan v1.0.0 (Unified)</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  content: {
    padding: 16,
    gap: 16,
  },
  userCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "800",
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
  userPhone: {
    fontSize: 12,
    color: "#8e8e93",
  },
  loginSmallBtn: {
    backgroundColor: "#111111",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  loginSmallBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  businessSwitchCard: {
    backgroundColor: "#111111",
    borderRadius: 22,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  switchIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  switchTextBox: {
    flex: 1,
    gap: 2,
  },
  switchTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#ffffff",
  },
  switchSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    lineHeight: 15,
  },
  section: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8e8e93",
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
    gap: 12,
  },
  menuIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "600",
    color: "#111111",
  },
  menuValue: {
    fontSize: 12,
    color: "#8e8e93",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#fff1f2",
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 4,
  },
  logoutBtnText: {
    color: "#e11d48",
    fontSize: 13,
    fontWeight: "600",
  },
  versionText: {
    textAlign: "center",
    fontSize: 10,
    color: "#8e8e93",
    marginTop: 12,
  },
});
