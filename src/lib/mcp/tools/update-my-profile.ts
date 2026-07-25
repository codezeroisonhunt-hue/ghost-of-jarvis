import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function supabaseForUser(ctx: ToolContext) {
  return createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_PUBLISHABLE_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    },
  );
}

export default defineTool({
  name: "update_my_profile",
  title: "Update my JARVIS profile",
  description:
    "Update the signed-in user's display name and/or avatar URL on their JARVIS profile.",
  inputSchema: {
    display_name: z.string().trim().min(1).max(80).optional()
      .describe("New display name."),
    avatar_url: z.string().url().optional()
      .describe("New avatar image URL."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true },
  handler: async ({ display_name, avatar_url }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    if (!display_name && !avatar_url) {
      return {
        content: [{ type: "text", text: "Provide display_name or avatar_url." }],
        isError: true,
      };
    }
    const supabase = supabaseForUser(ctx);
    const patch: Record<string, unknown> = { user_id: ctx.getUserId() };
    if (display_name !== undefined) patch.display_name = display_name;
    if (avatar_url !== undefined) patch.avatar_url = avatar_url;

    const { data, error } = await supabase
      .from("profiles")
      .upsert(patch, { onConflict: "user_id" })
      .select()
      .single();

    if (error) {
      return { content: [{ type: "text", text: error.message }], isError: true };
    }
    return {
      content: [{ type: "text", text: `Profile updated for ${ctx.getUserEmail() ?? ctx.getUserId()}` }],
      structuredContent: { profile: data },
    };
  },
});
