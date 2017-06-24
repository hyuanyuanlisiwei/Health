/**
 * Created by hyylsw on 2017/4/18.
 */
const fs=require("fs");
const sys=require("util");
const mysql=require("mysql");
const  http=require("http");
const url=require("url");
const path=require("path");
const nodemailer=require("nodemailer");
const smtpTransport=require("nodemailer-smtp-transport");
const log4js=require("log4js");
log4js.configure({
    appenders: [
        { type: 'console' }, //控制台输出
        {
            type: 'file', //文件输出
            filename: 'log.log',
        }
    ]
});
let logger = log4js.getLogger('normal');
logger.setLevel('INFO');
//静态资源配置
const MIME_TYPE={
    "css":"text/css",
    "js":"text/javascript",
    "woff":"application/x-font-woff",
    "ttf":"application/octet-stream"
};
//数据库配置;
const client={
    host:"182.92.173.117",
    port:3306,
    database:"health",
    user:"test",
    password:"test@fftime"
};
//Object扩展entries方法
Object.prototype.entries=function (item) {
    let doubleArr=[];
    for(let key of Object.keys(item)){
        let value=item[key];
        doubleArr.push([key,value]);
    }
    return doubleArr;
}

//创建http服务器
http.createServer((request,response)=>{
    "use strict";
    let pathname=url.parse(request.url).pathname;
    logger.info('-----pathname-----');
    logger.info(pathname);
    //处理浏览器默认请求;
    if("/favicon.ico"==pathname){
        return;
    }
    switch(pathname){
        case "/":
            goIndex(request,response);
            break;
        case "/persons":
            getPersons(request,response);
            break;
        case "/submitData":
            submitData(request,response);
            break;
        case "/searchData":
            searchData(request,response);
            break;
        case "/searchAllData":
            searchAllData(request,response);
            break;
        case "/sendEmail":
            sendEmail(request,response);
            break;
        default:
            handleStatic(request,response);
            break;
    }
}).listen(8000);
logger.info("服务器正在监听8000端口");
//处理静态资源
function handleStatic(request,response) {
    let pathname=url.parse(request.url).pathname;
    //处理静态资源;
    let type=MIME_TYPE[path.extname(url.parse(pathname).pathname).slice(1)];
    if(type){//如果是静态资源.
        response.writeHead(200,{"Content-Type":type});
        fs.readFile(__dirname+pathname,(err,data)=>{
            if(err){
                logger.error(err);
                return;
            }else{
                logger.info("response静态资源-----"+type);
                response.write(data.toString());
                response.end();
            }
        })
    }
}
//返回首页
function goIndex(request,response) {
    let indexPath=__dirname+"/"+url.parse("index.html").pathname;
    let indexPage=fs.readFileSync(indexPath);
    response.writeHead(200,{"Content-Type":"text/html"});
    response.end(indexPage);
}
//persons查询;
function getPersons(request,response){
    "use strict";
    //创建连接;
    let connection=mysql.createConnection(client);
    //连接数据库
    connection.connect(err=>{
        if(err){
            console.log(err);
            return;
        }else{
            logger.info("打开连接");
        }
    });
    //查询语句;
    let sql="select * from persons;";
    //执行查询;
    connection.query(sql,(err,rows,fields)=>{
        if(err){
            logger.info("----getPersons error-----");
            logger.error(err);
            return;
        }
        response.write(JSON.stringify(rows));
        response.end();
    });
    //关闭连接;
    connection.end(err=>{
        if(err){
            logger.error(err);
            return;
        }else{
            logger.info("连接关闭");
        }
    });
}
//录入数据到数据库;
function submitData(request,response) {
    "use strict";
    //创建数据库连接
    let connection=mysql.createConnection(client);
    //连接数据库;
    connection.connect(err=>{
        if(err){
            logger.error("----submitData error-----");
            logger.error(err);
            return;
        }else{
            logger.info("insert打开连接");
        }
    });
    //获取参数;
    let params=url.parse(request.url,true).query;
    //sql语句;
    let keys=[], values=[];
    for(let [key,value] of Object.entries(params)){
        keys.push(key);
        values.push(value);
    }
    let sql=`insert into health_data (${keys.join(",")}) values (${values.join(",")});`;
    console.log("-------insert sql--------");
    console.log(sql);
    //执行sql;
    connection.query(sql,(err,result)=>{
       if(err){
           logger.error(err);
           return;
       }else{
           response.write(JSON.stringify(result));
           response.end();
       }
    });
    //关闭连接
    connection.end(err=>{
        if(err){
            logger.error(err);
            return;
        }else{
            logger.info("连接关闭");
        }
    });
}
//查询所有
function searchAllData(request,response) {
    "use strict";
    //创建数据库连接
    let connection=mysql.createConnection(client);
    //连接数据库;
    connection.connect(err=>{
        if(err){
            logger.error("----searchAllData  error-----");
            logger.error(err);
            return;
        }else{
            logger.info("searchAllData打开连接");
        }
    });
    //获取参数;
    let params=url.parse(request.url,true).query;
    let sql=`select persons.*, health_data.* from health_data, persons `+
        `where health_data.person=persons.id and health_data.person=${params.person} order by health_data.id desc`;
    console.log("-------searchData sql--------");
    logger.info(sql);
    //执行查询;
    connection.query(sql,(err,rows,fields)=>{
        if(err){
            logger.error("----searchAllData error-----");
            logger.error(err);
            return;
        }
        response.write(JSON.stringify(rows));
        response.end();
    });
    //关闭连接
    connection.end(err=>{
        if(err){
            logger.error(err);
            return;
        }else{
            logger.info("连接关闭");
        }
    });
}

