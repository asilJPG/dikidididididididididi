import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  Platform,
} from "react-native";
import {
  Store,
  MapPin,
  Star,
  ExternalLink,
  Share2,
  Copy,
  LogOut,
  Send,
  Scissors,
} from "lucide-react-native";
import { Salon, User } from "../types";
import { API_BASE_URL, formatUZS } from "../config";

interface ProfileScreenProps {
  salon: Salon | null;
  currentUser: User | null;
  onLogout: () => void;
  onSwitchToClient: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  salon,
  currentUser,
  onLogout,
  onSwitchToClient,
}) => {
  const [copied, setCopied] = useState(false);

  if (!salon) return null;

  const bookingUrl = `${API_BASE_URL}/b/${salon.slug}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Онлайн-запись в ${salon.name}:\n${bookingUrl}`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenWidget = () => {
    Linking.openURL(bookingUrl);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Мой салон</Text>
        <Text style={styles.subtitle}>Профиль и онлайн-запись</Text>
      </View>

      <View style={styles.content}>
        {/* Карточка салона */}
        <View style={styles.salonCard}>
          <View style={styles.salonHeader}>
            <View style={styles.salonIcon}>
              <Store size={22} color="#111111" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.salonTitle}>{salon.name}</Text>
              <View style={styles.addressRow}>
                <MapPin size={12} color="#8e8e93" />
                <Text style={styles.addressText}>{salon.address}</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Star size={12} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{salon.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Ссылка на онлайн-запись */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ссылка на онлайн-запись</Text>
          <Text style={styles.cardSub}>
            Разместите в описании профиля Instagram и в Telegram-канале
          </Text>

          <View style={styles.urlBox}>
            <Text style={styles.urlText} numberOfLines={1}>
              {bookingUrl}
            </Text>
          </View>

          <View style={styles.urlActions}>
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
              <Share2 size={16} color="#ffffff" />
              <Text style={styles.shareBtnText}>Поделиться ссылкой</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleOpenWidget} style={styles.openBtn}>
              <ExternalLink size={16} color="#111111" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Интеграция с Telegram */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Send size={16} color="#229ED9" />
            <Text style={styles.cardTitle}>Telegram Mini App</Text>
          </View>
          <Text style={styles.cardSub}>
            Клиенты могут записываться прямо в Telegram без скачивания приложений.
            Бесплатные уведомления и напоминания отправляются автоматически через бота.
          </Text>
        </View>

        {/* Мастера салона */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Мастера ({salon.staff.length})</Text>
          <View style={styles.staffList}>
            {salon.staff.map((st) => (
              <View key={st.id} style={styles.staffItem}>
                <View style={styles.staffAvatar}>
                  <Text style={styles.staffAvatarText}>
                    {st.fullName.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.staffName}>{st.fullName}</Text>
                  <Text style={styles.staffRole}>{st.specialty}</Text>
                </View>
                <Text style={styles.staffPercent}>{st.commissionPercent}%</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Услуги */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Прайс-лист ({salon.services.length})</Text>
          <View style={styles.serviceList}>
            {salon.services.map((srv) => (
              <View key={srv.id} style={styles.serviceItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.srvName}>{srv.nameRu}</Text>
                  <Text style={styles.srvDuration}>{srv.durationMinutes} мин</Text>
                </View>
                <Text style={styles.srvPrice}>{formatUZS(srv.price)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Переключение в режим клиента */}
        <TouchableOpacity
          onPress={onSwitchToClient}
          style={styles.clientSwitchBtn}
        >
          <Text style={styles.clientSwitchBtnText}>💇 Переключиться в режим клиента</Text>
        </TouchableOpacity>

        {/* Кнопка выхода */}
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <LogOut size={16} color="#e11d48" />
          <Text style={styles.logoutBtnText}>Выйти из аккаунта</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  topBar: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },
  subtitle: {
    fontSize: 11,
    color: "#8e8e93",
    marginTop: 2,
  },
  content: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  salonCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  salonHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  salonIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  salonTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  addressText: {
    fontSize: 11,
    color: "#8e8e93",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400e",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
  },
  cardSub: {
    fontSize: 11,
    color: "#8e8e93",
    marginTop: 4,
    lineHeight: 16,
  },
  urlBox: {
    backgroundColor: "#f5f5f7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  urlText: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#111111",
  },
  urlActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  shareBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#111111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shareBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  openBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  staffList: {
    marginTop: 10,
    gap: 8,
  },
  staffItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
  },
  staffAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  staffAvatarText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111111",
  },
  staffName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111111",
  },
  staffRole: {
    fontSize: 10,
    color: "#8e8e93",
  },
  staffPercent: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
  },
  serviceList: {
    marginTop: 10,
    gap: 8,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  srvName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#111111",
  },
  srvDuration: {
    fontSize: 10,
    color: "#8e8e93",
  },
  srvPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111111",
  },
  clientSwitchBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  clientSwitchBtnText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "700",
  },
  logoutBtn: {
    marginTop: 4,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff1f2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutBtnText: {
    color: "#e11d48",
    fontSize: 13,
    fontWeight: "600",
  },
});
