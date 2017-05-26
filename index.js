/**
 * Created by hyylsw on 2017/4/18.
 */
let vm=new Vue({
    el:"#app",
    data:{
        activeIndex:"1",
        //最近两次对比的数据;
        tableData:[],
        //该人所有历史数据;
        tableAllData:[],
        age:0,
        height:0,
        InputData:{
            person:"",
            weight:"",
            bodyAge:"",
            bmi:"",
            bodyFatRate:"",
            bmr:"",
            viseralFat:"",
            allFat:"",
            allMuscle:"",
            upperFat:"",
            upperMuscle:'',
            trunkFat:"",
            trunkMuscle:'',
            lowerFat:"",
            lowerMuscle:""
        },
        persons:[]
    },
    mounted:function () {
        this.$nextTick(function () {
            this.initPersons();
        });
    },
    methods:{
        changePerson:function(personId){
           for(let person of this.persons){
               if(person.id==personId){
                   this.age=person.age;
                   this.height=person.height;
                   break;
               }
           }
        },
        initPersons:function () {
            this.$http({
                method:"GET",
                url:"/persons",
                enumlateJSON:true
            }).then(res=>{
                "use strict";
                 this.persons=JSON.parse(res.data);
            },res=>{
                "use strict";
            });
        },
        submitData:function(){
            this.$http({
                method:"GET",
                url:"/submitData",
                params:this.InputData,
                emulateJSON:true
            }).then(res=>{
                "use strict";
                let ret=JSON.parse(res.data);
                if(1==ret["affectedRows"]){
                    this.$alert("添加成功","添加结果",{
                        confirmButtonText:"确定"
                    });
                    //查询;
                    this.searchData();
                }else{
                    this.$alert("添加失败","添加结果",{
                        confirmButtonText:"确定"
                    });
                }
            },res=>{
                "use strict";
            });
        },
        searchAllData:function(){
            this.$http({
                method:"GET",
                url:"/searchAllData",
                params:{
                    person:this.InputData.person
                },
                emulateJSON:true
            }).then(res=>{
                "use strict";
                this.tableAllData=JSON.parse(res.data);
            });
        },
        searchData:function () {
            this.$http({
                method:"GET",
                url:"/searchData",
                params:{
                    person:this.InputData.person
                },
                emulateJSON:true
            }).then(res=>{
                "use strict";
                let ret=JSON.parse(res.data);
                if(ret.length==2){//有上一次
                    //第一条为本次, 第二条为上一次.
                    //需要计算出差值(本次-上一次)
                    ret[0]["compare"]="本次";
                    ret[1]["compare"]="上一次";
                    this.calculateDiff(ret);
                    ret[2]["compare"]="差值";
                }else if(ret.length==1){
                    ret[0]["compare"]="本次";
                }else if(ret.length==0){
                    this.$alert("没有相关数据","结果",{
                        confirmButtonText:"确定"
                    });
                }
                this.tableData=ret;
            },res=>{
                "use strict";
            });
        },
        calculateDiff:function (ret) {
            let diffObj={};
           for(let key of Object.keys(ret[0])) {
               diffObj[key] = (ret[0][key] - ret[1][key]).toFixed(2);
           }
           ret.push(diffObj);
        },
        sendEmail:function () {
            let params={};
            let personId=this.InputData.person;
            let person=this.persons.find(item=>{
                "use strict";
                return item.id==personId
            });
            Object.assign(params,person,{"data":this.tableData});
            this.$http.post("/sendEmail",params)
                .then(res=>{
                    "use strict";
                    if("true"==res["data"]){
                        this.$alert("邮件发送成功","结果",{
                            confirmButtonText:"确定"
                        });
                    }else{
                        this.$alert("邮件发送失败","结果",{
                            confirmButtonText:"确定"
                        });
                    }
                },res=>{
                    "use strict";
                });
        }
    }
});







