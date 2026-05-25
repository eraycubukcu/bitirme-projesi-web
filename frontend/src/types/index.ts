export interface Field {
  label: string;
  key: string;
  required: boolean;
  fixed?: boolean;
  fieldType?: "text" | "email" | "phone" | "number";
}

export interface FormConfig {
  textFields: Field[];
  description: string;
  startDate?: string;
  endDate?: string;
  cascadeDate?: string;
  cascadeExecuted?: boolean;
}

export interface Teacher {
  _id: string;
  name: string;
  username: string;
  minQuota: number;
  maxQuota: number;
  currentCount: number;
  hasFinalized?: boolean;
  bio?: string;
}

export interface Student {
  _id: string;
  clerkUserId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  formData: Record<string, string>;
  preferences: Teacher[];
  assignedTeacher?: Teacher | null;
  status: "unassigned" | "assigned";
  createdAt: string;
  updatedAt: string;
}
