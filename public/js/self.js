

//根蒂根基连接线样式
var connectorPaintStyle = {
    lineWidth: 2,
    strokeStyle: "rgb(0,0,0)",
    joinstyle: "round",
    outlineColor: "rgb(0,0,0)",
    outlineWidth: 0
};

// 鼠标悬浮在连接线上的样式
var connectorHoverStyle = {
    lineWidth: 2,
    strokeStyle: "#000000",
    outlineWidth: 0,
    outlineColor: "rgb(0,0,0)"
};

var hollowCircle = {
    endpoint: ["Dot", { radius: 0.5 }],  //端点的外形
    connectorStyle: connectorPaintStyle,//连接线的色彩,大小样式
    connectorHoverStyle: connectorHoverStyle,
    paintStyle: {
        strokeStyle: "rgb(0,0,0)",
        fillStyle: "rgb(0,0,0)",
        opacity: 0.5,
        // radius: 1,
        lineWidth: 2,
        outlineWidth:0
    },//端点的色彩样式
    //anchor: "AutoDefault",
    isSource: true,    //是否可以拖动(作为连线出发点)
    //connector: ["Flowchart", { stub: [40, 60], gap: 10, cornerRadius: 5, alwaysRespectStubs: true }],  //连接线的样式种类有[Bezier],[Flowchart],[StateMachine ],[Straight ]
    connector: ["Flowchart", { curviness:100 } ],//设置连线为贝塞尔曲线
    isTarget: true,    //是否可以放置(连线终点)
    maxConnections: -1,    // 设置连接点最多可以连接几条线
    // connectorOverlays: [["Arrow", { width: 10, length: 10, location: 1 }]]
};

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
// 规定行高，来计算中心线位置
var LINE_HEIGHT = window.R.gridWidth;
var DIV_HEIGHT = 40;

//记录当前流程框的数量
sessionStorage['currentChartAmount']=0;

//指定流程图设计区域宽度高度
function adjustDesignWidth(){
    var designWidth=0;
    var domWidth=$(window).width();
    designWidth=domWidth-$('.chart-right-panel').width();
    $('.chart-design').css('width',designWidth-24);
}

function toDelete(obj) {
    debugger;
    var parentDOM=$(obj);
    var parentID=parentDOM.attr('id');
    if(confirm("确定要删除吗?")) {
        chartOperationStack['delete'].push(getSingleChartJson(parentID));
        jsPlumb.removeAllEndpoints(parentID);
        chartRareOperationStack.push('delete');
    }
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

//生成单个流程图部件数据,用在新建流程图框时使用
//参数ID表示被push进栈的ID
//    获取当前部件的所有参数、包括连线和部件尺寸大小形状
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
    // 部件所有属性
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
    // console.log(serliza);
    return serliza;
}
    //新增一个部件
    //参数newChartArea代表新增部件的区域
    //参数chartID代表新流程图部件的ID,格式为元素名称-index
    //参数left,top代表新部件的插入位置
    //参数blockName代表新部件的文本
    //参数undo表示是否进行撤销操作,如果进行撤销操作则不进行入栈,默认为false
    function addNewChart(newChartArea,chartID,left,top,blockName,undo){
        alert("add");
        undo=(undo=='') ? false:arguments[5];

        var name=chartID.split('-')[0];

        //在div内append元素
        $(newChartArea).append("<div class=\"draggable "+name+" new-"+name+"\" id=\""+chartID+"\" ondblclick=\"toDelete(this)\"><img style='width: 100%;height: 100%' src='./img/test.svg'/>"+"</div>");
        $("#"+chartID).css("left",left).css("top",top).css("position","absolute").css("margin","0px");

        //用jsPlumb添加锚点
        jsPlumb.addEndpoint(chartID,{anchors: "TopCenter"},hollowCircle);
        jsPlumb.addEndpoint(chartID,{anchors: "RightMiddle"},hollowCircle);
        jsPlumb.addEndpoint(chartID,{anchors: "BottomCenter"},hollowCircle);
        jsPlumb.addEndpoint(chartID,{anchors: "LeftMiddle"},hollowCircle);

        jsPlumb.draggable(chartID);
        $("#"+chartID).draggable({containment: "parent"});//保证拖动不跨界

        sessionStorage['idIndex']=sessionStorage['idIndex']+1;

        changeValue("#"+chartID);

        if(undo==false){
            chartOperationStack['add'].push(getSingleChartJson(chartID));
            chartRareOperationStack.push('add');
        }
    }
