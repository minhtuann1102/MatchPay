import type { ThemeConfig } from 'antd';

// Identity tokens of the prototype: purple ink for actions, ledger green, amber, and seal red (D-205, D-206).
export const COLORS = {
  primary: '#4A3A8C',
  primaryWash: '#ECE9F6',
  success: '#2E6A55',
  warning: '#8A5E0F',
  error: '#B3261E',
  paper: '#F3F5F4',
};

export const theme: ThemeConfig = {
  token: {
    colorPrimary: COLORS.primary,
    colorSuccess: COLORS.success,
    colorWarning: COLORS.warning,
    colorError: COLORS.error,
    colorInfo: COLORS.primary,
    // Washes and lines of the ledger palette; antd would derive muddy ones from the dark amber and green.
    colorSuccessBg: '#E3F0EA',
    colorSuccessBorder: '#9CC6B6',
    colorWarningBg: '#F6EEDB',
    colorWarningBorder: '#DCC189',
    colorErrorBg: '#F8E7E5',
    colorErrorBorder: '#E0A29D',
    colorInfoBg: '#ECE9F6',
    colorInfoBorder: '#B9B0DC',
    colorLink: COLORS.primary,
    borderRadius: 6,
    fontFamily: '"Be Vietnam Pro", "Segoe UI", system-ui, sans-serif',
    fontSize: 14,
    colorBgLayout: COLORS.paper,
    colorTextBase: '#1E2233',
  },
  components: {
    Layout: { siderBg: '#FFFFFF', headerBg: '#FFFFFF', headerHeight: 56, headerPadding: '0 24px' },
    Menu: { itemSelectedBg: COLORS.primaryWash, itemSelectedColor: COLORS.primary, itemBorderRadius: 6 },
    Table: { headerBg: '#F7F7FA', headerColor: '#545A6E', rowHoverBg: '#FAF9FD' },
    Card: { headerFontSize: 16 },
    Statistic: { titleFontSize: 13 },
  },
};
