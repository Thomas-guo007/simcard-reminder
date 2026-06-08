export interface Ringtone {
  id: string;
  name: string;
  // For notification sound, this is the filename
  // 'default' means system default notification sound
  soundFile: string | null;
}

/**
 * 可选铃声列表
 * 由于自定义铃声需要在构建时打包到原生项目中，
 * 这里提供系统默认铃声和几种预设选项。
 * 实际通知时使用 sound 属性指定。
 */
export const RINGTONES: Ringtone[] = [
  { id: "default", name: "系统默认", soundFile: null },
  { id: "gentle", name: "柔和提示", soundFile: "gentle.wav" },
  { id: "urgent", name: "紧急提醒", soundFile: "urgent.wav" },
  { id: "chime", name: "清脆铃声", soundFile: "chime.wav" },
  { id: "bell", name: "经典铃声", soundFile: "bell.wav" },
  { id: "none", name: "静音（仅振动）", soundFile: "" },
];

export function getRingtoneById(id: string): Ringtone | undefined {
  return RINGTONES.find(r => r.id === id);
}
