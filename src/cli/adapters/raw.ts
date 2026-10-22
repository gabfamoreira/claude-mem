import type { PlatformAdapter } from '../types.js';
import { AdapterRejectedInput, isValidCwd } from './errors.js';

/** Hook stdin shape accepted by the raw adapter (camelCase or snake_case keys). */
interface RawHookPayload {
  cwd?: string;
  sessionId?: string;
  session_id?: string;
  prompt?: string;
  toolName?: string;
  tool_name?: string;
  toolInput?: unknown;
  tool_input?: unknown;
  toolResponse?: unknown;
  tool_response?: unknown;
  toolUseId?: string;
  tool_use_id?: string;
  transcriptPath?: string;
  transcript_path?: string;
  filePath?: string;
  file_path?: string;
  edits?: unknown[];
}

export const rawAdapter: PlatformAdapter = {
  normalizeInput(raw) {
    const r = (raw ?? {}) as RawHookPayload;
    const cwd = r.cwd || process.cwd();
    if (!isValidCwd(cwd)) {
      throw new AdapterRejectedInput('invalid_cwd');
    }
    return {
      sessionId: r.sessionId ?? r.session_id ?? 'unknown',
      cwd,
      prompt: r.prompt,
      toolName: r.toolName ?? r.tool_name,
      toolInput: r.toolInput ?? r.tool_input,
      toolResponse: r.toolResponse ?? r.tool_response,
      toolUseId: r.toolUseId ?? r.tool_use_id,
      transcriptPath: r.transcriptPath ?? r.transcript_path,
      filePath: r.filePath ?? r.file_path,
      edits: r.edits,
    };
  },
  formatOutput(result) {
    return result;
  }
};
