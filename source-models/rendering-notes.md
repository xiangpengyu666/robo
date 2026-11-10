# ROBO 渲染调校依据与参数

本轮目标：黑色摄影棚、中性顶光、克制的冷色轮廓、浅黄色透光表情。下列数值是当前模型的视觉调校值，不是拓竹或电子元件厂商的实测光学参数。

## 参考与采用方式

- Three.js MeshPhysicalMaterial：https://threejs.org/docs/pages/MeshPhysicalMaterial.html 。采用非金属塑料、粗糙度和折射率的分工；不把整块前面板变成玻璃。官方 transmission 不等同于白色塑料的体积多次散射。
- Adobe PBR Guide：https://www.adobe.com/learn/substance-3d-designer/web/the-pbr-guide-part-2 。按导体/绝缘体区分材质；裸金属用金属反射，阻焊、塑料及芯片封装保持非金属。
- model-viewer 环境与色调映射：https://modelviewer.dev/examples/lightingandenv/ 。本轮按 WebGi 管线改用 ACES Filmic，并重新调校浅黄色发光。
- Three.js PMREM：https://threejs.org/docs/pages/PMREMGenerator.html 。本地生成 HDR 摄影棚反射卡，启动时预滤波一次，不依赖远程 HDRI，不逐帧捕捉环境。
- Bambu PLA 分类：https://bambulab.cn/zh-cn/filament/pla-list 。Basic 与 Matte 是不同外观产品；现有外壳按 Basic 的视觉近似处理，未找到可直接作为本项目实测值的完整 PBR/透射参数。

## 材质参数

|表面|metalness|roughness|其他|
|---|---:|---:|---|
|白色 PLA 外壳|0|0.34|IOR 1.46；细微粗糙度/凹凸；无额外清漆|
|灰色连接板|0|0.42|保留用户确认配色|
|黑色/橙色打印件|0|0.32|细微表面纹理；保留配色|
|裸金属端子/屏蔽壳|1|0.22|环境反射塑形|
|焊点|1|0.29|较宽高光|
|PCB 阻焊层|0|0.34|保留黑色/绿色板色|
|芯片封装|0|0.72|粗糙、不金属化|
|插接件塑料|0|0.46|避免陶瓷式强高光|

导出时保留 surfaceRole，不再靠合并后丢失的网格名称猜测材质。蓝色舵机壳和 LED 后膜保留已有透射参数。

## 灯光与渲染

七张带柔边的本地 HDR 反射卡：顶部暖白、正面冷白、侧后条灯、背面条灯、侧前细条、弱填充和下方反光卡。实体灯以顶面柔光箱为主，正面提供弱补光，侧后条灯勾勒黑色结构。地面从中心向外渐隐，与黑色背景衔接；阴影相机覆盖范围收紧到 ±3.5，使用 4096 阴影图。

实际接入 ThreeViewer / threepipe 0.6.0 与 @threepipe/webgi-plugins 0.7.0。Three 依赖固定为插件所需的 three-modded 0.168.10008，不能单独升级为普通 Three.js 新版本。

参考官方手册：https://webgi.dev/

- GBufferPlugin：为屏幕空间效果提供深度/法线等信息。
- SSReflectionPlugin：强度 0.65，objectRadius 0.001，tolerance 0.8。
- SSAOPlugin：强度 0.30，bias 0.001，falloff 1.25，16 个样本。
- SSAAPlugin + ProgressivePlugin：每帧 2 次渲染，静止累计 64 次；镜头和阴影相机抖动采样。场景发生变化才重置累积，接线顶点变化也触发更新。
- TemporalAAPlugin：feedback 0.82/0.94。
- BloomPlugin：强度 0.085，阈值 2，4 次迭代。
- TonemapPlugin：ACES Filmic，展示曝光保持 0.36（按用户暗调截图略微提亮进行视觉匹配，并非原亮版数值乘 1.15），只进行一次输出色调映射。教学模式独立使用 0.65 和均匀环境照明，保证线色、端子和丝印可辨认。
- DepthOfFieldPlugin 已加载但关闭，保证零件和接线端子清晰。
- 自定义暗色地面和摄影棚环境保留，未使用示例 BaseGroundPlugin 的默认地面。
- 精细模式像素比 1.25–2，并将渲染像素预算限制在 500 万；轻量模式预算 250 万，关闭 AO/SSR/Bloom/TAA/SSAA。接线模式关闭 AO/SSR/Bloom/TAA 和雾，保证教学可读性。

手表示例不仅依靠插件，也依靠精细模型、材质、环境。此项目采用手册的插件体系，但没有复制手表 GLB 中可能包含的专用配置，不能声称参数和手表完全相同。

## 模型与微表面

- STEP 细分精度从 0.12 mm / 0.4 rad 提高至 0.035 mm / 0.18 rad；26 个实体共 67,100 个三角面。保留 OCCT 原始曲面法线，避免重新平均法线使平面出现三角暗纹。
- 打印件锐边采用约 0.1 mm 的着色微倒角，只调整局部法线，不修改装配外形；三角剖分内部边不参与倒角。
- 电子模块的部分实体小方块加入最多 0.09 mm 的几何微倒角，保持包围尺寸；插口、接触面、针脚和丝印不执行此处理。
- 打印件和部分电子表面使用局部坐标的三平面微纹理，随部件移动，不依赖 UV。不同材质的粗糙度和微凹凸分别调节。材质克隆时着色扩展具有幂等保护，避免教学克隆重复注入 GLSL。
- 浅黄色表情由真实 LED 坐标驱动核心与宽柔晕；前盖展开远离灯板后透光衰减。仍是实时扩散近似，不是路径追踪或经实测校准的体积散射。SSR 只能反射屏幕内的信息。

## 本轮验证

已执行 BOM、爆炸路径和接线检查：模型尺寸与材质批次有效，27 部件的 101 个展开位置没有新增或增加的包围盒重叠，24 条接线路径通过既有连接口以外的检测。装配态原有嵌套关系不等于三角面碰撞，因此该检测不能证明任意曲面绝无接触。

浏览器检查正常视角、背面、近看、展开、接线和显示模式，静止采样可达到 64。未做不同显卡的帧率基准。WebGi 在此 Chromium/D3D 环境仍可能输出 transmission shader 的潜在未初始化警告；本轮实际渲染未观察到对应异常。

许可：WebGi 插件包附带 GPL-3.0 及附加条款，原文位于 node_modules/@threepipe/webgi-plugins/LICENSE；分发时保留并遵守其许可。未使用付费珠宝插件。
