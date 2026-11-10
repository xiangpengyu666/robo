export const BOM_PARTS = {
  // Purchased part that keeps its STEP geometry (sourceGeometry) instead of a component template.
  'part-3': {model:'bearing', sourceGeometry:true, label:'滚珠轴承 · 底部旋转轴承', note:'外购滚珠轴承，沿用装配模型中的外形（约 Φ35 × 4 mm）；具体型号待补充，渲染为银色金属。'},
  'part-1': {model:'servo', label:'SG90 · 底部舵机', note:'依据实物照片细化的 SG90 展示模型；短线缆走向为示意。'},
  'part-4': {model:'servo', label:'SG90 · 中部舵机', rotationX:Math.PI/2, note:'保留原安装中心与轴向；透蓝壳体按实物照片细化，短线缆为示意。'},
  'part-8': {model:'servo', label:'SG90 · 顶部舵机', rotationX:-Math.PI/2, note:'保留原安装中心与轴向；透蓝壳体按实物照片细化，短线缆为示意。'},
  'part-13': {model:'matrix', label:'MAX7219 · 双 LED 点阵', frontFacing:true, offsetX:-3.2, note:'按照片细化 JY-MCU MAX7219 V2.0：乳白方形灯珠与窄背板；双模块尺寸沿用原占位，安装耳尺寸为近似，未点亮。'},
  'part-14': {model:'nano', label:'Nano Type-C · 控制板', note:'按所提供照片：44×18 mm 黑色 Nano 兼容板、Type-C、ATmega328P-AU、CH340G 与已焊排针；元件细节为外观近似。'},
  'part-15': {model:'camera', label:'H288-U1M-V1.0 · 摄像头', frontFacing:true, offsetX:-1.85, note:'依据 25×8 mm 实物照片细化黑色 PCB、阶梯镜头座、蓝色镜片与米白接口；元件布局为展示近似。'},
  'part-16': {model:'hub', label:'USB-HUB-4PH2.0 · 集线器', rotationY:Math.PI/2, note:'按实物照片细化：黑色 PCB、五个 PH 接口与五颗电容；53×35 mm 板面，元件高度和布局为展示近似。'},
};
export const SHELL_PARTS = new Set(['part-18','part-25','part-26']);
