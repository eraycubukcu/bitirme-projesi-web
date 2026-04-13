export interface Field {
  label: string;
  key: string;
  required: boolean;
  fixed?: boolean;
}

export interface FormConfig {
  isActive: boolean;
  textFields: Field[];
  description : string;
}

export interface Teacher {
  name : string,
  minQuota: Number,
  maxQuota: Number,
}