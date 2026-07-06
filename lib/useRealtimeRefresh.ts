import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

/** Subscribes to Postgres changes on the given tables and calls `onChange`
 * whenever a row is inserted/updated/deleted, so cards stay in sync with
 * edits made elsewhere (another tab, Supabase dashboard, etc). */
export function useRealtimeRefresh(tables: string[], onChange: () => void) {
  useEffect(() => {
    const channel = supabase.channel(`realtime:${tables.join(",")}`);

    for (const table of tables) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => onChange()
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tables.join(",")]);
}
