export interface Field {
  label: string;
  key: string;
  required: boolean;
  fixed?: boolean;
}

export interface FormConfig {
  isActive: boolean;
  textFields: Field[];
}

export interface Teacher {
  name : string,
  minQuota: Number,
  maxQuota: Number,
}