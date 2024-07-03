// pages/index/index.js
import {
    request
} from '../../utils/request';

Page({

    /**
     * 页面的初始数据
     */
    data: {
        inventoryList:[],
    },
    getInventoryList(){
        var that = this;
        request({
            url: '/invoke/nwms/method/wxapp/index',
            method: 'GET',
            data: {},
            
        }).then((res) =>{
           
            // console.log(res);
            if(res.status === 200){
                // console.log('盘点单列表：',res.data);
                that.setData({
                    inventoryList:res.data
                })
            }
            
        })
          
    },
    gotoInventorydetatil(e){
        // console.log('gotoInventorydetatil_e',e);
        const uuid = e.currentTarget.id;
        //携带brand_uuid跳转到盘点单详情页面
        wx.navigateTo({
            url: `/pages/inventorydetatil/inventorydetatil?uuid=${uuid}`
        });
    },

    onLoad(options) {
        // console.log('盘点单进来了！',options)

        this.getInventoryList();
    },


    onShow() {

    },

})