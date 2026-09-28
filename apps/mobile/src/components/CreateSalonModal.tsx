import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { X, Store, MapPin, Phone, FileText } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { api } from "../services/api";
import { User, Salon } from "../types";

interface CreateSalonModalProps {
  visible: boolean;
  currentUser: User | null;
  onClose: () => void;
  onSalonCreated: (salon: Salon) => void;
}

export const CreateSalonModal: React.FC<CreateSalonModalProps> = ({
  visible,
  currentUser,
  onClose,
  onSalonCreated,
}) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(currentUser?.phone || "+998 ");
  const [city, setCity] = useState("Ташкент");
  const [address, setAddress] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) {
      setError("Укажите название салона");
      return;
    }
    if (!address.trim()) {
      setError("Укажите адрес салона");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await api.createSalon({
        name: name.trim(),
        phone: phone.trim(),
        city: city.trim() || "Ташкент",
        address: address.trim(),
        description: description.trim(),
        ownerId: currentUser?.id,
        ownerPhone: currentUser?.phone,
      });

      if (res.error) {
        setError(res.error);
        return;
      }

      if (res.salon) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSalonCreated(res.salon);
        onClose();
      }
    } catch {
      setError("Ошибка создания салона. Проверьте сеть.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.iconBadge}>
              <Store size={20} color="#111111" />
            </View>
            <Text style={styles.title}>Создание салона</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color="#8e8e93" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.field}>
            <Text style={styles.label}>НАЗВАНИЕ САЛОНА / БАРБЕРШОПА</Text>
            <TextInput
              style={styles.input}
              placeholder="Например: Barbershop Chop-Chop"
              placeholderTextColor="#999"
              value={name}
              onChangeText={(t) => {
                setName(t);
                setError("");
              }}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>ГОРОД</Text>
            <TextInput
              style={styles.input}
              placeholder="Ташкент"
              placeholderTextColor="#999"
              value={city}
              onChangeText={setCity}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>АДРЕС</Text>
            <TextInput
              style={styles.input}
              placeholder="ул. Амира Темура, 45 (ориентир метро Ойбек)"
              placeholderTextColor="#999"
              value={address}
              onChangeText={(t) => {
                setAddress(t);
                setError("");
              }}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>КОНТАКТНЫЙ ТЕЛЕФОН САЛОНА</Text>
            <TextInput
              style={styles.input}
              placeholder="+998 90 123-45-67"
              placeholderTextColor="#999"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>ОПИСАНИЕ (НЕОБЯЗАТЕЛЬНО)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Краткое описание салона, стиль, особенности..."
              placeholderTextColor="#999"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, loading && { opacity: 0.7 }]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitBtnText}>Создать салон и начать работу</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
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
    fontSize: 17,
    fontWeight: "700",
    color: "#111111",
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  errorText: {
    fontSize: 13,
    color: "#ef4444",
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 12,
    textAlign: "center",
  },
  field: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: "700",
    color: "#8e8e93",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: "#111111",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  textArea: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: "top",
  },
  submitBtn: {
    backgroundColor: "#111111",
    borderRadius: 16,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  submitBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});
