import type { DataProvider } from '../provider';
import { mockProvider } from './mock';

// Switch provider here when moving to Supabase:
// import { supabaseProvider } from './supabase';
// export const dataProvider: DataProvider = supabaseProvider;

export const dataProvider: DataProvider = mockProvider;
