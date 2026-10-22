import type { PlatformAdapter, NormalizedHookInput } from '../types.js';
import { AdapterRejectedInput, isValidCwd } from './errors.js';

/** Windsurf Cascade hook stdin: `tool_info` fields vary by `agent_action_name`. */
interface WindsurfToolInfo {
  cwd?: string;
  user_prompt?: string;
  file_path?: string;
  edits?: unknown[];
  command_line?: string;
  mcp_tool_name?: string;
  mcp_tool_arguments?: unknown;
  mcp_result?: unknown;
  response?: unknown;
}

interface WindsurfHookPayload {
  tool_info?: WindsurfToolInfo;
  agent_action_name?: string;
  trajectory_id?: string;
  /** Typed as present: the adapter has always passed this through as the session id. */
  execution_id: string;
}

export const windsurfAdapter: PlatformAdapter = {
  normalizeInput(raw) {
    const r = (raw ?? {}) as WindsurfHookPayload;
    const toolInfo: WindsurfToolInfo = r.tool_info ?? {};
    const actionName: string = r.agent_action_name ?? '';

    const cwd = toolInfo.cwd || process.cwd();
    if (!isValidCwd(cwd)) {
      throw new AdapterRejectedInput('invalid_cwd');
    }

    const base: NormalizedHookInput = {
      sessionId: r.trajectory_id ?? r.execution_id,
      cwd,
      platform: 'windsurf',
    };

    switch (actionName) {
      case 'pre_user_prompt':
        return {
          ...base,
          prompt: toolInfo.user_prompt,
        };

      case 'post_write_code':
        return {
          ...base,
          toolName: 'Write',
          filePath: toolInfo.file_path,
          edits: toolInfo.edits,
          toolInput: {
            file_path: toolInfo.file_path,
            edits: toolInfo.edits,
          },
        };

      case 'post_run_command':
        return {
          ...base,
          cwd: toolInfo.cwd ?? base.cwd,
          toolName: 'Bash',
          toolInput: { command: toolInfo.command_line },
        };

      case 'post_mcp_tool_use':
        return {
          ...base,
          toolName: toolInfo.mcp_tool_name ?? 'mcp_tool',
          toolInput: toolInfo.mcp_tool_arguments,
          toolResponse: toolInfo.mcp_result,
        };

      case 'post_cascade_response':
        return {
          ...base,
          toolName: 'cascade_response',
          toolResponse: toolInfo.response,
        };

      default:
        return base;
    }
  },

  formatOutput(result) {
    return { continue: result.continue ?? true };
  },
};
