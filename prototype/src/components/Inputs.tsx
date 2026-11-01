import { InputNumber } from 'antd';
import type { InputNumberProps } from 'antd';

const group = (v: string | number | undefined): string => `${v ?? ''}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const strip = (v: string | undefined): number => Number((v ?? '').replace(/[^\d]/g, ''));

/** An amount in VND: dots as thousands separators, whole numbers only. */
export function MoneyInput(props: Omit<InputNumberProps<number>, 'formatter' | 'parser'>) {
  return <InputNumber<number> min={0} precision={0} style={{ width: '100%' }} {...props} formatter={group} parser={strip} addonAfter="₫" />;
}
