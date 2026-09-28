import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
  Platform,
} from "react-native";
import { Phone, Send, X, Clock, User, Scissors, DollarSign } from "lucide-react-native";
import { Appointment } from "../types";
import { formatUZS, formatPhoneUZ } from "../config";
import { StatusBadge } from "./StatusBadge";

interface AppointmentDetailsModalProps {
  appointment: Appointment | null;
  visible: boolean;
  onClose: () => void;
  onUpdateStatus: (id: string, newStatus: string) => Promise<void>;
}

export const AppointmentDetailsModal: React.FC<AppointmentDetailsModalProps> = ({
  appointment,
  visible,
  onClose,
  onUpdateStatus,
}) => {
  if (!appointment) return null;

  // Форматирование времени по Ташкенту
  const timeStr = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(appointment.startDateTime));

  const endTimeStr = new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Asia/Tashkent",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(appointment.endDateTime));

  const handleCall = () => {
    Linking.openURL(`tel:${appointment.clientPhone}`);
  };

  const handleTelegram = () => {
    const raw = appointment.clientPhone.replace(/\D/g, "");
    Linking.openURL(`https://t.me/${raw}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.subtitle}>ДЕТАЛИ ЗАПИСИ</Text>
              <Text style={styles.clientName}>{appointment.clientName}</Text>
              <Text style={styles.clientPhone}>{formatPhoneUZ(appointment.clientPhone)}</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={16} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Карточка услуги */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <Clock size={13} color="#8e8e93" />
                  <Text style={styles.infoLabel}>Время:</Text>
                </View>
                <Text style={styles.infoValue}>
                  {timeStr} — {endTimeStr}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <Scissors size={13} color="#8e8e93" />
                  <Text style={styles.infoLabel}>Услуга:</Text>
                </View>
                <Text style={styles.infoValue}>{appointment.service.nameRu}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <User size={13} color="#8e8e93" />
                  <Text style={styles.infoLabel}>Мастер:</Text>
                </View>
                <Text style={styles.infoValue}>{appointment.staff.fullName}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <DollarSign size={13} color="#8e8e93" />
                  <Text style={styles.infoLabel}>Стоимость:</Text>
                </View>
                <Text style={[styles.infoValue, { fontWeight: "700" }]}>
                  {formatUZS(appointment.price)}
                </Text>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0, paddingBottom: 2 }]}>
                <Text style={styles.infoLabel}>Текущий статус:</Text>
                <StatusBadge status={appointment.status} />
              </View>
            </View>

            {appointment.clientComment && (
              <View style={styles.commentBox}>
                <Text style={styles.commentLabel}>Заметка клиента:</Text>
                <Text style={styles.commentText}>{appointment.clientComment}</Text>
              </View>
            )}

            {/* Смена статуса (компактная сетка) */}
            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>Изменить статус записи</Text>
              <View style={styles.statusGrid}>
                <TouchableOpacity
                  onPress={() => onUpdateStatus(appointment.id, "CONFIRMED")}
                  style={[
                    styles.statusBtn,
                    appointment.status === "CONFIRMED" && styles.statusBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBtnText,
                      appointment.status === "CONFIRMED" && styles.statusBtnTextActive,
                    ]}
                  >
                    Подтвердить
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onUpdateStatus(appointment.id, "IN_PROGRESS")}
                  style={[
                    styles.statusBtn,
                    appointment.status === "IN_PROGRESS" && styles.statusBtnActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBtnText,
                      appointment.status === "IN_PROGRESS" && styles.statusBtnTextActive,
                    ]}
                  >
                    В кресле
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onUpdateStatus(appointment.id, "COMPLETED")}
                  style={[styles.statusBtn, styles.statusBtnSuccess]}
                >
                  <Text style={[styles.statusBtnText, { color: "#065f46" }]}>
                    Завершить
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onUpdateStatus(appointment.id, "CANCELLED")}
                  style={[styles.statusBtn, styles.statusBtnDanger]}
                >
                  <Text style={[styles.statusBtnText, { color: "#9f1239" }]}>
                    Отменить
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Быстрые действия: Позвонить и Telegram */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleCall} style={styles.callBtn}>
              <Phone size={15} color="#ffffff" />
              <Text style={styles.callBtnText}>Позвонить</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleTelegram} style={styles.tgBtn}>
              <Send size={15} color="#ffffff" />
              <Text style={styles.tgBtnText}>Telegram</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "92%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 9,
    fontWeight: "700",
    color: "#8e8e93",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  clientName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111111",
  },
  clientPhone: {
    fontSize: 12,
    color: "#666666",
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  infoCard: {
    backgroundColor: "#f9f9fb",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  infoLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoLabel: {
    fontSize: 11,
    color: "#666666",
  },
  infoValue: {
    fontSize: 11,
    color: "#111111",
    fontWeight: "500",
  },
  commentBox: {
    marginTop: 8,
    padding: 10,
    backgroundColor: "#f5f5f7",
    borderRadius: 12,
  },
  commentLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#8e8e93",
    marginBottom: 2,
  },
  commentText: {
    fontSize: 11,
    color: "#333333",
  },
  statusSection: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 6,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  statusBtn: {
    flex: 1,
    minWidth: "47%",
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  statusBtnActive: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },
  statusBtnSuccess: {
    backgroundColor: "#ecfdf5",
    borderColor: "#a7f3d0",
  },
  statusBtnDanger: {
    backgroundColor: "#ffe4e6",
    borderColor: "#fecdd3",
  },
  statusBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111111",
  },
  statusBtnTextActive: {
    color: "#ffffff",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  callBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#111111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  callBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  tgBtn: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    backgroundColor: "#229ED9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  tgBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
});
