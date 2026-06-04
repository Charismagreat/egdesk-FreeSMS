export interface Report {
  share_id: string;
  title: string;
  custom_title: string | null;
  sql_query: string;
  table_name: string;
  briefing_markdown: string;
  chart_spec_json: string | any;
  created_at: string;
  last_refreshed_at: string | null;
  is_active: number;
  refresh_interval: string;
  sort_order: number;
}

export interface ChartSpec {
  type: string;
  sampleRows?: any[];
  [key: string]: any;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'warn';
}
