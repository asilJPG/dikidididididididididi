import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { X, Trash2, UserPlus } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Staff } from "../types";
import { api } from "../services/api";

interface ManageStaffModalProps {
  visible: boolean;
  salonSlug: string;
  staffToEdit: Staff | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ManageStaffModal: React.FC<ManageStaffModalProps> = ({
  visible,
  salonSlug,
  staffToEdit,
  onClose,
  onSuccess,
}) => {
  const [fullName, setFullName] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [phone, setPhone] = useState("+998 ");
  const [commissionPercent, setCommissionPercent] = useState("40");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const PERCENTS = [30, 40, 50, 60];

  useEffect(() => {
    if (visible) {
      if (staffToEdit) {
        setFullName(staffToEdit.fullName);
        setSpecialty(staffToEdit.specialty);
        setPhone(staffToEdit.avatarUrl ? "" : "+998 ");
        setCommissionPercent(String(staffToEdit.commissionPercent || 40));
      } else {
        setFullName("");
        setSpecialty("");
        setPhone("+998 ");
        setCommissionPercent("40");
      }
      setError("");
    }
  }, [visible, staffToEdit]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      setError("Введите имя мастера");
      return;
    }
    if (!specialty.trim()) {
      setError("Укажите должность мастера (напр. Барбер)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (staffToEdit) {
        const res = await api.updateStaff({
          id: staffToEdit.id,
          fullName: fullName.trim(),
          specialty: specialty.trim(),
          phone: phone.replace(/\D/g, "").length >= 12 ? phone : undefined,
          commissionPercent: Number(commissionPercent),
        });
        if (res.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onSuccess();
          onClose();
        } else {
          setError(res.error || "Не удалось обновить мастера");
        }
      } else {
        const res = await api.createStaff(salonSlug, {
          fullName: fullName.trim(),
          specialty: specialty.trim(),
          phone: phone.replace(/\D/g, "").length >= 12 ? phone : undefined,
          commissionPercent: Number(commissionPercent),
        });
        if (res.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onSuccess();
          onClose();
        } else {
          setError(res.error || "Не удалось добавить мастера");
        }
      }
    } catch {
      setError("Ошибка сети при сохранении");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!staffToEdit) return;
    Alert.alert(
      "Удаление мастера",
      `Вы действительно хотите удалить мастера «${staffToEdit.fullName}»?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await api.deleteStaff(staffToEdit.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onSuccess();
              onClose();
            } catch {
              Alert.alert("Ошибка", "Не удалось удалить мастера");
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>
              {staffToEdit ? "Редактировать мастера" : "Добавить мастера в салон"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>ФАМИЛИЯ И ИМЯ МАСТЕРА</Text>
              <TextInput
                style={styles.input}
                placeholder="Например: Азиз Рустамов"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setName => setFullName(setName)}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>СПЕЦИАЛЬНОСТЬ / ДОЛЖНОСТЬ</Text>
              <TextInput
                style={styles.input}
                placeholder="Например: Топ-барбер, Стилист"
                placeholderTextColor="#999"
                value={specialty}
                onChangeText={setSpecialty}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>ТЕЛЕФОН (ДЛЯ ВХОДА МАСТЕРА В СВОЙ ЖУРНАЛ)</Text>
              <TextInput
                style={styles.input}
                placeholder="+998 90 123-45-67"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={phone}
                onChangeText={t => setPhone(t.startsWith("+998") ? t : "+998 ")}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>ПРОЦЕНТ КОМИССИИ МАСТЕРА (%)</Text>
              <View style={styles.percentRow}>
                {PERCENTS.map((p) => {
                  const isSel = commissionPercent === String(p);
                  return (
                    <TouchableOpacity
                      key={p}
                      style={[styles.percentBtn, isSel && styles.percentBtnActive]}
                      onPress={() => setCommissionPercent(String(p))}
                    >
                      <Text style={[styles.percentBtnText, isSel && styles.percentBtnTextActive]}>
                        {p}%
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, loading && { opacity: 0.6 }]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveBtnText}>
                  {staffToEdit ? "Сохранить изменения" : "Добавить мастера"}
                </Text>
              )}
            </TouchableOpacity>

            {staffToEdit && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                disabled={loading}
              >
                <Trash2 size={15} color="#e11d48" />
                <Text style={styles.deleteBtnText}>Удалить мастера</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "800",
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
  errorText: {
    color: "#e11d48",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  form: {
    gap: 12,
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8e8e93",
    letterSpacing: 0.6,
  },
  input: {
    backgroundColor: "#ffffff",
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#111111",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  percentRow: {
    flexDirection: "row",
    gap: 6,
  },
  percentBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  percentBtnActive: {
    backgroundColor: "#111111",
  },
  percentBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8e8e93",
  },
  percentBtnTextActive: {
    color: "#ffffff",
  },
  saveBtn: {
    backgroundColor: "#111111",
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#fff1f2",
  },
  deleteBtnText: {
    color: "#e11d48",
    fontSize: 12,
    fontWeight: "600",
  },
});
