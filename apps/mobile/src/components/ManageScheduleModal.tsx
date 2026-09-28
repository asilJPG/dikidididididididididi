import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  TextInput,
  Platform,
} from "react-native";
import { X, Clock, Calendar, Check, Coffee } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Staff } from "../types";
import { api } from "../services/api";

interface ScheduleItem {
  dayOfWeek: number;
  name: string;
  startTime: string;
  endTime: string;
  isDayOff: boolean;
  breakStart: string;
  breakEnd: string;
}

interface ManageScheduleModalProps {
  visible: boolean;
  staff: Staff | null;
  onClose: () => void;
  onSaved?: () => void;
}

const DEFAULT_SCHEDULE: ScheduleItem[] = [
  { dayOfWeek: 1, name: "Понедельник", startTime: "09:00", endTime: "19:00", isDayOff: false, breakStart: "13:00", breakEnd: "14:00" },
  { dayOfWeek: 2, name: "Вторник", startTime: "09:00", endTime: "19:00", isDayOff: false, breakStart: "13:00", breakEnd: "14:00" },
  { dayOfWeek: 3, name: "Среда", startTime: "09:00", endTime: "19:00", isDayOff: false, breakStart: "13:00", breakEnd: "14:00" },
  { dayOfWeek: 4, name: "Четверг", startTime: "09:00", endTime: "19:00", isDayOff: false, breakStart: "13:00", breakEnd: "14:00" },
  { dayOfWeek: 5, name: "Пятница", startTime: "09:00", endTime: "19:00", isDayOff: false, breakStart: "13:00", breakEnd: "14:00" },
  { dayOfWeek: 6, name: "Суббота", startTime: "10:00", endTime: "18:00", isDayOff: false, breakStart: "13:00", breakEnd: "14:00" },
  { dayOfWeek: 0, name: "Воскресенье", startTime: "10:00", endTime: "18:00", isDayOff: true, breakStart: "13:00", breakEnd: "14:00" },
];

