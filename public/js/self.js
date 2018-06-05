// 用作连接判断
$("._jsPlumb_connector ").on("mouseover",function (e) {
    console.log(e.target)
})
//用数组记录下所有连接的组件和连线，用作全局渲染，用比较决定

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
var anchorPos = ['RightMiddle','LeftMiddle'];
var FlowConnector={
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
var LINE_HEIGHT = 50;
var DIV_HEIGHT = 40;
var TD_WIDTH = 100;
var line_width;
var list=[];//全部的连接点列表
//记录当前流程框的数量
sessionStorage['currentChartAmount']=0;

//指定流程图设计区域宽度高度
function adjustDesignWidth(){
    var designWidth=0;
    var domWidth=$(window).width();
    designWidth=domWidth-$('.chart-right-panel').width();
    $('.chart-design').css('width',designWidth-24);
    line_width = designWidth-24;
}
adjustDesignWidth();
var block_num = Math.floor(line_width/window.R.gridWidth);

function init_arr(index){
    var arr = [];
    for(var i=0;i<block_num+1;i++){
        arr.push({size:20,id:null})
    }
    arr.repeated = 0;
    window.R.arr.splice(index,0,arr);
    while(index<window.R.Index){
        var real = index + 1;
        window.R.arr[index][0].id = "side_"+real;
        index++;
    }
}
function init_same_arr(index){
    var arr = [];
    for(var i=0;i<block_num+1;i++){
        arr.push({size:40,id:null})
    }
    arr.repeated = 0;
    window.R.arr.splice(index,0,arr);
}

function drawTwo(size,index) {
    var tmpsize = 10;
    $children = $("side-group").children();
    var id = 'side_'+index;
    var sideHtml = '<div class="side-border" id='+id+'>\n' +
        '                <svg xmlns="http://www.w3.org/2000/svg" class="svgForDrag">\n' +
        '                    <path d="M0,0 l0,50Z"\n' +
        '                          class="stroke"/>\n' +
        '                </svg>\n' +
        '            </div>';
    var twoSideHtml = '<div class="side-border-two">\n' +
        '<div class="side-border" id='+id+'>\n' +
        '                <svg xmlns="http://www.w3.org/2000/svg" class="svgForDrag">\n' +
        '                    <path d="M0,0 l0,50Z"\n' +
        '                          class="stroke"/>\n' +
        '                </svg>\n' +
        '            </div>'+
        '<div class="side-border">\n' +
        '                <svg xmlns="http://www.w3.org/2000/svg" class="svgForDrag">\n' +
        '                    <path d="M0,0 l0,50Z"\n' +
        '                          class="stroke"/>\n' +
        '                </svg>\n' +
        '            </div>'+
        '            </div>';
    if($children.length == 0){
        if(size>tmpsize){
            $("#side-group").append(twoSideHtml);
        }else{
            $("#side-group").append(sideHtml);
        }
    }else{
        var headIndex = index-1;
        var originId = split_string('side_',headIndex);
        if(size>tmpsize){
            $('#'+originId).after(twoSideHtml);
        }else{
            $('#'+originId).after(sideHtml);
        }
    }
    jsPlumb.addEndpoint(id,{anchors: "RightMiddle"},hollowCircle);
}
// 当超出的高度组件出现进行拓展
function extendHeight(th,flag) {
    debugger;
    // 批量做了处理，但要根据数组size来区分是否需要进行操作
    $(".number_item_two").addClass("number_item")
        .removeClass("number_item_two");
    $("#number_"+th).removeClass("number_item")
        .addClass("number_item_two");
    $("#side-group").html("");
    for(var i = 1;i<=window.R.Index;i++){
        if(th.indexOf(i) !== -1){
            console.log(i);
            // 当某行没有被撑高才成撑高
            if(window.R.arr[i-1].repeated > 0){

            }else{
                init_same_arr(i);
            }
            drawTwo(20,i);
            window.R.arr[i-1].repeated++;
        }else{
            drawTwo(10,i);
        }
    }
    if(flag){
        var originId = window.R.Index;
        originId++;
        var lineId = 'line_'+originId;
        $('#line_'+window.R.Index).after('<div class="drop_line"  id='+lineId+'></div>');
    }else{

    }
}
// 当前行没有没有拓宽的组件时，进行收缩
function shortenHeight(id) {
    
}
function toDelete(obj) {
    var parentDOM=$(obj);
    var parentID=parentDOM.attr('id');
    if(confirm("确定要删除吗?")) {
        chartOperationStack['delete'].push(getSingleChartJson(parentID));
        jsPlumb.removeAllEndpoints(parentID);
        chartRareOperationStack.push('delete');
    }
}

function findInArray(line,column,type) {
    if(type){
        if(window.R.arr[line][column].id){
            return window.R.arr[line][column].id;
        }else{
            return false;
        }
    }else{
        return window.R.arr[line][column].size;
    }

}

function changeArrayForH(line,column,multiple,id) {
    window.R.arr[line][column].size *= multiple;
    window.R.arr[line][column].id = id;
}

function insertToArray(line,column,id,multiple) {
    var res = findInArray(line,column,1);
    window.R.arr[line][column].id = id;
    if(multiple!==null){
        changeArrayForH(line,column,multiple,id);
        changeArrayForH(line,column+1,multiple,id);
        changeArrayForH(line+1,column,multiple,id);
        changeArrayForH(line+1,column+1,multiple,id);
        if(multiple < 1){
            window.R.arr.splice(line, 1);
            //window.R.arr[line].repeated--;
        }else if(multiple>1){
            window.R.arr[line].repeated++;
        }
    }else{

    }
    if(res){
        window.R.arr[line][column+1].id = null;
    }else{
        return true;
    }

}

function checkInArray(id){
    for(var i=0,len=window.R.componentArr.length;i<len;i++){
        if(window.R.componentArr[i].id === id){
            return {
                line:window.R.componentArr[i].line,
                column:window.R.componentArr[i].column,
                index:i,
                size:window.R.componentArr[i].size
            }
        }
    }
    return false;
}

function findTwoLine() {
    var resArr = [];
    for(var i=0,len=window.R.componentArr.length;i<len;i++){
        if(window.R.componentArr[i].size > 1){
            resArr.push(window.R.componentArr[i].line+1)
        }
    }
    return resArr;
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
    // 删除某组件的所有节点及连线
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

    /* 同步socket */
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
        drawSide();
    });
    /* 同步socket */
    // 给边块画线描点
    function drawSide(size) {
        var tmpsize = 10;
        if(size){
            tmpsize = size;
        }
        var $btn = $('#add_button');
        var originId = 'side_'+Index;
        var linePrev = 'line_'+Index;
        Index++;
        var id = 'side_'+Index;
        var lineId = 'line_'+Index;
        var sideHtml = '<div class="side-border" id='+id+'>\n' +
            '                <svg xmlns="http://www.w3.org/2000/svg" class="svgForDrag">\n' +
            '                    <path d="M0,0 l0,50Z"\n' +
            '                          class="stroke"/>\n' +
            '                </svg>\n' +
            '            </div>';
        $btn.before('<div class="number_item" id="number_'+Index+'">'+Index+'</div>');
        $('#'+originId).after(sideHtml);
        $('#'+linePrev).after('<div class="drop_line"  id='+lineId+'></div>');
        jsPlumb.addEndpoint(id,{anchors: "RightMiddle"},hollowCircle);
    }
    // 添加边界框
    $('#add_button').on('click',function () {
        drawSide();
        socket.emit('add_side');
    });

    // 初始化二维数组
    var arr_2d = [];
    function arr_2d_push(num) {
        arr_2d[num] = [];
        var number = num+1;
        arr_2d[num][0]={size:40,id:'side_'+number};
        arr_2d[num].repeated = 0;
        for(var i=0;i<block_num;i++){
            arr_2d[num].push({size:40,id:null})
        }
        window.R.arr = arr_2d;
    }
    arr_2d_push(0);
    arr_2d_push(1);
    arr_2d_push(2);
    arr_2d_push(3);

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
        drag:function () {
            console.clear();
          console.log("drag");
        },
        drop:function(event,ui){
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
            var orderNum = Math.floor(left/window.R.gridWidth);//第几个
            var distance = left%window.R.gridWidth;
            // if(-5<distance<0){
            //     orderNum = orderNum>=0 ? orderNum-1:0;
            // }
            console.log(window.R.arr);
            var isExitId = findInArray(line,orderNum,1);
            if(distance<10 &&  isExitId !== null){
                left = orderNum*window.R.gridWidth+0.5*TD_WIDTH;
            }

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
            if(name === 'functionBlock'){
                jsPlumb.addEndpoint(trueId,{anchors: "LeftThird"},hollowCircle);
                jsPlumb.addEndpoint(trueId,{anchors: "RightThird"},hollowCircle);
                // jsPlumb.addEndpoint(trueId,{anchors: "LeftTwoThird"},hollowCircle);
            }
            else if(onePointArr.indexOf(name)===-1){
                jsPlumb.addEndpoint(trueId,{anchors: "RightMiddle"},hollowCircle);
                jsPlumb.addEndpoint(trueId,{anchors: "LeftMiddle"},hollowCircle);
            }
            else{
                jsPlumb.addEndpoint(trueId,{anchors: "LeftMiddle"},hollowCircle);
            }

            jsPlumb.draggable(trueId);
            $("#"+trueId).draggable({containment: "parent"});//保证拖动不跨界,只能在父容器中移动

            // changeValue("#"+trueId);
            // 做拓宽处理
            var height = ui.helper[0].clientHeight;
            var th = Math.ceil(top/LINE_HEIGHT);
            debugger;
            var tmpArr = findTwoLine();
            var times = Math.ceil(height/DIV_HEIGHT);
            if(times > 1){
                tmpArr.push(th);
                extendHeight(tmpArr,1);
                insertToArray(line,orderNum+1,trueId,2);
            }else{
                insertToArray(line,orderNum+1,trueId);
            }
            if(distance<10 &&  isExitId !== trueId){
                if(name === 'functionBlock'){
                    var newAchs = ['RightMiddle','LeftThird'];
                    FlowConnector.anchors = newAchs;
                }
                jsPlumb.connect({
                    source: isExitId, target: trueId
                },FlowConnector);
                FlowConnector.anchors = anchorPos;
                window.R.arr[line][orderNum+1].id = trueId;
                window.R.arr[line][orderNum+1].size = DIV_HEIGHT;
            }

            var params = {
                id:trueId,
                line:line,
                column:orderNum+1,
                size:times
            }
            window.R.componentArr.push(params);
            console.log(window.R.componentArr);
            list=jsPlumb.getAllConnections();//获取所有的连接


            //元素ID网上加,防止重复
            sessionStorage['idIndex']=parseInt(sessionStorage['idIndex'])+1;

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


    //删除连接线
    jsPlumb.bind("click",function(conn,originalEvent){
        
        if(confirm("确定删除吗?")){
            jsPlumb.detach(conn);
        }
    });
    var index=0;

    // 点击进行提示高亮
    $(document).on("click",function (e) {
       var top = e.clientY;
        $(".highlight").removeClass("highlight");
       index = Math.floor(top/LINE_HEIGHT) + 1;
       var two_id = index - 1;
       console.log(window.R.arr);
        if(window.R.arr[two_id][0].size == 40 && !window.R.arr[two_id][0].id){
            $("#line_"+two_id).addClass("highlight");
        }else{
            var id  = window.R.arr[two_id][0].id;
            $("#line_"+index).addClass("highlight");
            $("#side_"+index).addClass("highlight");
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
        if(event.which==13 && index!=0){
            var newIdex = index + 1;
            drawSide();
            init_arr(index);
        }
        if(event.which==40 && index!=0){
            $("#number_"+index).removeClass("number_item");
            $("#number_"+index).addClass("number_item_two");
            $("#side-group").html("");
            for(var i = 1;i<=Index;i++){
                if(i==index){
                    init_same_arr(index);
                    window.R.arr[index].size = 40
                    drawTwo(20,i);
                }else{
                    drawTwo(10,i);
                }
                console.log(window.R.arr);
            }
            console.log(window.R.arr);
        }
        if(event.which==38 && index!=0){
            $(".highlight").removeClass("highlight");
        }
    });
    jsPlumb.addEndpoint('side_1',{anchors: "RightMiddle"},hollowCircle);
    jsPlumb.addEndpoint('side_2',{anchors: "RightMiddle"},hollowCircle);
    jsPlumb.addEndpoint('side_3',{anchors: "RightMiddle"},hollowCircle);
    jsPlumb.addEndpoint('side_4',{anchors: "RightMiddle"},hollowCircle);



    //***********************************元素拖动控制部分************************************

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
    $('#export').on('click',function () {
        console.clear();
        console.log("获取的连接:");
        console.log(list);
       dataJson = save();
    });
    $('#import').on('click',function () {
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
                },FlowConnector);
        }

        return true;
    }

    $("._jsPlumb_endpoint").on("click",function (e) {
        console.log($(this).sibling(".draggable")[0].id);
    });


