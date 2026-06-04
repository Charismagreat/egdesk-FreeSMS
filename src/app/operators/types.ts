export interface Operator {
  id: number;
  username: string;
  name: string;
  role: string;
  created_at: string;
}

export interface OperatorForm {
  username: string;
  password: string;
  name: string;
  role: string;
}
