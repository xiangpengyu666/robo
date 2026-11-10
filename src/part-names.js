import { BOM_PARTS } from './bom-config.js';

// Descriptive display names inferred from geometry/assembly, not supplier part numbers.
// Left/right is viewed facing the robot's front panel (+X towards the assembly).
export const PRINTED_PART_NAMES = Object.freeze({
  'part-2': '底部舵机双臂舵盘',
  'part-5': '中部关节舵臂',
  'part-6': '中部关节右侧盖',
  'part-7': '中部关节左侧盖',
  'part-9': '顶部关节舵臂',
  'part-10': '顶部关节右侧盖',
  'part-11': '顶部关节左侧盖',
  'part-12': '头部舵机安装架',
  'part-17': '机械臂镂空支架',
  'part-18': '头部上壳',
  'part-19': '显示器安装支架',
  'part-20': '底部镂空安装座',
  'part-21': '底部旋转连接盘',
  'part-22': '中部舵机安装座',
  'part-23': '机械臂左连接板',
  'part-24': '机械臂右连接板',
  'part-25': '头部前面板',
  'part-26': '头部橙色底壳',
});
export function partDisplayName(id) {
  const label=(id==='part-27'?'五路正负极分电板':null) || BOM_PARTS[id]?.label || PRINTED_PART_NAMES[id];
  if(!label)throw new Error(`Missing part name: ${id}`);
  return `部件 ${id.replace('part-','').padStart(2,'0')} · ${label}`;
}
