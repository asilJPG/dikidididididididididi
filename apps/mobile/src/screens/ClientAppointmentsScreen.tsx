import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Linking,
} from "react-native";
import {
  Calendar,
  Clock,
  MapPin,
  Phone,
  User as UserIcon,
  XCircle,
  Sparkles,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Appointment, User } from "../types";
import { api } from "../services/api";
import { StatusBadge } from "../components/StatusBadge";

interface ClientAppointmentsScreenProps {
  currentUser: User | null;
  onGoToCatalog: () => void;
  onRequireLogin: () => void;
}

export const ClientAppointmentsScreen: React.FC<ClientAppointmentsScreenProps> = ({
  currentUser,
  onGoToCatalog,
  onRequireLogin,
}) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTab, setFilterTab] = useState<"upcoming" | "past">("upcoming");

  const loadAppointments = async () => {
    if (!currentUser?.phone) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      const data = await api.getClientAppointments(currentUser.phone);
      setAppointments(data);
    } catch (e) {
      console.error("Error loading client appointments:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [currentUser]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const handleCancel = (appointment: Appointment) => {
    Alert.alert(
      "Отмена записи",
      `Вы уверены, что хотите отменить запись на ${appointment.service?.nameRu}?`,
      [
        { text: "Нет", style: "cancel" },
        {
          text: "Да, отменить",
          style: "destructive",
          onPress: async () => {
            const ok = await api.cancelAppointment(appointment.id);
            if (ok) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              loadAppointments();
            } else {
              Alert.alert("Ошибка", "Не удалось отменить запись");
            }
          },
        },
      ]
    );
  };

  const handleCall = (phone: string) => {
    const clean = phone.replace(/[^\d+]/g, "");
    Linking.openURL(`tel:${clean}`);
  };

  // Разделение на предстоящие и прошлые
  const now = new Date();
  const upcomingList = appointments.filter((a) => {
    const isPast = new Date(a.startDateTime) < now;
    return !isPast && a.status !== "CANCELLED";
  });

  const pastList = appointments.filter((a) => {
    const isPast = new Date(a.startDateTime) < now;
    return isPast || a.status === "CANCELLED";
  });

  const displayedList = filterTab === "upcoming" ? upcomingList : pastList;

  // Если не авторизован
  if (!currentUser) {
    return (
      <View style={styles.authPromptContainer}>
        <View style={styles.authPromptBox}>
          <Calendar size={36} color="#111111" />
          <Text style={styles.authPromptTitle}>Войдите по номеру телефона</Text>
          <Text style={styles.authPromptSub}>
            Чтобы видеть ваши записи, историю визитов и получать напоминания
          </Text>
          <TouchableOpacity style={styles.authPromptBtn} onPress={onRequireLogin}>
            <Text style={styles.authPromptBtnText}>Войти / Зарегистрироваться</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Селектор табов */}
      <View style={styles.tabSelector}>
        <TouchableOpacity
          style={[styles.tabBtn, filterTab === "upcoming" && styles.tabBtnActive]}
          onPress={() => setFilterTab("upcoming")}
        >
          <Text
            style={[styles.tabBtnText, filterTab === "upcoming" && styles.tabBtnTextActive]}
          >
            Предстоящие ({upcomingList.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, filterTab === "past" && styles.tabBtnActive]}
          onPress={() => setFilterTab("past")}
        >
          <Text
            style={[styles.tabBtnText, filterTab === "past" && styles.tabBtnTextActive]}
          >
            История ({pastList.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Список записей */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#111111" />
        </View>
      ) : (
        <FlatList
          data={displayedList}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Sparkles size={32} color="#8e8e93" />
              <Text style={styles.emptyTitle}>
                {filterTab === "upcoming" ? "Нет предстоящих записей" : "История пуста"}
              </Text>
              <Text style={styles.emptySub}>
                {filterTab === "upcoming"
                  ? "Выберите удобное время в одном из лучших салонов города"
                  : "Здесь будут отображаться ваши завершенные визиты"}
              </Text>
              {filterTab === "upcoming" && (
                <TouchableOpacity style={styles.emptyActionBtn} onPress={onGoToCatalog}>
                  <Text style={styles.emptyActionBtnText}>Найти салон в каталоге</Text>
                </TouchableOpacity>
              )}
            </View>
          }
          renderItem={({ item: appt }) => {
            const startDate = new Date(appt.startDateTime);
            const dateFormatted = startDate.toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "long",
              weekday: "short",
            });
            const timeFormatted = startDate.toLocaleTimeString("ru-RU", {
              hour: "2-digit",
              minute: "2-digit",
            });

            return (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <View>
                    <Text style={styles.salonName}>{appt.salon?.name || "Салон красоты"}</Text>
                    <View style={styles.row}>
                      <MapPin size={11} color="#8e8e93" />
                      <Text style={styles.addressText} numberOfLines={1}>
                        {appt.salon?.address || "Ташкент"}
                      </Text>
                    </View>
                  </View>
                  <StatusBadge status={appt.status} />
                </View>

                {/* Инфо о записи */}
                <View style={styles.detailsBox}>
                  <View style={styles.detailRow}>
                    <Calendar size={14} color="#111111" />
                    <Text style={styles.detailText}>
                      {dateFormatted} в <Text style={styles.bold}>{timeFormatted}</Text>
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <UserIcon size={14} color="#8e8e93" />
                    <Text style={styles.detailText}>
                      {appt.service?.nameRu} ·{" "}
                      <Text style={styles.bold}>{appt.staff?.fullName}</Text>
                    </Text>
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.priceLabel}>Стоимость:</Text>
                    <Text style={styles.priceVal}>
                      {appt.price.toLocaleString("ru-RU")} сум
                    </Text>
                  </View>
                </View>

                {/* Действия */}
                {filterTab === "upcoming" && appt.status !== "CANCELLED" && (
                  <View style={styles.cardActions}>
                    {appt.salon?.phone && (
                      <TouchableOpacity
                        style={styles.actionBtnSecondary}
                        onPress={() => handleCall(appt.salon!.phone)}
                      >
                        <Phone size={13} color="#111111" />
                        <Text style={styles.actionBtnSecondaryText}>Позвонить</Text>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity
                      style={styles.actionBtnDestructive}
                      onPress={() => handleCancel(appt)}
                    >
                      <XCircle size={13} color="#e11d48" />
                      <Text style={styles.actionBtnDestructiveText}>Отменить</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabSelector: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 6,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  tabBtnActive: {
    backgroundColor: "#111111",
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8e8e93",
  },
  tabBtnTextActive: {
    color: "#ffffff",
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    gap: 12,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  salonName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    fontSize: 11,
    color: "#8e8e93",
    maxWidth: 200,
  },
  detailsBox: {
    backgroundColor: "#f5f5f7",
    borderRadius: 14,
    padding: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailText: {
    fontSize: 12,
    color: "#111111",
  },
  bold: {
    fontWeight: "700",
  },
  priceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 8,
    marginTop: 2,
  },
  priceLabel: {
    fontSize: 11,
    color: "#8e8e93",
  },
  priceVal: {
    fontSize: 13,
    fontWeight: "800",
    color: "#111111",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
  },
  actionBtnSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f5f5f7",
  },
  actionBtnSecondaryText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111111",
  },
  actionBtnDestructive: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#fff1f2",
  },
  actionBtnDestructiveText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#e11d48",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: "#8e8e93",
    textAlign: "center",
    paddingHorizontal: 36,
    lineHeight: 18,
  },
  emptyActionBtn: {
    backgroundColor: "#111111",
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 8,
  },
  emptyActionBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  authPromptContainer: {
    flex: 1,
    backgroundColor: "#f5f5f7",
    justifyContent: "center",
    padding: 24,
  },
  authPromptBox: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    gap: 12,
  },
  authPromptTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111111",
    textAlign: "center",
  },
  authPromptSub: {
    fontSize: 12,
    color: "#8e8e93",
    textAlign: "center",
    lineHeight: 18,
  },
  authPromptBtn: {
    backgroundColor: "#111111",
    width: "100%",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 8,
  },
  authPromptBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
