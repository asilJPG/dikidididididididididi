import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  X,
  Lock,
  Building,
  Video,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api } from "../services/api";
import { authStorage } from "../services/auth";
import { User } from "../types";

interface BusinessAuthModalProps {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess: (user: User) => void;
}

export const BusinessAuthModal: React.FC<BusinessAuthModalProps> = ({
  visible,
  onClose,
  onLoginSuccess,
}) => {
  const [tab, setTab] = useState<"login" | "register">("login");

  // Состояние входа
  const [loginInput, setLoginInput] = useState("+998 90 123-45-67");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Состояние заявки на регистрацию
  const [regPhone, setRegPhone] = useState("+998 ");
  const [salonName, setSalonName] = useState("");
  const [category, setCategory] = useState("Барбершоп");
  const [address, setAddress] = useState("");
  const [videoAttached, setVideoAttached] = useState(false);
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState("");

  const CATEGORIES = [
    "Барбершоп",
    "Салон красоты",
    "Ногтевой сервис",
    "Косметология",
    "Массаж и СПА",
    "Частный мастер",
  ];

  // Вход по логину и паролю
  const handleBusinessLogin = async () => {
    if (!loginInput.trim() || !passwordInput.trim()) {
      setLoginError("Введите логин и пароль");
      return;
    }

    setLoginLoading(true);
    setLoginError("");

    try {
      const res = await api.businessLogin(loginInput, passwordInput);
      if (res.error) {
        setLoginError(res.error);
        return;
      }

      if (res.user) {
        await authStorage.setUser(res.user);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onLoginSuccess(res.user);
        onClose();
      }
    } catch {
      setLoginError("Ошибка сети при входе");
    } finally {
      setLoginLoading(false);
    }
  };

  // Быстрый демо-вход для владельца
  const handleQuickDemoBusinessLogin = async () => {
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await api.businessLogin("+998901234567", "demo123");
      if (res.user) {
        await authStorage.setUser(res.user);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onLoginSuccess(res.user);
        onClose();
      } else if (res.error) {
        // Fallback через обычный verify
        const fallback = await api.verifyAuthCode("+998901234567", "7777");
        if (fallback.user) {
          await authStorage.setUser(fallback.user);
          onLoginSuccess(fallback.user);
          onClose();
        }
      }
    } catch {
      setLoginError("Ошибка демо-входа");
    } finally {
      setLoginLoading(false);
    }
  };

  // Имитация прикрепления видео
  const handleAttachVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVideoAttached(true);
    Alert.alert("Видео выбрано", "Видеозапись рабочего места прикреплена (workspace_video.mp4, 18.2 MB)");
  };

  // Отправка заявки на регистрацию
  const handleRegisterBusiness = async () => {
    if (regPhone.replace(/\D/g, "").length < 12) {
      setRegError("Введите корректный номер телефона (+998...)");
      return;
    }
    if (!salonName.trim()) {
      setRegError("Укажите название салона или имя мастера");
      return;
    }
    if (!address.trim()) {
      setRegError("Укажите адрес помещения");
      return;
    }
    if (!videoAttached) {
      setRegError("Пожалуйста, прикрепите короткое видео рабочего места");
      return;
    }

    setRegLoading(true);
    setRegError("");

    try {
      const res = await api.submitBusinessApplication({
        phone: regPhone,
        salonName: salonName.trim(),
        category,
        address: address.trim(),
        videoName: "workspace_video.mp4",
      });

      if (res.success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setRegSuccess(true);
      } else {
        setRegError(res.error || "Не удалось отправить заявку");
      }
    } catch {
      setRegError("Сетевая ошибка при отправке заявки");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        {/* Шапка модалки */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color="#111111" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>DIKIDI Business</Text>
            <Text style={styles.headerSub}>Кабинет для мастеров и салонов</Text>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {regSuccess ? (
          /* ЭКРАН ОЖИДАНИЯ МОДЕРАЦИИ */
          <View style={styles.moderationContainer}>
            <View style={styles.moderationIconBox}>
              <Clock size={40} color="#f59e0b" />
            </View>
            <Text style={styles.moderationTitle}>Заявка на модерации</Text>
            <Text style={styles.moderationSub}>
              Мы получили заявку и видео помещения салона «{salonName}». Наш модератор проверит данные в течение 24 часов.
            </Text>
            <View style={styles.moderationCard}>
              <ShieldCheck size={20} color="#10b981" />
              <Text style={styles.moderationCardText}>
                После проверки мы отправим логин и пароль для входа по SMS на номер {regPhone}.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                setRegSuccess(false);
                onClose();
              }}
            >
              <Text style={styles.doneBtnText}>Понятно, вернуться</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Переключатель Вход / Заявка */}
            <View style={styles.tabToggle}>
              <TouchableOpacity
                style={[styles.toggleBtn, tab === "login" && styles.toggleBtnActive]}
                onPress={() => {
                  setTab("login");
                  setLoginError("");
                }}
              >
                <Text style={[styles.toggleBtnText, tab === "login" && styles.toggleBtnTextActive]}>
                  Вход по паролю
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleBtn, tab === "register" && styles.toggleBtnActive]}
                onPress={() => {
                  setTab("register");
                  setRegError("");
                }}
              >
                <Text style={[styles.toggleBtnText, tab === "register" && styles.toggleBtnTextActive]}>
                  Подать заявку
                </Text>
              </TouchableOpacity>
            </View>

            {/* ВКЛАДКА 1: ВХОД ПО ЛОГИНУ И ПАРОЛЮ */}
            {tab === "login" && (
              <View style={styles.form}>
                <Text style={styles.infoBanner}>
                  Вход предназначен только для подтвержденных партнеров, получивших пароль от администрации.
                </Text>

                {loginError ? <Text style={styles.errorText}>{loginError}</Text> : null}

                <View style={styles.field}>
                  <Text style={styles.label}>ЛОГИН / ТЕЛЕФОН</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+998 90 123-45-67"
                    placeholderTextColor="#999"
                    value={loginInput}
                    onChangeText={setLoginInput}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>ПАРОЛЬ</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Введите пароль"
                    placeholderTextColor="#999"
                    secureTextEntry
                    value={passwordInput}
                    onChangeText={setPasswordInput}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, loginLoading && { opacity: 0.6 }]}
                  onPress={handleBusinessLogin}
                  disabled={loginLoading}
                >
                  {loginLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Войти в кабинет CRM</Text>
                  )}
                </TouchableOpacity>

                {/* Быстрый демо-вход */}
                <View style={styles.demoSection}>
                  <Text style={styles.demoTitle}>БЫСТРЫЙ ДЕМО-ВХОД ДЛЯ ТЕСТА</Text>
                  <TouchableOpacity
                    style={styles.demoBtn}
                    onPress={handleQuickDemoBusinessLogin}
                  >
                    <View>
                      <Text style={styles.demoBtnName}>Bro Barbershop (Владелец)</Text>
                      <Text style={styles.demoBtnPhone}>+998 90 123-45-67</Text>
                    </View>
                    <ArrowRight size={16} color="#8e8e93" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.switchTabLink}
                  onPress={() => setTab("register")}
                >
                  <Text style={styles.switchTabLinkText}>
                    Нет аккаунта? Подайте заявку на подключение бизнеса →
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ВКЛАДКА 2: РЕГИСТРАЦИЯ БИЗНЕСА С ВИДЕО */}
            {tab === "register" && (
              <View style={styles.form}>
                <Text style={styles.infoBanner}>
                  Для защиты клиентов от мошенников все новые салоны проходят строгую модерацию с подтверждением видеозаписью.
                </Text>

                {regError ? <Text style={styles.errorText}>{regError}</Text> : null}

                <View style={styles.field}>
                  <Text style={styles.label}>НОМЕР ТЕЛЕФОНА</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="+998 90 123-45-67"
                    placeholderTextColor="#999"
                    keyboardType="phone-pad"
                    value={regPhone}
                    onChangeText={setRegPhone}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>НАЗВАНИЕ САЛОНА / ИМЯ МАСТЕРА</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Например: Chop-Chop Tashkent"
                    placeholderTextColor="#999"
                    value={salonName}
                    onChangeText={setSalonName}
                  />
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>КАТЕГОРИЯ</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catScroll}>
                    {CATEGORIES.map((c) => {
                      const isSelected = category === c;
                      return (
                        <TouchableOpacity
                          key={c}
                          style={[styles.catPill, isSelected && styles.catPillActive]}
                          onPress={() => setCategory(c)}
                        >
                          <Text style={[styles.catPillText, isSelected && styles.catPillTextActive]}>
                            {c}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                <View style={styles.field}>
                  <Text style={styles.label}>ГОРОД И АДРЕС ПОМЕЩЕНИЯ</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="г. Ташкент, Мирабадский р-н, ул. Нукус, 21"
                    placeholderTextColor="#999"
                    value={address}
                    onChangeText={setAddress}
                  />
                </View>

                {/* Блок видео */}
                <View style={styles.field}>
                  <Text style={styles.label}>ВИДЕО РАБОЧЕГО МЕСТА / ВЫВЕСКИ</Text>
                  <TouchableOpacity
                    style={[styles.videoBtn, videoAttached && styles.videoBtnAttached]}
                    onPress={handleAttachVideo}
                  >
                    {videoAttached ? (
                      <>
                        <CheckCircle2 size={20} color="#10b981" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.videoAttachedTitle}>Видео прикреплено</Text>
                          <Text style={styles.videoAttachedSub}>workspace_video.mp4 (18.2 MB)</Text>
                        </View>
                        <Text style={styles.videoChangeText}>Изменить</Text>
                      </>
                    ) : (
                      <>
                        <Video size={20} color="#111111" />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.videoBtnTitle}>Снять или прикрепить видео</Text>
                          <Text style={styles.videoBtnSub}>10–30 сек. с вывеской или креслами</Text>
                        </View>
                      </>
                    )}
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={[styles.primaryBtn, regLoading && { opacity: 0.6 }]}
                  onPress={handleRegisterBusiness}
                  disabled={regLoading}
                >
                  {regLoading ? (
                    <ActivityIndicator color="#ffffff" />
                  ) : (
                    <Text style={styles.primaryBtnText}>Отправить заявку на модерацию</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        )}
      </KeyboardAvoidingView>
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
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 16,
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
  },
  tabToggle: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    padding: 4,
    borderRadius: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  toggleBtnActive: {
    backgroundColor: "#111111",
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8e8e93",
  },
  toggleBtnTextActive: {
    color: "#ffffff",
  },
  form: {
    gap: 12,
  },
  infoBanner: {
    fontSize: 11,
    color: "#8e8e93",
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    lineHeight: 16,
  },
  errorText: {
    color: "#e11d48",
    fontSize: 12,
    textAlign: "center",
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
    borderColor: "rgba(0,0,0,0.06)",
  },
  catScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  catPillActive: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },
  catPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111111",
  },
  catPillTextActive: {
    color: "#ffffff",
  },
  videoBtn: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  videoBtnAttached: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  videoBtnTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111111",
  },
  videoBtnSub: {
    fontSize: 10,
    color: "#8e8e93",
    marginTop: 2,
  },
  videoAttachedTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#065f46",
  },
  videoAttachedSub: {
    fontSize: 10,
    color: "#059669",
    marginTop: 2,
  },
  videoChangeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563eb",
  },
  primaryBtn: {
    backgroundColor: "#111111",
    height: 50,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  demoSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  demoTitle: {
    fontSize: 9,
    fontWeight: "700",
    color: "#8e8e93",
    textAlign: "center",
    marginBottom: 8,
  },
  demoBtn: {
    backgroundColor: "#ffffff",
    padding: 12,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  demoBtnName: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111111",
  },
  demoBtnPhone: {
    fontSize: 10,
    color: "#8e8e93",
    marginTop: 2,
  },
  switchTabLink: {
    alignItems: "center",
    paddingVertical: 12,
  },
  switchTabLinkText: {
    fontSize: 12,
    color: "#8e8e93",
    fontWeight: "500",
  },
  moderationContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
    gap: 14,
  },
  moderationIconBox: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  moderationTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111111",
  },
  moderationSub: {
    fontSize: 13,
    color: "#8e8e93",
    textAlign: "center",
    lineHeight: 18,
  },
  moderationCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 14,
    gap: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    marginVertical: 10,
  },
  moderationCardText: {
    flex: 1,
    fontSize: 12,
    color: "#111111",
    lineHeight: 16,
  },
  doneBtn: {
    backgroundColor: "#111111",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
  },
  doneBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "700",
  },
});
