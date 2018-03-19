    adjustDesignWidth();
//标识右侧工具栏是否已显示,默认显示
sessionStorage['rightToolsIsDisplay']=true;

//标识当前点击的流程图框,默认为none
sessionStorage['currentChartSelected']='none';

//栈,记录用户操作的先后顺序,用来进行撤销操作,数据结构为JSON,其中的copy用来复制部件
//是个二维栈,包括新增/删除/粘贴操作
var chartOperationStack=new Array;
chartOperationStack['add']=[];
chartOperationStack['delete']=[];
chartOperationStack['paste']=[];
chartOperationStack['copy']=[];

//记录用户具体操作,有copy,add,delete,paste
var chartRareOperationStack=new Array;

//记录当前流程框的数量
sessionStorage['currentChartAmount']=0;

//指定流程图设计区域宽度高度
function adjustDesignWidth(){
    var designWidth=0;
    var domWidth=$(window).width();
    designWidth=domWidth-$('.chart-right-panel').width();
    $('.chart-design').css('width',designWidth-4);
}

//设置当前部件top,left
function setChartLocation(top,left){
    $('#lo-x-display').val(top);
    $('#lo-y-display').val(left);
}

//设置当前部件的width和height
function setChartSize(width,height){
    alert("setChartSize");
    $('#chart-width-display').val(width);
    $('#chart-height-display').val(height);
}

//****************负责属性面板的内容设置*****************

//*********************************jsPlumb基础信息配置区域*********************************{

//流程图ID唯一标识,用来防止重复,每次新建一个部件时此值必须加1,否则会出现异常
sessionStorage['idIndex']=0;

//检测设计区域中间区域是否被占据,页面刚加载时默认没有被占据
sessionStorage['midIsOccupied']='not';

//根蒂根基连接线样式
var connectorPaintStyle = {
    lineWidth: 1,
    strokeStyle: "rgb(0,0,0)",
    joinstyle: "round",
    outlineColor: "rgb(0,0,0)",
    outlineWidth: 0
};

// 鼠标悬浮在连接线上的样式
var connectorHoverStyle = {
    lineWidth: 1,
    strokeStyle: "#000000",
    outlineWidth: 0,
    outlineColor: "rgb(0,0,0)"
};

var hollowCircle = {
    endpoint: ["Dot", { radius: 1 }],  //端点的外形
    connectorStyle: connectorPaintStyle,//连接线的色彩,大小样式
    connectorHoverStyle: connectorHoverStyle,
    paintStyle: {
        strokeStyle: "rgb(0,0,0)",
        fillStyle: "rgb(0,0,0)",
        opacity: 0.5,
        radius: 1,
        lineWidth: 1
    },//端点的色彩样式
    //anchor: "AutoDefault",
    isSource: true,    //是否可以拖动(作为连线出发点)
    //connector: ["Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true }],  //连接线的样式种类有[Bezier],[Flowchart],[StateMachine ],[Straight ]
    connector: ["Flowchart", { curviness:100 } ],//设置连线为贝塞尔曲线
    isTarget: true,    //是否可以放置(连线终点)
    maxConnections: -1,    // 设置连接点最多可以连接几条线
    // connectorOverlays: [["Arrow", { width: 10, length: 10, location: 1 }]]
};

//设置线条展现方式为Straight
function setLineStraight(){hollowCircle['connector'][0]='Straight';}

//设置线条展现方式为Bezier
function setLineBezier(){hollowCircle['connector'][0]='Bezier';}

//设置线条展现方式为Flowchart
function setLineFlowchart(){hollowCircle['connector'][0]='Flowchart';}

//灵活设置线条表现方式,参数type只能为Straight|Bezier|Flowchart
function setChartLineType(type){hollowCircle['connector'][0]=type;}

//*********************************jsPlumb基础信息配置区域*********************************

//*********************************流程图数据操作区域*********************************
var list=[];//全部的连接点列表

