import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { ArrowRight, ChevronLeft, ShieldCheck } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api } from "../services/api";
import { authStorage } from "../services/auth";
import { User } from "../types";

interface LoginScreenProps {
  onLoginSuccess: (user: User, isBusiness?: boolean) => void;
  onOpenBusinessAuth: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onOpenBusinessAuth,
}) => {
  const [step, setStep] = useState<"phone" | "code" | "register">("phone");
  const [phone, setPhone] = useState("+998 ");
  const [code, setCode] = useState("");
  const [fullName, setFullName] = useState("");
  const [gender, setGender] = useState<"MALE" | "FEMALE">("MALE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);

  const handleSendCode = async () => {
    if (phone.replace(/\D/g, "").length < 12) {
      setError("Введите корректный номер телефона (+998 ...)");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.sendAuthCode(phone);
      if (res.error) {
        setError(res.error);
        return;
      }
      if (res.devCode) {
        setDevCode(res.devCode);
      }
      setStep("code");
      Haptics.selectionAsync();
    } catch {
      setError("Ошибка сети при отправке кода");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length < 5) {
      setError("Введите 5-значный код подтверждения");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.verifyAuthCode(phone, code);
      if (res.error) {
        setError(res.error);
        return;
      }

      if (res.user) {
        // Если имя не заполнено (новый пользователь), переводим на шаг ввода имени
        if (!res.user.fullName || res.user.fullName === "Пользователь") {
          setStep("register");
          return;
        }

        await authStorage.setUser(res.user);
        const hasSalon = res.user.ownedSalons && res.user.ownedSalons.length > 0;
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onLoginSuccess(res.user, hasSalon);
      }
    } catch {
      setError("Ошибка при проверке кода");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteClientRegistration = async () => {
    if (!fullName.trim()) {
      setError("Пожалуйста, введите ваше имя");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Сохраняем имя клиента через повторную валидацию с fullName
      const res = await api.verifyAuthCode(phone, code || "12121", fullName.trim());
      if (res.user) {
        await authStorage.setUser(res.user);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onLoginSuccess(res.user, false);
      }
    } catch {
      setError("Ошибка сохранения профиля");
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.card}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>D</Text>
          </View>
          <Text style={styles.title}>DIKIDI</Text>
          <Text style={styles.subtitle}>
            Онлайн-запись в салоны красоты и барбершопы Узбекистана
          </Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* ШАГ 1: ВВОД ТЕЛЕФОНА */}
        {step === "phone" && (
          <View style={styles.form}>
            <Text style={styles.label}>НОМЕР ТЕЛЕФОНА</Text>
            <TextInput
              style={styles.input}
              placeholder="+998 90 123-45-67"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(t) => {
                setPhone(t.startsWith("+998") ? t : "+998 ");
                setError("");
              }}
            />

            <TouchableOpacity
              onPress={handleSendCode}
              disabled={loading}
              style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.primaryBtnText}>Получить код</Text>
                  <ArrowRight size={16} color="#ffffff" />
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ШАГ 2: ВВОД 5-ЗНАЧНОГО КОДА */}
        {step === "code" && (
          <View style={styles.form}>
            <Text style={styles.label}>КОД ИЗ TELEGRAM ИЛИ SMS</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="00000"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={5}
              value={code}
              onChangeText={(t) => {
                setCode(t);
                setError("");
              }}
            />

            {devCode && (
              <View style={styles.devCodeBadge}>
                <Text style={styles.devCodeText}>Тестовый код: {devCode}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleVerifyCode}
              disabled={loading}
              style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>Войти</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setStep("phone");
                setCode("");
                setError("");
              }}
              style={styles.backBtn}
            >
              <Text style={styles.backBtnText}>Изменить номер телефона</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ШАГ 3: БЫСТРАЯ РЕГИСТРАЦИЯ НОВОГО КЛИЕНТА */}
        {step === "register" && (
          <View style={styles.form}>
            <Text style={styles.stepTitle}>Завершение регистрации</Text>
            <Text style={styles.stepSub}>Укажите ваше имя для записи к мастерам</Text>

            <View style={{ gap: 6 }}>
              <Text style={styles.label}>КАК ВАС ЗОВУТ?</Text>
              <TextInput
                style={styles.input}
                placeholder="Иван или Сардор"
                placeholderTextColor="#999"
                value={fullName}
                onChangeText={setFullName}
              />
            </View>

            <View style={{ gap: 6 }}>
              <Text style={styles.label}>ПОЛ (ДЛЯ РЕКОМЕНДАЦИЙ УСЛУГ)</Text>
              <View style={styles.genderRow}>
                <TouchableOpacity
                  style={[styles.genderBtn, gender === "MALE" && styles.genderBtnActive]}
                  onPress={() => setGender("MALE")}
                >
                  <Text style={[styles.genderBtnText, gender === "MALE" && styles.genderBtnTextActive]}>
                    Мужской
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.genderBtn, gender === "FEMALE" && styles.genderBtnActive]}
                  onPress={() => setGender("FEMALE")}
                >
                  <Text style={[styles.genderBtnText, gender === "FEMALE" && styles.genderBtnTextActive]}>
                    Женский
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              onPress={handleCompleteClientRegistration}
              disabled={loading}
              style={[styles.primaryBtn, loading && { opacity: 0.6 }]}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryBtnText}>Начать пользоваться</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* НЕПРИМЕТНАЯ КНОПКА ДЛЯ БИЗНЕСА В САМОМ НИЗУ */}
        <View style={styles.businessLinkSection}>
          <TouchableOpacity
            onPress={onOpenBusinessAuth}
            style={styles.businessLinkBtn}
            activeOpacity={0.6}
          >
            <Text style={styles.businessLinkText}>
              Для мастеров и салонов: вход в DIKIDI Business →
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 28,
    padding: 28,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.04,
    shadowRadius: 16,
    elevation: 3,
  },
  header: {
    alignItems: "center",
    marginBottom: 20,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  logoText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111111",
  },
  subtitle: {
    fontSize: 12,
    color: "#8e8e93",
    marginTop: 4,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8e8e93",
  },
  input: {
    height: 50,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    backgroundColor: "#fafafa",
    paddingHorizontal: 16,
    fontSize: 15,
    fontWeight: "600",
    color: "#111111",
  },
  codeInput: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  devCodeBadge: {
    backgroundColor: "#f5f5f7",
    padding: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  devCodeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111111",
  },
  primaryBtn: {
    height: 50,
    borderRadius: 16,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  stepSub: {
    fontSize: 12,
    color: "#8e8e93",
    marginTop: -6,
    marginBottom: 6,
  },
  genderRow: {
    flexDirection: "row",
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  genderBtnActive: {
    backgroundColor: "#111111",
  },
  genderBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8e8e93",
  },
  genderBtnTextActive: {
    color: "#ffffff",
  },
  backBtn: {
    alignItems: "center",
    paddingVertical: 6,
  },
  backBtnText: {
    fontSize: 12,
    color: "#8e8e93",
    fontWeight: "500",
  },
  errorText: {
    color: "#e11d48",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 8,
  },
  demoSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  demoBtn: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#f5f5f7",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  demoBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111111",
  },
  demoBtnPhone: {
    fontSize: 10,
    color: "#8e8e93",
    marginTop: 2,
  },
  businessLinkSection: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    alignItems: "center",
  },
  businessLinkBtn: {
    paddingVertical: 4,
  },
  businessLinkText: {
    fontSize: 11,
    color: "#8e8e93",
    fontWeight: "500",
  },
});
