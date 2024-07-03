// pages/inventorydetatil/inventorydetatil.js\
import {
    Printer
} from '../../utils/print';
import {
    request
} from '../../utils/request';
const app = getApp();

function getLocation() {
    return new Promise((resolve, reject) => {
        wx.getLocation({
            success: (res) => {
                resolve(res);
            },
            fail: (error) => {
                reject(error);
            },
        });
    });
}
Page({

    /**
     * 页面的初始数据
     */
    data: {
        inventoryDetail: {},
        inventoryInfo: {},
        form: {
            width:1520,
            height:15
        },
        //操作人
        todoAllPerName: [],
        todoPersonName: [],
        todoIndex: 0,
        //品牌
        brandsName: [],
        brandIndex: 0,
        //品牌系列
        brandSerName: [],
        brandSerIndex: 0,
        //产品型号
        goodsName: [],
        goodsIndex: 0,

        //产品等级
        items: [{
                value: 'A',
                name: 'A',
                checked:true
            },
            {
                value: 'A-',
                name: 'A-'
            },
            {
                value: 'B',
                name: 'B'
            },
        ],
        inputValue: '',
        deviceId: '',
        name: '',
        pros: [],
        hisArr: [],
        histry: false,
        inputShowed: true,
        inputValue: '',
        isLocation: false,
        //纬度
        latitude: '',
        //经度
        longitude: '',

        //扫描到的产品uuid
        backfill_uuid: undefined,
        inputVal: '',
        filteredGoods:[],
        inputBser:'',
        BrandsSer:[],
        filteredBrandsSer:[],
        inputTyping1:false,
        inputTyping:false,
        inputfilteredGoods:[],
        //所有产品型号
        allGoods:[],
        inputAllGoods:'',
        inputTypeAll:false,
        inputfilteredAllGoods:[]
    },
    selectbrandSer(e){
        const allgoodsDocs = this.data.inventoryInfo.goodsDocs;
        //品牌系列uuid
        const { name, uuid }= e.currentTarget.dataset;
        const filteredGoods = allgoodsDocs.filter(item => item.wms_brand_series.uuid === uuid);
        console.log('当前系列的型号',filteredGoods);

        this.setData({
            'form.brand_series_uuid':uuid,
            inputBser:name,
            inputTyping1:false,
            filteredGoods
        });
        console.log('form.brand_series_uuid',this.data.form);
    },
    selectGood(e){
        const { name, uuid }= e.currentTarget.dataset;
        this.setData({
            'form.goods_uuid':{
                label:name,
                value:uuid.toString()
            },
            inputVal:name,
            inputTyping:false,
            
        });
        console.log('form.goods_uuid',this.data.form);

    },
    selectAllGood(e){
        console.log(e.currentTarget.dataset);
        const { name, uuid, brand,brandser }= e.currentTarget.dataset;
        this.setData({
            'form.goods_uuid':{
                label:name,
                value:uuid.toString()
            },
            'form.brand_series_uuid':brandser.uuid,
            'form.brand_uuid':brand.uuid,
            nowBrandSerVal:brandser.name,
            nowBrandVal:brand.name,
            inputAllGoods:name,
            inputTypeAll:false,
            
        });
        console.log('form=>',this.data.form);

    },
    getLocation() {
        let that = this;
        getLocation()
            .then((res) => {
                // console.log('获取地址结果=>', res);
                that.setData({
                    latitude: res.latitude,
                    longitude: res.longitude
                })
            })
            .catch((error) => {
                console.error('获取地址失败=>', error);
                wx.showToast({
                    title: '位置未获取',
                    icon: 'error'
                });
                // that.setData({
                //     isLocation:true,
                //     msg:'位置未获取，无法提供查询服务'
                // })
            });
    },
    addInfo(e) {
        // console.log('addInfo');
        // b6a76144-0f60-4b77-8f0b-cba6b5c646ea
        let that = this;
        wx.scanCode({
            success(res) {
                console.log('res,扫码结果', res);
                console.log(that.data.backfill_uuid)
                if (res.errMsg == "scanCode:ok") {
                    const location = {
                        latitude: that.data.latitude.toString(),
                        longitude: that.data.longitude.toString()
                    };
                    const product_uuid = res.result == "20231023CC-01020" ? '34b77186-dc9c-4510-995f-8b02c5f64645' : res.result;
                    console.log('查询的product_uuid', product_uuid)

                    request({
                        url: 'https://abc.nit.pub/invoke/nbpm/method/wxapp/query-product-inventory',
                        method: 'POST',
                        data: {
                            product_uuid,
                            location
                        },
                        success(res) {
                            console.log('查询结果==>', res);
                            // return
                            if (res.data.status === 200) {
                                if (res.data.data.uuid == that.data.backfill_uuid) {
                                    wx.showToast({
                                        title: '刷新页面再次扫码',
                                        icon: 'none'
                                    })
                                    return
                                };
                                // that.setData({
                                //     backfill_uuid:product_uuid
                                // });
                                const {
                                    brand_uuid,
                                    brand_series_uuid,
                                    goods_uuid,
                                    width,
                                    height,
                                    rollId,
                                    grade,
                                    uuid
                                } = res.data.data;

                                const {
                                    brandDocs,
                                    brandSeriesDocs,
                                    goodsDocs
                                } = that.data.inventoryInfo;

                                const brandIndex = brandDocs.findIndex(item => item.uuid === brand_uuid);
                                const brandSerIndex = brandSeriesDocs.findIndex(item => item.uuid === brand_series_uuid);
                                const goodsIndex = goodsDocs.findIndex(item => item.uuid === goods_uuid.uuid);
                                // console.log(brandIndex,brandSerIndex,goodsIndex);

                                let items = that.data.items.map(item => {
                                    if (item.name === grade) {
                                        return {
                                            ...item,
                                            checked: 'true'
                                        };
                                    }
                                    return item;
                                });
                                console.log('items==>', items)

                                let arr = that.data.form.stocks || [];
                                arr.push({
                                    rollId,
                                    product_uuid: uuid
                                })

                                that.setData({
                                    items,
                                    'form.stocks': arr,
                                    'form.width': width,
                                    'form.height': height,
                                    'form.grade': grade,
                                    brandIndex,
                                    brandSerIndex,
                                    goodsIndex,

                                });
                                console.log('当前膜卷数组', that.data.form.stocks);


                            } else {
                                wx.showToast({
                                    title: '查无产品',
                                    icon: 'error'
                                });
                                that.setData({
                                    backfill_uuid: product_uuid
                                });
                                console.log('backfill_uuid查无此uuid，存起来', that.data.backfill_uuid);

                            }
                        },
                        fail() {
                            console.log('查询失败')

                        },
                    })

                } else {
                    wx.showToast({
                        title: '扫描失败',
                        icon: 'error'
                    })
                }
            },
            fail(res) {
                wx.showToast({
                    title: '扫描失败',
                    icon: 'error'
                })
            }
        })
    },
    addTo() {
        if (this.data.inputValue !== '') {
            // console.log(typeof parseInt(this.data.inputValue));
            const inputVal = this.data.inputValue.trim();
            let arr = this.data.form.stocks || [];
            let foundItem = arr.find(item => item.rollId === inputVal.toString());
            if (foundItem) {
                wx.showToast({
                    title: '膜卷号已存在',
                    icon: 'none'
                });
                return
            }
            arr.push({
                rollId: inputVal.toString(),
                product_uuid: this.data.backfill_uuid
            });
            this.setData({
                'form.stocks': arr,
                backfill_uuid: undefined
            });
            console.log('添加之后的form.stocks', this.data.form.stocks);

        }

    },
    bindKeyInput: function (e) {
        // console.log(e)
        this.setData({
            inputValue: e.detail.value
        })
    },
    showInput() {
        this.setData({
            inputShowed: true,
        });
    },
    hideInput() {
        this.setData({
            inputVal: '',
            inputShowed: false,
        });
    },
    clearInput() {
        this.setData({
            inputVal: '',
            inputfilteredGoods:[],
        });
    },
    clearInput2() {
        this.setData({
            inputAllGoods: '',
            inputfilteredAllGoods:[],
        });
    },
    clearInput1() {
        this.setData({
            inputBser: '',
            filteredBrandsSer:[]
        });
    },
    inputTyping1(e) {
        const inputStr = e.detail.value;
        const nowBrandsSer = this.data.BrandsSer;

        this.setData({
            inputBser: inputStr,
            inputTyping1:true
        });

        const delay = 300;

        // 清除之前的定时器
        clearTimeout(this.data.debounceTimer1);

        const debounceTimer1 = setTimeout(() => {
            // 在这里执行模糊匹配逻辑
            const filteredBrandsSer = this.filterGoods(inputStr, nowBrandsSer);
            console.log('键入品牌系列之后过滤的系列=>',filteredBrandsSer);
            this.setData({
                filteredBrandsSer,
            });
        }, delay);

        this.setData({
            debounceTimer1,
        });
    },
    inputTypeAll(e) {
        const inputStr = e.detail.value;
        const nowGoods = this.data.allGoods;
        console.log('当前系列的型号',nowGoods)
        this.setData({
            inputAllGoods: inputStr,
            inputTypeAll:true
        });
        const delay = 300;

        clearTimeout(this.data.debounceTimer2);

        const debounceTimer2 = setTimeout(() => {
            // 在这里执行模糊匹配逻辑
            const inputfilteredAllGoods = this.filterGoods(inputStr, nowGoods);
            console.log('筛选出来的型号=>',inputfilteredAllGoods);
            // 更新数据
            this.setData({
                inputfilteredAllGoods,
            });
        }, delay);

        // 保存定时器ID
        this.setData({
            debounceTimer2,
        });
    },
    inputTyping(e) {
        const inputStr = e.detail.value;
        const nowGoods = this.data.filteredGoods;
        console.log('当前系列的型号',this.data.filteredGoods)
        this.setData({
            inputVal: inputStr,
            inputTyping:true
        });

        // 设置延迟时间，例如300毫秒
        const delay = 300;

        // 清除之前的定时器
        clearTimeout(this.data.debounceTimer);

        // 设置新的定时器
        const debounceTimer = setTimeout(() => {
            // 在这里执行模糊匹配逻辑
            const inputfilteredGoods = this.filterGoods(inputStr, nowGoods);
            console.log('inputfilteredGoods=>',inputfilteredGoods);
            // 更新数据
            this.setData({
                inputfilteredGoods,
            });
        }, delay);

        // 保存定时器ID
        this.setData({
            debounceTimer,
        });
    },

    filterGoods(inputStr, allGoods) {
        // 在这里实现模糊匹配逻辑
        const filtered = allGoods.filter(good => good.name.includes(inputStr));
        return filtered;
    },

    clearInputNum() {
        this.setData({
            inputValue: '',
        });
    },


    getSome(uuid, brandname, goodsname, productbatch, rollid) {
        let that = this;
        const {
            serviceId,
            deviceId,
            characteristicId
        } = app.globalData;

        console.log('开始打印===>', serviceId, deviceId, characteristicId);
        // return                                                                                                                                                                                                                                                                                                                                                                               
        let printData = [
            `QRCODE 8,8,L,3,A,0,"${uuid}"`,
            `TEXT 108,16,"TSS16.BF2",0,1,1,"${brandname || 'undefind'}"`,
            `TEXT 108,34,"TSS16.BF2",0,1,1,"卷芯码:${rollid || 'undefind'}"`,
            `TEXT 108,52,"TSS16.BF2",0,1,1,"${goodsname}"`,
            `TEXT 108,74,"3",0,1,1,"${productbatch || 'undefind'}"`,

        ].join('\r\n');

        const print = new Printer({
            size: {
                width: 40,
                height: 15
            },
            speed: 2,
            gap: {
                x: 1,
                y: 6
            },
            serialport: null
        });


        print.clear().sendCommand(printData).print({
            quantity: 1,
            count: 1
        }).then(async (printName) => {
            console.log('buffer长度', printName.buffer.byteLength);
            const count = Math.ceil(printName.buffer.byteLength / 20);
            for (let i = 0; i < count; i++) {
                let buffer = printName.buffer.slice(i * 20, (i + 1) * 20 > printName.buffer.byteLength ? printName.buffer.byteLength : (i + 1) * 20);

                await wx.writeBLECharacteristicValue({
                    deviceId,
                    serviceId,
                    characteristicId,
                    value: buffer,
                    success: (res) => {
                        console.log('发送数据成功', res);
                        if (i === count - 1) {
                            console.log(rollid, 'getsome')

                            const stocks_ = that.data.form.stocks;
                            const stocks = stocks_.filter(item => item.rollId.toString() !== rollid.toString());
                            console.log('stocks', stocks);


                            const filteredArray = that.data.pros.filter(item => item.rollId !== rollid);

                            // console.log(filteredArray);


                            that.setData({
                                pros: filteredArray,
                                'form.stocks': stocks
                            });
                        }
                    },
                    fail(res) {
                        console.log('发送数据失败', res);
                    }
                })
            };

        })
    },
    print(e) {
        // console.log(e);
        const {
            uuid,
            brandname,
            goodsname,
            productbatch,
            rollid,
        } = e.currentTarget.dataset;
        this.getSome(uuid, brandname, goodsname, productbatch, rollid);

    },


    submit() {
        console.log('提交表单，数组聚合前：', this.data.form);
        //各个选择的下标
        const {
            todoIndex,
            brandIndex,
            // brandSerIndex,
            // goodsIndex,
            inventoryInfo,
            inventoryDetail
        } = this.data;
        console.log('单子详情：', inventoryDetail);
        // 操作人信息
        let operator = {};
        if (inventoryDetail.inventory_operator.length > 0) {
            operator = inventoryDetail.inventory_operator[todoIndex];
        } else {
            console.log('原始数据：', inventoryInfo);
            const operatorInfo = inventoryInfo.operatorDocs[todoIndex];
            operator = {
                label: operatorInfo.cPersonName,
                value: operatorInfo.cPersonCode
            };
        };

        console.log('操作人信息', operator);
        this.data.form.operator = operator;
        //coatingCode
        this.data.form.coatingCode = inventoryDetail.coatingCode;

        //品牌
        // const brandInfo = inventoryInfo.brandDocs[brandIndex];
        // const brand_uuid = brandInfo.uuid;
        // this.data.form.brand_uuid = brand_uuid;

        //品牌系列
        // const brandSerInfo = inventoryInfo.brandSeriesDocs[brandSerIndex];
        // const brand_series_uuid = brandSerInfo.uuid;
        // this.data.form.brand_series_uuid = brand_series_uuid;

        //goods_uuid
        // var goodsInfo = inventoryInfo.goodsDocs[goodsIndex];
        // var goods_uuid = {};
        // goods_uuid.label = goodsInfo.name;
        // goods_uuid.value = goodsInfo.uuid;
        // this.data.form.goods_uuid = goods_uuid;
        const inventory_uuid = inventoryDetail.uuid;
        const item = this.data.items.find(item => item?.checked === true )
        this.data.form.grade = this.data.form.grade ? this.data.form.grade : item.name;


        const bodyData = this.data.form;
        if (bodyData.goods_uuid === undefined ||
            bodyData.brand_series_uuid === undefined ||
            bodyData.coatingCode === undefined ||
            bodyData.operator === undefined ||
            bodyData.stocks === undefined ||
            bodyData.grade === undefined) {
            wx.showToast({
                title: '提交失败！请补充参数',
                icon: 'none',
                duration: 1000
            });
            return
        }
        console.log('提交表单，数据聚合后', bodyData);

        //测试
        // let pros = [
        //     {
        //         rollId:'12312312',
        //         brand_name:'测试品牌',
        //         goodsName:'ceshi型号',
        //         uuid:'2131231236sgda',
        //         product_batch:'6781623',
        //     }
        // ];
        // let hisArr = this.data.hisArr;
        // for (const p of pros) {
        //     hisArr.push(p);
        // };
        // console.log('hisArr===>', hisArr);
        // this.setData({
        //     pros,
        //     hisArr
        // });
        // return
        var that = this;
        wx.request({
            url: `https://abc.nit.pub/invoke/nwms/method/wxapp/check`,
            method: 'POST',
            data: {
                inventory_uuid,
                data: bodyData
            },
            success(res) {
                console.log('表单提交结果=>', res);

                if (res.data.status == 200) {
                    let pros = res.data.data;
                    let hisArr = that.data.hisArr;
                    for (const p of pros) {
                        hisArr.push(p);
                    };
                    console.log('hisArr===>', hisArr);
                    that.setData({
                        pros,
                        hisArr
                    });

                    // console.log(that.data.pros);


                }
                if (res.data.status == 500) {

                    wx.showToast({
                        title: JSON.stringify(`${res.data.statusText}`),
                        icon: 'none'
                    }, 1500);


                    return
                }

            }
        })


    },


    del(e) {
        const index = e.currentTarget.dataset.index;
        const arr = this.data.form.stocks;
        arr.splice(index, 1);

        this.setData({
            pros: [],
            'form.stocks': arr
        });
    },
    scanCode: function () {
        var that = this;
        wx.scanCode({
            success(res) {
                if (res.errMsg == "scanCode:ok") {

                    console.log('扫码结果_res=>', res);
                    let stocks = that.data.form.stocks || [];
                    console.log('当前膜卷数组', stocks);
                    // return;
                    if (stocks.length > 0) {
                        const rollIdExists = stocks.some(stock => stock.rollId === res.result);
                        const num = Date.now();
                        console.log(num)
                        if (!rollIdExists) {
                            console.log(`数组中不存在包含 rollId 为 ${res.result} 的元素。`);
                            stocks.push({
                                rollId: res.result,
                                product_uuid: that.data.backfill_uuid
                            });
                            that.setData({
                                'form.stocks': stocks,
                                backfill_uuid: undefined
                            });
                            console.log('当前膜卷数组', that.data.form.stocks);
                        } else {
                            console.log(`数组中存在包含 rollId 为 ${res.result} 的元素。`);
                            return;
                        }
                    } else {
                        stocks.push({
                            rollId: res.result,
                            product_uuid: that.data.backfill_uuid
                        });
                        that.setData({
                            'form.stocks': stocks,
                            backfill_uuid: undefined
                        })
                        console.log("数组为空，无法执行检查。");
                    }
                } else {
                    wx.showToast({
                        title: '此膜卷不存在',
                        duration: 1000,
                        icon: 'error'
                    });

                }
            }
        })
    },
    bindremark: function (e) {
        // console.log('备注',e.detail.value);
        const remark = e.detail.value;
        this.setData({
            'form.remark': remark,
        });
        // console.log(this.data.form);
    },


    bindwidth: function (e) {
        // console.log('产品宽度',e.detail.value);
        const width = parseInt(e.detail.value);
        this.setData({
            'form.width': width,
        });
        // console.log(this.data.form);
    },
    bindheight: function (e) {
        // console.log('产品长度',e.detail.value);
        const height = parseInt(e.detail.value);
        this.setData({
            'form.height': height,
        });
        // console.log(this.data.form);
    },


    radioChange(e) {
        // console.log('选择等级：', e.detail.value)
        const grade = e.detail.value;
        this.setData({
            'form.grade': grade,
        });
    },


    gotoHistry() {
        this.setData({
            histry: !this.data.histry
        })
        // wx.navigateTo({
        //     url: 'invertoryHistry',
        // });
    },


    bindPickerChangeTodo: function (e) {
        // console.log('选择操作人下标', e.detail.value)
        const todoIndex = e.detail.value;
        // const todoPersons = this.data.inventoryDetail.inventory_operator;
        // const todoPerson = todoPersons[todoIndex];
        this.setData({
            // 'form.operator': todoPerson,
            todoIndex
        });
        // console.log('this.data.form.operator',this.data.form.operator);

    },
    bindPickerChangeBrand: function (e) {

        this.setData({
            filteredBrandsSer:[],
            inputfilteredGoods:[],
            inputBser:'',
            inputVal:''
        })
        const brandIndex = e.detail.value;
        const brandInput = this.data.inventoryInfo.brandDocs[brandIndex];
        console.log('选中的品牌=>',brandInput);
        const brandSeriesDocs = this.data.inventoryInfo.brandSeriesDocs;
        const BrandsSer = brandSeriesDocs.filter(brand => brand.wms_brand.uuid === brandInput.uuid);
        console.log('此类品牌下面的系列=>',BrandsSer);
        this.setData({
            BrandsSer,
            brandIndex
        });

    },
    bindPickerChangeBrandSeries: function (e) {
        console.log('选择品牌系列下标', e.detail.value)
        const brandSerIndex = e.detail.value;
        this.setData({
            brandSerIndex
        });

    },
    bindPickerChangeGoods: function (e) {
        // console.log('选择产品型号下标', e.detail.value)
        const goodsIndex = e.detail.value;
        this.setData({
            goodsIndex
        });
    },
    getInventoryDetail(uuid) {
        var that = this;
        wx.request({
            url: `https://abc.nit.pub/invoke/nwms/method/wxapp/detail?inventory_uuid=${uuid}`,
            method: 'GET',
            // data: bodyData,
            success(res) {
                // console.log('盘点单详情', res);
                if (res.statusCode === 200) {
                    const inventoryDetail = res.data.data.inventoryDoc;

                    //操作人
                    const todoPersons = inventoryDetail.inventory_operator;
                    let todoPersonName = [];

                    for (const i of todoPersons) {
                        todoPersonName.push(i.label);
                    };
                    that.setData({
                        todoPersonName,
                        inventoryDetail
                    })
                }
            }
        })
    },
    getInitInfo() {
        var that = this;
        wx.request({
            url: `https://abc.nit.pub/invoke/nwms/method/wxapp/predata`,
            method: 'GET',
            // data: bodyData,
            success(res) {
                if (res.statusCode === 200) {
                    // console.log('该盘点单初始化信息：', res.data.data);
                    const inventoryInfo = res.data.data;
                    //操作人
                    const todoAllPer = inventoryInfo.operatorDocs;
                    // console.log(todoAllPer)
                    let todoAllPerName = [];

                    for (const i of todoAllPer) {
                        todoAllPerName.push(i.cPersonName);
                    };
                    // console.log(todoAllPerName)

                    //品牌列表
                    const brands = inventoryInfo.brandDocs;
                    let brandsName = [];

                    for (const i of brands) {
                        brandsName.push(i.name);
                    };

                    //品牌系列列表
                    const brandSer = inventoryInfo.brandSeriesDocs;
                    const brandFirst = inventoryInfo.brandDocs[0];
                    const BrandsSer = brandSer.filter(brand => brand.wms_brand.uuid === brandFirst.uuid);                 

                    //产品型号列表
                    let filteredGoods = []
                    if(BrandsSer.length > 0){
                        const goods = inventoryInfo.goodsDocs;
                        const BrandsSerFirst = BrandsSer[0];
                        filteredGoods =  goods.filter(good => good.wms_brand_series.uuid === BrandsSerFirst.uuid);
                    }

                    //所有产品型号
                    let allGoods = inventoryInfo.goodsDocs;

                    that.setData({
                        filteredGoods,
                        BrandsSer,
                        todoAllPerName,
                        brandsName,
                        inventoryInfo,
                        allGoods
                    })
                };

            }
        })
    },

    onLoad(options) {
        wx.setStorage({
            key: "nowInvent",
            data: ""
        })
        // console.log(options);
        this.setData({
            deviceId: options.deviceId,
            name: options.name
        });
        const uuid = options.uuid;
        //获取盘点单详情
        this.getInventoryDetail(uuid);

        //获取盘点单原始基本信息
        this.getInitInfo();

        this.getLocation();


    },



})