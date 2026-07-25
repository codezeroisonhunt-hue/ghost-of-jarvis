import { auth, defineMcp } from "@lovable.dev/mcp-js";
import echoTool from "./tools/echo";
import getMyProfileTool from "./tools/get-my-profile";
import updateMyProfileTool from "./tools/update-my-profile";

const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "jarvis-mcp",
  title: "JARVIS",
  version: "0.1.0",
  instructions:
    "Tools for the JARVIS assistant app. Use `echo` to verify connectivity, `get_my_profile` to read the signed-in user's profile, and `update_my_profile` to change their display name or avatar.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [echoTool, getMyProfileTool, updateMyProfileTool],
});
