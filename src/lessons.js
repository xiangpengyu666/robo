export const LESSONS = [
 {title:'连接底部舵机',kind:'servo',parts:[14,27,1],servo:1,pair:1,pin:'D3',z:-5.08,text:'Nano D3 → 底部舵机信号端 SIG。分电板第 2 组 + / − → 舵机电源 / 地线；三条线同时演示。对应测试程序 servo1，基准角度 90°。'},
 {title:'连接中部舵机',kind:'servo',parts:[14,27,4],servo:4,pair:2,pin:'D5',z:0,text:'Nano D5 → 中部舵机信号端 SIG。分电板第 3 组 + / − → 舵机电源 / 地线；三条线同时演示。对应测试程序 servo2，基准角度 90°。'},
 {title:'连接顶部舵机',kind:'servo',parts:[14,27,8],servo:8,pair:3,pin:'D6',z:2.54,text:'Nano D6 → 顶部舵机信号端 SIG。分电板第 4 组 + / − → 舵机电源 / 地线；三条线同时演示。对应测试程序 servo3，基准角度 110°。'},
 {title:'连接点阵屏',kind:'led',parts:[14,27,13],source:27,destination:13,pair:4,destPins:[[-25,-1.25,-7.04],[-25,-1.25,-5.77]],signals:[{pin:'D10',z:12.7,dest:'CS',endZ:-3.23,color:'#b98240',lane:1},{pin:'D11',z:15.24,dest:'CLK',endZ:-1.96,color:'#368b91',lane:0},{pin:'D12',z:17.78,dest:'DIN',endZ:-4.5,color:'#8b68b2',lane:2}],text:'Nano D10 / D11 / D12 → 第一块 CS / CLK / DIN；分电板第 5 组 + / − → VCC / GND。第一块再以五线连接第二块：CLK、CS、电源共接，DOUT → DIN。所有连线同时演示。'},
 {title:'Nano 电源接入分电板',kind:'power',parts:[14,27],source:14,destination:27,sourcePins:[[7.6,1.05,10.16],[7.6,1.05,15.24]],destPins:[[5.08,.95,-1.27],[5.08,.95,1.27]],text:'Nano 5V → 分电板第 1 组 +；Nano GND → 第 1 组 −。其余四组用于并联分配电源。'},
 {title:'USB 模块插接',kind:'usb',parts:[15,16,14],text:'摄像头使用配套四针线束接入匹配的 Hub 下行接口；Nano 通过 Type-C 数据线接入 Hub，Hub 上行连接电脑。点击连接名称逐条查看。'},
];

export function visibleLessonParts(lesson,usbIndex=0){return lesson.kind==='usb'?[[15,16],[14,16],[16]][usbIndex]:lesson.parts;}
