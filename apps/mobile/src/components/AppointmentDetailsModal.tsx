import React from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ScrollView,
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
              <X size={18} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scroll}>
            {/* Карточка услуги */}
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <Clock size={14} color="#8e8e93" />
                  <Text style={styles.infoLabel}>Время:</Text>
                </View>
                <Text style={styles.infoValue}>
                  {timeStr} — {endTimeStr}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <Scissors size={14} color="#8e8e93" />
                  <Text style={styles.infoLabel}>Услуга:</Text>
                </View>
                <Text style={styles.infoValue}>{appointment.service.nameRu}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <User size={14} color="#8e8e93" />
                  <Text style={styles.infoLabel}>Мастер:</Text>
                </View>
                <Text style={styles.infoValue}>{appointment.staff.fullName}</Text>
              </View>

              <View style={styles.infoRow}>
                <View style={styles.infoLabelGroup}>
                  <DollarSign size={14} color="#8e8e93" />
                  <Text style={styles.infoLabel}>Стоимость:</Text>
                </View>
                <Text style={[styles.infoValue, { fontWeight: "700" }]}>
                  {formatUZS(appointment.price)}
                </Text>
              </View>

              <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
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

            {/* Смена статуса */}
            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>Изменить статус записи</Text>
              <View style={styles.statusGrid}>
                <TouchableOpacity
                  onPress={() => onUpdateStatus(appointment.id, "CONFIRMED")}
                  style={[styles.statusBtn, appointment.status === "CONFIRMED" && styles.statusBtnActive]}
                >
                  <Text style={styles.statusBtnText}>Подтвердить</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onUpdateStatus(appointment.id, "IN_PROGRESS")}
                  style={[styles.statusBtn, appointment.status === "IN_PROGRESS" && styles.statusBtnActive]}
                >
                  <Text style={styles.statusBtnText}>В кресле</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onUpdateStatus(appointment.id, "COMPLETED")}
                  style={[styles.statusBtn, styles.statusBtnSuccess]}
                >
                  <Text style={[styles.statusBtnText, { color: "#065f46" }]}>Завершить</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => onUpdateStatus(appointment.id, "CANCELLED")}
                  style={[styles.statusBtn, styles.statusBtnDanger]}
                >
                  <Text style={[styles.statusBtnText, { color: "#9f1239" }]}>Отменить</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Быстрые действия: Позвонить и Telegram */}
          <View style={styles.actions}>
            <TouchableOpacity onPress={handleCall} style={styles.callBtn}>
              <Phone size={16} color="#ffffff" />
              <Text style={styles.callBtnText}>Позвонить</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleTelegram} style={styles.tgBtn}>
              <Send size={16} color="#ffffff" />
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
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  content: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: "85%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8e8e93",
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  clientName: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },
  clientPhone: {
    fontSize: 13,
    color: "#666666",
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  scroll: {
    marginVertical: 4,
  },
  infoCard: {
    backgroundColor: "#f9f9fb",
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  infoLabelGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoLabel: {
    fontSize: 12,
    color: "#666666",
  },
  infoValue: {
    fontSize: 12,
    color: "#111111",
    fontWeight: "500",
  },
  commentBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#f5f5f7",
    borderRadius: 14,
  },
  commentLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8e8e93",
    marginBottom: 4,
  },
  commentText: {
    fontSize: 12,
    color: "#333333",
  },
  statusSection: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111111",
    marginBottom: 8,
  },
  statusGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  statusBtn: {
    flex: 1,
    minWidth: "45%",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
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
    fontSize: 12,
    fontWeight: "600",
    color: "#111111",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  callBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#111111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  callBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
  tgBtn: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    backgroundColor: "#229ED9",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tgBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
  },
});