//生成单个流程图数据,用在新建流程图框时使用
//参数ID表示被push进栈的ID
function getSingleChartJson(id){

    var connects=[];
    
    for(var i in list){
        for(var j in list[i]){
            connects.push({
                ConnectionId:list[i][j]['id'],
                PageSourceId:list[i][j]['sourceId'],
                PageTargetId:list[i][j]['targetId']
            });
        }
    }

    var blocks=[];
    var elem=$("#"+id);
    var rareHTML=elem.html();
    var resultHTML=rareHTML;
    //console.log(rareHTML);
    //去掉在进行复制操作时误复制的img部件
    if(rareHTML.indexOf('<img src=\"img/delete.png\"')!=-1){
        rareHTML=rareHTML.split('<img src=\"img/delete.png\"');
        resultHTML=rareHTML[0];
    }

    if(resultHTML.indexOf('<div style="z-index: 90;" ')!=-1){
        resultHTML=resultHTML.split('<div style="z-index: 90;" ')[0];
    }

    /**********************字体**********************/
        //圆角
    var borderRadius=elem.css('borderRadius');
    var elemType=id.split('-')[0];
    (borderRadius=='') ? borderRadius='0':borderRadius;
    //如果当前部件是圆角矩形,且borderRadius为空或者为0就把默认borderradius设置为4,下同
    (elemType=='roundedRect' && (borderRadius=='' || borderRadius=='0')) ? borderRadius='4':borderRadius;
    (elemType=='circle' && (borderRadius=='' || borderRadius=='0')) ? borderRadius='15':borderRadius;
    //填充
    var fillColor=elem.css('backgroundColor');
    (fillColor=='') ? fillColor='rgb(255,255,255)':fillColor;
    //线框样式
    var borderStyle=elem.css('border-left-style');
    (borderStyle=='') ? borderStyle='solid':borderStyle;
    //线框宽度
    var borderWidth=elem.css('border-left-width');
    (borderWidth=='') ? borderWidth='2':borderWidth.split('px')[0];
    //线框颜色
    var borderColor=elem.css('border-left-color');
    (borderColor=='') ? borderColor='rgb(136,242,75)':borderColor;

    blocks.push({
        BlockId:elem.attr('id'),
        BlockContent:resultHTML,
        BlockX:parseInt(elem.css("left"), 10),
        BlockY:parseInt(elem.css("top"), 10),
        BlockWidth:parseInt(elem.css("width"),10),
        BlockHeight:parseInt(elem.css("height"),10),
        BlockBorderRadius:borderRadius,
        BlockBackground:fillColor,
        BlockBorderStyle:borderStyle,
        BlockBorderWidth:borderWidth,
        BlockborderColor:borderColor,
    });

    var serliza="{"+'"connects":'+JSON.stringify(connects)+',"block":'+JSON.stringify(blocks)+"}";
    console.log(serliza);
    return serliza;
}

//删除一个流程框图,若参数undo为true则在进行操作时不进行入栈操作,默认为false
function deleteChart(id,undo){
    undo=(undo=='') ? false:'';
    var DOM=$('#'+id);
    if(undo==false){
        chartOperationStack['delete'].push(getSingleChartJson(id));
    }
    jsPlumb.removeAllEndpoints(id);
    DOM.remove();
    if(undo==false){
        chartRareOperationStack.push('delete');
    }
}

//设置流程框图宽度,如果当前选择的部件为none则默认改变全局,下同
function setChartDesignWidth(width){
    if(sessionStorage['currentChartSelected']=='none'){
        $('.new-circle,.new-rhombus,.new-roundedRect,.new-rect').css('width',width);
    }else{
        $('#'+sessionStorage['currentChartSelected']).css('width',width);
    }
}

//设置流程框图高度
function setChartDesignHeight(height){
    if(sessionStorage['currentChartSelected']=='none'){
        $('.new-circle,.new-rhombus,.new-roundedRect,.new-rect').css('height',height);
    }else{
        $('#'+sessionStorage['currentChartSelected']).css('height',height);
    }
}

//设置流程框图top
function setChartDesignTop(top){
    if(sessionStorage['currentChartSelected']=='none'){
        $('.new-circle,.new-rhombus,.new-roundedRect,.new-rect').css('top',top);
    }else{
        $('#'+sessionStorage['currentChartSelected']).css('top',top);
    }
}

//设置流程框图left
function setChartDesignLeft(left){
    if(sessionStorage['currentChartSelected']=='none'){
        $('.new-circle,.new-rhombus,.new-roundedRect,.new-rect').css('left',left);
    }else{
        $('#'+sessionStorage['currentChartSelected']).css('left',left);
    }
}

