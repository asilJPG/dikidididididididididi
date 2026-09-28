import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import {
  Calendar,
  Users,
  DollarSign,
  Store,
  Search,
  BookmarkCheck,
  User,
} from "lucide-react-native";
import { AppMode } from "../types";

export type BusinessTabKey = "journal" | "clients" | "finance" | "salon";
export type ClientTabKey = "catalog" | "my-bookings" | "client-profile";
export type TabKey = BusinessTabKey | ClientTabKey;

interface TabBarProps {
  mode: AppMode;
  currentTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
}

export const TabBar: React.FC<TabBarProps> = ({ mode, currentTab, onSelectTab }) => {
  const businessTabs = [
    { key: "journal" as TabKey, label: "Журнал", icon: Calendar },
    { key: "clients" as TabKey, label: "Клиенты", icon: Users },
    { key: "finance" as TabKey, label: "Касса", icon: DollarSign },
    { key: "salon" as TabKey, label: "Салон", icon: Store },
  ];

  const clientTabs = [
    { key: "catalog" as TabKey, label: "Каталог", icon: Search },
    { key: "my-bookings" as TabKey, label: "Мои записи", icon: Calendar },
    { key: "client-profile" as TabKey, label: "Профиль", icon: User },
  ];

  const tabs = mode === "business" ? businessTabs : clientTabs;

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.key;
        const color = isActive ? "#111111" : "#8e8e93";

        return (
          <TouchableOpacity
            key={tab.key}
            onPress={() => onSelectTab(tab.key)}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <Icon size={20} color={color} strokeWidth={isActive ? 2.5 : 2} />
            <Text style={[styles.tabLabel, { color, fontWeight: isActive ? "700" : "500" }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    paddingTop: 8,
    paddingBottom: Platform.OS === "ios" ? 28 : 12,
    justifyContent: "space-around",
    alignItems: "center",
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    minWidth: 64,
  },
  tabLabel: {
    fontSize: 10,
  },
});
