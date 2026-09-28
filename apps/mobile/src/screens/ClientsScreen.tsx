import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import { Search, Phone, Send, UserCheck } from "lucide-react-native";
import { Salon, Customer } from "../types";
import { api } from "../services/api";
import { formatUZS, formatPhoneUZ } from "../config";

interface ClientsScreenProps {
  salon: Salon | null;
}

export const ClientsScreen: React.FC<ClientsScreenProps> = ({ salon }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const loadCustomers = async () => {
    if (!salon) return;
    try {
      const data = await api.getCustomers(salon.id, search);
      setCustomers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [salon, search]);

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleTelegram = (phone: string) => {
    const raw = phone.replace(/\D/g, "");
    Linking.openURL(`https://t.me/${raw}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <Text style={styles.title}>База клиентов</Text>
        <Text style={styles.subtitle}>Всего в базе: {customers.length}</Text>

        <View style={styles.searchBox}>
          <Search size={16} color="#8e8e93" />
          <TextInput
            style={styles.searchInput}
            placeholder="Поиск по имени или телефону..."
            placeholderTextColor="#999"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch("")}>
              <Text style={{ color: "#999", fontSize: 13 }}>✕</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color="#111111" />
        </View>
      ) : customers.length === 0 ? (
        <View style={styles.emptyBox}>
          <UserCheck size={36} color="#cccccc" />
          <Text style={styles.emptyText}>Клиенты не найдены</Text>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.fullName.slice(0, 2).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.info}>
                  <Text style={styles.name}>{item.fullName}</Text>
                  <Text style={styles.phone}>{formatPhoneUZ(item.phone)}</Text>
                </View>

                <View style={styles.actions}>
                  <TouchableOpacity
                    onPress={() => handleTelegram(item.phone)}
                    style={styles.actionBtnTg}
                  >
                    <Send size={14} color="#ffffff" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleCall(item.phone)}
                    style={styles.actionBtnCall}
                  >
                    <Phone size={14} color="#ffffff" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Визитов</Text>
                  <Text style={styles.statValue}>{item.totalVisits}</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Потрачено всего</Text>
                  <Text style={styles.statValue}>{formatUZS(item.totalSpent)}</Text>
                </View>
              </View>

              {item.notes ? (
                <View style={styles.notesBox}>
                  <Text style={styles.notesText}>{item.notes}</Text>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
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
    marginBottom: 10,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f7",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111111",
  },
  list: {
    padding: 16,
    gap: 10,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111111",
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#111111",
  },
  phone: {
    fontSize: 11,
    color: "#8e8e93",
    marginTop: 1,
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtnTg: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#229ED9",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnCall: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row",
    backgroundColor: "#fafafa",
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 20,
    backgroundColor: "rgba(0,0,0,0.06)",
  },
  statLabel: {
    fontSize: 10,
    color: "#8e8e93",
  },
  statValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111111",
    marginTop: 2,
  },
  notesBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#f9f9fb",
    borderRadius: 8,
  },
  notesText: {
    fontSize: 11,
    color: "#666666",
    fontStyle: "italic",
  },
  loadingBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#8e8e93",
  },
});