//设置流程图框的圆角大小
function setChartDesignBorderRadius(radius){
    if(sessionStorage['currentChartSelected']=='none'){
        $('.new-circle,.new-rhombus,.new-roundedRect,.new-rect').css('border-top-left-radius',radius);
    }else{
        $('#'+sessionStorage['currentChartSelected']).css('border-top-left-radius',radius);
    }
}

//设置流程图框的线样式
function setChartDesignBorderWidthStyle(style){
    if(sessionStorage['currentChartSelected']=='none'){
        $('.new-circle,.new-rhombus,.new-roundedRect,.new-rect').css('border-width',style);
    }else{
        $('#'+sessionStorage['currentChartSelected']).css('border-width',style);
    }
}



//*********************************流程图数据操作区域*********************************

$(document).ready(function(){

    //**************************************UI控制部分***************************************

    //初始化动画效果
    $('.chart-ratio-form,.chart-fill-border-selector,#chart-v-shadow-display,#chart-h-shadow-display,#chart-blur-range-display,#chart-shadow-blur-display,#chart-shadow-color-display,#chart-shadow-spread-display').css("opacity",'0.6');

    //隐藏右侧属性面板
    //$('.chart-right-panel').hide();




    //**************************************UI控制部分***************************************

    //***********************************元素拖动控制部分************************************

    //允许元素拖动
    $(".list-content .area").children().draggable({
        //revert: "valid",//拖动之后原路返回
        helper: "clone",//复制自身
        scope: "dragflag"//标识
    });

    $(".droppable").droppable({
        accept: ".draggable", //只接受来自类.dragable的元素
        activeClass:"drop-active", //开始拖动时放置区域显示
        scope: "dragflag",
        // 右侧拖动元素
        drop:function(event,ui){
            sessionStorage['idIndex']=sessionStorage['idIndex']+1;

            //获取鼠标坐标
            
            var left=parseInt(ui.offset.left-$(this).offset().left);
            var top=parseInt(ui.offset.top-$(this).offset().top)+4;

            var domWidth=$(window).width();
            var designWidth=domWidth-$('.chart-right-panel').width() - 50;

            if(left > designWidth){
                left = designWidth;
            }

            setChartLocation(top,left);//设置坐标

            var name=ui.draggable[0].id;//返回被拖动元素的ID
            var trueId=name+"-"+sessionStorage['idIndex']+sessionStorage['currentChartAmount'];

            //在div内append元素
            $(this).append("<div class=\"draggable "+name+" new-"+name+"\" id=\""+trueId+"\">"+$(ui.helper).html()+"</div>");
            $("#"+trueId).css("left",left).css("top",top).css("position","absolute").css("margin","0px");

            //用jsPlumb添加锚点
            // jsPlumb.addEndpoint(trueId,{anchors: "TopCenter"},hollowCircle);
            jsPlumb.addEndpoint(trueId,{anchors: "RightMiddle"},hollowCircle);
            // jsPlumb.addEndpoint(trueId,{anchors: "BottomCenter"},hollowCircle);
            jsPlumb.addEndpoint(trueId,{anchors: "LeftMiddle"},hollowCircle);

            jsPlumb.draggable(trueId);
            $("#"+trueId).draggable({containment: "parent"});//保证拖动不跨界

            // changeValue("#"+trueId);

            list=jsPlumb.getAllConnections();//获取所有的连接
            console.log(list);

            //元素ID网上加,防止重复
            sessionStorage['idIndex']=sessionStorage['idIndex']+1;

            //设置当前选择的流程框图
            sessionStorage['currentChartSelected']=trueId;

            //将新拖进来的流程图框JSON数据push进栈
            chartOperationStack['add'].push(getSingleChartJson(trueId));
            chartRareOperationStack.push('add');

            sessionStorage['currentChartAmount']=parseInt(sessionStorage['currentChartAmount'],10)+2;
        }
    });

    $('.droppable .draggable').resizable({
        ghost: true
    });


    $('.droppable').on('dblclick',function(){
        console.log("db");
        sessionStorage['currentChartSelected']='none';//置当前选择的流程图框为空
        $('#B,#I,#U').removeClass('fl-font-style-active');//置当前字体样式选择器为空
        $('#btn-align-center,#btn-align-left,#btn-align-right,#btn-align-none').removeClass('fl-align-style-active');//置当前对齐方式为空
    });

    //*****************右侧属性面板内容改变同步到设计区域******************

    ////////预加载
    jQuery(function($){
        txtValue=$(".chart-location-form").val();
        ////////    给txtbox绑定键盘事件
        $(".chart-location-form").bind("keydown",function(){
            var currentValue=$(this).val();
            var currentID=$(this).attr('id');
            if(currentValue!=txtValue){
                switch(currentID){
                    case 'chart-font-display'://字体
                        setChartDesignFont(currentValue);
                        break;
                    case 'chart-font-size-display'://字体大小
                        setChartDesignFontSize(currentValue*10);
                        break;
                    case 'chart-align-display'://字体对齐样式
                        setChartDesignFontAlign(currentValue);
                        break;
                    case 'chart-font-color-display'://字体颜色
                        setChartDesignFontColor(currentValue);
                        break;
                    case 'lo-x-display'://top
                        setChartDesignTop(currentValue*10);
                        break;
                    case 'lo-y-display'://left
                        setChartDesignLeft(currentValue*10);
                        break;
                    case 'chart-width-display'://宽度
                        setChartDesignWidth(currentValue*10);
                        break;
                    case 'chart-height-display'://高度
                        setChartDesignHeight(currentValue*10);
                        break;
                    case 'chart-border-display'://框线style
                        setChartDesignBorderRadius(currentValue);
                        break;
                    case 'chart-fill-border-width-display'://框线粗细
                        setChartDesignBorderWidthStyle(currentValue);
                        break;
                    case 'chart-fill-border-color-display'://框线颜色
                        setChartDesignBorderColorStyle(currentValue);
                        break;
                    case 'chart-font-height-display'://文字高度
                        setChartDesignLineHeight(currentValue);
                        break;
                    case 'chart-font-height-display'://文字间距
                        setChartDesignLetterSpacing(currentValue);
                        break;
                    default:
                        break;
                }
            }
        });
    });

    //*****************右侧属性面板内容改变同步到设计区域******************

    jsPlumb.bind("mouseenter",function (e,callback) {
        
       alert("on");
    });

    //删除连接线
    jsPlumb.bind("click",function(conn,originalEvent){
        
        if(confirm("确定删除吗?")){
            jsPlumb.detach(conn);
        }
    });

    //DOCUMENT快捷键操作
    $(document).on("keydown", function(event){
        if(event.ctrlKey && event.which==90){
            //按下 CTRL+Z 进行撤销操作
            var rareOperation=chartRareOperationStack.pop();//取出用户最近一次的操作
            var operationJSON=chartOperationStack[rareOperation].pop();//根据用户最后一次进行的操作弹出最近一次的流程框图数据
            operationJSON=JSON.parse(operationJSON);
            var chartOperationData=operationJSON['block'][0];
            switch(rareOperation){
                case 'delete':
                    //用户操作为删除,撤销操作为添加
                    addNewChart('.chart-design',chartOperationData['BlockId']+sessionStorage['idIndex']+sessionStorage['currentChartAmount'],chartOperationData['BlockX'],chartOperationData['BlockY'],chartOperationData['BlockContent'],true);
                    break;
                case 'add':
                    //用户操作为添加,撤销操作为删除
                    deleteChart(chartOperationData['BlockId'],true);
                    break;
                case 'paste':
                    //用户操作为粘贴,撤销操作为删除
                    deleteChart(chartOperationData['BlockId'],true);
                    break;
            }
        }
        if(event.ctrlKey && event.which==67){
            //CTRL+C 进行复制部件操作
            if(sessionStorage['currentChartSelected']!='none'){
                chartOperationStack['copy'].push(getSingleChartJson(sessionStorage['currentChartSelected']));
                //console.log(sessionStorage['currentChartSelected']);
                chartRareOperationStack.push('copy');
            }
        }
        if(event.ctrlKey && event.which==86){
            //CTRL+V 进行粘贴部件操作
            var chartCopiedJson=chartOperationStack['copy'][chartOperationStack['copy'].length-1];

            var unpack=JSON.parse(chartCopiedJson);
            var chartBlockObj=unpack['block'][0];
            var chartPastedID=chartBlockObj['BlockId']+sessionStorage['idIndex'];//设置被粘贴部件的新ID

            var BlockContent=chartBlockObj['BlockContent'];
            var BlockX=chartBlockObj['BlockX'];
            var BlockY=chartBlockObj['BlockY'];
            var width=chartBlockObj['BlockWidth'];
            var height=chartBlockObj['BlockHeight'];
            var font=chartBlockObj['BlockFont'];
            var fontSize=chartBlockObj['BlockFontSize'];
            var fontAlign=chartBlockObj['BlockFontAlign'];
            var fontColor=chartBlockObj['BlockFontColor'];
            var borderRadius=chartBlockObj['BlockBorderRadius'];
            var backgroundColor=chartBlockObj['BlockBackground'];
            var fillBlurRange=chartBlockObj['BlockFillBlurRange'];
            var fillBlurColor=chartBlockObj['BlockFillBlurColor'];
            var borderStyle=chartBlockObj['BlockBorderStyle'];
            var borderColor=chartBlockObj['BlockborderColor'];
            var shadow=chartBlockObj['BlockShadow'];
            var fontStyle=chartBlockObj['BlockFontStyle'];
            var fontWeight=chartBlockObj['BlockFontWeight'];
            var fontUnderline=chartBlockObj['BlockFontUnderline'];
            var lineHeight=chartBlockObj['BlockLineHeight'];

            var blockAttr=chartPastedID.split('-')[0];

            var boxInsetShadowStyle='10px 10px '+fillBlurRange+"px 20px "+fillBlurColor+' inset';

            if(unpack['connects'].length==0){
                addNewChart('.chart-design',chartPastedID,chartBlockObj['BlockX'],chartBlockObj['BlockY']-20,chartBlockObj['BlockContent']);
                $("#"+chartPastedID)
                    .css("left",BlockX)
                    .css("top",BlockY)
                    .css("position","absolute")
                    .css("margin","0px")
                    .css("width",width)
                    .css("height",height)
                    .css('font',font)
                    .css('font-size',fontSize)
                    .css('text-align',fontAlign)
                    .css('color',fontColor)
                    .css('border-radius',borderRadius)
                    .css('background',backgroundColor)
                    .css('box-shadow',boxInsetShadowStyle)
                    .css('border-style',borderStyle)
                    .css('border-color',borderColor)
                    .css('box-shadow',shadow)
                    .css('font-style',fontStyle)
                    .css('font-weight',fontWeight)
                    .css('font-underline',fontUnderline)
                    .css('line-height',lineHeight);
            }else{

            }
            unpack['block'][0]['BlockId']=chartPastedID;
            chartOperationStack['paste'].push(JSON.stringify(unpack));
            chartRareOperationStack.push('paste');
        }
        if(event.which==46){
            //DELETE 进行删除部件操作
            if(sessionStorage['currentChartSelected']!='none'){
                if(confirm("确定要删除吗?")){
                    deleteChart(sessionStorage['currentChartSelected']);
                    setChartLocation(0,0);
                    setChartSize(0,0);
                }
            }
        }
    });

    //点击空白处或者自身隐藏弹出层，下面分别为滑动和淡出效果。
    $(document).click(function(event){
        $('.line-select').slideUp('fast');
        sessionStorage['topLineSelectIsDisplayed']=false;
        sessionStorage['topAlignSelectIsDisplayed']=false;
    });

    //设置style
    function setEnvironmentStyle(styleName){
        switch(styleName){
            case 'entertainment':
                console.log(styleName);
                $('.droppable').css('background','rgb(173,219,225)');
                break;
            case 'enterprises':
                $('.droppable').css('background','rgb(255,255,255)');
                break;
            case 'blue':
                $('.droppable').css('background','rgb(255,235,190)');
                break;
            case 'dark':
                $('.droppable').css('background','rgb(6,1,0)');
                break;
            case 'pink':
                $('.droppable').css('background','rgb(127,0,185)');
                break;
        }
    }

    //选择相应的style
    $('.right-style-selector').click(function(){
        var styleName=$(this).attr('id').split('-')[1];
        setEnvironmentStyle(styleName);
    });

    //***********************************元素拖动控制部分************************************
});


    $(".draggable").draggable({
        start:function(){
            // console.log('start');
        },
        drag:function(){
            // console.log('drag');
        },
        stop:function(){
            // console.log('stop');
        }
    });

    //删除元素按钮
    // $(".droppable").on("mouseenter",".draggable",function(){
    //     $(this).append("<img src=\"img\/delete.png\" id=\"fuck\" style=\"position:absolute;width:20px;height:16px;\"/>");
    //
    //     //因为流程图的形状不一样,所以要获取特定的流程图名称来指定删除按钮的位置
    //     var wholeID=$(this).attr('id');
    //     var wholeIDSep=wholeID.split('-');
    //
    //     if(wholeIDSep[0]=="circle") {
    //         $("img").css("left", $(this).width()-20).css("top", 20);
    //     }else if(wholeIDSep[0]=="rhombus"){
    //         $("img").css("left", $(this).width()-18).css("top", 10);
    //     }else{
    //         $("img").css("left", $(this).width()-20).css("top", 10);
    //     }
    // });

    // $(".droppable").on("mouseleave",".draggable",function(){
    //     $("img").remove();
    // });

    // $(".droppable").on("click","img",function(){
    //     //要先保存父元素的DOM,因为出现确认对话框之后(this)会消失
    //     var parentDOM=$(this).parent();
    //     var parentID=parentDOM.attr('id');
    //     if(confirm("确定要删除吗?")) {
    //         chartOperationStack['delete'].push(getSingleChartJson(parentID));
    //         jsPlumb.removeAllEndpoints(parentID);
    //         parentDOM.remove();
    //         chartRareOperationStack.push('delete');
    //     }
    // });
    //删除元素按钮
    //设计区域被双击时

    function getMousePos(event) {
        var e = event || window.event;
        return {'x':e.screenX,'y':screenY}
    }

    $(document).on('drag','._jsPlumb_connector ',function () {
       alert("1");
    });


    //序列化全部流程图数据,json格式
    function saveConnection() {
        var obj = {};
        var connects=[];
        // console.log(jsPlumb.getAllConnections());

        for(var i in list){
            for(var j in list[i]){
                connects.push({
                    ConnectionId:list[i][j]['id'],
                    PageSourceId:list[i][j]['sourceId'],
                    PageTargetId:list[i][j]['targetId']
                });
            }
        }
        obj['connects'] = connects;
        return JSON.stringify(obj);
    }
    function save(){
        var obj = {};
        var blocks=[];
        $(".droppable .draggable").each(function(idx, elem){
            var elem=$(elem);
            var rareHTML=elem.html();
            var resultHTML=rareHTML;
            //去掉在进行复制操作时误复制的img部件
            if(rareHTML.indexOf('<img src=\"img/delete.png\"')!=-1){
                rareHTML=rareHTML.split('<img src=\"img/delete.png\"');
                resultHTML=rareHTML[0];
            }

            if(resultHTML.indexOf('<div style="z-index: 90;" ')!=-1){
                resultHTML=resultHTML.split('<div style="z-index: 90;" ')[0];
            }

            /**********************字体**********************/
                //圆角
            var borderRadius=elem.css('borderRadius');
            var elemType=elem.attr('id').split('-')[0];
            (borderRadius=='') ? borderRadius='0':borderRadius;
            //如果当前部件是圆角矩形,且borderRadius为空或者为0就把默认borderradius设置为4,下同
            (elemType=='roundedRect' && (borderRadius=='' || borderRadius=='0')) ? borderRadius='4':borderRadius;
            (elemType=='circle' && (borderRadius=='' || borderRadius=='0')) ? borderRadius='15':borderRadius;
            //填充
            var fillColor=elem.css('backgroundColor');
            (fillColor=='') ? fillColor='rgb(255,255,255)':fillColor;
            // // //渐近度
            // var fillBlurRange=elem.css('boxShadow');//rgb(0, 0, 0) 10px 10px 17px 20px inset
            // var fillBlurSplit=fillBlurRange.split(' ');
            // (fillBlurRange=='') ? fillBlurRange='0':fillBlurRange=fillBlurSplit[5];
            // //渐近色
            // var fillBlurColor=fillBlurSplit[0]+fillBlurSplit[1]+fillBlurSplit[2];
            //线框样式
            var borderStyle=elem.css('border-left-style');
            (borderStyle=='') ? borderStyle='solid':borderStyle;
            //线框宽度
            var borderWidth=elem.css('border-left-width');
            (borderWidth=='') ? borderWidth='2':borderWidth.split('px')[0];
            //线框颜色
            var borderColor=elem.css('border-left-color');
            (borderColor=='') ? borderColor='rgb(136,242,75)':borderColor;

            //阴影数据
            var shadow=elem.css('box-shadow');


            blocks.push({
                BlockId:elem.attr('id'),
                BlockContent:resultHTML,
                BlockX:parseInt(elem.css("left"), 10),
                BlockY:parseInt(elem.css("top"), 10),
                BlockWidth:parseInt(elem.css("width"),10),
                BlockHeight:parseInt(elem.css("height"),10),
                BlockBorderRadius:borderRadius,
                BlockBackground:fillColor,
                // BlockFillBlurRange:fillBlurRange,
                // BlockFillBlurColor:fillBlurColor,
                BlockBorderStyle:borderStyle,
                BlockBorderWidth:borderWidth,
                BlockborderColor:borderColor
            });

        });

       obj['block'] = blocks;
        return JSON.stringify(obj);
    }

    // var dataJson = '{"connects":[{"ConnectionId":"con_12","PageSourceId":"rect-010","PageTargetId":"roundedRect-01112"}],"block":[{"BlockId":"rect-010","BlockContent":"","BlockX":498,"BlockY":108,"BlockWidth":40,"BlockHeight":20,"BlockBorderRadius":"0px","BlockBackground":"rgb(255, 255, 255)","BlockBorderStyle":"solid","BlockBorderWidth":"2px","BlockborderColor":"rgb(0, 0, 0)"},{"BlockId":"roundedRect-01112","BlockContent":"","BlockX":740,"BlockY":110,"BlockWidth":40,"BlockHeight":20,"BlockBorderRadius":"8px","BlockBackground":"rgb(255, 255, 255)","BlockBorderStyle":"solid","BlockBorderWidth":"2px","BlockborderColor":"rgb(0, 0, 0)"}]}';
    var dataJson;
    var dataxml1;
    var dataxml2;
    $('#export').on('click',function () {
       dataJson = save();
        // dataxml1 = fnJson2xml(saveConnection());
        // dataxml2 = fnJson2xml(save());
    });
    $('#import').on('click',function () {
        // console.log(dataxml1);
        // console.log(dataxml2);
        // console.log(fnXml2json(dataxml1));
        // Xml2Json(dataxml2)
       loadChartByJSON(dataJson);
    });
    //通过json加载流程图
    function loadChartByJSON(data){
        $('.droppable').html("");
        var unpack=JSON.parse(data);

        if(!unpack){
            return false;
        }
        var flowConnector={
            anchors:["RightMiddle","LeftMiddle"],
            endpoint: ["Dot", { radius: 1 }],  //端点的外形
            connectorStyle: connectorPaintStyle,//连接线的色彩,大小样式
            connectorHoverStyle: connectorHoverStyle,
            paintStyle: {
                strokeStyle: "rgb(0,0,0)",
                fillStyle: "rgb(0,0,0)",
                opacity: 0.5,
                radius: 1,
                lineWidth: 1
            },//端点的色彩样式
            isSource: true,    //是否可以拖动(作为连线出发点)
            connector: ["Flowchart", { curviness:100 } ],//设置连线为贝塞尔曲线
            isTarget: true,    //是否可以放置(连线终点)
            maxConnections: -1,    // 设置连接点最多可以连接几条线
        };

        for(var i=0;i<unpack['block'].length;i++){
            var BlockId=unpack['block'][i]['BlockId'];
            var BlockContent=unpack['block'][i]['BlockContent'];
            var BlockX=unpack['block'][i]['BlockX'];
            var BlockY=unpack['block'][i]['BlockY'];
            var width=unpack['block'][i]['BlockWidth'];
            var height=unpack['block'][i]['BlockHeight'];
            var borderRadius=unpack['block'][i]['BlockBorderRadius'];
            var backgroundColor=unpack['block'][i]['BlockBackground'];
            var borderStyle=unpack['block'][i]['BlockBorderStyle'];
            var borderColor=unpack['block'][i]['BlockborderColor'];

            var blockAttr=BlockId.split('-')[0];


            $('.chart-design').append("<div class=\"draggable "+blockAttr+" new-"+blockAttr+"\" id=\""+BlockId+"\">"+BlockContent+"</div>");
            $("#"+BlockId)
                .css("left",BlockX)
                .css("top",BlockY)
                .css("position","absolute")
                .css("margin","0px")
                .css("width",width)
                .css("height",height)
                .css('border-radius',borderRadius)
                .css('background',backgroundColor)
                .css('border-style',borderStyle)
                .css('border-color',borderColor)
        }
        debugger;
        for(var i=0;i<unpack['connects'].length;i++) {
            var ConnectionId = unpack['connects'][i]['ConnectionId'];
            var PageSourceId = unpack['connects'][i]['PageSourceId'];
            var PageTargetId = unpack['connects'][i]['PageTargetId'];

            //用jsPlumb添加锚点
            // jsPlumb.addEndpoint(PageSourceId,{anchors: "TopCenter"},hollowCircle);
            jsPlumb.addEndpoint(PageSourceId, {anchors: "RightMiddle"}, hollowCircle);
            // jsPlumb.addEndpoint(PageSourceId,{anchors: "BottomCenter"},hollowCircle);
            jsPlumb.addEndpoint(PageSourceId, {anchors: "LeftMiddle"}, hollowCircle);

            // jsPlumb.addEndpoint(PageTargetId,{anchors: "TopCenter"},hollowCircle);
            jsPlumb.addEndpoint(PageTargetId, {anchors: "RightMiddle"}, hollowCircle);
            // jsPlumb.addEndpoint(PageTargetId,{anchors: "BottomCenter"},hollowCircle);
            jsPlumb.addEndpoint(PageTargetId, {anchors: "LeftMiddle"}, hollowCircle);

            jsPlumb.draggable(PageSourceId);
            jsPlumb.draggable(PageTargetId);

            $("#" + PageSourceId).draggable({containment: "parent"});//保证拖动不跨界
            $("#" + PageTargetId).draggable({containment: "parent"});//保证拖动不跨界

            jsPlumb.connect({
                    source: PageSourceId, target: PageTargetId
                },flowConnector);
        }

        return true;
    }

    $("._jsPlumb_endpoint").on("click",function (e) {
        console.log($(this).sibling(".draggable")[0].id);
    });


    function fnJson2xml(data){
        var xotree = new XML.ObjTree();
        // var jsonText = document.getElementById("json").value;
//将json字符串转为json对象后转为xml字符串
        var json = eval("(" + data + ")");
        var xml = xotree.writeXML(json);
        //使用jkl-dumper.js中的formatXml方法将xml字符串格式化
        var xmlText = formatXml(xml);
        return xmlText;
        // document.getElementById("xml").value = xmlText;
    }

    function Xml2Json(data) {
        //创建文档对象
        var parser=new DOMParser();
        var xmlDoc=parser.parseFromString(data,"text/xml");
        var obj = {};
        //提取数据
        var nodes2 = xmlDoc.getElementsByTagName('block');
        debugger;
        var arr2 =  xmlOne(nodes2);
        obj['block'] = arr2;
        console.log(obj);
    }

    function xmlOne(nodes) {
        debugger;
        var arr = [];
        for (var i = 0; i < nodes.length; i++) {
            var arr1 = {};
            for(var j= 0;j<nodes[i].children.length;j++){
                var cname = nodes[i].children[j].nodeName;
                arr1[cname] = nodes[i].children[j].textContent;
            }
            arr.push(arr1);
        };
        return arr;
    }

    function fnXml2json(data){
        //将xml字符串转为json
        debugger;
        var xotree = new XML.ObjTree();
        // var xmlText = document.getElementById("xml").value;
        var json = xotree.parseXML(data);
        //将json对象转为格式化的字符串
        var dumper = new JKL.Dumper();
        var jsonText = dumper.dump(json);
        return jsonText;
        // document.getElementById("json").value = jsonText;
    }