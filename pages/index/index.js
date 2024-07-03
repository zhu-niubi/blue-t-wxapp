// pages/index/index.js
import {Printer} from '../../utils/print';
const app = getApp()


Page({

    /**
     * 页面的初始数据
     */
    data: {
        candata: false,

        deviceList:[],
        deviceId:'',
        name:'',    
        list: [
            {
              id: 'form',
              name: '任务导航',
              open: false,
              pages: [
                  {
                    name:'连接蓝牙打印机缴库',
                    method:'searchBlue'
                  },
                  {
                    name:'存货缴库',
                    method:'gotoDepositOrder'
                  }
              ],
            },
          ],

    },
    gotoDepositOrder(){
        wx.navigateTo({
          url: '/pages/depositOrder/depositOrder',
        })
    },
    kindToggle(e) {
        const { id } = e.currentTarget; const { list } = this.data;
        for (let i = 0, len = list.length; i < len; ++i) {
          if (list[i].id == id) {
            list[i].open = !list[i].open;
          } else {
            list[i].open = false;
          }
        }
        this.setData({
          list,
        });
      },
    gotoList(){
        wx.navigateTo({
          url: `/pages/inventory/inventory?name=${this.data.name}&&deviceId=${this.data.deviceId}`,
        })
    },
    getDeviceCharacteristics(deviceId, services = [], success, fail) {
        services = services.slice(0);
        if (services.length) {
            const serviceId = services.shift().uuid
            this.wxAsyncPromise('getBLEDeviceCharacteristics', {
                deviceId,
                serviceId,
            })
            .then((res) => {
                let finished = false;
                let write = false;
                let notify = false;
                let indicate = false;
                //有斑马品牌的一款打印机中res.characteristics的所有uuid都是相同的，
                //找所有的properties存在(notify || indicate) && write（如果只写入数据只要write=true也可以）这种情况就说明这个uuid是可用的
                //（不确保所有的打印机都能用这种方式取得uuid,
                //在凯盛诺打印机的res.characteristic只有一个uuid,所以也能用这个方式）
                for (var i = 0; i < res.characteristics.length; i++) {
                    if (!notify) {
                        notify = res.characteristics[i].properties.notify;
                    }
                    if (!indicate) {
                        indicate = res.characteristics[i].properties.indicate;
                    }
                    if (!write) {
                        write = res.characteristics[i].properties.write;
                    }
                    if ((notify || indicate) && write) {
                        /* 获取蓝牙特征值uuid */
                        success &&
                            success({
                                serviceId,
                                characteristicId: res.characteristics[i].uuid,
                            });
                        finished = true;
                        break;
                    };
                    console.log('getBLEDeviceCharacteristics', deviceId, serviceId, res);
                }

                if (!finished) {
                    getDeviceCharacteristics(deviceId, services, success, fail);
                }
            })
            .catch((res) => {
                getDeviceCharacteristics(deviceId, services, success, fail);
            });
        } else {
            fail && fail();
        }
    },
    wxAsyncPromise(name, options) {
        return new Promise((resolve, reject) => {
            wx[name]({
                ...(options || {}),
                success: function (res) {
                    resolve(res);
                },
                fail: function (res) {
                    reject(res);
                },
            });
        });
    },

    getSome(deviceId) {
        wx.getBLEDeviceServices({
            //deviceId
            deviceId,
            success:async (res) => {
                //serviceIds,每个item的uuid
                console.log('设备服务:', res.services);
                const services = res.services;
                this.getDeviceCharacteristics(deviceId, services, (result) => {
                    const serviceId = result.serviceId;
                    const characteristicId = result.characteristicId;
                    
                    const globalData = app.globalData;
                    globalData.deviceId = deviceId;
                    globalData.serviceId = serviceId;
                    globalData.characteristicId = characteristicId;
                    console.log('app',globalData);

                });
            },
            
            fail(res) {
                console.log('获取设备服务失败', res);
            }
        });
    },

    //连接打印机蓝牙
    connectBlue(deviceId) {
        wx.createBLEConnection({
            deviceId,
            success: (res) => {
                console.log('连接蓝牙设备成功', res);
                // 连接到设备后获取服务和特征
                this.getSome(this.data.deviceId);
                this.setData({
                    candata: true
                })

            },
            fail(res) {
                console.log('连接蓝牙设备失败', res);
            }
        });
    },

    //连接打印机
    connect(e){

        console.log(e)
        const deviceId = e.currentTarget.dataset.deviceid;
        const name = e.currentTarget.dataset.name;
        this.setData({
            deviceId,
            name
        });

        console.log(deviceId,name);
        this.connectBlue(deviceId);
        // 停止搜索设备
        wx.stopBluetoothDevicesDiscovery({
            success: (res) => {
                console.log('停止搜索蓝牙设备成功', res);
            },
            fail(res) {
                console.log('停止搜索蓝牙设备失败', res);
            }
        });
    },
    
    //搜索蓝牙
    searchBlue() {
        this.setData({
            candata: false
        });
        var that = this;
        console.log(that.data.deviceId,'that.data.deviceId');
        if(that.data.deviceId === ''){
            wx.openBluetoothAdapter({
                success: (res) => {
                    console.log("初始化蓝牙适配器成功", res);
                    that.startBluetoothDevicesDiscovery();
                },
                fail: (res) => {
                    console.log("初始化蓝牙适配器失败", res);
                }
            });
        }else{
            wx.closeBLEConnection({
                deviceId:that.data.deviceId,
                success (res) {
                  console.log('断开之前蓝牙设备连接',res);
                  wx.openBluetoothAdapter({
                        success: (res) => {
                            console.log("初始化蓝牙适配器成功", res);
                            that.startBluetoothDevicesDiscovery();
                        },
                        fail: (res) => {
                            console.log("初始化蓝牙适配器失败", res);
                        }
                    });
                }
              })
        }
        
        
    },
    //打开蓝牙服务
    startBluetoothDevicesDiscovery() {
        wx.startBluetoothDevicesDiscovery({
            services: [], // 可以设置为空数组
            allowDuplicatesKey: false,
            success: (res) => {
                console.log('启动搜索蓝牙设备成功', res);
                let deviceList = [];

                wx.onBluetoothDeviceFound((res) => {
                    console.log('新设备已找到', res.devices);
                    const devices = res.devices;
                    
                    devices.forEach(device => {
                        if (/^(GP|Printer)/.test(device.localName)) {
                            console.log('找到的设备: ', device);
                            // 检查 deviceList 中是否已经存在具有相同 localName 的设备
                            const isDeviceExist = deviceList.some(d => d.localName === device.localName);
                            // 如果设备不存在，则添加到列表中
                            if (!isDeviceExist) {
                                deviceList.push(device);
                                this.setData({
                                    deviceList
                                });
                            }
        
                        }
                    });
        
                });
            },
            fail(res) {
                console.log('启动搜索蓝牙设备失败', res);
            }
        });
    },

    onLoad() {
        
    },


    onShow() {

    },

})