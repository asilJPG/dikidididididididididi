import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { X, Check } from "lucide-react-native";
import { Salon } from "../types";
import { formatUZS } from "../config";

interface AddAppointmentModalProps {
  visible: boolean;
  salon: Salon | null;
  selectedDate: string;
  onClose: () => void;
  onSubmit: (payload: {
    salonId: string;
    staffId: string;
    serviceId: string;
    date: string;
    time: string;
    clientName: string;
    clientPhone: string;
    clientComment?: string;
  }) => Promise<void>;
}

export const AddAppointmentModal: React.FC<AddAppointmentModalProps> = ({
  visible,
  salon,
  selectedDate,
  onClose,
  onSubmit,
}) => {
  if (!salon) return null;

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("+998 ");
  const [selectedServiceId, setSelectedServiceId] = useState(salon.services[0]?.id || "");
  const [selectedStaffId, setSelectedStaffId] = useState(salon.staff[0]?.id || "");
  const [time, setTime] = useState("12:00");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!clientName.trim()) {
      setError("Укажите имя клиента");
      return;
    }
    if (clientPhone.replace(/\D/g, "").length < 12) {
      setError("Введите номер телефона (+998 ...)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await onSubmit({
        salonId: salon.id,
        staffId: selectedStaffId,
        serviceId: selectedServiceId,
        date: selectedDate,
        time,
        clientName: clientName.trim(),
        clientPhone: clientPhone.trim(),
        clientComment: comment.trim() || undefined,
      });

      // Сброс полей
      setClientName("");
      setClientPhone("+998 ");
      setComment("");
      onClose();
    } catch {
      setError("Не удалось создать запись");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Новая запись</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={18} color="#666666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.form}>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.label}>ИМЯ КЛИЕНТА *</Text>
            <TextInput
              style={styles.input}
              placeholder="Например, Олимхон"
              placeholderTextColor="#999"
              value={clientName}
              onChangeText={(t) => {
                setClientName(t);
                setError("");
              }}
            />

            <Text style={styles.label}>ТЕЛЕФОН (+998...) *</Text>
            <TextInput
              style={styles.input}
              placeholder="+998 90 123-45-67"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={clientPhone}
              onChangeText={(t) => {
                setClientPhone(t.startsWith("+998") ? t : "+998 ");
                setError("");
              }}
            />

            <Text style={styles.label}>ВРЕМЯ ЗАПИСИ (ЧЧ:ММ) *</Text>
            <TextInput
              style={styles.input}
              placeholder="12:00"
              placeholderTextColor="#999"
              value={time}
              onChangeText={setTime}
            />

            <Text style={styles.label}>УСЛУГА *</Text>
            <View style={styles.pickerContainer}>
              {salon.services.map((srv) => {
                const isSelected = selectedServiceId === srv.id;
                return (
                  <TouchableOpacity
                    key={srv.id}
                    onPress={() => setSelectedServiceId(srv.id)}
                    style={[styles.selectOption, isSelected && styles.selectOptionActive]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, isSelected && styles.optionTitleActive]}>
                        {srv.nameRu}
                      </Text>
                      <Text style={styles.optionSubtitle}>
                        {srv.durationMinutes} мин · {formatUZS(srv.price)}
                      </Text>
                    </View>
                    {isSelected && <Check size={16} color="#ffffff" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>МАСТЕР *</Text>
            <View style={styles.pickerContainer}>
              {salon.staff.map((st) => {
                const isSelected = selectedStaffId === st.id;
                return (
                  <TouchableOpacity
                    key={st.id}
                    onPress={() => setSelectedStaffId(st.id)}
                    style={[styles.selectOption, isSelected && styles.selectOptionActive]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optionTitle, isSelected && styles.optionTitleActive]}>
                        {st.fullName}
                      </Text>
                      <Text style={styles.optionSubtitle}>{st.specialty}</Text>
                    </View>
                    {isSelected && <Check size={16} color="#ffffff" />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>ЗАМЕТКА ДЛЯ CRM</Text>
            <TextInput
              style={[styles.input, { height: 60, textAlignVertical: "top" }]}
              placeholder="Пожелания клиента"
              placeholderTextColor="#999"
              multiline
              value={comment}
              onChangeText={setComment}
            />
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelText}>Отмена</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitBtn, loading && { opacity: 0.6 }]}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.submitText}>Записать</Text>
              )}
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    marginVertical: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8e8e93",
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 13,
    color: "#111111",
    backgroundColor: "#fafafa",
  },
  pickerContainer: {
    gap: 6,
  },
  selectOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#f5f5f7",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  selectOptionActive: {
    backgroundColor: "#111111",
  },
  optionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111111",
  },
  optionTitleActive: {
    color: "#ffffff",
  },
  optionSubtitle: {
    fontSize: 11,
    color: "#8e8e93",
    marginTop: 1,
  },
  errorText: {
    color: "#e11d48",
    fontSize: 12,
    marginBottom: 8,
    fontWeight: "500",
  },
  footer: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#666666",
  },
  submitBtn: {
    flex: 1.5,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
  },
});