//删除一个流程框部件图,若参数undo为true则在进行操作时不进行入栈操作,默认为false
function deleteChart(id,undo){
    undo=(undo=='') ? false:'';
    var $DOM=$('#'+id);
    if(undo==false){
        // 把以删除数据放入栈中以便复原
        chartOperationStack['delete'].push(getSingleChartJson(id));
    }
    jsPlumb.removeAllEndpoints(id);
    $DOM.remove();
    if(undo==false){
        // 记录上一步操作
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
    var Index = 4;
    var url = window.R.url;
    var socket = io.connect(url);
    socket.emit("getInfo");
    socket.on('userInfo',function (data) {
        console.log(data.userList);
        $("#number").html("当前在线的人数为："+data.number);
    });

    socket.on('drag_start',function (data) {
        var user_name = sessionStorage.getItem("username");
        if(data.name!==user_name){
            window.R.is_dragging = data.id;
            window.R.user_name = data.name;
        }
        $("#dragInfo").html("当前"+data.name+"正在拖动的是"+data.id);
    });

    socket.on('stop_div',function () {
        window.R.is_dragging = '';
        window.R.user_name = '';
    });

    socket.on('drawDiv',function (data) {
        var top = data.top;
        var left = data.left;
        var index = data.id;
        var name = data.name;
        var trueId = name+"-"+index;
        var user_name = sessionStorage.getItem("username");
        var helper = data.helper;
        var obj = $("#chart-content");
        if(user_name!== data.user_name){
            setChartLocation(top,left);//设置坐标
            //在div内append元素 helper-被拖拽的对象
            $(obj).append("<div class=\"draggable "+name+" new-"+name+"\" id=\""+trueId+"\">"+helper+"</div>");
            $("#"+trueId).css("left",left).css("top",top).css("position","absolute").css("margin","0px");
            var onePointArr = ['parentheses','circle'];
            if(onePointArr.indexOf(name)===-1){
                jsPlumb.addEndpoint(trueId,{anchors: "RightMiddle"},hollowCircle);
            }
            jsPlumb.addEndpoint(trueId,{anchors: "LeftMiddle"},hollowCircle);
            jsPlumb.draggable(trueId);
            $("#"+trueId).draggable({containment: "parent"});//保证拖动不跨界,只能在父容器中移动
            sessionStorage['idIndex']=index+1;
        }
    });

    socket.on('draw_stop',function (data) {
        debugger;
        var PageSourceId = data.sId;
        var PageTargetId = data.tId;
        var anchorPos = data.aPos;
        var flowConnector={
            anchors:anchorPos,
            endpoint: ["Dot", { radius: 1 }],  //端点的外形
            connectorStyle: connectorPaintStyle,//连接线的色彩,大小样式
            connectorHoverStyle: connectorHoverStyle,
            paintStyle: {
                strokeStyle: "rgb(0,0,0)",
                fillStyle: "rgb(0,0,0)",
                opacity: 0.5,
                radius: 1,
                lineWidth: 2,
                outlineWidth:0
            },//端点的色彩样式
            isSource: true,    //是否可以拖动(作为连线出发点)
            connector: ["Flowchart", { curviness:100 } ],//设置连线为贝塞尔曲线
            isTarget: true,    //是否可以放置(连线终点)
            maxConnections: -1,    // 设置连接点最多可以连接几条线
        };

        jsPlumb.connect({
            source: PageSourceId, target: PageTargetId
        },flowConnector);
    });

    socket.on('side_add',function () {
        debugger;
        drawSide();
    })
    //**************************************UI控制部分***************************************

    //初始化动画效果
    $('.chart-ratio-form,.chart-fill-border-selector,#chart-v-shadow-display,#chart-h-shadow-display,#chart-blur-range-display,#chart-shadow-blur-display,#chart-shadow-color-display,#chart-shadow-spread-display').css("opacity",'0.6');

    //隐藏右侧属性面板
    //$('.chart-right-panel').hide();




    //**************************************UI控制部分***************************************

    //***********************************元素拖动控制部分************************************

    //允许元素拖动
    //启用 JQuery的draggable 功能
    $(".list-content .area").children().draggable({
        //revert: "valid",//拖动之后原路返回
        helper: "clone",//复制自身被拖动
        scope: "dragflag"//标识 设置元素只允许拖拽到具有相同scope值的droppable元素
    });



    
    $(".droppable").droppable({
        accept: ".draggable", //只接受来自类.draggable的元素
        activeClass:"drop-active", //开始拖动时放置区域讲添加该类名
        scope: "dragflag",
        // 当draggable放置在droppable上时触发
        //            Event，Object
        drop:function(event,ui){
            sessionStorage['idIndex']=sessionStorage['idIndex']+1;

            //获取鼠标坐标
            
            var left=parseInt(ui.offset.left-$(this).offset().left);
            var top=parseInt(ui.offset.top-$(this).offset().top)+4;
            // 保证放置后处于“画布”内
            var domWidth=$(window).width();
            var designWidth=domWidth-$('.chart-right-panel').width() - 50;

            if(left > designWidth){
                left = designWidth;
            }

            var order_number = top / LINE_HEIGHT;
            var line = Math.floor(order_number);
            top = line * LINE_HEIGHT +LINE_HEIGHT/2-DIV_HEIGHT/2;

            setChartLocation(top,left);//设置坐标

            var name=ui.draggable[0].id;//返回被拖动元素的ID
            var index = sessionStorage['idIndex'];
                // +sessionStorage['currentChartAmount'];
            var trueId=name+"-"+index;
            //在div内append元素 helper-被拖拽的对象
            $(this).append("<div class=\"draggable "+name+" new-"+name+"\" id=\""+trueId+"\">"+$(ui.helper).html()+"</div>");
            $("#"+trueId).css("left",left).css("top",top).css("position","absolute").css("margin","0px");

            //用jsPlumb添加锚点
            var onePointArr = ['parentheses','circle'];
            if(onePointArr.indexOf(name)===-1){
                jsPlumb.addEndpoint(trueId,{anchors: "RightMiddle"},hollowCircle);
            }
            jsPlumb.addEndpoint(trueId,{anchors: "LeftMiddle"},hollowCircle);

            jsPlumb.draggable(trueId);
            $("#"+trueId).draggable({containment: "parent"});//保证拖动不跨界,只能在父容器中移动

            // changeValue("#"+trueId);

            list=jsPlumb.getAllConnections();//获取所有的连接


            //元素ID网上加,防止重复
            sessionStorage['idIndex']=sessionStorage['idIndex']+1;

            //设置当前选择的流程框图
            sessionStorage['currentChartSelected']=trueId;

            //将新拖进来的流程图框JSON数据push进栈
            chartOperationStack['add'].push(getSingleChartJson(trueId));
            chartRareOperationStack.push('add');

            sessionStorage['currentChartAmount']=parseInt(sessionStorage['currentChartAmount'],10)+2;
            var user_name = sessionStorage.getItem("username");
            socket.emit("newDiv",{left:left,top:top,name:name,trueId:index,user_name:user_name,helper:$(ui.helper).html()});
        }
    });
    // 缩放
    $('.droppable .draggable').resizable({
        // 调整尺寸显示一个半透明的辅助元素
        ghost: true
    });


    // $('.droppable').on('dblclick',function(){
    //     console.log("db");
    //     sessionStorage['currentChartSelected']='none';//置当前选择的流程图框为空
    //     $('#B,#I,#U').removeClass('fl-font-style-active');//置当前字体样式选择器为空
    //     $('#btn-align-center,#btn-align-left,#btn-align-right,#btn-align-none').removeClass('fl-align-style-active');//置当前对齐方式为空
    // });

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
            var borderRadius=chartBlockObj['BlockBorderRadius'];
            var backgroundColor=chartBlockObj['BlockBackground'];
            var borderStyle=chartBlockObj['BlockBorderStyle'];
            var borderColor=chartBlockObj['BlockborderColor'];

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
                    .css('border-radius',borderRadius)
                    .css('background',backgroundColor)
                    .css('box-shadow',boxInsetShadowStyle)
                    .css('border-style',borderStyle)
                    .css('border-color',borderColor)
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

    jsPlumb.addEndpoint('side_1',{anchors: "RightMiddle"},hollowCircle);
    jsPlumb.addEndpoint('side_2',{anchors: "RightMiddle"},hollowCircle);
    jsPlumb.addEndpoint('side_3',{anchors: "RightMiddle"},hollowCircle);
    jsPlumb.addEndpoint('side_4',{anchors: "RightMiddle"},hollowCircle);

    var arr_2d = [];
    var line_width = $('.line_group').eq(0).width();
    var block_num = Math.floor(line_width/window.R.gridWidth);
;    function arr_2d_push(num) {
        arr_2d[num] = [];
        arr_2d[num][0]={size:20,id:'side_'+num};
        for(var i=0;i<block_num;i++){
            arr_2d[num].push([{size:20,id:null}])
        }
    }

    arr_2d_push(1);
    arr_2d_push(2);
    arr_2d_push(3);
    arr_2d_push(4);
    window.R.arr = arr_2d;
    console.log( window.R.arr);

    //***********************************元素拖动控制部分************************************

    function split_string(arg1,arg2) {
        return  (arg1+arg2).toString();
    }

    function drawSide() {
        var $btn = $('#add_button');
        var originId = split_string('side_',Index);
        var linePrev = split_string('line_',Index);
        Index++;
        var id = split_string('side_'+Index);
        var lineId = split_string('line_',Index);
        var sideHtml = '<div class="side-border" id='+id+'>\n' +
            '                <svg xmlns="http://www.w3.org/2000/svg" class="svgForDrag">\n' +
            '                    <path d="M0,0 l0,100Z"\n' +
            '                          class="stroke"/>\n' +
            '                </svg>\n' +
            '            </div>';
        $btn.before('<div class="number_item">'+Index+'</div>');
        $('#'+originId).after(sideHtml);
        $('#'+linePrev).after('<div class="drop_line"  id='+lineId+'></div>');
        jsPlumb.addEndpoint(id,{anchors: "RightMiddle"},hollowCircle);
    }

    $('#add_button').on('click',function () {
        drawSide();
        socket.emit('add_side');
    });
    adjustDesignWidth();
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

        return JSON.stringify(obj);
    }
    function save(){
        var obj = {};
        var connects=[];
        var blocks=[];
        // console.log(jsPlumb.getAllConnections());

        for(var i in list){
            for(var j in list[i]){
                connects.push({
                    ConnectionId:list[i][j]['id'],
                    PageSourceId:list[i][j]['sourceId'],
                    PageTargetId:list[i][j]['targetId'],
                    ConSourcePos:list[i][j]['sourceIdPos'],
                    ConTargetPos:list[i][j]['targetIdPos']
                });
            }
        }
        console.log(connects);
        obj['connects'] = connects;

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
        console.clear();
        console.log("获取的连接:");
        console.log(list);
       dataJson = save();
        // dataxml1 = fnJson2xml(saveConnection());
        // dataxml2 = fnJson2xml(save());
    });
    $('#import').on('click',function () {
        // console.log(dataxml1);
        // console.log(dataxml2);
        // console.log(fnXml2json(dataxml1));
        // Xml2Json(dataxml2)
        <!-- 读取一行内容 -->
        <!-- 读取全部内容 -->
       loadChartByJSON(dataJson);
    });
    //通过json加载流程图
    function loadChartByJSON(data){
        var unpack=JSON.parse(data);

        if(!unpack){
            return false;
        }
        // var anchorPos = [];


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
        for(var i=0;i<unpack['connects'].length;i++) {
            var ConnectionId = unpack['connects'][i]['ConnectionId'];
            var PageSourceId = unpack['connects'][i]['PageSourceId'];
            var PageTargetId = unpack['connects'][i]['PageTargetId'];
            anchorPos = [];
            anchorPos.push(unpack['connects'][i]['ConSourcePos']);
            anchorPos.push(unpack['connects'][i]['ConTargetPos']);
            var flowConnector={
                anchors:anchorPos,
                endpoint: ["Dot", { radius: 1 }],  //端点的外形
                connectorStyle: connectorPaintStyle,//连接线的色彩,大小样式
                connectorHoverStyle: connectorHoverStyle,
                paintStyle: {
                    strokeStyle: "rgb(0,0,0)",
                    fillStyle: "rgb(0,0,0)",
                    opacity: 0.5,
                    radius: 1,
                    lineWidth: 2,
                    outlineWidth:0
                },//端点的色彩样式
                isSource: true,    //是否可以拖动(作为连线出发点)
                connector: ["Flowchart", { curviness:100 } ],//设置连线为贝塞尔曲线
                isTarget: true,    //是否可以放置(连线终点)
                maxConnections: -1,    // 设置连接点最多可以连接几条线
            };
            //用jsPlumb添加锚点
            jsPlumb.addEndpoint(PageSourceId, {anchors: "RightMiddle"}, hollowCircle);
            jsPlumb.addEndpoint(PageSourceId, {anchors: "LeftMiddle"}, hollowCircle);

            jsPlumb.addEndpoint(PageTargetId, {anchors: "RightMiddle"}, hollowCircle);
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