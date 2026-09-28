import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { CreditCard, Banknote, TrendingUp, User as UserIcon } from "lucide-react-native";
import { Salon, Appointment, User } from "../types";
import { api } from "../services/api";
import { formatUZS } from "../config";

interface FinanceScreenProps {
  salon: Salon | null;
  currentUser?: User | null;
}

export const FinanceScreen: React.FC<FinanceScreenProps> = ({ salon, currentUser }) => {
  const isMaster = !!currentUser?.staffProfile || currentUser?.role === "MASTER";
  const masterStaffId = currentUser?.staffProfile?.id;
  const masterPercent = currentUser?.staffProfile?.commissionPercent || 40;

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
    if (!salon) {
      setRefreshing(false);
      setAppointments([]);
      return;
    }
    try {
      const staffParam = isMaster && masterStaffId ? masterStaffId : "all";
      const data = await api.getAppointments(salon.id, todayStr, staffParam);
      setAppointments(data);
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [salon, isMaster, masterStaffId]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const completedAppts = appointments.filter(
    (a) => a.status === "COMPLETED" || a.paymentStatus === "PAID"
  );

  const totalRevenue = completedAppts.reduce((sum, a) => sum + a.price, 0);

  const clickPaymeRevenue = completedAppts
    .filter((a) => a.paymentMethod === "CLICK" || a.paymentMethod === "PAYME")
    .reduce((sum, a) => sum + a.price, 0);

  const cashRevenue = completedAppts
    .filter((a) => a.paymentMethod === "CASH")
    .reduce((sum, a) => sum + a.price, 0);

  const myEarnings = Math.round(totalRevenue * (masterPercent / 100));
  const payrollEstimate = Math.round(totalRevenue * 0.45);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#111111" />}
    >
      <View style={styles.topBar}>
        <Text style={styles.title}>
          {isMaster ? "Мой доход и касса" : "Касса и финансы"}
        </Text>
        <Text style={styles.subtitle}>
          {isMaster
            ? `Мастер: ${currentUser?.staffProfile?.fullName || currentUser?.fullName} (${masterPercent}%)`
            : `Сводка за сегодня · ${salon?.name || "Точка"}`}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Главная карточка выручки */}
        <View style={styles.mainCard}>
          <Text style={styles.mainLabel}>
            {isMaster ? "МОЙ ЗАРАБОТОК ЗА СЕГОДНЯ" : "ВЫРУЧКА ТОЧКИ ЗА СЕГОДНЯ"}
          </Text>
          <Text style={styles.mainAmount}>
            {formatUZS(isMaster ? myEarnings : totalRevenue)}
          </Text>
          <Text style={styles.mainSub}>
            {isMaster
              ? `Выполнено записей: ${completedAppts.length} (из ${appointments.length})`
              : `Всего визитов сегодня: ${appointments.length}`}
          </Text>
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
                <Text style={styles.paymentSub}>Оплата клиентом</Text>
              </View>
            </View>
            <Text style={styles.paymentAmount}>{formatUZS(cashRevenue)}</Text>
          </View>
        </View>

        {/* Зарплатный фонд (для владельца) или детальная ставка (для мастера) */}
        <View style={styles.card}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <TrendingUp size={16} color="#111111" />
            <Text style={styles.cardTitle}>
              {isMaster ? "Условия начисления" : "Зарплатный фонд мастеров"}
            </Text>
          </View>

          <Text style={styles.payrollAmount}>
            {formatUZS(isMaster ? myEarnings : payrollEstimate)}
          </Text>
          <Text style={styles.payrollSub}>
            {isMaster
              ? `Ваша ставка составляет ${masterPercent}% от чека за каждую выполненную услугу.`
              : `Ориентировочный расчет по ставке мастеров (~45% от чека салона).`}
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
    paddingBottom: 40,
  },
  mainCard: {
    backgroundColor: "#111111",
    borderRadius: 22,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  mainLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "rgba(255,255,255,0.6)",
  },
  mainAmount: {
    fontSize: 28,
    fontWeight: "900",
    color: "#ffffff",
    marginTop: 6,
  },
  mainSub: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
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
    justifyContent: "space-between",
    alignItems: "center",
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
    width: 38,
    height: 38,
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
  },
  paymentAmount: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
  },
  payrollAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#059669",
    marginTop: 2,
  },
  payrollSub: {
    fontSize: 11,
    color: "#8e8e93",
    marginTop: 4,
    lineHeight: 16,
  },
});
