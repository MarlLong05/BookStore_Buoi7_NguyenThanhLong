import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Header } from "../components/Header";
import { SearchBar } from "../components/SearchBar";
import { CategoryChips } from "../components/CategoryChips";
import { PriceFilter } from "../components/PriceFilter";
import { BookGrid } from "../components/BookGrid";
import { FloatingCartButton } from "../components/FloatingCartButton";
import { EmptyState } from "../components/EmptyState";
import { LoadingView } from "../components/LoadingView";
import { ErrorView } from "../components/ErrorView";
import { getBooks } from "../services/bookService";
import { getCategories } from "../services/categoryService";
import { getErrorMessage } from "../api/client";
import { useDebounce } from "../hooks/useDebounce";
import { filterBooks, PriceRange } from "../utils/filters";
import { useCart } from "../store/hooks";
import { Book, Category } from "../types";
import { TabScreenProps } from "../navigation/types";
import { colors, radius } from "../theme";

type SortOrder = "none" | "asc" | "desc";

export function HomeScreen({ navigation, route }: TabScreenProps<"Home">) {
  // BT7.3d
  const { totalQuantity } = useCart();

  // BT7.5b: state dữ liệu API
  const [books, setBooks] = useState<Book[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // hai API độc lập → chạy SONG SONG
      const [b, c] = await Promise.all([getBooks(), getCategories()]);
      setBooks(b);
      setCategories(c);
    } catch (e) {
      setError(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const [searchOpen, setSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [priceRange, setPriceRange] = useState<PriceRange>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("none"); // Câu 5: sắp xếp theo giá

  // BT7.7a: chỉ lọc sau khi ngừng gõ 400 ms
  const debouncedKeyword = useDebounce(keyword, 400);

  // BT7.7c + BT7.8a + C2 + Câu 5
  const visibleBooks = useMemo(() => {
    const filtered = filterBooks(books, { keyword: debouncedKeyword, categoryId, priceRange });
    if (sortOrder === "none") return filtered;
    return [...filtered].sort((a, b) => (sortOrder === "asc" ? a.price - b.price : b.price - a.price));
  }, [books, debouncedKeyword, categoryId, priceRange, sortOrder]);

  // BT7.8b: nhận categoryId từ tab Danh mục, dùng xong thì xoá params
  useEffect(() => {
    const id = route.params?.categoryId;
    if (id !== undefined) {
      setCategoryId(id);
      navigation.setParams({ categoryId: undefined });
    }
  }, [route.params?.categoryId, navigation]);

  // BT7.7e
  const hasFilter = keyword !== "" || categoryId !== null || priceRange !== null;
  const clearFilters = () => {
    setKeyword("");
    setCategoryId(null);
    setPriceRange(null);
  };

  const sortOptions: { key: Exclude<SortOrder, "none">; label: string }[] = [
    { key: "asc", label: "Giá tăng ↑" },
    { key: "desc", label: "Giá giảm ↓" },
  ];

  return (
    <View style={styles.container}>
      <Header title="📚 BookStore" onSearchPress={() => setSearchOpen((v) => !v)} />
      {searchOpen && (
        <SearchBar
          value={keyword}
          onChangeText={setKeyword}
          onClose={() => {
            setSearchOpen(false);
            setKeyword("");
          }}
        />
      )}
      {/* BT7.5c: 3 trạng thái */}
      {loading ? (
        <LoadingView label="Đang tải sách…" />
      ) : error ? (
        <ErrorView message={error} onRetry={load} />
      ) : (
        <BookGrid
          data={visibleBooks}
          onPressBook={(b) => navigation.navigate("BookDetail", { bookId: b.id })} // BT7.2a
          ListHeaderComponent={
            <View>
              <CategoryChips categories={categories} selectedId={categoryId} onSelect={setCategoryId} />
              <PriceFilter value={priceRange} onChange={setPriceRange} />
              <View style={styles.toolRow}>
                {sortOptions.map((o) => {
                  const active = sortOrder === o.key;
                  return (
                    <Pressable key={o.key} style={[styles.sortBtn, active && styles.sortBtnActive]} onPress={() => setSortOrder(active ? "none" : o.key)}>
                      <Text style={[styles.sortText, active && styles.sortTextActive]}>{o.label}</Text>
                    </Pressable>
                  );
                })}
                {hasFilter && (
                  <Pressable style={styles.clearBtn} onPress={clearFilters}>
                    <Text style={styles.clearText}>✕ Xóa bộ lọc</Text>
                  </Pressable>
                )}
              </View>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              emoji="🔎"
              title="Không tìm thấy sách phù hợp"
              message="Hãy thử từ khoá khác hoặc bỏ bớt bộ lọc."
              actionLabel="Xóa bộ lọc"
              onAction={clearFilters}
            />
          }
        />
      )}
      <FloatingCartButton count={totalQuantity} onPress={() => navigation.navigate("Cart")} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  toolRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 12, paddingBottom: 8, alignItems: "center" },
  sortBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: "#fff", borderWidth: 1, borderColor: colors.line },
  sortBtnActive: { backgroundColor: colors.navy, borderColor: colors.navy },
  sortText: { color: colors.text, fontWeight: "600", fontSize: 13 },
  sortTextActive: { color: "#fff" },
  clearBtn: { marginLeft: "auto", paddingHorizontal: 10, paddingVertical: 6 },
  clearText: { color: "#DC2626", fontWeight: "700", fontSize: 13 },
});
