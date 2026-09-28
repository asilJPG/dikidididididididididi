import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { CreditCard, Banknote, TrendingUp, DollarSign } from "lucide-react-native";
import { Salon, Appointment } from "../types";
import { api } from "../services/api";
import { formatUZS } from "../config";

interface FinanceScreenProps {
  salon: Salon | null;
}

export const FinanceScreen: React.FC<FinanceScreenProps> = ({ salon }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const todayStr = (() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const loadData = async () => {
    if (!salon) return;
    try {
      const data = await api.getAppointments(salon.id, todayStr);
      setAppointments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [salon]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const totalRevenue = appointments
    .filter((a) => a.status === "COMPLETED" || a.paymentStatus === "PAID")
    .reduce((sum, a) => sum + a.price, 0);

  const clickPaymeRevenue = appointments
    .filter((a) => a.paymentMethod === "CLICK" || a.paymentMethod === "PAYME")
    .reduce((sum, a) => sum + a.price, 0);

  const cashRevenue = appointments
    .filter((a) => a.paymentMethod === "CASH")
    .reduce((sum, a) => sum + a.price, 0);

  const payrollEstimate = Math.round(totalRevenue * 0.45);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#111111" />}
    >
      <View style={styles.topBar}>
        <Text style={styles.title}>Касса и финансы</Text>
        <Text style={styles.subtitle}>Сводка за сегодня</Text>
      </View>

      <View style={styles.content}>
        {/* Главная карточка выручки */}
        <View style={styles.mainCard}>
          <Text style={styles.mainLabel}>ВЫРУЧКА ЗА СЕГОДНЯ</Text>
          <Text style={styles.mainAmount}>{formatUZS(totalRevenue)}</Text>
          <Text style={styles.mainSub}>Всего визитов: {appointments.length}</Text>
        </View>

        {/* Разделение оплат */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Способы оплаты</Text>

          <View style={styles.paymentRow}>
            <View style={styles.paymentLeft}>
              <View style={[styles.iconBox, { backgroundColor: "#e0f2fe" }]}>
                <CreditCard size={18} color="#0284c7" />
              </View>
              <View>
                <Text style={styles.paymentName}>Click / Payme</Text>
                <Text style={styles.paymentSub}>Безналичный расчет</Text>
              </View>
            </View>
            <Text style={styles.paymentAmount}>{formatUZS(clickPaymeRevenue)}</Text>
          </View>

          <View style={[styles.paymentRow, { borderBottomWidth: 0 }]}>
            <View style={styles.paymentLeft}>
              <View style={[styles.iconBox, { backgroundColor: "#ecfdf5" }]}>
                <Banknote size={18} color="#059669" />
              </View>
              <View>
                <Text style={styles.paymentName}>Наличные (Naqd)</Text>
                <Text style={styles.paymentSub}>Оплата в кассу</Text>
              </View>
            </View>
            <Text style={styles.paymentAmount}>{formatUZS(cashRevenue)}</Text>
          </View>
        </View>

        {/* Зарплатный фонд */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <TrendingUp size={16} color="#111111" />
            <Text style={styles.cardTitle}>Зарплаты мастеров</Text>
          </View>

          <Text style={styles.payrollAmount}>{formatUZS(payrollEstimate)}</Text>
          <Text style={styles.payrollSub}>
            Ориентировочный расчет по ставке мастеров (~45% от чека)
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  topBar: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
  },
  subtitle: {
    fontSize: 11,
    color: "#8e8e93",
    marginTop: 2,
  },
  content: {
    padding: 16,
    gap: 12,
  },
  mainCard: {
    backgroundColor: "#111111",
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  mainLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8e8e93",
    letterSpacing: 0.8,
  },
  mainAmount: {
    fontSize: 28,
    fontWeight: "800",
    color: "#ffffff",
    marginTop: 6,
    letterSpacing: -0.5,
  },
  mainSub: {
    fontSize: 11,
    color: "#8e8e93",
    marginTop: 4,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
    marginBottom: 12,
  },
  paymentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
  },
  paymentLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  paymentName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111111",
  },
  paymentSub: {
    fontSize: 10,
    color: "#8e8e93",
    marginTop: 1,
  },
  paymentAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
  },
  payrollAmount: {
    fontSize: 22,
    fontWeight: "700",
    color: "#111111",
  },
  payrollSub: {
    fontSize: 11,
    color: "#8e8e93",
    marginTop: 4,
    lineHeight: 16,
  },
});
