export interface EcountScript {
  fileName: string;
  title: string;
  menuPath: string;
  targetTable: string;
  description: string;
  category: string;
  defaultDaysRange: number;
  columns: string[];
  isRealFileAvailable?: boolean;
  isTableCreated?: boolean;
}

export interface EcountSchedule {
  id: string;
  script_file: string;
  script_title: string;
  target_table: string;
  period_preset: 'hour' | 'daily' | 'weekly' | 'monthly';
  run_time: string;
  week_days?: string;
  month_day?: number;
  sync_days_range: number;
  is_active: number;
  last_run_at: string | null;
  next_run_at: string | null;
  created_at: string;
}
