import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import {
  Search,
  Star,
  MapPin,
  Clock,
  ChevronRight,
  Briefcase,
  Sparkles,
} from "lucide-react-native";
import { Salon, Service } from "../types";
import { api } from "../services/api";

const CATEGORIES = [
  { id: "all", name: "Все" },
  { id: "barbershop", name: "Барбершопы" },
  { id: "nails", name: "Ногти" },
  { id: "hair", name: "Волосы" },
  { id: "massage", name: "Массаж" },
  { id: "cosmetology", name: "Косметология" },
];

interface ClientCatalogScreenProps {
  onSelectSalonForBooking: (salon: Salon, initialService?: Service) => void;
}

export const ClientCatalogScreen: React.FC<ClientCatalogScreenProps> = ({
  onSelectSalonForBooking,
}) => {
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const loadSalons = async () => {
    try {
      const data = await api.getSalons();
      setSalons(data);
    } catch (e) {
      console.error("Error loading salons:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSalons();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSalons();
  };

  const filteredSalons = salons.filter((salon) => {
    const matchesSearch =
      salon.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
      salon.services?.some((s) =>
        s.nameRu.toLowerCase().includes(searchQuery.toLowerCase())
      );

    if (selectedCategory === "all") return matchesSearch;
    // Простая фильтрация по категории или названию
    const matchesCategory =
      salon.name.toLowerCase().includes(selectedCategory) ||
      salon.slug.toLowerCase().includes(selectedCategory) ||
      salon.categories?.some((c) => c.nameRu.toLowerCase().includes(selectedCategory));

    return matchesSearch && (matchesCategory || selectedCategory === "all");
  });

  return (
    <View style={styles.container}>
      {/* Поисковая строка */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Search size={16} color="#8e8e93" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Салон, услуга (напр. Стрижка, Маникюр)..."
            placeholderTextColor="#8e8e93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
          />
        </View>
      </View>

      {/* Горизонтальный список категорий */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => {
            const isActive = selectedCategory === item.id;
            return (
              <TouchableOpacity
                style={[
                  styles.categoryPill,
                  isActive && styles.categoryPillActive,
                ]}
                onPress={() => setSelectedCategory(item.id)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isActive && styles.categoryPillTextActive,
                  ]}
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Список салонов */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#111111" />
        </View>
      ) : (
        <FlatList
          data={filteredSalons}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.salonsList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Sparkles size={32} color="#8e8e93" />
              <Text style={styles.emptyTitle}>Салоны не найдены</Text>
              <Text style={styles.emptySub}>
                Попробуйте изменить поисковый запрос или выбрать другую категорию
              </Text>
            </View>
          }
          renderItem={({ item: salon }) => {
            const minPrice = salon.services?.length
              ? Math.min(...salon.services.map((s) => s.price))
              : null;

            return (
              <View style={styles.salonCard}>
                {/* Шапка карточки */}
                <View style={styles.cardHeader}>
                  <View style={styles.salonAvatar}>
                    <Text style={styles.salonAvatarText}>
                      {salon.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.salonInfo}>
                    <Text style={styles.salonName}>{salon.name}</Text>
                    <View style={styles.ratingRow}>
                      <Star size={13} color="#f59e0b" fill="#f59e0b" />
                      <Text style={styles.ratingVal}>{salon.rating.toFixed(1)}</Text>
                      <Text style={styles.reviewsCount}>
                        ({salon.reviewCount || 12} отзывов)
                      </Text>
                    </View>
                    <View style={styles.addressRow}>
                      <MapPin size={11} color="#8e8e93" />
                      <Text style={styles.addressText} numberOfLines={1}>
                        {salon.city}, {salon.address}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Популярные услуги */}
                {salon.services && salon.services.length > 0 && (
                  <View style={styles.servicesPreview}>
                    {salon.services.slice(0, 3).map((service) => (
                      <TouchableOpacity
                        key={service.id}
                        style={styles.serviceRow}
                        onPress={() => onSelectSalonForBooking(salon, service)}
                      >
                        <View style={styles.serviceNameCol}>
                          <Text style={styles.serviceName}>{service.nameRu}</Text>
                          <Text style={styles.serviceDuration}>
                            {service.durationMinutes} мин
                          </Text>
                        </View>
                        <View style={styles.servicePriceCol}>
                          <Text style={styles.servicePrice}>
                            {service.price.toLocaleString("ru-RU")} сум
                          </Text>
                          <Text style={styles.serviceBookText}>Записаться →</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Нижняя кнопка онлайн-записи */}
                <View style={styles.cardFooter}>
                  {minPrice ? (
                    <Text style={styles.fromPriceText}>
                      от{" "}
                      <Text style={styles.fromPriceVal}>
                        {minPrice.toLocaleString("ru-RU")} сум
                      </Text>
                    </Text>
                  ) : (
                    <View />
                  )}
                  <TouchableOpacity
                    style={styles.bookBtn}
                    onPress={() => onSelectSalonForBooking(salon)}
                  >
                    <Text style={styles.bookBtnText}>Выбрать мастера и время</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
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
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  businessBanner: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
  },
  bannerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  bannerIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#f5f5f7",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111111",
  },
  bannerSub: {
    fontSize: 10,
    color: "#8e8e93",
  },
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#111111",
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  categoryPillActive: {
    backgroundColor: "#111111",
    borderColor: "#111111",
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#111111",
  },
  categoryPillTextActive: {
    color: "#ffffff",
  },
  salonsList: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 14,
  },
  salonCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    marginBottom: 12,
  },
  salonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#111111",
    alignItems: "center",
    justifyContent: "center",
  },
  salonAvatarText: {
    color: "#ffffff",
    fontWeight: "800",
    fontSize: 16,
  },
  salonInfo: {
    flex: 1,
    gap: 2,
  },
  salonName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingVal: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111111",
  },
  reviewsCount: {
    fontSize: 11,
    color: "#8e8e93",
  },
  addressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  addressText: {
    fontSize: 11,
    color: "#8e8e93",
    flex: 1,
  },
  servicesPreview: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 10,
    marginBottom: 12,
    gap: 8,
  },
  serviceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  serviceNameCol: {
    flex: 1,
  },
  serviceName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111111",
  },
  serviceDuration: {
    fontSize: 10,
    color: "#8e8e93",
  },
  servicePriceCol: {
    alignItems: "flex-end",
  },
  servicePrice: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111111",
  },
  serviceBookText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#2563eb",
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fromPriceText: {
    fontSize: 11,
    color: "#8e8e93",
  },
  fromPriceVal: {
    fontWeight: "700",
    color: "#111111",
  },
  bookBtn: {
    backgroundColor: "#111111",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bookBtnText: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#111111",
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: "#8e8e93",
    textAlign: "center",
    paddingHorizontal: 32,
  },
});
