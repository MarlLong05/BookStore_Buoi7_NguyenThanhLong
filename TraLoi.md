# Trả lời câu hỏi bổ sung – Buổi 7 BookStore

Nguyễn Thành Long / MSSV:23723141 

## Câu 1. Cấu trúc điều hướng
BookDetail đăng ký ở Stack (ngoài cùng) vì đây là màn "đi sâu" từ một màn khác: khi mở ra nó phủ lên cả Tab Bar, có nút ← tự động để quay lại Home và giữ nguyên vị trí cuộn. Nếu đặt vào Tab thì nó trở thành một tab ngang hàng: Tab Bar vẫn hiện, phải có thêm một mục tab thừa (hoặc phải giấu đi), không có nút quay lại đúng nghĩa, và mỗi lần bấm sách khác phải đổi params trên cùng một màn tab chứ không "chồng" màn mới lên

## Câu 2. Redux
Trong reducer của createSlice, state thực chất là một draft proxy do thư viện Immer cung cấp. Immer ghi lại các thao tác như state.items.push(...) rồi tự tạo ra một state mới bất biến, còn state gốc không bị đổi. Nếu bỏ useMemo trong useCart thì kết quả hiển thị không đổi (tổng vẫn đúng), nhưng reduce bị chạy lại ở mọi lần render (kể cả khi items không đổi), nên tốn tính toán vô ích khi giỏ lớn.

## Câu 3. Promise.all
Với Promise.all, chỉ cần getCategories() lỗi là cả Promise bị reject, đi vào catch nên Home hiện ErrorView + nút Thử lại, dù getBooks() đã thành công và dữ liệu sách bị bỏ đi. Dùng Promise.allSettled thì ta nhận kết quả từng request (fulfilled/rejected) và vẫn hiện được danh sách sách, danh mục để rỗng. Đánh đổi: code dài hơn (phải kiểm tra từng kết quả), giao diện ở trạng thái "lỗi một phần" (thiếu chip danh mục) nên phải tự thiết kế cách báo lỗi và thử lại riêng cho phần đó.

## Câu 4. Debounce
Nếu đặt setTimeout thẳng trong onChangeText thì mỗi ký tự gõ vào tạo một hẹn giờ mới mà không huỷ cái cũ, nên 10 ký tự sẽ lọc 10 lần (chỉ trễ chứ không "chờ ngừng gõ"). Đặt trong useEffect có hàm dọn dẹp return () => clearTimeout(t) thì mỗi lần value đổi hẹn giờ cũ bị huỷ, chỉ lần gõ cuối được áp dụng. Hàm dọn dẹp cũng tránh lỗi gọi setState sau khi component đã unmount (rò rỉ bộ nhớ, cảnh báo) và tránh kết quả cũ ghi đè kết quả mới.

## Câu 5. Code bổ sung – sắp xếp giá
Thêm một state và sửa trong visibleBooks ở HomeScreen.tsx (thêm 2 nút "Giá tăng ↑ / Giá giảm ↓" để đổi state, bấm lần nữa để bỏ sắp xếp):

tsx
type SortOrder = "none" | "asc" | "desc";
const [sortOrder, setSortOrder] = useState<SortOrder>("none");

const visibleBooks = useMemo(() => {
  const filtered = filterBooks(books, { keyword: debouncedKeyword, categoryId, priceRange });
  if (sortOrder === "none") return filtered;
  return [...filtered].sort((a, b) => (sortOrder === "asc" ? a.price - b.price : b.price - a.price));
}, [books, debouncedKeyword, categoryId, priceRange, sortOrder]);

Dùng [...filtered] để không sort trực tiếp lên mảng gốc. Sắp xếp chạy sau khi lọc nên dùng chung được với từ khoá, danh mục, khoảng giá.

Ảnh chụp kết quả (giá giảm dần):
![Giá giảm dần](screenshots/giamdan.jpg)
![Giá tăng dần](screenshots/tangdan.jpg)

## Thử thách (nếu làm)
- **C1 Wishlist:** UI chỉ gọi `useWishlist()` (`isFavorite`, `toggle`) nên nếu đổi Redux sang Zustand/Recoil chỉ phải sửa `store/hooks.ts`, các màn giữ nguyên (mẫu Adapter).
- **C2 Lọc giá:** `inRange` dùng chung trong `filterBooks` cùng điều kiện từ khoá và danh mục (AND).
