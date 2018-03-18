var dataJson = '{"connects":[{"ConnectionId":"con_12","PageSourceId":"rect-010","PageTargetId":"roundedRect-01112"}],"block":[{"BlockId":"rect-010","BlockContent":"","BlockX":498,"BlockY":108,"BlockWidth":40,"BlockHeight":20,"BlockBorderRadius":"0px","BlockBackground":"rgb(255, 255, 255)","BlockBorderStyle":"solid","BlockBorderWidth":"2px","BlockborderColor":"rgb(0, 0, 0)"},{"BlockId":"roundedRect-01112","BlockContent":"","BlockX":740,"BlockY":110,"BlockWidth":40,"BlockHeight":20,"BlockBorderRadius":"8px","BlockBackground":"rgb(255, 255, 255)","BlockBorderStyle":"solid","BlockBorderWidth":"2px","BlockborderColor":"rgb(0, 0, 0)"}]}';


var xmlParser = new XmlToJson();
var json = xmlParser.parse(xml);
console.log( JSON.stringify(json) );
var jsonParser = new JsonToXml();
var xml = jsonParser.parse(dataJson);
debugger
console.clear();
console.log( xml );

function XmlToJson() {
}
XmlToJson.prototype.setXml = function(xml) {
    if(xml && typeof xml == "string") {
        this.xml = document.createElement("div");
        this.xml.innerHTML = xml;
        this.xml = this.xml.getElementsByTagName("*")[0];
    }
    else if(typeof xml == "object"){
        this.xml = xml;
    }
};
XmlToJson.prototype.getXml = function() {
    return this.xml;
};
XmlToJson.prototype.parse = function(xml) {
    this.setXml(xml);
    return this.convert(this.xml);
};
XmlToJson.prototype.convert = function(xml) {
    if (xml.nodeType != 1) {
        return null;
    }
    var obj = {};
    obj.xtype = xml.nodeName.toLowerCase();
    var nodeValue = (xml.textContent || "").replace(/(\r|\n)/g, "").replace(/^\s+|\s+$/g, "");

    if(nodeValue && xml.childNodes.length == 1) {
        obj.text = nodeValue;
    }
    if (xml.attributes.length > 0) {
        for (var j = 0; j < xml.attributes.length; j++) {
            var attribute = xml.attributes.item(j);
            obj[attribute.nodeName] = attribute.nodeValue;
        }
    }
    if (xml.childNodes.length > 0) {
        var items = [];
        for(var i = 0; i < xml.childNodes.length; i++) {
            var node = xml.childNodes.item(i);
            var item = this.convert(node);
            if(item) {
                items.push(item);
            }
        }
        if(items.length > 0) {
            obj.items = items;
        }
    }
    return obj;
};


function JsonToXml() {
    this.result = [];
}
JsonToXml.prototype.spacialChars = ["&","<",">","\"","'"];
JsonToXml.prototype.validChars = ["&","<",">","\"","'"];
    JsonToXml.prototype.toString = function(){
        return this.result.join("");
    };
JsonToXml.prototype.replaceSpecialChar = function(s){
    for(var i=0;i<this.spacialChars.length;i++){
        s=s.replace(new RegExp(this.spacialChars[i],"g"),this.validChars[i]);
    }
    return s;
};
JsonToXml.prototype.appendText = function(s){
    s = this.replaceSpecialChar(s);
    this.result.push(s);
};
JsonToXml.prototype.appendAttr = function(key, value){
    this.result.push(" "+ key +"=\""+ value +"\"");
};
JsonToXml.prototype.appendFlagBeginS = function(s){
    this.result.push("<"+s);
};
JsonToXml.prototype.appendFlagBeginE = function(){
    this.result.push(">");
};
JsonToXml.prototype.appendFlagEnd = function(s){
    this.result.push("</"+s+">");
};
JsonToXml.prototype.parse = function(json){
    this.convert(json);
    return this.toString();
};
JsonToXml.prototype.convert = function(obj) {
    var nodeName = obj.xtype || "item";
    this.appendFlagBeginS(nodeName);
    var arrayMap = {};
    for(var key in obj) {
        var item = obj[key];
        if(key == "xtype") {
            continue;
        }
        if(item.constructor == String) {
            this.appendAttr(key, item);
        }
        if(item.constructor == Array) {
            arrayMap[key] = item;
        }
    }
    this.appendFlagBeginE();
    for(var key in arrayMap) {
        var items = arrayMap[key];
        for(var i=0;i<items.length;i++) {
            this.convert(items[i]);
        }
    }
    this.appendFlagEnd(nodeName);
};