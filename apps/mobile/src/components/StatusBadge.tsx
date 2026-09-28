import React from "react";
import { View, Text, StyleSheet } from "react-native";

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case "CONFIRMED":
      return (
        <View style={[styles.badge, styles.confirmed]}>
          <Text style={styles.confirmedText}>Подтверждена</Text>
        </View>
      );
    case "IN_PROGRESS":
      return (
        <View style={[styles.badge, styles.inProgress]}>
          <Text style={styles.inProgressText}>В кресле</Text>
        </View>
      );
    case "COMPLETED":
      return (
        <View style={[styles.badge, styles.completed]}>
          <Text style={styles.completedText}>Завершена</Text>
        </View>
      );
    case "CANCELLED":
      return (
        <View style={[styles.badge, styles.cancelled]}>
          <Text style={styles.cancelledText}>Отменена</Text>
        </View>
      );
    case "PENDING":
    default:
      return (
        <View style={[styles.badge, styles.pending]}>
          <Text style={styles.pendingText}>Новая заявка</Text>
        </View>
      );
  }
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  confirmed: {
    backgroundColor: "#111111",
  },
  confirmedText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "700",
  },
  inProgress: {
    backgroundColor: "#fef3c7",
    borderWidth: 1,
    borderColor: "#fde68a",
  },
  inProgressText: {
    color: "#92400e",
    fontSize: 10,
    fontWeight: "700",
  },
  completed: {
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  completedText: {
    color: "#065f46",
    fontSize: 10,
    fontWeight: "700",
  },
  cancelled: {
    backgroundColor: "#ffe4e6",
    borderWidth: 1,
    borderColor: "#fecdd3",
  },
  cancelledText: {
    color: "#9f1239",
    fontSize: 10,
    fontWeight: "700",
  },
  pending: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  pendingText: {
    color: "#374151",
    fontSize: 10,
    fontWeight: "700",
  },
});
