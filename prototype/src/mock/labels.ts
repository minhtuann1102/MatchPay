// Vietnamese text written by the system into mock data (allowed here: this folder is the data layer).
export const periodLabel = (period: string): string => {
  const [y, m] = period.split('-');
  return `Tháng ${Number(m)}/${y}`;
};

export const MOCK_TEXT = {
  removedAllLines: 'Đã gỡ hết các dòng',
  batchReopened: 'Mở lại lô để rà soát',
  requestDeclined: 'Đề nghị bị từ chối',
  uploadedByPerson: 'Tải lên bởi người dùng',
  sampleErrorWithdrawn: 'Rút khỏi lô do lỗi ở mẫu kiểm tra',
  cancelledBySeller: 'Người bán đã hủy hóa đơn',
  fetchedSubject: 'Hóa đơn',
  fetchedOtherSubject: 'Bảng đối chiếu công nợ',
  mailSender: 'Kế toán phải trả',
};
