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
import { X, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Service } from "../types";
import { api } from "../services/api";

interface ManageServiceModalProps {
  visible: boolean;
  salonSlug: string;
  serviceToEdit: Service | null; // null = создание новой
  onClose: () => void;
  onSuccess: () => void;
}

export const ManageServiceModal: React.FC<ManageServiceModalProps> = ({
  visible,
  salonSlug,
  serviceToEdit,
  onClose,
  onSuccess,
}) => {
  const [nameRu, setNameRu] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("45");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const DURATIONS = [30, 45, 60, 90, 120];

  useEffect(() => {
    if (visible) {
      if (serviceToEdit) {
        setNameRu(serviceToEdit.nameRu);
        setPrice(String(serviceToEdit.price));
        setDurationMinutes(String(serviceToEdit.durationMinutes));
      } else {
        setNameRu("");
        setPrice("");
        setDurationMinutes("45");
      }
      setError("");
    }
  }, [visible, serviceToEdit]);

  const handleSave = async () => {
    if (!nameRu.trim()) {
      setError("Введите название услуги");
      return;
    }
    const cleanPrice = Number(price.replace(/\D/g, ""));
    if (!cleanPrice || cleanPrice <= 0) {
      setError("Укажите корректную стоимость в сумах");
      return;
    }

    setLoading(true);
    setError("");

    try {
      if (serviceToEdit) {
        const res = await api.updateService({
          id: serviceToEdit.id,
          nameRu: nameRu.trim(),
          price: cleanPrice,
          durationMinutes: Number(durationMinutes),
        });
        if (res.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onSuccess();
          onClose();
        } else {
          setError(res.error || "Не удалось обновить услугу");
        }
      } else {
        const res = await api.createService(salonSlug, {
          nameRu: nameRu.trim(),
          price: cleanPrice,
          durationMinutes: Number(durationMinutes),
        });
        if (res.success) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          onSuccess();
          onClose();
        } else {
          setError(res.error || "Не удалось создать услугу");
        }
      }
    } catch {
      setError("Ошибка сети при сохранении");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    if (!serviceToEdit) return;
    Alert.alert(
      "Удаление услуги",
      `Вы действительно хотите удалить услугу «${serviceToEdit.nameRu}»?`,
      [
        { text: "Отмена", style: "cancel" },
        {
          text: "Удалить",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await api.deleteService(serviceToEdit.id);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              onSuccess();
              onClose();
            } catch {
              Alert.alert("Ошибка", "Не удалось удалить услугу");
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
              {serviceToEdit ? "Редактировать услугу" : "Новая услуга в прайс"}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={16} color="#666" />
            </TouchableOpacity>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>НАЗВАНИЕ УСЛУГИ</Text>
              <TextInput
                style={styles.input}
                placeholder="Например: Модельная стрижка"
                placeholderTextColor="#999"
                value={nameRu}
                onChangeText={setNameRu}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>СТОИМОСТЬ (В СУМАХ UZS)</Text>
              <TextInput
                style={styles.input}
                placeholder="150 000"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>ДЛИТЕЛЬНОСТЬ (МИНУТ)</Text>
              <View style={styles.durationRow}>
                {DURATIONS.map((d) => {
                  const isSel = durationMinutes === String(d);
                  return (
                    <TouchableOpacity
                      key={d}
                      style={[styles.durBtn, isSel && styles.durBtnActive]}
                      onPress={() => setDurationMinutes(String(d))}
                    >
                      <Text style={[styles.durBtnText, isSel && styles.durBtnTextActive]}>
                        {d} мин
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
                  {serviceToEdit ? "Сохранить изменения" : "Добавить услугу"}
                </Text>
              )}
            </TouchableOpacity>

            {serviceToEdit && (
              <TouchableOpacity
                style={styles.deleteBtn}
                onPress={handleDelete}
                disabled={loading}
              >
                <Trash2 size={15} color="#e11d48" />
                <Text style={styles.deleteBtnText}>Удалить услугу</Text>
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
  durationRow: {
    flexDirection: "row",
    gap: 6,
  },
  durBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  durBtnActive: {
    backgroundColor: "#111111",
  },
  durBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#8e8e93",
  },
  durBtnTextActive: {
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
