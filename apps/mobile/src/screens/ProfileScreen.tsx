import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
  Linking,
  Platform,
} from "react-native";
import {
  Store,
  MapPin,
  Star,
  ExternalLink,
  Share2,
  LogOut,
  Send,
  Plus,
  Edit2,
  ChevronRight,
  Calendar,
  Clock,
} from "lucide-react-native";
import { Salon, User, Service, Staff } from "../types";
import { API_BASE_URL, formatUZS } from "../config";
import { ManageServiceModal } from "../components/ManageServiceModal";
import { ManageStaffModal } from "../components/ManageStaffModal";
import { ManageScheduleModal } from "../components/ManageScheduleModal";
import { CreateSalonModal } from "../components/CreateSalonModal";

interface ProfileScreenProps {
  salon: Salon | null;
  currentUser: User | null;
  onLogout: () => void;
  onReloadSalon?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  salon,
  currentUser,
  onLogout,
  onReloadSalon,
}) => {
  const [createSalonVisible, setCreateSalonVisible] = useState(false);
  const [serviceModalVisible, setServiceModalVisible] = useState(false);
  const [serviceToEdit, setServiceToEdit] = useState<Service | null>(null);

  const [staffModalVisible, setStaffModalVisible] = useState(false);
  const [staffToEdit, setStaffToEdit] = useState<Staff | null>(null);

  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [staffForSchedule, setStaffForSchedule] = useState<Staff | null>(null);

  const handleOpenSchedule = (st: Staff) => {
    setStaffForSchedule(st);
    setScheduleModalVisible(true);
  };

  if (!salon) {
    return (
      <View style={styles.container}>
        <View style={styles.noSalonContainer}>
          <View style={styles.noSalonIconBadge}>
            <Store size={36} color="#111111" />
          </View>
          <Text style={styles.noSalonTitle}>Салон еще не создан</Text>
          <Text style={styles.noSalonSub}>
            Создайте профиль вашего салона или барбершопа, чтобы добавлять услуги, подключать мастеров и вести журнал записей.
          </Text>

          <TouchableOpacity
            style={styles.createSalonBtn}
            onPress={() => setCreateSalonVisible(true)}
            activeOpacity={0.8}
          >
            <Plus size={18} color="#ffffff" strokeWidth={2.5} />
            <Text style={styles.createSalonBtnText}>Создать салон</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutBtnEmpty}
            onPress={onLogout}
            activeOpacity={0.7}
          >
            <LogOut size={16} color="#e11d48" />
            <Text style={styles.logoutBtnEmptyText}>Выйти из аккаунта</Text>
          </TouchableOpacity>
        </View>

        <CreateSalonModal
          visible={createSalonVisible}
          currentUser={currentUser}
          onClose={() => setCreateSalonVisible(false)}
          onSalonCreated={() => {
            onReloadSalon?.();
          }}
        />
      </View>
    );
  }

  const isOwner =
    currentUser?.role === "OWNER" ||
    currentUser?.role === "SALON_OWNER" ||
    (currentUser?.ownedSalons && currentUser.ownedSalons.length > 0) ||
    !currentUser?.staffProfile;

  const myStaffProfile =
    currentUser?.staffProfile ||
    salon?.staff.find(
      (st) =>
        (currentUser?.phone && (st as any).phone === currentUser.phone) ||
        st.fullName.toLowerCase() === currentUser?.fullName?.toLowerCase()
    );

  const bookingUrl = `${API_BASE_URL}/b/${salon.slug}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Онлайн-запись в ${salon.name}:\n${bookingUrl}`,
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenWidget = () => {
    Linking.openURL(bookingUrl);
  };

  const handleOpenAddService = () => {
    setServiceToEdit(null);
    setServiceModalVisible(true);
  };

  const handleOpenEditService = (srv: Service) => {
    if (!isOwner) return;
    setServiceToEdit(srv);
    setServiceModalVisible(true);
  };

  const handleOpenAddStaff = () => {
    setStaffToEdit(null);
    setStaffModalVisible(true);
  };

  const handleOpenEditStaff = (st: Staff) => {
    if (!isOwner) return;
    setStaffToEdit(st);
    setStaffModalVisible(true);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.topBar}>
        <Text style={styles.title}>Мой салон</Text>
        <Text style={styles.subtitle}>
          {isOwner ? "Управление салоном, прайсом и мастерами" : `Мастер салона: ${currentUser?.fullName}`}
        </Text>
      </View>

      <View style={styles.body}>
        {/* Карточка салона */}
        <View style={styles.salonCard}>
          <View style={styles.salonHeader}>
            <View style={styles.salonIcon}>
              <Store size={22} color="#111111" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.salonTitle}>{salon.name}</Text>
              <View style={styles.addressRow}>
                <MapPin size={12} color="#8e8e93" />
                <Text style={styles.addressText}>{salon.address}</Text>
              </View>
            </View>
            <View style={styles.ratingBadge}>
              <Star size={12} color="#f59e0b" fill="#f59e0b" />
              <Text style={styles.ratingText}>{salon.rating.toFixed(1)}</Text>
            </View>
          </View>
        </View>

        {/* Мой рабочий график (для мастера) */}
        {myStaffProfile && (
          <View style={styles.card}>
            <View style={styles.sectionHeader}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <View style={styles.scheduleIconBadge}>
                  <Calendar size={16} color="#111111" />
                </View>
                <Text style={styles.cardTitle}>Мой рабочий график</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleOpenSchedule(myStaffProfile)}
                style={styles.addMiniBtn}
                activeOpacity={0.7}
              >
                <Clock size={13} color="#111111" />
                <Text style={styles.addMiniBtnText}>Настроить</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.cardSub}>
              Рабочие и выходные дни, часы приёма и время обеденного перерыва
            </Text>
          </View>
        )}

        {/* Ссылка на онлайн-запись */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Ссылка на онлайн-запись</Text>
          <Text style={styles.cardSub}>
            Разместите в описании профиля Instagram и в Telegram-канале
          </Text>

          <View style={styles.urlBox}>
            <Text style={styles.urlText} numberOfLines={1}>
              {bookingUrl}
            </Text>
          </View>

          <View style={styles.urlActions}>
            <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
              <Share2 size={16} color="#ffffff" />
              <Text style={styles.shareBtnText}>Поделиться ссылкой</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleOpenWidget} style={styles.openBtn}>
              <ExternalLink size={16} color="#111111" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Мастера салона */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Мастера ({salon.staff.length})</Text>
            {isOwner && (
              <TouchableOpacity onPress={handleOpenAddStaff} style={styles.addMiniBtn}>
                <Plus size={13} color="#111111" />
                <Text style={styles.addMiniBtnText}>Добавить</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.staffList}>
            {salon.staff.map((st) => (
              <View key={st.id} style={styles.staffItem}>
                <TouchableOpacity
                  style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
                  onPress={() => isOwner && handleOpenEditStaff(st)}
                  activeOpacity={isOwner ? 0.7 : 1}
                >
                  <View style={styles.staffAvatar}>
                    <Text style={styles.staffAvatarText}>
                      {st.fullName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.staffName}>{st.fullName}</Text>
                    <Text style={styles.staffRole}>{st.specialty}</Text>
                  </View>
                </TouchableOpacity>

                <View style={styles.staffRightActions}>
                  <TouchableOpacity
                    style={styles.scheduleMiniBtn}
                    onPress={() => handleOpenSchedule(st)}
                    activeOpacity={0.7}
                  >
                    <Clock size={12} color="#111111" />
                    <Text style={styles.scheduleMiniBtnText}>График</Text>
                  </TouchableOpacity>

                  {isOwner && (
                    <TouchableOpacity
                      onPress={() => handleOpenEditStaff(st)}
                      style={styles.percentBadge}
                    >
                      <Text style={styles.staffPercent}>{st.commissionPercent}%</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Прайс-лист и услуги */}
        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.cardTitle}>Прайс-лист ({salon.services.length})</Text>
            {isOwner && (
              <TouchableOpacity onPress={handleOpenAddService} style={styles.addMiniBtn}>
                <Plus size={13} color="#111111" />
                <Text style={styles.addMiniBtnText}>Добавить</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.serviceList}>
            {salon.services.map((srv) => (
              <TouchableOpacity
                key={srv.id}
                style={styles.serviceItem}
                onPress={() => handleOpenEditService(srv)}
                disabled={!isOwner}
                activeOpacity={0.7}
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.srvName}>{srv.nameRu}</Text>
                  <Text style={styles.srvDuration}>{srv.durationMinutes} мин</Text>
                </View>
                <View style={{ alignItems: "flex-end", gap: 2 }}>
                  <Text style={styles.srvPrice}>{formatUZS(srv.price)}</Text>
                  {isOwner && <Text style={styles.editHint}>Редакт.</Text>}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Кнопка выхода */}
        <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
          <LogOut size={16} color="#e11d48" />
          <Text style={styles.logoutBtnText}>Выйти из аккаунта</Text>
        </TouchableOpacity>
      </View>

      {/* Модалки управления */}
      <ManageServiceModal
        visible={serviceModalVisible}
        salonSlug={salon.slug}
        serviceToEdit={serviceToEdit}
        onClose={() => setServiceModalVisible(false)}
        onSuccess={() => onReloadSalon?.()}
      />

      <ManageStaffModal
        visible={staffModalVisible}
        salonSlug={salon.slug}
        staffToEdit={staffToEdit}
        onClose={() => setStaffModalVisible(false)}
        onSuccess={() => onReloadSalon?.()}
      />

      <ManageScheduleModal
        visible={scheduleModalVisible}
        staff={staffForSchedule}
        onClose={() => setScheduleModalVisible(false)}
        onSaved={() => onReloadSalon?.()}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  content: {
    paddingBottom: 40,
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
  body: {
    padding: 16,
    gap: 12,
  },
  salonCard: {
    backgroundColor: "#ffffff",
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  salonHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  salonIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  salonTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  addressText: {
    fontSize: 11,
    color: "#8e8e93",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#fef3c7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#92400e",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111111",
  },
  addMiniBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f5f5f7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  addMiniBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111111",
  },
  cardSub: {
    fontSize: 11,
    color: "#8e8e93",
    marginTop: 4,
    lineHeight: 16,
  },
  urlBox: {
    backgroundColor: "#f5f5f7",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 12,
  },
  urlText: {
    fontSize: 12,
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
    color: "#111111",
  },
  urlActions: {
    flexDirection: "row",
    gap: 8,
    marginTop: 10,
  },
  shareBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#111111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  shareBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  openBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  staffList: {
    marginTop: 4,
    gap: 6,
  },
  staffItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  staffAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  staffAvatarText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111111",
  },
  staffName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111111",
  },
  staffRole: {
    fontSize: 10,
    color: "#8e8e93",
  },
  scheduleIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  staffRightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  scheduleMiniBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#f5f5f7",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  scheduleMiniBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#111111",
  },
  percentBadge: {
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  staffPercent: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  editHint: {
    fontSize: 9,
    color: "#8e8e93",
  },
  serviceList: {
    marginTop: 4,
    gap: 6,
  },
  serviceItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.03)",
  },
  srvName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111111",
  },
  srvDuration: {
    fontSize: 10,
    color: "#8e8e93",
  },
  srvPrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111111",
  },
  clientSwitchBtn: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
  },
  clientSwitchBtnText: {
    color: "#111111",
    fontSize: 13,
    fontWeight: "700",
  },
  logoutBtn: {
    marginTop: 4,
    height: 48,
    borderRadius: 16,
    backgroundColor: "#fff1f2",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  logoutBtnText: {
    color: "#e11d48",
    fontSize: 13,
    fontWeight: "600",
  },
  noSalonContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  noSalonIconBadge: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  noSalonTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111111",
    textAlign: "center",
  },
  noSalonSub: {
    fontSize: 13,
    color: "#8e8e93",
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 12,
  },
  createSalonBtn: {
    backgroundColor: "#111111",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    height: 50,
    borderRadius: 16,
    gap: 8,
    width: "100%",
  },
  createSalonBtnText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  logoutBtnEmpty: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 8,
  },
  logoutBtnEmptyText: {
    color: "#e11d48",
    fontSize: 13,
    fontWeight: "600",
  },
});
