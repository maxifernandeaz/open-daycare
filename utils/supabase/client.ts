import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabasePublishableKey,
  getSupabaseUrl,
} from "@/utils/supabase/config";

export const createClient = () =>
  createBrowserClient(getSupabaseUrl(), getSupabasePublishableKey());
