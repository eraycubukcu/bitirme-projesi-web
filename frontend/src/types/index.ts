export interface Field {
  label: string;
  key: string;
  required: boolean;
  fixed?: boolean;
}

export interface FormConfig {
  textFields: Field[];
  description: string;
  startDate?: string;
  endDate?: string;
}

export interface Teacher {
  _id: string;
  name: string;
  username: string;
  minQuota: number;
  maxQuota: number;
  currentCount: number;
}