export const ManageScheduleModal: React.FC<ManageScheduleModalProps> = ({
  visible,
  staff,
  onClose,
  onSaved,
}) => {
  const [schedules, setSchedules] = useState<ScheduleItem[]>(DEFAULT_SCHEDULE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible && staff) {
      loadSchedule();
    }
  }, [visible, staff]);

  const loadSchedule = async () => {
    if (!staff) return;
    setLoading(true);
    setError("");
    try {
      const data = await api.getStaffSchedule(staff.id);
      if (Array.isArray(data) && data.length > 0) {
        setSchedules(data);
      } else {
        setSchedules(DEFAULT_SCHEDULE);
      }
    } catch {
      setError("Не удалось загрузить график");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDayOff = (index: number) => {
    Haptics.selectionAsync();
    setSchedules((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], isDayOff: !copy[index].isDayOff };
      return copy;
    });
  };

  const handleChangeTime = (index: number, field: "startTime" | "endTime" | "breakStart" | "breakEnd", val: string) => {
    setSchedules((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleSave = async () => {
    if (!staff) return;
    setSaving(true);
    setError("");
    try {
      const res = await api.updateStaffSchedule(staff.id, schedules);
      if (res.error) {
        setError(res.error);
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved?.();
      onClose();
    } catch {
      setError("Ошибка при сохранении графика");
    } finally {
      setSaving(false);
    }
  };

  if (!staff) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Шапка */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBadge}>
              <Clock size={20} color="#111111" />
            </View>
            <View>
              <Text style={styles.title}>Рабочее расписание</Text>
              <Text style={styles.subtitle}>{staff.fullName}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color="#8e8e93" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color="#111111" />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <Text style={styles.hintText}>
              Укажите рабочие часы и дни приёма клиентов. В нерабочие часы и выходные дни онлайн-запись будет недоступна.
            </Text>

            {schedules.map((item, index) => (
              <View
                key={item.dayOfWeek}
                style={[styles.dayCard, item.isDayOff && styles.dayCardOff]}
              >
                <View style={styles.dayHeader}>
                  <View>
                    <Text style={[styles.dayName, item.isDayOff && styles.dayNameOff]}>
                      {item.name}
                    </Text>
                    <Text style={styles.dayStatus}>
                      {item.isDayOff ? "Выходной" : `${item.startTime} — ${item.endTime}`}
                    </Text>
                  </View>
                  <View style={styles.switchRow}>
                    <Text style={styles.switchLabel}>
                      {item.isDayOff ? "Отдых" : "Работает"}
                    </Text>
                    <Switch
                      value={!item.isDayOff}
                      onValueChange={() => handleToggleDayOff(index)}
                      trackColor={{ false: "#e5e5ea", true: "#111111" }}
                      thumbColor="#ffffff"
                    />
                  </View>
                </View>

                {!item.isDayOff && (
                  <View style={styles.hoursBlock}>
                    <View style={styles.timeInputsRow}>
                      <View style={styles.timeCol}>
                        <Text style={styles.timeLabel}>НАЧАЛО</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={item.startTime}
                          onChangeText={(v) => handleChangeTime(index, "startTime", v)}
                          placeholder="09:00"
                          maxLength={5}
                          keyboardType="numbers-and-punctuation"
                        />
                      </View>

                      <View style={styles.timeCol}>
                        <Text style={styles.timeLabel}>КОНЕЦ</Text>
                        <TextInput
                          style={styles.timeInput}
                          value={item.endTime}
                          onChangeText={(v) => handleChangeTime(index, "endTime", v)}
                          placeholder="19:00"
                          maxLength={5}
                          keyboardType="numbers-and-punctuation"
                        />
                      </View>
                    </View>

                    {/* Перерыв */}
                    <View style={styles.breakRow}>
                      <View style={styles.breakLeft}>
                        <Coffee size={14} color="#8e8e93" />
                        <Text style={styles.breakLabel}>Обед:</Text>
                      </View>
                      <View style={styles.breakInputs}>
                        <TextInput
                          style={styles.breakInput}
                          value={item.breakStart}
                          onChangeText={(v) => handleChangeTime(index, "breakStart", v)}
                          placeholder="13:00"
                          maxLength={5}
                        />
                        <Text style={styles.breakDash}>—</Text>
                        <TextInput
                          style={styles.breakInput}
                          value={item.breakEnd}
                          onChangeText={(v) => handleChangeTime(index, "breakEnd", v)}
                          placeholder="14:00"
                          maxLength={5}
                        />
                      </View>
                    </View>
                  </View>
                )}
              </View>
            ))}

            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.8}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.saveBtnContent}>
                  <Check size={18} color="#ffffff" strokeWidth={2.5} />
                  <Text style={styles.saveBtnText}>Сохранить график</Text>
                </View>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111111",
  },
  subtitle: {
    fontSize: 12,
    color: "#8e8e93",
    marginTop: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 16,
    gap: 10,
    paddingBottom: 40,
  },
  hintText: {
    fontSize: 12,
    color: "#8e8e93",
    lineHeight: 16,
    marginBottom: 6,
    paddingHorizontal: 4,
  },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 12,
    textAlign: "center",
  },
  dayCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    gap: 10,
  },
  dayCardOff: {
    backgroundColor: "#fcfcfc",
    opacity: 0.75,
  },
  dayHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  dayName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
  },
  dayNameOff: {
    color: "#8e8e93",
  },
  dayStatus: {
    fontSize: 11,
    color: "#8e8e93",
    marginTop: 2,
  },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  switchLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8e8e93",
  },
  hoursBlock: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 10,
    gap: 10,
  },
  timeInputsRow: {
    flexDirection: "row",
    gap: 12,
  },
  timeCol: {
    flex: 1,
    gap: 4,
  },
  timeLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#8e8e93",
  },
  timeInput: {
    backgroundColor: "#f5f5f7",
    borderRadius: 12,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
    textAlign: "center",
  },
  breakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fafafa",
    padding: 10,
    borderRadius: 12,
  },
  breakLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  breakLabel: {
    fontSize: 12,
    color: "#666666",
    fontWeight: "500",
  },
  breakInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  breakInput: {
    backgroundColor: "#ffffff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    height: 32,
    paddingHorizontal: 8,
    fontSize: 12,
    fontWeight: "600",
    color: "#111111",
    textAlign: "center",
    width: 60,
  },
  breakDash: {
    color: "#8e8e93",
  },
  saveBtn: {
    backgroundColor: "#111111",
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  saveBtnContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  saveBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
