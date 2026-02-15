import type { ReactElement } from "react";

type Props = {
  label: string;
  value: number;
  onChange: (nextValue: number) => void;
  minimumDate?: number;
  maximumDate?: number;
  minuteInterval?: 1 | 5 | 10 | 15 | 20 | 30;
};

export declare function DateTimeField(props: Props): ReactElement;
