import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from "react-native";
import {
  X,
  Check,
  Calendar,
  Clock,
  User as UserIcon,
  Sparkles,
  ArrowRight,
  ChevronLeft,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Salon, Service, Staff, User } from "../types";
import { api } from "../services/api";

interface ClientBookingModalProps {
  visible: boolean;
  salon: Salon | null;
  initialService?: Service | null;
  currentUser: User | null;
  onClose: () => void;
  onBookingSuccess: () => void;
}

export const ClientBookingModal: React.FC<ClientBookingModalProps> = ({
  visible,
  salon,
  initialService,
  currentUser,
  onClose,
  onBookingSuccess,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isAnyStaff, setIsAnyStaff] = useState(true);

  // Даты на 7 дней
  const [dateList, setDateList] = useState<{ dateStr: string; label: string; sub: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Слоты
  const [slots, setSlots] = useState<{ time: string; availableStaffIds: string[] }[]>([]);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Контакты
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("+998 ");
  const [clientComment, setClientComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Инициализация дат и начальной услуги
  useEffect(() => {
    if (visible && salon) {
      // Генерируем даты на 7 дней
      const dates = [];
      const now = new Date();
      for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() + i);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        let label = i === 0 ? "Сегодня" : i === 1 ? "Завтра" : d.toLocaleDateString("ru-RU", { weekday: "short" });
        let sub = d.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });

        dates.push({ dateStr, label, sub });
      }
      setDateList(dates);
      setSelectedDate(dates[0].dateStr);

      if (initialService) {
        setSelectedService(initialService);
        setStep(2); // Сразу к выбору мастера
      } else {
        setSelectedService(null);
        setStep(1);
      }

      setIsAnyStaff(true);
      setSelectedStaff(null);
      setSelectedTime("");

      if (currentUser) {
        setClientName(currentUser.fullName || "");
        setClientPhone(currentUser.phone || "+998 ");
      }
    }
  }, [visible, salon, initialService, currentUser]);

  // Загрузка слотов при смене даты или мастера
  useEffect(() => {
    if (salon && selectedService && selectedDate && step === 3) {
      loadSlots();
    }
  }, [selectedDate, selectedService, selectedStaff, isAnyStaff, step]);

  const loadSlots = async () => {
    if (!salon || !selectedService || !selectedDate) return;
    setLoadingSlots(true);
    setSelectedTime("");
    try {
      const staffParam = isAnyStaff ? "any" : selectedStaff?.id || "any";
      const available = await api.getAvailableSlots(
        salon.slug,
        selectedService.id,
        selectedDate,
        staffParam
      );
      setSlots(available);
    } catch (e) {
      console.error("Error loading slots:", e);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleSelectService = (srv: Service) => {
    setSelectedService(srv);
    setStep(2);
    Haptics.selectionAsync();
  };

  const handleSelectStaff = (st: Staff | null) => {
    if (!st) {
      setIsAnyStaff(true);
      setSelectedStaff(null);
    } else {
      setIsAnyStaff(false);
      setSelectedStaff(st);
    }
    setStep(3);
    Haptics.selectionAsync();
  };

  const handleSelectSlot = (time: string) => {
    setSelectedTime(time);
    setStep(4);
    Haptics.selectionAsync();
  };

  const handleConfirmBooking = async () => {
    if (!salon || !selectedService || !selectedDate || !selectedTime) return;
    if (!clientName.trim()) {
      Alert.alert("Ошибка", "Введите ваше имя");
      return;
    }
    if (clientPhone.replace(/\D/g, "").length < 12) {
      Alert.alert("Ошибка", "Введите корректный номер телефона Узбекистана (+998...)");
      return;
    }

    setSubmitting(true);
    try {
      const targetStaffId = isAnyStaff
        ? (slots.find((s) => s.time === selectedTime)?.availableStaffIds[0] || salon.staff[0]?.id)
        : (selectedStaff?.id || salon.staff[0]?.id);

      const res = await api.bookAppointment({
        salonSlug: salon.slug,
        serviceId: selectedService.id,
        staffId: targetStaffId,
        date: selectedDate,
        time: selectedTime,
        clientName: clientName.trim(),
        clientPhone: clientPhone.replace(/\s+/g, ""),
        clientComment: clientComment.trim() || undefined,
      });

      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setStep(5);
      } else {
        Alert.alert("Ошибка бронирования", res.error || "Не удалось оформить запись");
      }
    } catch {
      Alert.alert("Ошибка", "Произошла сетевая ошибка при бронировании");
    } finally {
      setSubmitting(false);
    }
  };

  if (!salon) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        {/* Шапка модалки */}
        <View style={styles.header}>
          {step > 1 && step < 5 ? (
            <TouchableOpacity onPress={() => setStep((s) => (s - 1) as any)} style={styles.iconBtn}>
              <ChevronLeft size={22} color="#111111" />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 36 }} />
          )}

          <View style={styles.headerTitleCol}>
            <Text style={styles.headerTitle}>{salon.name}</Text>
            <Text style={styles.headerSub}>
              {step === 1 && "Шаг 1: Выберите услугу"}
              {step === 2 && "Шаг 2: Выберите специалиста"}
              {step === 3 && "Шаг 3: Выберите дату и время"}
              {step === 4 && "Шаг 4: Контактные данные"}
              {step === 5 && "Запись оформлена!"}
            </Text>
          </View>

          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <X size={20} color="#111111" />
          </TouchableOpacity>
        </View>

        {/* ШАГ 1: ВЫБОР УСЛУГИ */}
        {step === 1 && (
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Text style={styles.sectionLabel}>ДОСТУПНЫЕ УСЛУГИ</Text>
            {(!salon.services || salon.services.length === 0) ? (
              <View style={styles.noSlotsBox}>
                <Sparkles size={28} color="#8e8e93" />
                <Text style={styles.noSlotsTitle}>Услуги еще не добавлены</Text>
                <Text style={styles.noSlotsSub}>В этом салоне пока нет доступных для записи услуг</Text>
              </View>
            ) : (
              salon.services?.map((srv) => (
                <TouchableOpacity
                  key={srv.id}
                  style={[
                    styles.serviceCard,
                    selectedService?.id === srv.id && styles.serviceCardSelected,
                  ]}
                  onPress={() => handleSelectService(srv)}
                >
                  <View style={styles.srvLeft}>
                    <Text style={styles.srvName}>{srv.nameRu}</Text>
                    <Text style={styles.srvDuration}>{srv.durationMinutes} мин</Text>
                  </View>
                  <View style={styles.srvRight}>
                    <Text style={styles.srvPrice}>{srv.price.toLocaleString("ru-RU")} сум</Text>
                    <ArrowRight size={16} color="#8e8e93" />
                  </View>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        )}

        {/* ШАГ 2: ВЫБОР СПЕЦИАЛИСТА */}
        {step === 2 && (
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Text style={styles.sectionLabel}>ВЫБЕРИТЕ МАСТЕРА</Text>

            {/* Любой мастер */}
            <TouchableOpacity
              style={[styles.staffCard, isAnyStaff && styles.staffCardSelected]}
              onPress={() => handleSelectStaff(null)}
            >
              <View style={[styles.staffAvatar, { backgroundColor: "#2563eb" }]}>
                <Sparkles size={18} color="#ffffff" />
              </View>
              <View style={styles.staffInfo}>
                <Text style={styles.staffName}>Любой свободный мастер</Text>
                <Text style={styles.staffSpec}>Запись на самое удобное и ближайшее время</Text>
              </View>
              {isAnyStaff && <Check size={18} color="#2563eb" />}
            </TouchableOpacity>

            {/* Список мастеров салона */}
            {salon.staff?.map((master) => {
              const isSelected = !isAnyStaff && selectedStaff?.id === master.id;
              return (
                <TouchableOpacity
                  key={master.id}
                  style={[styles.staffCard, isSelected && styles.staffCardSelected]}
                  onPress={() => handleSelectStaff(master)}
                >
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffAvatarText}>
                      {master.fullName.slice(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.staffInfo}>
                    <Text style={styles.staffName}>{master.fullName}</Text>
                    <Text style={styles.staffSpec}>{master.specialty}</Text>
                  </View>
                  {isSelected && <Check size={18} color="#111111" />}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}

        {/* ШАГ 3: ВЫБОР ДАТЫ И СЛОТА ВРЕМЕНИ */}
        {step === 3 && (
          <View style={styles.body}>
            {/* Горизонтальный календарь */}
            <View style={styles.datePickerSection}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateScroll}>
                {dateList.map((item) => {
                  const isCur = selectedDate === item.dateStr;
                  return (
                    <TouchableOpacity
                      key={item.dateStr}
                      style={[styles.datePill, isCur && styles.datePillActive]}
                      onPress={() => {
                        setSelectedDate(item.dateStr);
                        Haptics.selectionAsync();
                      }}
                    >
                      <Text style={[styles.dateLabel, isCur && styles.dateTextActive]}>
                        {item.label}
                      </Text>
                      <Text style={[styles.dateSub, isCur && styles.dateTextActive]}>
                        {item.sub}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Сетка времени */}
            <ScrollView contentContainerStyle={styles.slotsContainer}>
              <Text style={styles.sectionLabel}>СВОБОДНЫЕ СЛОТЫ ВРЕМЕНИ</Text>
              {loadingSlots ? (
                <View style={styles.slotsLoading}>
                  <ActivityIndicator color="#111111" />
                  <Text style={styles.loadingSlotsText}>Поиск свободных окон...</Text>
                </View>
              ) : slots.length === 0 ? (
                <View style={styles.noSlotsBox}>
                  <Clock size={28} color="#8e8e93" />
                  <Text style={styles.noSlotsTitle}>Нет свободных окон</Text>
                  <Text style={styles.noSlotsSub}>Попробуйте выбрать другую дату или мастера</Text>
                </View>
              ) : (
                <View style={styles.slotsGrid}>
                  {slots.map((s) => {
                    const isSelected = selectedTime === s.time;
                    return (
                      <TouchableOpacity
                        key={s.time}
                        style={[styles.slotItem, isSelected && styles.slotItemActive]}
                        onPress={() => handleSelectSlot(s.time)}
                      >
                        <Text style={[styles.slotText, isSelected && styles.slotTextActive]}>
                          {s.time}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        )}

        {/* ШАГ 4: КОНТАКТЫ И ПОДТВЕРЖДЕНИЕ */}
        {step === 4 && (
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Карточка резюме */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Детали визита</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Услуга:</Text>
                <Text style={styles.summaryVal}>{selectedService?.nameRu}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Мастер:</Text>
                <Text style={styles.summaryVal}>
                  {isAnyStaff ? "Любой свободный" : selectedStaff?.fullName}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>Дата и время:</Text>
                <Text style={styles.summaryVal}>
                  {selectedDate} в {selectedTime}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryKey}>К оплате:</Text>
                <Text style={[styles.summaryVal, styles.summaryPrice]}>
                  {selectedService?.price.toLocaleString("ru-RU")} сум
                </Text>
              </View>
            </View>

            {/* Поля ввода */}
            <Text style={styles.sectionLabel}>ВАШИ ДАННЫЕ ДЛЯ ЗАПИСИ</Text>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ВАШЕ ИМЯ</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="Иван или Сардор"
                placeholderTextColor="#999"
                value={clientName}
                onChangeText={setClientName}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>НОМЕР ТЕЛЕФОНА</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="+998 90 123-45-67"
                placeholderTextColor="#999"
                keyboardType="phone-pad"
                value={clientPhone}
                onChangeText={setClientPhone}
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ПОЖЕЛАНИЕ ИЛИ КОММЕНТАРИЙ</Text>
              <TextInput
                style={[styles.fieldInput, { height: 60 }]}
                placeholder="Например: хочу переход с нуля"
                placeholderTextColor="#999"
                multiline
                value={clientComment}
                onChangeText={setClientComment}
              />
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, submitting && { opacity: 0.6 }]}
              onPress={handleConfirmBooking}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.confirmBtnText}>Подтвердить запись</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* ШАГ 5: УСПЕШНОЕ ОФОРМЛЕНИЕ */}
        {step === 5 && (
          <View style={styles.successContainer}>
            <View style={styles.successIconBox}>
              <Check size={40} color="#ffffff" />
            </View>
            <Text style={styles.successTitle}>Вы успешно записаны!</Text>
            <Text style={styles.successSub}>
              Ждем вас {selectedDate} в {selectedTime} в {salon.name}. Запись добавлена в ваши визиты.
            </Text>

            <TouchableOpacity
              style={styles.successDoneBtn}
              onPress={() => {
                onBookingSuccess();
                onClose();
              }}
            >
              <Text style={styles.successDoneBtnText}>Перейти к моим записям</Text>
            </TouchableOpacity>
          </View>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleCol: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  headerSub: {
    fontSize: 11,
    color: "#8e8e93",
    marginTop: 2,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    gap: 12,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8e8e93",
    marginBottom: 4,
  },
  serviceCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  serviceCardSelected: {
    borderColor: "#111111",
    borderWidth: 1.5,
  },
  srvLeft: {
    flex: 1,
    gap: 2,
  },
  srvName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
  },
  srvDuration: {
    fontSize: 11,
    color: "#8e8e93",
  },
  srvRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  srvPrice: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
  },
  staffCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  staffCardSelected: {
    borderColor: "#111111",
    borderWidth: 1.5,
  },
  staffAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  staffAvatarText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },
  staffInfo: {
    flex: 1,
    gap: 2,
  },
  staffName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
  },
  staffSpec: {
    fontSize: 11,
    color: "#8e8e93",
  },
  datePickerSection: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  dateScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    minWidth: 70,
  },
  datePillActive: {
    backgroundColor: "#111111",
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111111",
  },
  dateSub: {
    fontSize: 10,
    color: "#8e8e93",
    marginTop: 2,
  },
  dateTextActive: {
    color: "#ffffff",
  },
  slotsContainer: {
    padding: 16,
  },
  slotsLoading: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  loadingSlotsText: {
    fontSize: 12,
    color: "#8e8e93",
  },
  noSlotsBox: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  noSlotsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    marginTop: 4,
  },
  noSlotsSub: {
    fontSize: 11,
    color: "#8e8e93",
  },
  slotsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 8,
  },
  slotItem: {
    width: "22.5%",
    height: 44,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  slotItemActive: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },
  slotText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
  },
  slotTextActive: {
    color: "#ffffff",
  },
  summaryCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    gap: 8,
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  summaryKey: {
    fontSize: 12,
    color: "#8e8e93",
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111111",
  },
  summaryPrice: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111111",
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8e8e93",
  },
  fieldInput: {
    backgroundColor: "#ffffff",
    height: 48,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#111111",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  confirmBtn: {
    backgroundColor: "#111111",
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  confirmBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  successContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 16,
  },
  successIconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
  },
  successSub: {
    fontSize: 13,
    color: "#8e8e93",
    textAlign: "center",
    lineHeight: 18,
  },
  successDoneBtn: {
    backgroundColor: "#111111",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 16,
  },
  successDoneBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
});
