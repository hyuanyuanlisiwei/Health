/**
 * Created by hyylsw on 2017/4/18.
 */
let vm=new Vue({
    el:"#app",
    data:{
        //isPC
        isPC:true,
        activeIndex:'0',
        //最近两次对比的数据;
        tableData:[],
        //该人所有历史数据;
        tableAllData:[],
        age:0,
        height:0,
        redClass:'red',
        blueClass:'blue',
        columnData:{
            weight:'体重(kg)',
            bodyAge:"体年龄",
            bmi:"BMI",
            bodyFatRate:"体脂率(%)",
            bmr:"基础代谢(kcal)",
            viseralFat:'内脏脂肪',
            allFat:'全身体脂(%)',
            allMuscle:'全身肌肉(%)',
            upperFat:'上肢体脂(%)',
            upperMuscle:'上肢肌肉(%)',
            trunkFat:'躯干体脂(%)',
            trunkMuscle:'躯干肌肉(%)',
            lowerFat:'下肢体脂(%)',
            lowerMuscle:'下肢肌肉(%)'
        },
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
        keys:[],
        persons:[]
    },
    mounted:function () {
        this.$nextTick(function () {
            this.keys=Object.keys(this.InputData).splice(1);
            this.initPersons();
            this.isPC=this.initIsPC();
        });
    },
    watch:{
        'InputData.person':function(val){
            "use strict";
            this.changePerson(val);
        }
    },
    methods:{
        initIsPC:function () {
            let userAgent=navigator.userAgent;
            let agents=["Android","iPhone","iPad","iPod"];
            let flag=true;
            for(let item of agents){
                if(userAgent.includes(item)){
                    flag=false;
                    break;
                }
            }
            return flag;
        },
        empty:function () {
          this.age=0;
          this.height=0;
          for(let key of Object.keys(this.InputData)){
              this.InputData[key]='';
          }
        },
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
                 this.InputData['person']=this.persons[this.persons.length-1];
            },res=>{
                "use strict";
            });
        },
        submitData:function(){
            // 输入不能为空
            for(let key of Object.keys(this.InputData)){
                if(!this.InputData[key]){
                    if(this.isPC){
                        this.$alert("提示","输入不能有空",{
                            confirmButtonText:"确定"
                        });
                    }else{
                        window.alert("输入不能有空");
                    }
                    return false;
                }
            }
            this.$http({
                method:"GET",
                url:"/submitData",
                params:this.InputData,
                emulateJSON:true
            }).then(res=>{
                "use strict";
                let ret=JSON.parse(res.data);
                if(1==ret["affectedRows"]){
                    if(this.isPC){
                        this.$alert("添加成功","添加结果",{
                            confirmButtonText:"确定",
                            callback:action=>{
                                this.empty();
                            }
                        });
                    }else{
                        window.alert("添加成功");
                    }
                    //查询;
                    this.searchData();
                }else{
                    if(this.isPC){
                        this.$alert("添加失败","添加结果",{
                            confirmButtonText:"确定"
                        });
                    }else{
                        window.alert("添加失败");
                    }
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
                        if(this.isPC){
                            this.$alert("邮件发送成功","结果",{
                                confirmButtonText:"确定"
                            });
                        }else{
                            window.alert("邮件发送成功!");
                        }
                    }else{
                        if(this.isPC){
                            this.$alert("邮件发送失败","结果",{
                                confirmButtonText:"确定"
                            });
                        }else{
                            window.alert("邮件发送失败");
                        }
                    }
                },res=>{
                    "use strict";
                });
        }
    }
});







