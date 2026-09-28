import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { Plus, Calendar as CalendarIcon, Clock, ChevronRight } from "lucide-react-native";
import { Salon, Appointment, User } from "../types";
import { api } from "../services/api";
import { formatUZS, formatPhoneUZ } from "../config";
import { StatusBadge } from "../components/StatusBadge";
import { AppointmentDetailsModal } from "../components/AppointmentDetailsModal";
import { AddAppointmentModal } from "../components/AddAppointmentModal";
import { User as UserIcon } from "lucide-react-native";

interface JournalScreenProps {
  salon: Salon | null;
  currentUser?: User | null;
}

export const JournalScreen: React.FC<JournalScreenProps> = ({ salon, currentUser }) => {
  const isMaster = !!currentUser?.staffProfile || currentUser?.role === "MASTER";
  const masterStaffId = currentUser?.staffProfile?.id;

  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });

  const [filterStaff, setFilterStaff] = useState<string>(
    isMaster && masterStaffId ? masterStaffId : "all"
  );
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Модальные окна
  const [activeAppointment, setActiveAppointment] = useState<Appointment | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Список 7 дней вперед
  const daysList = React.useMemo(() => {
    const list = [];
    const dayNames = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(today.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      list.push({
        dateStr,
        dayName: i === 0 ? "Сегодня" : i === 1 ? "Завтра" : dayNames[d.getDay()],
        dayNum: d.getDate(),
      });
    }
    return list;
  }, []);

  const loadAppointments = async () => {
    if (!salon) {
      setLoading(false);
      setRefreshing(false);
      setAppointments([]);
      return;
    }
    setLoading(true);
    try {
      const targetStaff = isMaster && masterStaffId ? masterStaffId : filterStaff;
      const data = await api.getAppointments(salon.id, selectedDate, targetStaff);
      setAppointments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [salon, selectedDate, filterStaff, isMaster, masterStaffId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadAppointments();
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const success = await api.updateAppointmentStatus(id, newStatus);
    if (success) {
      loadAppointments();
      if (activeAppointment && activeAppointment.id === id) {
        setActiveAppointment({ ...activeAppointment, status: newStatus as any });
      }
    }
  };

  const handleCreateAppointment = async (payload: any) => {
    await api.createAppointment(payload);
    loadAppointments();
  };

  const totalRevenue = appointments
    .filter((a) => a.status === "COMPLETED" || a.paymentStatus === "PAID")
    .reduce((sum, a) => sum + a.price, 0);

  const masterPercent = currentUser?.staffProfile?.commissionPercent || 40;
  const masterEarnings = Math.round(totalRevenue * (masterPercent / 100));

  if (!salon) {
    return (
      <View style={styles.container}>
        <View style={styles.topBar}>
          <View>
            <Text style={styles.salonName}>Мой салон</Text>
            <Text style={styles.dateLabel}>Журнал расписания</Text>
          </View>
        </View>
        <View style={styles.emptyBox}>
          <CalendarIcon size={44} color="#8e8e93" />
          <Text style={styles.emptyTitle}>Салон еще не создан</Text>
          <Text style={styles.emptySubtitle}>
            Перейдите во вкладку «Салон» в нижнем меню, чтобы создать профиль вашего салона и начать работу
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Верхний заголовок экрана */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.salonName}>{salon?.name || "Мой салон"}</Text>
          <Text style={styles.dateLabel}>
            {isMaster ? "Личный журнал мастера" : "Журнал расписания всех мастеров"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => setShowAddModal(true)}
          style={styles.addBtn}
          activeOpacity={0.8}
        >
          <Plus size={16} color="#ffffff" strokeWidth={2.5} />
          <Text style={styles.addBtnText}>Запись</Text>
        </TouchableOpacity>
      </View>

      {/* Быстрый выбор даты (горизонтальный скролл) */}
      <View style={styles.dateSelector}>
        {daysList.map((day) => {
          const isSelected = selectedDate === day.dateStr;
          return (
            <TouchableOpacity
              key={day.dateStr}
              onPress={() => setSelectedDate(day.dateStr)}
              style={[styles.dateChip, isSelected && styles.dateChipActive]}
              activeOpacity={0.7}
            >
              <Text style={[styles.dateChipName, isSelected && styles.dateChipNameActive]}>
                {day.dayName}
              </Text>
              <Text style={[styles.dateChipNum, isSelected && styles.dateChipNumActive]}>
                {day.dayNum}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Фильтр по мастерам: мастер видит только себя, владелец видит всех */}
      {isMaster && currentUser?.staffProfile ? (
        <View style={styles.masterBadgeBox}>
          <UserIcon size={13} color="#111111" />
          <Text style={styles.masterBadgeText}>
            Мастер: {currentUser.staffProfile.fullName} ({currentUser.staffProfile.specialty})
          </Text>
        </View>
      ) : (
        salon?.staff && salon.staff.length > 1 && (
          <View style={styles.masterFilter}>
            <TouchableOpacity
              onPress={() => setFilterStaff("all")}
              style={[styles.filterPill, filterStaff === "all" && styles.filterPillActive]}
            >
              <Text
                style={[
                  styles.filterPillText,
                  filterStaff === "all" && styles.filterPillTextActive,
                ]}
              >
                Все мастера
              </Text>
            </TouchableOpacity>
            {salon.staff.map((m) => (
              <TouchableOpacity
                key={m.id}
                onPress={() => setFilterStaff(m.id)}
                style={[styles.filterPill, filterStaff === m.id && styles.filterPillActive]}
              >
                <Text
                  style={[
                    styles.filterPillText,
                    filterStaff === m.id && styles.filterPillTextActive,
                  ]}
                >
                  {m.fullName.split(" ")[0]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )
      )}

      {/* Сводка за день */}
      <View style={styles.summaryBar}>
        <Text style={styles.summaryCount}>Записей: {appointments.length}</Text>
        <Text style={styles.summaryRevenue}>
          {isMaster ? (
            <>
              Мой заработок:{" "}
              <Text style={{ fontWeight: "700", color: "#059669" }}>
                {formatUZS(masterEarnings)}
              </Text>
            </>
          ) : (
            <>
              Выручка:{" "}
              <Text style={{ fontWeight: "700", color: "#111111" }}>
                {formatUZS(totalRevenue)}
              </Text>
            </>
          )}
        </Text>
      </View>

      {/* Список записей */}
      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#111111" />
        </View>
      ) : appointments.length === 0 ? (
        <View style={styles.emptyBox}>
          <CalendarIcon size={36} color="#cccccc" />
          <Text style={styles.emptyTitle}>На этот день нет записей</Text>
          <Text style={styles.emptySubtitle}>
            Нажмите «Запись», чтобы добавить клиента вручную
          </Text>
          <TouchableOpacity
            onPress={() => setShowAddModal(true)}
            style={styles.emptyAddBtn}
          >
            <Text style={styles.emptyAddBtnText}>Записать клиента</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={appointments}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#111111" />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const timeStr = new Intl.DateTimeFormat("ru-RU", {
              timeZone: "Asia/Tashkent",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }).format(new Date(item.startDateTime));

            const endTimeStr = new Intl.DateTimeFormat("ru-RU", {
              timeZone: "Asia/Tashkent",
              hour: "2-digit",
              minute: "2-digit",
              hour12: false,
            }).format(new Date(item.endDateTime));

            return (
              <TouchableOpacity
                onPress={() => setActiveAppointment(item)}
                style={styles.card}
                activeOpacity={0.7}
              >
                <View style={styles.cardTop}>
                  <View style={styles.timeBox}>
                    <Text style={styles.startTime}>{timeStr}</Text>
                    <Text style={styles.endTime}>{endTimeStr}</Text>
                  </View>

                  <View style={styles.clientBox}>
                    <Text style={styles.cardClientName}>{item.clientName}</Text>
                    <Text style={styles.cardClientPhone}>
                      {formatPhoneUZ(item.clientPhone)}
                    </Text>
                  </View>

                  <StatusBadge status={item.status} />
                </View>

                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.serviceName}>{item.service.nameRu}</Text>
                    <Text style={styles.staffName}>Мастер: {item.staff.fullName}</Text>
                  </View>
                  <Text style={styles.price}>{formatUZS(item.price)}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* Модалки */}
      <AppointmentDetailsModal
        appointment={activeAppointment}
        visible={!!activeAppointment}
        onClose={() => setActiveAppointment(null)}
        onUpdateStatus={handleUpdateStatus}
      />

      <AddAppointmentModal
        visible={showAddModal}
        salon={salon}
        selectedDate={selectedDate}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleCreateAppointment}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  salonName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
  dateLabel: {
    fontSize: 11,
    color: "#8e8e93",
    marginTop: 1,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#111111",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
  },
  addBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  dateSelector: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: "#ffffff",
  },
  dateChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
  },
  dateChipActive: {
    backgroundColor: "#111111",
  },
  dateChipName: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8e8e93",
  },
  dateChipNameActive: {
    color: "#ffffff",
  },
  dateChipNum: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
    marginTop: 2,
  },
  dateChipNumActive: {
    color: "#ffffff",
  },
  masterBadgeBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: "#ffffff",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  masterBadgeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111111",
  },
  masterFilter: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  filterPillActive: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },
  filterPillText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#666666",
  },
  filterPillTextActive: {
    color: "#ffffff",
  },
  summaryBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  summaryCount: {
    fontSize: 11,
    color: "#8e8e93",
    fontWeight: "500",
  },
  summaryRevenue: {
    fontSize: 11,
    color: "#8e8e93",
  },
  listContent: {
    padding: 16,
    gap: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 1,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  timeBox: {
    backgroundColor: "#111111",
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignItems: "center",
    minWidth: 54,
  },
  startTime: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "700",
  },
  endTime: {
    color: "#8e8e93",
    fontSize: 9,
    fontWeight: "500",
  },
  clientBox: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  cardClientName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
  },
  cardClientPhone: {
    fontSize: 11,
    color: "#8e8e93",
    marginTop: 1,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.04)",
  },
  serviceName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#333333",
  },
  staffName: {
    fontSize: 10,
    color: "#8e8e93",
    marginTop: 2,
  },
  price: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: "#8e8e93",
    textAlign: "center",
    maxWidth: 240,
  },
  emptyAddBtn: {
    marginTop: 12,
    backgroundColor: "#111111",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
  },
  emptyAddBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});
