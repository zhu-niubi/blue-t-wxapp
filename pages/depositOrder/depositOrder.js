// pages/depositOrder/depositOrder.js
import {
    request
} from '../../utils/request';
Page({
    onTap: function() {
        // 点击空白处关闭模态对话框
        wx.hideModal();
      },

    /**
     * 页面的初始数据
     */
    data: {
        inputVal: '',
        rollVal: '',
        brandVal: '',
        seriesGoodsVal: '',
        personOption: [],
        brandDocs: [],
        brandSeries_Goods: [],

        filteredPersons: [],
        filteredBrands: [],
        filteredSeriesGoods: [],



        goodsInput: true,
        brandInput: true,

        gradeList: [{
                value: 'A',
                name: 'A',
                checked: true
            },
            {
                value: 'A-',
                name: 'A-',
                checked: false
            },
            {
                value: 'B',
                name: 'B',
                checked: false
            },
        ],





        brandSeriesDocs: [],
        tableHeader: [{
                prop: 'rollId',
                width: '150',
                label: '卷芯码',
                color: '#000'
            },
            {
                prop: 'brandName',
                width: '152',
                label: '品牌',
                color: '#000'
            },
            {
                prop: 'seriesGoodsName',
                width: '152',
                label: '产品型号',
                color: '#000'
            },
            {
                prop: 'spec',
                label: '规格',
                width: '110',
                color: '#000'
            },
            {
                prop: 'todo',
                width: '110',
                label: '',
                color: '#000'
            },
        ],

        stripe: true, //表格是否为斑马纹
        border: false, //是否有间隔线	

        msg: '暂无数据',
        submitAll: false,
        formData: {
            height: '15',
            grade: 'A',
            width: '1520',
        },
        row: [],
    },
    submitAll() {
        let that = this;
        wx.showModal({
            title: '提示',
            content: '确认缴库吗？',
            success: function (res) {
                if (res.confirm) {
                    const groupedData = {};
                    that.data.row.forEach(item => {
                        const operator = item.operator;
                        if (!groupedData[operator]) {
                            groupedData[operator] = [];
                        }
                        groupedData[operator].push(item);
                    });
                    const result = [];
                    for (const operator in groupedData) {
                        const operatorData = groupedData[operator];
                        const operatorDetailData = {};
                        operatorData.forEach(item => {
                            const {
                                grade,
                                height,
                                width
                            } = item;
                            const key = `${grade}-${height}-${width}`;
                            if (!operatorDetailData[key]) {
                                operatorDetailData[key] = {
                                    height: parseInt(height),
                                    grade: grade,
                                    width: parseInt(width),
                                    quantity: 1,
                                    totalHeight: parseInt(height),
                                    rollList: [{
                                        rollId: item.rollId,
                                        uuid: that.generateUUID() // 生成UUID
                                    }]
                                };
                            } else {
                                operatorDetailData[key].quantity++;
                                operatorDetailData[key].totalHeight += parseInt(height);
                                operatorDetailData[key].rollList.push({
                                    rollId: item.rollId,
                                    uuid: that.generateUUID() // 生成UUID
                                });
                            }
                        });
            
                        const newData = {
                            data: {
                                ...operatorData[0]
                            }, // 使用操作员的第一条数据作为基础数据
                            operator: operator,
                            detail_data: Object.values(operatorDetailData)
                        };
                        result.push(newData);
                    }
            
            
                    // 要从每个数据对象中删除的键
                    const keysToRemove = ['brandName', 'grade', 'height', 'rollId', 'rollId_uuid', 'seriesGoodsName', 'spec', 'todo', 'width'];
            
                    // 遍历 'result' 数组并处理数据对象
                    result.forEach(item => {
                        if (item.data) {
                            let totalQuantity = 0;
                            let totalHeight = 0;
                            // 计算 detail_data 中的 quantity 和 totalHeight 的总和
                            if (Array.isArray(item.detail_data)) {
                                item.detail_data.forEach(detailItem => {
                                    totalQuantity += detailItem.quantity || 0;
                                    totalHeight += detailItem.totalHeight || 0;
                                });
                            }
                            // 将总和值添加到 data 对象中
                            item.data.quantity = totalQuantity;
                            item.data.totalHeight = totalHeight;
                            item.data.isWxapp = true;
            
                            // 删除指定的键
                            keysToRemove.forEach(key => {
                                delete item.data[key];
                            });
                        }
                    });
                    //组装好的数据
                    // //console.log(result);
                    // return;
            
                    that.setData({
                        row:[]
                    })

                    that.doInsertAll(result);
                } else {

                }
            }
        })



    },
    doInsertAll(bodyData) {

        request({
            url: `/invoke/nbpm/method/ncd/deposit-order-checkin-auto`,
            method: 'POST',
            data: {
                data: bodyData
            },
        }).then((res) => {
            //console.log('缴库结果=>',res)
            if(res.status == 200){
                wx.showToast({
                  title: '缴库成功',
                  icon: 'success'
                })
                
            }else{
                wx.showToast({
                    title: res.statusText,
                    icon: 'none'
                })
            }
        })
    },

    onSubmit() {
        const rowData = {
            ...this.data.formData
        };
        if (!rowData.brandDoc || !rowData.goods_uuid || !rowData.grade || !rowData.height ||
            !rowData.operator || !rowData.productCode || !rowData.productName || this.data.rollVal == '' ||
            !rowData.serieDoc || !rowData.width) {
            wx.showToast({
                title: '请完善表单',
                icon: 'none'
            })
            return;
        }
        rowData.brandName = rowData.brandDoc.title;
        rowData.seriesGoodsName = `${rowData.serieDoc.title}-${rowData.productName}`;
        rowData.spec = `${rowData.grade}:宽度${rowData.width}mm*长度${rowData.height}M`;
        rowData.todo = '操作';
        rowData.rollId = this.data.rollVal;
        rowData.rollId_uuid = this.generateUUID();

        this.setTableData(rowData);


    },
    generateUUID() {
        let d = new Date().getTime();
        const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            const r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
        return uuid;
    },
    setTableData(rowData) {

        let row = [...this.data.row];

        if (!row.some(item => item.rollId === rowData.rollId)) {
            row.push({
                ...rowData
            });
            this.setData({
                row,
                submitAll: true,
                rollVal:''
            });
        } else {
            wx.showToast({
                title: '请勿添加重复卷号产品',
                icon: 'none'
            })
            return;
        }

    },
    delRow(e) {
        let that = this;
        wx.showModal({
            title: '提示',
            cancelText: '删除',
            confirmText: '修改',
            success: function (res) {

                if (res.confirm) {

                    const updateRow = e.detail.currentTarget.dataset.it;
                    const row = that.data.row;
                    const newRow = row.filter(item => item.rollId !== updateRow.rollId);
                    //console.log(updateRow,that.data.gradeList);
                    const gradeList = that.data.gradeList.map(item => {
                        if (item.value === updateRow.grade) {
                            item.checked = true;
                        } else {
                            item.checked = false;
                        }
                        return item;
                    });
                    
                    // //console.log(gradeList);
                    
                    that.setData({
                        row: newRow,
                        formData:updateRow,
                        rollVal:updateRow.rollId,
                        inputVal:updateRow.operator,
                        brandVal:updateRow.brandName,
                        seriesGoodsVal:updateRow.seriesGoodsName,
                        gradeList:gradeList
                    })
                    //console.log(that.data.gradeList);

                } else {
                    ////console.log('用户点击确定')
                    const delRow = e.detail.currentTarget.dataset.it
                    // //console.log('delRow.rollId: ', delRow.rollId);
                    const row = that.data.row;

                    const newRow = row.filter(item => item.rollId !== delRow.rollId);

                    that.setData({
                        row: newRow
                    });
                }
            }
        })

    },
    selectPerson(e) {
        // //////console.log('selectPerson_e=>',e);

        const {
            personid,
            operator
        } = e.currentTarget.dataset;
        const formData = this.data.formData;
        formData.operator = personid;
        this.setData({
            inputVal: operator,
            formData,
            filteredPersons: [],
            brandInput: false
        })
    },
    selectBrand(e) {
        const {
            label,
            title,
            value
        } = e.currentTarget.dataset;

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const productCode = `${year}${month}${day}`;
        const formData = this.data.formData;
        formData.productCode = productCode;
        formData.brandDoc = {
            label,
            title,
            value,
        };
        this.setData({
            brandVal: title,
            goodsInput: false,
            formData,
            filteredBrands: [],
            seriesGoodsVal: ''
        });
        this.getGoodsList();
    },

    selectSeriesGoods(e) {
        const {
            goods_uuid,
            product_name,
            wms_brand_series
        } = e.currentTarget.dataset;

        const formData = this.data.formData;
        formData.serieDoc = {
            label: wms_brand_series.name,
            title: wms_brand_series.title,
            value: wms_brand_series.uuid
        };
        formData.goods_uuid = goods_uuid;
        formData.productName = product_name;

        this.setData({
            seriesGoodsVal: `${product_name}_${wms_brand_series.name}`,
            goodsInput: false,
            formData,
            filteredSeriesGoods: []
        });
        //////console.log('this.data.formData=>',this.data.formData)
    },

    clearInput() {
        this.setData({
            inputVal: '',
        });
    },
    inputTyping(e) {
        const inputVal = e.detail.value;
        const filteredPersons = this.data.personOption.filter(person => {
            return person.cPersonName.includes(inputVal);
        });
        // console.log(filteredPersons);

        this.setData({
            inputVal,
            filteredPersons
        });
    },

    inputBrand(e) {

        const brandVal = e.detail.value;
        // //////console.log(brandVal)
        const filteredBrands = this.data.brandDocs.filter(brand => {
            return brand.title.includes(brandVal) || brand.name.includes(brandVal);
        });

        this.setData({
            brandVal,
            filteredBrands
        });
    },

    inputSG(e) {
        const seriesGoodsVal = e.detail.value;
        // //////console.log(seriesGoodsVal)
        // //////console.log(this.data.brandSeries_Goods);
        const filteredSeriesGoods = this.data.brandSeries_Goods.filter(item => {
            return item.name.includes(seriesGoodsVal);
        });

        this.setData({
            seriesGoodsVal,
            filteredSeriesGoods
        });
    },

    gradeChange(e) {
        // //////console.log('radio发生change事件，携带value值为：', e.detail.value)

        const gradeList = this.data.gradeList
        for (let i = 0, len = gradeList.length; i < len; ++i) {
            gradeList[i].checked = gradeList[i].value === e.detail.value
        }
        const formData = this.data.formData;
        formData.grade = e.detail.value;
        this.setData({
            gradeList,
            formData
        })
    },
    inputWidth(e) {
        const widthVal = e.detail.value;
        const formData = this.data.formData;
        formData.width = widthVal;
        this.setData({
            formData
        });
    },
    inputHeight(e) {
        const heightVal = e.detail.value;
        const formData = this.data.formData;
        formData.height = heightVal;
        this.setData({
            formData
        });
    },

    inputRoll(e) {
        const rollVal = e.detail.value;
        this.setData({
            rollVal
        });
    },
    scanCode() {
        let that = this;
        wx.scanCode({
            scanType: ['qrCode', 'barCode', 'datamatrix', 'pdf417'],
            success(res) {
                if (res.errMsg == "scanCode:ok") {
                    ////console.log('扫码结果_res=>', res);
                    const num = res.result;
                    that.setData({
                        rollVal: num
                    });
                } else {
                    wx.showToast({
                        title: '扫码失败',
                        duration: 1000,
                        icon: 'error'
                    });
                }
            }
        })
    },


    getGoodsList() {
        let that = this;

        // //console.log(that.data.formData.brandDoc.value)
        request({
            url: `/invoke/nbpm/method/wms/goods-index?brand_uuid=${that.data.formData.brandDoc.value}`,
            method: 'GET',
        }).then((res) => {
            //console.log("该品牌产品型号", res);
            if (res.status == 200) {
                that.setData({
                    brandSeries_Goods: res.data.goodsDocs
                });
            } else {
                return;
            }
        })
    },
    getbrandList() {
        let that = this;
        request({
            url: '/invoke/nwms/method/brand/index',
            method: 'GET'
        }).then((res) => {
            // //////console.log("品牌", res);
            if (res.status == 200) {
                that.setData({
                    brandDocs: res.data.brandDocs
                });
            } else {
                return;
            }
        })
    },
    getPersonOption(cPersonName) {

        let that = this;
        request({
            url: '/invoke/nwms/method/predata/employee',
            method: 'POST',
            data: {
                cPersonName
            },

        }).then((res) => {
            //console.log("制单人", res);
            if (res.status == 200) {
                that.setData({
                    personOption: res.data
                });
            } else {
                return;
            }
        })
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad(options) {

        this.getPersonOption();
        this.getbrandList();
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady() {

    },

    /**
     * 生命周期函数--监听页面显示
     */
    onShow() {

    },

    /**
     * 生命周期函数--监听页面隐藏
     */
    onHide() {

    },

    /**
     * 生命周期函数--监听页面卸载
     */
    onUnload() {

    },

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh() {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom() {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage() {

    }
})