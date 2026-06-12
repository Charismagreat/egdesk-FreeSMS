export interface WebTemplate {
  id: number;
  template_name: string;
  document_type: string;
  html_content: string;
  is_active: number;
  updated_at: string;
  updated_by: string;
}

export interface OperatorInfo {
  id: number;
  name: string;
  username: string;
  role: string;
  department?: string;
  position?: string;
  joined_date?: string;
  commute_area?: string;
  address?: string;
  email?: string;
  phone?: string;
}