//查询最近两次 数据表
function searchData(request,response) {
    "use strict";
    //创建数据库连接
    let connection=mysql.createConnection(client);
    //连接数据库;
    connection.connect(err=>{
        if(err){
            logger.error("----searchData error-----");
            logger.error(err);
            return;
        }else{
            logger.info("searchData打开连接");
        }
    });
    //获取参数;
    let params=url.parse(request.url,true).query;
    let sql=`select * from health_data where person=${params.person} order by id desc limit 0,2;`;
    console.log("-------searchData sql--------");
    logger.info(sql);
    //执行查询;
    connection.query(sql,(err,rows,fields)=>{
        if(err){
            logger.error("----searchData error-----");
            logger.error(err);
            return;
        }
        response.write(JSON.stringify(rows));
        response.end();
    });
    //关闭连接
    connection.end(err=>{
        if(err){
            logger.error(err);
            return;
        }else{
            logger.info("连接关闭");
        }
    });
}

function sendEmail(request,response) {
    let info="";
    request.addListener("data",chunk=>{
        "use strict";
        info+=chunk;
    }).addListener("end",()=>{
        "use strict";
         info=JSON.parse(info);
         MailUtils(info);
         response.write("true");
         response.end();
    });
}
function MailUtils(info) {
    let transport=nodemailer.createTransport(smtpTransport({
        host:"smtp.exmail.qq.com",
        port:25,
        auth:{
            user:"service@f2time.com",
            pass:"feifan1234"
        }
    }));
    let htmlStr=makeHtml(info);
    let mailOptions={
        from:"service<service@f2time.com>",
        to:info.email,
        subject:"非凡体检报告",
        html:htmlStr,
        attachments:[{
            filename:"指标.jpeg",
            path:"./1.jpeg"
        }]
    };
    transport.sendMail(mailOptions,(err,response)=>{
        "use strict";
        if(err){
            logger.error(err);
        }else{
            logger.info("-------邮件发送完毕-------");
            logger.info(response);
        }
        transport.close();
    });
}
function  makeHtml(info){
    let htmlStr="<h3>你好,"+info.name+"</h3>";
    htmlStr+="<table border='1' cellpadding='5' cellspacing='0' width='100%'>" +
        "<thead><th>体重</th> <th>体年龄</th> <th>BMI</th> <th>体脂率(%)</th>" +
        "<th>基础代谢</th> <th>内脏脂肪</th> <th>全身皮脂(%)</th> <th>全身肌肉(%)</th>" +
        "<th>上肢皮脂(%)</th><th>上肢肌肉(%)</th> <th>躯干皮脂(%)</th> <th>躯干肌肉(%)</th>" +
        " <th>下肢皮脂(%)</th> <th>下肢肌肉(%)</th><th style='background-color:#ff494900'>对比</th></thead>" +
        "<tbody>"+makeTr(info.data)+
        "</tbody> </table>";
    return htmlStr;
}
function makeTr(data) {
    let trStr="";
    for(let item of data){
        trStr+="<tr>"
        for(let [key,value] of Object.entries(item)){
            if(key!='id' && key!="person"){
                trStr+="<td>"+value+"</td>"
            }
        }
        trStr+="</tr>";
    }
    return trStr;
}
