# Brief đề tài: Nền tảng tự động hóa duyệt chi hóa đơn đầu vào đa pháp nhân có AI

Oct 31, 2026 · @Tuan

Đề xuất xây dựng một nền tảng dùng chung cho tập đoàn nhiều công ty con, trong đó AI tự kiểm tra hóa đơn và đưa hóa đơn khớp chuẩn vào lô thanh toán; người có thẩm quyền ký đề nghị thanh toán tổng hợp theo nhà cung cấp, và chỉ ngoại lệ mới cần xử lý từng chiếc. Mục tiêu: trả đúng tiền, đúng pháp nhân, đúng hạn và không mất quyền khấu trừ thuế.

**Trạng thái:** đã chốt phạm vi MVP ngày 31/10/2026. Phần thuế của hóa đơn nước ngoài sẽ chi tiết hóa sau.

## Bối cảnh và vấn đề

Tập đoàn mô hình holding có nhiều công ty con là pháp nhân độc lập; mỗi công ty tự mua hàng, nhận hóa đơn và duyệt chi theo quy trình riêng. Khâu duyệt chi đang tắc ở 4 điểm:

| # | Bottleneck | Hệ quả |
| --- | --- | --- |
| P1 | Đối chiếu hóa đơn với đơn mua và phiếu nhập kho làm thủ công; ngoại lệ chiếm phần lớn công sức | Nhóm công nợ trung bình chỉ xử lý tự động khoảng 1/3 hóa đơn ([Sista AI, dẫn Ardent Partners](https://sista.ai/tr/insights/touchless-ap-reconciliation-case-study)) |
| P2 | Tên hàng, đơn vị tính lệch giữa các chứng từ | Quy tắc so khớp chuỗi thất bại, kế toán phải dò từng dòng |
| P3 | Hóa đơn từ nhà cung cấp rủi ro về thuế, hoặc xuất sai pháp nhân mua | Bị loại chi phí, mất khấu trừ thuế GTGT; danh sách doanh nghiệp rủi ro cao đã vượt 6.042 doanh nghiệp ([MISA AMIS](https://amis.misa.vn/?p=295073)) |
| P4 | Duyệt chi qua email, Zalo; không có ma trận duyệt theo pháp nhân | Trả chậm, trả trùng, không kiểm soát được việc chia nhỏ đơn để né ngưỡng duyệt |

Thời điểm phù hợp: từ 01/6/2025, doanh nghiệp có doanh thu từ 1 tỷ đồng/năm phải dùng hóa đơn điện tử có mã của cơ quan thuế ([Sapo](https://www.sapo.vn/blog/hoa-don-dien-tu-la-gi)). Hóa đơn điện tử có cấu trúc ở cấp trường dữ liệu theo định dạng XML do Tổng cục Thuế quy định ([iHOADON](https://ihoadon.vn/hddt/quy-dinh-ve-dinh-dang-hoa-don-dien-tu.html)), nên không cần OCR; nhưng tên hàng vẫn là văn bản tự do do nhà cung cấp tự ghi, nên vẫn cần AI để hiểu nghĩa.

**Giá trị không chỉ là nhanh hơn**, mà là bốn việc con người hiện không làm được dù có thời gian:

1. **Không trả sai:** bắt hóa đơn trùng, tính thừa số lượng, sai giá.
2. **Không mất khấu trừ thuế:** chặn hóa đơn từ nhà cung cấp rủi ro, hóa đơn sai pháp nhân.
3. **Phát hiện gian lận:** chia nhỏ đơn để né ngưỡng, giá bất thường so với các công ty con khác.
4. **Người ký có căn cứ:** thay vì ký mù hoặc xem từng hóa đơn.

## Đối tượng và người dùng

Hệ thống phục vụ nhóm tài chính, những người hưởng lợi trực tiếp. Nhóm vận hành (mua hàng, kho, bộ phận nghiệm thu) là nguồn dữ liệu: họ tiếp tục làm việc trên ERP và phần mềm kho như cũ, dữ liệu được đồng bộ sang. Đối tượng là tập đoàn hoặc doanh nghiệp nhiều pháp nhân đã có quy trình đặt hàng.

| Actor | Phạm vi dữ liệu | Việc chính trong hệ thống |
| --- | --- | --- |
| Kế toán công nợ | Một pháp nhân | Người dùng chính: tải hóa đơn, tạo hồ sơ định kỳ, xác nhận trường AI đọc từ PDF, xử lý ngoại lệ, kiểm tra mẫu lô trước khi ký |
| Kế toán trưởng | Một pháp nhân | Quyết định với hóa đơn từ nhà cung cấp rủi ro thuế, thuế nhà thầu, chứng từ nhập khẩu; ký chứng từ chi cùng người duyệt |
| Người có thẩm quyền duyệt chi (trưởng bộ phận, giám đốc tài chính) | Một pháp nhân | Ký điện tử đề nghị thanh toán tổng hợp theo nhà cung cấp, nhiều đề nghị trong một thao tác; duyệt từng khoản ngoại lệ hoặc vượt ngưỡng |
| Quản trị | Một pháp nhân hoặc toàn tập đoàn, theo phạm vi được cấp | Cấp tập đoàn: thêm pháp nhân, đặt khung giới hạn chung, quản lý AI và cổng tự động hóa. Cấp pháp nhân: cấu hình ma trận duyệt, dung sai, ngưỡng đưa vào lô trong khung tập đoàn; quản lý người dùng |

**Actor phụ (hệ thống):**

| Actor | Vai trò |
| --- | --- |
| AI Agent | Phân loại luồng, đọc chứng từ, ghép dòng, phát hiện bất thường, đề xuất đưa vào lô, chọn mẫu kiểm tra, tóm tắt lô; chỉ dùng số liệu tổng hợp khi so sánh liên pháp nhân |
| ERP của từng pháp nhân | Nguồn sự thật cho đơn mua, phiếu nhập kho, nghiệm thu, nhà cung cấp, danh mục; nhận lại lô thanh toán đã ký để ghi sổ và chi (MVP: ERP giả lập) |
| Dịch vụ tra cứu trạng thái hóa đơn | Trả trạng thái hóa đơn trên hệ thống thuế (Nâng cao; thiết kế sẵn cổng kết nối) |
| Ngân hàng | Sao kê giao dịch thẻ cho thuê bao (Nâng cao) |

## Vai trò của AI

Nguyên tắc: AI đưa ra bằng chứng, bộ quy tắc ra quyết định, con người ký và chịu trách nhiệm. Luật Kế toán yêu cầu chứng từ kế toán có chữ ký, họ tên của người lập và người duyệt ([Bộ Tài chính](https://portal.mof.gov.vn/hoidapcstc/home/cthoidap/166736)), nên AI không thay người ký; AI thay phần việc kiểm tra mà kế toán đang làm bằng tay.

| Việc | Trước đây kế toán làm | AI làm | Khi AI không chắc chắn |
| --- | --- | --- | --- |
| 1. Phân loại luồng | Tự xem hóa đơn thuộc loại nào | Phân loại: mua hàng có đơn mua, thuê bao, định kỳ, hóa đơn nước ngoài, chi phí nhân viên, chứng từ khác | Ngoại lệ, người phân loại |
| 2. Đọc chứng từ | Gõ lại số liệu | Đọc XML; PDF nước ngoài dùng LLM đa phương thức | Người xác nhận; với PDF ở MVP, người xác nhận mọi trường |
| 3. Nhận diện | Tra pháp nhân, đơn mua | Xác định pháp nhân, đơn mua hoặc hồ sơ thuê bao, kể cả khi thiếu mã số thuế | Kế toán công nợ xác nhận |
| 4. Ghép dòng hàng | Dò từng dòng, quy đổi đơn vị | "Giấy Double A 70gsm" là "Giấy in A4 loại 1"; 1 thùng = 5 ram | Đánh dấu dòng nghi ngờ |
| 5. Phát hiện bất thường | Thường không làm được | Giá bất thường, hóa đơn trùng, chia nhỏ đơn, thuê bao tự tăng số chỗ, hóa đơn định kỳ tăng bất thường so với các kỳ trước | AI gắn cờ, người xử lý |
| 6. Xử lý ngoại lệ | Tự tìm lệch, tự viết email | Giải thích lệch ở đâu; soạn sẵn đề nghị nhà cung cấp điều chỉnh, hoặc thông báo bộ phận mua hàng, kho sửa dữ liệu trên ERP; theo dõi hạn phản hồi, tự ghép hóa đơn mới với ngoại lệ cũ và đóng ngoại lệ khi khớp. Mọi thứ gửi ra ngoài do kế toán bấm gửi | — |
| 7. Thuế nhà thầu | Tự phân loại dịch vụ nước ngoài | Gắn cờ và chặn thanh toán (MVP); đề xuất loại hình kèm lý do (Nâng cao) | Kế toán quyết định |
| 8. Chọn mẫu kiểm tra | Ngẫu nhiên hoặc theo cảm tính | Chọn theo rủi ro: giá trị cao, nhà cung cấp mới mở tự động, mặt hàng hay ghép sai | — |
| 9. Chuẩn bị cho người ký | Lập bảng tổng hợp bằng Excel | Tóm tắt lô: tổng tiền theo pháp nhân và nhà cung cấp, điểm cần chú ý, kết quả kiểm tra mẫu | — |

**Điều kiện để hóa đơn được đưa vào lô thanh toán** (thiếu một điều kiện thì vào ngoại lệ):

1. Các trường quan trọng (người bán, số tiền, số lượng) được một nguồn độc lập xác nhận (BR-17).
2. Mọi dòng hàng được ghép với độ tin cậy trên ngưỡng.
3. Giá và số lượng nằm trong dung sai của pháp nhân; số lượng không vượt số thực nhận.
4. Tổng tiền dưới ngưỡng đưa vào lô của pháp nhân đó.
5. Nhà cung cấp đã qua cổng tự động hóa và không nằm trong danh sách rủi ro về thuế.
6. Không có dấu hiệu bất thường và không còn nghĩa vụ thuế chưa xử lý (thuế nhà thầu, chứng từ nhập khẩu).

**AI không làm:** không ký chứng từ chi tiền; không tự quyết định đưa vào lô (bộ quy tắc quyết định dựa trên bằng chứng của AI); không quyết các phán đoán pháp lý như loại hình thuế nhà thầu, người bán có thuộc diện lập bảng kê hay không, xử lý hóa đơn từ nhà cung cấp rủi ro thuế.

**Phát hiện bất thường liên pháp nhân** là lợi thế riêng của nền tảng dùng chung: giá mua của một công ty con cao hơn hẳn mức chung của tập đoàn; nhiều đơn liên tiếp sát dưới ngưỡng duyệt; hóa đơn trùng kể cả khi đổi số hoặc gửi sang pháp nhân khác. AI chỉ hiển thị số liệu tổng hợp (ví dụ giá trung vị toàn tập đoàn), không bao giờ hiển thị giao dịch cụ thể của pháp nhân khác.

**Vì sao không dùng rule-based:** quy tắc xử lý tốt các ca khớp chính xác và vẫn được dùng cho các ca đó. AI đảm nhận phần quy tắc không làm được: đọc chứng từ không có cấu trúc, hiểu ngữ nghĩa tên hàng, và cân nhắc nhiều tín hiệu cùng lúc.

## Kiến trúc AI

Kiến trúc tách hai lớp: lớp hiểu chứng từ dùng AI, lớp quyết định dùng quy tắc minh bạch.

| Thành phần | Kỹ thuật | Vì sao |
| --- | --- | --- |
| Tiếp nhận và chuẩn hóa | Bộ chuyển đổi cho từng nguồn (XML, PDF, ERP) đưa về mô hình chứng từ chung | Logic đối chiếu và quy tắc chỉ viết một lần cho mọi nguồn |
| Bảng ánh xạ | Tra cứu các cặp tên hàng của nhà cung cấp ↔ mã hàng nội bộ đã được người xác nhận | Khớp ngay, không cần gọi AI |
| Embedding | Mô hình vector hóa văn bản đa ngôn ngữ, hỗ trợ tiếng Việt | Tìm 3–5 dòng ứng viên có nghĩa gần nhất |
| LLM ghép dòng | Mô hình ngôn ngữ lớn, trả JSON theo schema cố định | Chỉ gọi khi bảng ánh xạ và embedding chưa đủ chắc; hiểu nghĩa tên hàng, quy đổi đơn vị, trả lý do |
| Model kết hợp tín hiệu | Hồi quy logistic tự huấn luyện trên bộ dữ liệu có đáp án; đầu vào: độ tương đồng embedding, khớp giá, khớp số lượng, lịch sử ghép, kết quả LLM nếu có | Cho xác suất đã hiệu chỉnh, đáng tin hơn độ tin LLM tự báo; chỉ thay bản mới khi tốt hơn trên tập kiểm tra |
| LLM đa phương thức | Đọc PDF hoặc ảnh, trả về cùng mô hình chứng từ chung | Hóa đơn nước ngoài, chứng từ không có XML |
| Phát hiện bất thường | Thống kê theo lịch sử (trung vị, cửa sổ thời gian) | Giải thích được bằng con số |
| Bộ quy tắc quyết định | Kiểm tra 6 điều kiện, không dùng LLM | Quyết định phải giải thích và kiểm toán được |

Ba nguyên tắc kiến trúc:

1. **LLM đưa bằng chứng, quy tắc quyết định, người ký chịu trách nhiệm.**
2. **Hệ thống rẻ hơn và tự động hơn theo thời gian:** mỗi lần người xác nhận một cặp ghép, cặp đó vào bảng ánh xạ, lần sau không cần gọi LLM.
3. **Đo trước khi tin:** chạy ngầm để đo độ chính xác, mở cổng tự động hóa cho từng cặp nhà cung cấp – pháp nhân khi đạt ngưỡng, tự đóng khi kiểm tra mẫu phát hiện sai; mỗi quyết định lưu phiên bản prompt và mô hình.

**Mô hình chứng từ chung** quy định mọi chứng từ dùng cùng: mã pháp nhân, mã nhà cung cấp, mã hàng nội bộ, đơn vị tính quy đổi, nguyên tệ và tỷ giá, nguồn và độ tin của chứng từ. Đơn mua và phiếu nhập kho là chứng từ nội bộ nên đã đúng mô hình từ đầu, không cần chuyển sang XML.

## Đầu vào và phân loại chứng từ

Mọi hóa đơn đến được phân loại theo luồng xử lý; hóa đơn không có đơn mua không bị coi là lỗi mà được chuyển đúng luồng.

| Loại | Chứng từ đối chiếu | Phạm vi |
| --- | --- | --- |
| Hàng hóa trong nước | Đơn mua + phiếu nhập kho | MVP |
| Dịch vụ trong nước | Đơn mua + biên bản nghiệm thu (xác nhận trên hệ thống) | MVP |
| Thuê bao phần mềm | Hồ sơ thuê bao + giao dịch thẻ; nếu trừ thẻ trước thì xác nhận sau, sai thì yêu cầu hoàn tiền | Nâng cao (MVP: thuê bao giá cố định đi theo hồ sơ định kỳ) |
| Hóa đơn nước ngoài (PDF) | Như trên theo loại; người xác nhận mọi trường; hàng nhập khẩu phải đính kèm tờ khai hải quan và chứng từ nộp thuế GTGT khâu nhập khẩu ([Kế toán Thuận Thiên](https://ketoanthuanthien.vn/?p=7811)); dịch vụ phải xử lý thuế nhà thầu trước khi thanh toán ([Kế toán Thuận Thiên](https://ketoanthuanthien.vn/kien-thuc/dich-vu-xuyen-bien-gioi/)) | MVP (mức A) |
| Đặt vé, khách sạn qua đại lý | Yêu cầu đặt đã duyệt + xác nhận chuyến đi | Nâng cao |
| Định kỳ không có đơn mua (điện, nước, thuê văn phòng) | Hồ sơ định kỳ (hợp đồng, giá cố định hoặc theo mức sử dụng) + lịch sử các kỳ | MVP |
| Chi phí nhân viên không có yêu cầu đặt | Tách sang danh sách chờ hồ sơ hoàn ứng | Chỉ phân loại; xử lý ngoài phạm vi |
| Chứng từ khác: hóa đơn giấy đặt in của cơ quan thuế, bảng kê mua hàng không có hóa đơn ([Kế toán Thuận Thiên](https://ketoanthuanthien.vn/?p=10244)) | Kế toán nhập tay, luôn qua người | Nâng cao |

**Năm nhóm dữ liệu đầu vào:**

| Nhóm | Gồm | Trong bản demo |
| --- | --- | --- |
| Chứng từ giao dịch | Đơn mua, phiếu nhập kho, biên bản nghiệm thu, hồ sơ thuê bao, hóa đơn | Đơn mua, phiếu nhập, nghiệm thu đồng bộ từ ERP giả lập; kế toán tạo hồ sơ định kỳ; tải file XML, PDF mẫu |
| Danh mục | Pháp nhân, nhà cung cấp, hàng hóa dịch vụ, đơn vị tính và quy đổi | Đồng bộ từ ERP giả lập |
| Cấu hình chính sách | Khung tập đoàn, ma trận duyệt, dung sai, ngưỡng, tỷ lệ kiểm tra mẫu | Quản trị cấu hình |
| Dữ liệu bên ngoài | Danh sách doanh nghiệp rủi ro cao về thuế, giao dịch thẻ | Giả lập |
| Dữ liệu tự tích lũy | Bảng ánh xạ, lịch sử giá, độ tin nhà cung cấp, kết quả kiểm tra mẫu | Hệ thống tự sinh |

**Độ tin của nguồn quyết định mức tự động:**

| Mức | Nguồn | Vào lô không cần người xem từng chiếc? |
| --- | --- | --- |
| Cao | XML có chữ ký số và mã cơ quan thuế | Có, nếu đủ điều kiện |
| Trung bình | PDF có nguồn độc lập xác nhận (ví dụ khớp giao dịch thẻ và hồ sơ thuê bao) | Có thể, sau khi qua cổng tự động hóa, ngưỡng tiền thấp (Nâng cao) |
| Thấp | PDF không có nguồn đối chiếu, ảnh scan, chứng từ giấy | Không |

Khi có thể lấy XML gốc, hệ thống không nhận PDF làm nguồn dữ liệu: hướng dẫn kế toán cảnh báo người bán có thể sửa file rồi gửi qua email, Zalo ([ACC](https://accgroup.vn/in-tra-cuu-hoa-don-dien-tu)).

## Luồng xử lý

&#91;embedded content: luồng xử lý một hóa đơn · 1 điểm quyết định\]

AI không ký: hóa đơn đủ 6 điều kiện vào lô, kế toán kiểm tra mẫu theo rủi ro trước khi ký, người có thẩm quyền ký điện tử các **đề nghị thanh toán tổng hợp theo nhà cung cấp** trong lô. Cách gộp này bám theo mẫu giấy đề nghị thanh toán 05-TT, vốn liệt kê nhiều khoản công nợ kèm số hóa đơn trong một đề nghị ([EasyHRM](https://easyhrm.vn/?p=6703)). Mọi kiểm tra xong trước khi tiền ra khỏi tài khoản.

| Bước | Ai làm | Thời điểm |
| --- | --- | --- |
| 1. Nhận hóa đơn, phân loại, đối chiếu | AI | Ngay khi hóa đơn đến |
| 2. Đủ điều kiện thì vào lô, không đủ thì vào ngoại lệ | Bộ quy tắc, dựa trên bằng chứng của AI | Ngay sau đối chiếu |
| 3. Kiểm tra mẫu trên lô | Kế toán, mẫu do AI chọn theo rủi ro | Trước khi ký |
| 4. Ký đề nghị thanh toán tổng hợp theo nhà cung cấp | Người có thẩm quyền và kế toán trưởng | Cuối kỳ, hoặc giữa kỳ nếu hạn hợp đồng ngắn hơn |
| 5. Chi tiền | Ngân hàng | Sau khi ký |
| 6. Theo dõi độ chính xác, cập nhật cổng tự động hóa | Hệ thống | Liên tục |

**Ngoại lệ duy nhất "trả trước, kiểm tra sau":** thuê bao tự trừ thẻ (Nâng cao). Rủi ro được giới hạn bằng hạn mức thẻ theo hồ sơ thuê bao; sai thì yêu cầu hoàn tiền, giảm số chỗ hoặc khóa thẻ.

## Phạm vi

MVP tập trung một luồng lõi làm sâu: hóa đơn → AI đọc và ghép dòng → bộ quy tắc → lô thanh toán → ký. Khối lượng khoảng 28 user story; các phần ở cột Nâng cao đã được thiết kế và là hướng mở rộng. Nghiệp vụ mua sắm và quy trình hoàn ứng công tác phí nằm ngoài phạm vi. Bản demo dùng 3 pháp nhân giả định.

| Hạng mục | MVP | Nâng cao | Ngoài phạm vi |
| --- | --- | --- | --- |
| Chứng từ | Đơn mua, phiếu nhập kho, nghiệm thu, nhà cung cấp, danh mục đồng bộ từ ERP giả lập (có màn hình tạo đơn mua, xác nhận nhận hàng để demo trọn vòng); hồ sơ định kỳ do kế toán tạo; tải hóa đơn XML; hóa đơn nước ngoài dạng PDF | Hộp thư hóa đơn tự lấy XML; cổng nhà cung cấp; kết nối ERP thật của từng pháp nhân | Thay thế chức năng mua hàng, kho của ERP; kết nối trực tiếp hệ thống của cơ quan thuế |
| Loại hóa đơn | Hàng hóa, dịch vụ, định kỳ trong nước (điện, nước, thuê văn phòng, thuê bao phần mềm giá cố định); hóa đơn nước ngoài (mức A); phân loại và tách chi phí nhân viên | Thuê bao trừ thẻ tự động (xác nhận sau, hoàn tiền, hạn mức thẻ); chứng từ khác nhập tay, tự lập bảng kê; đặt vé, khách sạn qua đại lý | Hoàn ứng, tạm ứng công tác phí |
| AI | Phân loại luồng, đọc XML và PDF, nhận diện, ghép dòng (bảng ánh xạ, embedding, model kết hợp tín hiệu tự huấn luyện, LLM cho phần còn lại), đề xuất đưa vào lô, chọn mẫu theo rủi ro, tóm tắt lô, định tuyến ngoại lệ, soạn yêu cầu gửi nhà cung cấp (kế toán bấm gửi), tự ghép hóa đơn điều chỉnh và đóng ngoại lệ; phát hiện hóa đơn trùng, chia nhỏ đơn, giá bất thường so với lịch sử của pháp nhân | Bất thường liên pháp nhân, đề xuất loại hình thuế nhà thầu, tìm XML từ PDF, huấn luyện lại model định kỳ từ xác nhận của kế toán | AI ký chứng từ; AI tự đàm phán giá |
| Duyệt chi | Lô thanh toán, kiểm tra mẫu trước khi ký, ký điện tử đề nghị thanh toán tổng hợp theo nhà cung cấp (nhiều đề nghị trong một thao tác); ngoại lệ duyệt từng chiếc theo ma trận | Duyệt trên di động; lô giữa kỳ theo hạn hợp đồng | Thanh toán qua ngân hàng thật |
| Thuế | Kiểm tra chữ ký số XML; với hóa đơn nước ngoài: gắn cờ thuế nhà thầu và chứng từ nhập khẩu, chặn thanh toán đến khi kế toán xác nhận; tra danh sách nhà cung cấp rủi ro (giả lập) | Tra cứu trạng thái hóa đơn qua cổng kết nối; đối chiếu tờ khai hải quan | Kê khai thuế |
| Kiểm soát | Mã pháp nhân trên mọi dữ liệu, cấu hình riêng trong khung tập đoàn; phân tách nhiệm vụ; audit log; cổng tự động hóa bật/tắt thủ công, chạy ngầm | Cổng tự động hóa tự bật/tắt theo kết quả kiểm tra mẫu; actor Kiểm soát tập đoàn | — |
| Báo cáo | Tỷ lệ hóa đơn không cần xem từng chiếc, tỷ lệ AI xếp sai, ngoại lệ tồn đọng | So sánh giữa các pháp nhân | — |

## Business rules chính

Các ngưỡng là tham số cấu hình theo từng pháp nhân; số trong ngoặc chỉ là ví dụ cho bản demo.

| ID | Quy tắc |
| --- | --- |
| BR-01 | Mỗi chứng từ thuộc đúng một pháp nhân. Hóa đơn có mã số thuế người mua không khớp pháp nhân đặt hàng bị từ chối, yêu cầu nhà cung cấp xuất lại |
| BR-02 | Phân tách nhiệm vụ: người tạo đơn mua, người xác nhận nhập kho và người duyệt chi của cùng một giao dịch phải là ba người khác nhau; người tạo đơn mua và người xác nhận nhập kho lấy từ dữ liệu ERP |
| BR-03 | Ma trận duyệt theo pháp nhân và ngưỡng tiền (ví dụ: dưới 50 triệu trưởng bộ phận, từ 50 triệu trở lên giám đốc tài chính) |
| BR-04 | Dung sai giá và số lượng cấu hình theo pháp nhân (ví dụ: giá ±2%, số lượng không được vượt số đã nhập kho) |
| BR-05 | Hóa đơn chỉ được đưa vào lô thanh toán khi đủ 6 điều kiện ở mục Vai trò của AI; hóa đơn trong lô vẫn có thể bị rút ra cho đến khi chứng từ chi được ký |
| BR-06 | Cổng tự động hóa theo từng cặp nhà cung cấp – pháp nhân: chỉ mở khi độ chính xác của AI đo ở chế độ chạy ngầm đạt ngưỡng (ví dụ ≥ 98%); tự đóng khi kiểm tra mẫu phát hiện sai vượt ngưỡng |
| BR-07 | Kiểm tra mẫu trước khi ký: kế toán kiểm tra một phần lô (ví dụ 10%) do AI chọn theo rủi ro, ưu tiên hóa đơn giá trị cao và nhà cung cấp mới mở tự động; phát hiện sai thì rút hóa đơn khỏi lô |
| BR-08 | Nhà cung cấp nằm trong danh sách rủi ro về thuế: tạm giữ thanh toán, kế toán trưởng quyết định; không tự động loại hóa đơn |
| BR-09 | Cô lập dữ liệu theo pháp nhân. So sánh liên pháp nhân chỉ hiển thị số liệu tổng hợp, và ẩn khi có ít hơn 3 pháp nhân cùng mua mặt hàng đó |
| BR-10 | Chia nhỏ đơn: nhiều đơn cùng nhà cung cấp trong một khoảng ngắn (ví dụ 7 ngày) có tổng vượt ngưỡng thì được gộp lại để xét duyệt ở cấp cao hơn |
| BR-11 | Không thanh toán trùng: trùng nhà cung cấp, ký hiệu và số hóa đơn thì chặn; nội dung gần giống thì chuyển người kiểm tra |
| BR-12 | Mọi quyết định của AI lưu lý do, độ tin cậy và phiên bản mô hình; audit log không sửa được qua ứng dụng |
| BR-13 | Phiếu nhập kho chỉ do thủ kho lập từ số lượng thực nhận, tham chiếu đơn mua; không được sinh từ hóa đơn |
| BR-14 | Hóa đơn chưa có phiếu nhập kho tương ứng ở trạng thái Chờ hàng, không được duyệt chi (trường hợp hóa đơn về trước, hàng về sau) |
| BR-15 | Số lượng được thanh toán không vượt quá số lượng thực nhận; phần giao thiếu giữ đơn mua ở trạng thái còn mở |
| BR-16 | Quản trị pháp nhân chỉ cấu hình dung sai và ngưỡng đưa vào lô trong khung tối đa do tập đoàn đặt; không được nới vượt khung |
| BR-17 | AI chỉ được đưa hóa đơn vào lô khi người bán, số tiền, số lượng được một nguồn độc lập xác nhận (XML có chữ ký số và mã cơ quan thuế; hoặc PDF khớp giao dịch thẻ và hồ sơ thuê bao ở Nâng cao); chứng từ không có nguồn đối chiếu luôn qua người |
| BR-18 | PDF và XML của cùng một hóa đơn lệch nhau ở trường tiền, số lượng hoặc mã số thuế thì gắn cờ nghi gian lận; khi có XML gốc, hệ thống không nhận PDF làm nguồn dữ liệu |
| BR-19 | Số lượng thực nhận và nghiệm thu lấy từ xác nhận của thủ kho hoặc người nghiệm thu trên ERP hoặc phần mềm kho; bản scan có chữ ký tay chỉ là tệp đính kèm, AI không xác thực chữ ký tay |
| BR-20 | Mọi khoản chi phải có chữ ký điện tử của người có thẩm quyền và kế toán trưởng trước khi chi; AI không ký thay. Lô gồm các đề nghị thanh toán tổng hợp theo nhà cung cấp, mỗi đề nghị liệt kê từng hóa đơn; người ký có thể loại bớt dòng trước khi ký; mỗi hóa đơn truy vết được đến chữ ký đã duyệt nó. Cách gộp (theo nhà cung cấp, mặc định; hoặc từng hóa đơn) là tham số cấu hình theo quy chế của pháp nhân. Màn hình ký lô hiển thị tổng tiền theo pháp nhân và nhà cung cấp, hóa đơn giá trị lớn, kết quả kiểm tra mẫu và bằng chứng từng hóa đơn |
| BR-21 | Dịch vụ nước ngoài: chặn thanh toán đến khi kế toán xác nhận đã xử lý thuế nhà thầu. Hàng nhập khẩu: bắt buộc đính kèm tờ khai hải quan và chứng từ nộp thuế GTGT khâu nhập khẩu trước khi vào lô. Hóa đơn nước ngoài lưu nguyên tệ và tỷ giá |
| BR-22 | (Nâng cao) Thuê bao tự trừ thẻ: hạn mức thẻ theo hồ sơ thuê bao; hóa đơn được xác nhận sau; số chỗ, đơn giá lệch hồ sơ hoặc tính trùng kỳ thì yêu cầu hoàn tiền, giảm số chỗ hoặc khóa thẻ |
| BR-23 | Hóa đơn chi phí nhân viên không có yêu cầu đặt (khách sạn, nhà hàng, taxi) được tách sang danh sách chờ hồ sơ hoàn ứng, không tính là ngoại lệ. Người bán có thuộc diện lập bảng kê hay không do kế toán quyết định, không do AI |
| BR-24 | Hóa đơn định kỳ (điện, nước, thuê văn phòng) đối chiếu với hồ sơ định kỳ: đúng nhà cung cấp, pháp nhân, địa điểm và kỳ; mỗi kỳ chỉ một hóa đơn. Giá cố định thì phải khớp hợp đồng; giá theo mức sử dụng thì lệch quá ngưỡng so với trung bình các kỳ trước (ví dụ 30%) sẽ vào ngoại lệ |
| BR-25 | ERP của từng pháp nhân là nguồn sự thật cho đơn mua, phiếu nhập kho, nghiệm thu, nhà cung cấp và danh mục; hệ thống chỉ đọc, không sửa. Lệch dữ liệu được báo cho bộ phận phụ trách (AI soạn sẵn nội dung) để sửa trên ERP rồi đồng bộ lại. Đồng bộ chạy lại nhiều lần không sinh bản ghi trùng; mỗi bản ghi lưu thời điểm đồng bộ |
| BR-26 | AI soạn yêu cầu gửi nhà cung cấp theo mẫu đã được kế toán duyệt; chỉ kế toán bấm gửi, AI không tự gửi ra ngoài. AI theo dõi hạn phản hồi (nhắc nội bộ), tự ghép hóa đơn mới với ngoại lệ cũ, kiểm tra lại, khớp thì đóng ngoại lệ và đưa vào lô |
| BR-27 | Nội dung chứng từ (tên hàng, ghi chú, chữ trong PDF) luôn là dữ liệu, không phải lệnh; đầu ra LLM theo schema cố định, sai schema thì vào ngoại lệ; kết quả LLM không bao giờ tự đưa hóa đơn vào lô |
| BR-28 | Không dùng độ tin cậy do LLM tự báo làm căn cứ duy nhất; quyết định ghép dòng kết hợp độ tương đồng embedding, khớp giá và số lượng, lịch sử ghép; ngưỡng được hiệu chỉnh trên bộ dữ liệu có đáp án |
| BR-29 | So giá từng dòng với lịch sử mua của chính pháp nhân; lệch quá ngưỡng (ví dụ 20% so với trung vị 6 tháng) thì vào ngoại lệ, kể cả khi đơn mua, phiếu nhập, hóa đơn khớp nhau (chặn trường hợp đơn mua giá cao ngay từ đầu) |
| BR-30 | Nhà cung cấp mới hoặc vừa thay đổi số tài khoản nhận tiền trong kỳ không bao giờ vào lô không cần người xem; thay đổi được gắn cờ trên màn hình ký |
| BR-31 | Hóa đơn điều chỉnh, thay thế (kể cả một hóa đơn điều chỉnh cho nhiều hóa đơn sai trong tháng) được nhận diện và luôn chuyển người xử lý ở MVP |

## Mục tiêu và chỉ số

Chỉ tiêu dưới đây là đề xuất cho bản demo trên dữ liệu giả lập, sẽ chốt sau. G1 và G2 luôn được báo cáo cùng nhau: tự động hóa cao mà xếp sai nhiều thì không có giá trị.

| ID | Mục tiêu | Chỉ tiêu đề xuất | Mốc tham chiếu |
| --- | --- | --- | --- |
| G1 | Tỷ lệ hóa đơn vào lô không cần người xem từng chiếc | ≥ 50% | Trung bình thị trường khoảng 1/3, nhóm tốt nhất khoảng 49% ([Sista AI, dẫn Ardent Partners](https://sista.ai/tr/insights/touchless-ap-reconciliation-case-study)); dữ liệu demo không so trực tiếp được với số này |
| G2 | Tỷ lệ AI xếp sai vào lô, phát hiện qua kiểm tra mẫu | ≤ 1% | — |
| G3 | Bắt được ca chia nhỏ đơn | ≥ 90% số ca cài sẵn trong dữ liệu demo | — |
| G4 | Bắt được hóa đơn trùng | 100% ca trùng chính xác, ≥ 90% ca trùng biến thể | — |
| G5 | Thời gian AI xử lý một hóa đơn | ≤ 1 phút | Toàn quy trình: nhóm tốt nhất 3,1 ngày, trung bình 10,9 ngày ([Corpay](https://www.corpay.com/de-CH/resources/blog/ap-team-productivity-benchmarks)) |
| G6 | Không lộ dữ liệu giữa các pháp nhân | 0 trường hợp trong bộ kiểm thử phân quyền | — |
| G7 | Tỷ lệ dòng hàng ghép xong không cần gọi LLM (bằng bảng ánh xạ hoặc embedding và model kết hợp) | ≥ 60% | — |

## Đối thủ và khoảng trống

Ý tưởng AI tự duyệt hóa đơn cho doanh nghiệp nhiều pháp nhân đã có trên thị trường quốc tế; tại Việt Nam mới thấy từng mảnh. Khoảng trống của đề tài là bản địa hóa cho Việt Nam trên mô hình dịch vụ dùng chung, không phải bản thân ý tưởng.

| Giải pháp | Đã làm được | Chưa phù hợp hoặc cần kiểm chứng |
| --- | --- | --- |
| [Rillion](https://www.rillion.com/blog/best-invoice-automation-software/) | Quản lý nhiều pháp nhân bằng AI: tự đoán người duyệt, tự hạch toán, tự đối chiếu 3 bên | Mức hỗ trợ hóa đơn điện tử và quy định thuế Việt Nam; chi phí |
| Tipalti ([qua Rillion](https://www.rillion.com/blog/best-invoice-automation-software/)) | Công nợ phải trả và thanh toán cho tổ chức nhiều pháp nhân toàn cầu | Như trên |
| [MISA meInvoice](https://www.meinvoice.vn/?p=10310) | AI phân loại hóa đơn theo nhóm chi phí, cảnh báo vượt định mức, cảnh báo rủi ro hóa đơn | Chưa thấy cơ chế AI tự duyệt chi |
| [MISA AVA](https://amis.misa.vn/143559/tu-dong-hach-toan-hoa-don-dau-vao-voi-tro-ly-so-misa-ava/) | Tự động hạch toán hóa đơn đầu vào | Phục vụ hạch toán, không phải kiểm soát duyệt chi |
| [MISA AMIS mô hình tập đoàn](https://helpact.misa.vn/?p=79085) | Tổng hợp dữ liệu nhiều cấp, danh mục dùng chung, báo cáo hợp nhất | Mỗi công ty con có dữ liệu và giấy phép riêng; trọng tâm là báo cáo hợp nhất |
| [xCyber BillStore](https://xcyber.vn/?p=2672) | Quảng cáo tự động hóa 90% xử lý hóa đơn đầu vào | Cần kiểm chứng phạm vi thực tế |

**Khoảng trống giả định:** luồng duyệt chi dùng chung cho nhiều pháp nhân tại Việt Nam, nối đơn mua → phiếu nhập kho → hóa đơn điện tử → duyệt chi; AI tự kiểm tra và đưa hóa đơn vào lô trong khung chính sách, người có thẩm quyền ký theo lô; kiểm tra rủi ro thuế chỉ là một bước. Kết quả trên mới từ vài lượt tra tài liệu công khai; Bước 1 cần kiểm chứng kỹ, nhất là các ERP lớn mà tập đoàn Việt Nam đang dùng.

**Câu hỏi Bước 1 phải trả lời:** vì sao tập đoàn không mua luôn giải pháp quốc tế (chi phí, mức hỗ trợ hóa đơn điện tử và thuế Việt Nam, nơi lưu dữ liệu tài chính).

## Rủi ro, giả định và ràng buộc

| Loại | Nội dung | Cách xử lý |
| --- | --- | --- |
| Rủi ro | AI xếp sai hóa đơn vào lô dẫn đến chi sai tiền | Cổng tự động hóa, kiểm tra mẫu trước khi ký, người có thẩm quyền ký (BR-05, BR-06, BR-07, BR-20) |
| Rủi ro | Bị so sánh với đề tài HybridCheckout vì cùng có bước đối chiếu | Trình bày theo trục tự động hóa duyệt chi đa pháp nhân; đối chiếu chỉ là một bước |
| Rủi ro | Scope phình vì vừa đa pháp nhân vừa AI | Giới hạn 3 pháp nhân demo và khoảng 28 user story; một luồng lõi làm sâu, phần còn lại ở Nâng cao; phần bất thường liên pháp nhân để ở Nâng cao |
| Giả định | Dữ liệu giả lập, tên tập đoàn và công ty con giả định; không dùng dữ liệu nơi thực tập | — |
| Giả định | Hóa đơn trong nước phần lớn là hóa đơn điện tử dạng XML; hóa đơn nước ngoài dạng PDF | — |
| Ràng buộc | Tuân thủ quy định về hóa đơn, chứng từ (Nghị định 123/2020, sửa đổi bởi [Nghị định 70/2025](https://www.meinvoice.vn/tin-tuc/31439/nghi-dinh-70-2025-nd-cp-sua-doi-nghi-dinh-123/)) | — |
| Ràng buộc | Luật Kế toán yêu cầu chữ ký người lập, người duyệt trên chứng từ; người ký chịu trách nhiệm về nội dung | AI không ký; mô hình lô thanh toán có người ký (BR-20) |
| Rủi ro | Thuê bao tự trừ thẻ: tiền ra trước khi kiểm tra | Hạn mức thẻ, xác nhận sau, yêu cầu hoàn tiền (BR-22) |
| Rủi ro | Hóa đơn nước ngoài và thuế nhà thầu cần chuyên môn thuế sâu | MVP chỉ gắn cờ và chặn thanh toán; AI đề xuất loại hình ở Nâng cao, kế toán quyết định (BR-21) |
| Rủi ro | Dữ liệu ERP chậm hoặc sai làm đối chiếu sai | Hiển thị thời điểm đồng bộ trên mỗi chứng từ; lệch thì báo bộ phận phụ trách sửa trên ERP (BR-25) |
| Rủi ro | Dữ liệu giả lập do cùng người sinh và đánh giá (tự ra đề, tự giải) | Tên hàng lấy từ nguồn mua sắm công khai; nhờ người khác viết biến thể khó; tách phần dữ liệu dùng để báo cáo |
| Rủi ro | Nhiều thành phần giả lập (ERP, chứng thư số) | Lõi làm thật (AI ghép dòng, bộ quy tắc, kiểm tra chữ ký, lô và ký duyệt); chỉ ranh giới với hệ thống ngoài giả lập, mỗi chỗ có cổng kết nối để thay bằng thật |
| Ràng buộc | Lưu trữ file XML hóa đơn trong 10 năm theo quy định | Lưu file gốc bất biến kèm mã băm; MVP chỉ thiết kế, chưa triển khai chính sách lưu trữ |

## Câu hỏi mở cần chốt trước Bước 1

- [ ] Tên chính thức của đề tài
- [ ] Số pháp nhân trong bản demo (đề xuất 3)
- [ ] Mô hình AI: gọi LLM qua API hay tự vận hành (ảnh hưởng chi phí và bảo mật dữ liệu tài chính)
- [ ] Có được nhắc đến bối cảnh nơi thực tập trong tài liệu không (cần hỏi quản lý)
- [ ] Ủy quyền theo chính sách (người có thẩm quyền ký duyệt quy tắc) có thay được chữ ký duyệt từng chứng từ không (hỏi kế toán, pháp chế)
- [ ] Bút toán do hệ thống tự lập ghi ai là người lập, có cần người duyệt riêng không
- [ ] Nhà cung cấp nước ngoài đã đăng ký thuế trực tiếp tại Việt Nam thì bên mua còn phải nộp thay thuế nhà thầu không
- [ ] Mẫu bảng kê mua hàng không có hóa đơn hiện hành là 01/TNDN hay 02/TNDN (Thông tư 20/2026), và điều kiện thanh toán không dùng tiền mặt (các nguồn đang mâu thuẫn)
- [ ] Phiên bản định dạng XML hóa đơn điện tử mới nhất (Quyết định 1450/QĐ-TCT đã được sửa đổi bởi Quyết định 1510/QĐ-TCT)
- [ ] Cổng hóa đơn điện tử của cơ quan thuế có API để hệ thống bên thứ ba lấy hóa đơn đầu vào không

## Nguồn tham khảo

- [Sista AI – Touchless AP reconciliation case study (dẫn Ardent Partners)](https://sista.ai/tr/insights/touchless-ap-reconciliation-case-study)
- [Corpay – AP team productivity benchmarks](https://www.corpay.com/de-CH/resources/blog/ap-team-productivity-benchmarks)
- [Rillion – Best invoice automation software](https://www.rillion.com/blog/best-invoice-automation-software/)
- [Sapo – Hóa đơn điện tử theo Nghị định 70/2025](https://www.sapo.vn/blog/hoa-don-dien-tu-la-gi)
- [iHOADON – Quy định về định dạng hóa đơn điện tử (Quyết định 1450/QĐ-TCT)](https://ihoadon.vn/hddt/quy-dinh-ve-dinh-dang-hoa-don-dien-tu.html)
- [MISA meInvoice – Nghị định 70/2025 sửa đổi Nghị định 123](https://www.meinvoice.vn/tin-tuc/31439/nghi-dinh-70-2025-nd-cp-sua-doi-nghi-dinh-123/)
- [Bộ Tài chính – Hỏi đáp về nội dung chứng từ kế toán (Luật Kế toán 2015)](https://portal.mof.gov.vn/hoidapcstc/home/cthoidap/166736)
- [ACC – Tra cứu hóa đơn điện tử](https://accgroup.vn/in-tra-cuu-hoa-don-dien-tu)
- [Kế toán Thuận Thiên – Khấu trừ thuế GTGT hàng nhập khẩu](https://ketoanthuanthien.vn/?p=7811)
- [Kế toán Thuận Thiên – Dịch vụ xuyên biên giới và thuế nhà thầu](https://ketoanthuanthien.vn/kien-thuc/dich-vu-xuyen-bien-gioi/)
- [Kế toán Thuận Thiên – Bảng kê mua hàng không có hóa đơn](https://ketoanthuanthien.vn/?p=10244)
- [MISA AMIS – Danh sách doanh nghiệp rủi ro cao về thuế, hóa đơn](https://amis.misa.vn/?p=295073)
- [MISA meInvoice – Doanh nghiệp rủi ro về hóa đơn](https://www.meinvoice.vn/tin-tuc/19785/doanh-nghiep-rui-ro-ve-hoa-don)
- [MISA meInvoice – Phần mềm quản lý hóa đơn điện tử](https://www.meinvoice.vn/?p=10310)
- [MISA AMIS – Tự động hạch toán hóa đơn đầu vào với MISA AVA](https://amis.misa.vn/143559/tu-dong-hach-toan-hoa-don-dau-vao-voi-tro-ly-so-misa-ava/)
- [MISA – Mô hình quản lý và tổng hợp dữ liệu tập đoàn (V2)](https://helpact.misa.vn/?p=79085)
- [xCyber BillStore](https://xcyber.vn/?p=2672)
