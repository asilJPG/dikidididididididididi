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
import { ShieldCheck, ArrowRight } from "lucide-react-native";
import { api } from "../services/api";
import { authStorage } from "../services/auth";
import { User } from "../types";

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [phone, setPhone] = useState("+998 ");
  const [code, setCode] = useState("");
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
    } catch {
      setError("Ошибка сети при отправке кода");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (code.length < 4) {
      setError("Введите 4-значный код");
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
        await authStorage.setUser(res.user);
        onLoginSuccess(res.user);
      }
    } catch {
      setError("Ошибка при проверке кода");
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoPhone: string) => {
    setLoading(true);
    try {
      const res = await api.verifyAuthCode(demoPhone, "7777");
      if (res.user) {
        await authStorage.setUser(res.user);
        onLoginSuccess(res.user);
      }
    } catch {
      setError("Ошибка демо-входа");
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
          <Text style={styles.title}>DIKIDI Business</Text>
          <Text style={styles.subtitle}>Вход для владельцев салонов и мастеров</Text>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {step === "phone" ? (
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
        ) : (
          <View style={styles.form}>
            <Text style={styles.label}>4-ЗНАЧНЫЙ КОД</Text>
            <TextInput
              style={[styles.input, styles.codeInput]}
              placeholder="0000"
              placeholderTextColor="#999"
              keyboardType="number-pad"
              maxLength={4}
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
                <Text style={styles.primaryBtnText}>Войти в кабинет</Text>
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
              <Text style={styles.backBtnText}>Изменить номер</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Быстрый вход для демо */}
        <View style={styles.demoSection}>
          <Text style={styles.demoTitle}>БЫСТРЫЙ ВХОД ДЛЯ ТЕСТА</Text>
          <TouchableOpacity
            onPress={() => handleQuickLogin("+998901234567")}
            style={styles.demoBtn}
          >
            <Text style={styles.demoBtnText}>Bro Barbershop (Сардор Алимов)</Text>
            <Text style={styles.demoBtnPhone}>+998 90 123-45-67</Text>
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
    marginBottom: 24,
  },
  logoBadge: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  logoText: {
    color: "#ffffff",
    fontSize: 22,
    fontWeight: "900",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#111111",
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: "#8e8e93",
    marginTop: 4,
    textAlign: "center",
  },
  form: {
    gap: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8e8e93",
    letterSpacing: 0.6,
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
    letterSpacing: 10,
    fontSize: 20,
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
    marginTop: 6,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  primaryBtnText: {
    color: "#ffffff",
    fontSize: 13,
    fontWeight: "600",
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
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
  },
  demoTitle: {
    fontSize: 9,
    fontWeight: "700",
    color: "#8e8e93",
    letterSpacing: 0.6,
    textAlign: "center",
    marginBottom: 8,
  },
  demoBtn: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#f5f5f7",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
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
  },
});
